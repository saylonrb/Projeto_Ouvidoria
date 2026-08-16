// src/controllers/chatController.js
/**
 * Controller do Atendente Virtual Inteligente da Ouvidoria Municipal.
 * Integração real com LLM para triagem conversacional, extração de dados estruturados
 * e criação automática de demandas vinculadas ao cidadão e ao setor correto.
 */
const { z } = require('zod');
const xss = require('xss');
const { prisma } = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');
const { generateProtocol } = require('../utils/protocolGenerator');
const { processConversationalAI } = require('../services/ai/geminiService');
const { deduplicateSubmission } = require('../services/deduplicationService');
const { logAudit } = require('../middlewares/auditLogger');
const logger = require('../utils/logger');

const CHAT_BOT_EMAIL = 'chatbot@ouvidoria.gov.br';

const STATUS_LABELS = {
  RECEIVED: 'Recebido e em triagem',
  AI_PROCESSING: 'Em análise inteligente pela IA',
  TRIAGED: 'Classificado e triado',
  FORWARDED: 'Encaminhado ao setor responsável',
  IN_PROGRESS: 'Em atendimento no local',
  TEAM_DISPATCHED: 'Equipe em deslocamento',
  COMPLETED: 'Resolvido e concluído',
  REJECTED: 'Arquivado',
  CANCELLED: 'Cancelado',
};

const chatRequestSchema = z.object({
  message: z.string().max(2000).optional().default(''),
  wizardState: z.record(z.any()).optional().default({}),
  history: z.array(z.record(z.any())).optional().default([]),
});

/**
 * Obtém ou cria o usuário padrão para atendimentos sem login
 */
async function getChatUser() {
  return prisma.user.upsert({
    where: { email: CHAT_BOT_EMAIL },
    update: {},
    create: {
      name: 'Cidadão Atendimento Virtual',
      email: CHAT_BOT_EMAIL,
      role: 'CITIZEN',
      isActive: true,
      emailVerified: false,
    },
  });
}

/**
 * Processa a mensagem do chat integrando LLM e regra de negócio
 */
async function processChat(req, res, next) {
  try {
    const rawBody = chatRequestSchema.parse(req.body);
    const userQuery = xss(rawBody.message.trim());
    const queryLower = userQuery.toLowerCase();
    const state = rawBody.wizardState || {};
    const history = rawBody.history || [];

    // ── 0. ESTADO DE INICIALIZAÇÃO (FRONTEND MANDA MENSAGEM VAZIA) ──
    if (userQuery === '' && (!state.step || state.step === 'idle')) {
      return sendSuccess(res, {
        response: 'Olá! Sou a assistente inteligente da Ouvidoria Municipal de Parauapebas.\n\nVocê pode me contar o seu problema em linguagem simples (por exemplo: *"a lâmpada do poste da minha rua está apagada"*) que eu identificarei automaticamente a secretaria responsável.',
        wizardState: { step: 'idle' },
        options: buildMainMenu(),
        suggestions: ['Luz do poste apagada', 'Buraco no asfalto', 'Bueiro entupido', 'Descarte de lixo'],
      });
    }

    // ── 1. ESTADO DE TRANSBORDO HUMANO ──────────────────────────
    if (state.isHumanHandover || state.step === 'handover') {
      if (queryLower === 'menu' || queryLower.includes('voltar') || queryLower.includes('recomeçar')) {
        return sendSuccess(res, {
          response: 'Atendimento do assistente virtual da Ouvidoria reiniciado!\n\nComo posso ajudar você hoje?',
          wizardState: { step: 'idle' },
          options: buildMainMenu(),
          suggestions: ['Pedir um reparo', 'Fazer denúncia', 'Enviar elogio', 'Rastrear protocolo'],
        });
      }
      return sendSuccess(res, {
        response: 'Sua solicitação está na fila de atendimento da Ouvidoria Municipal de Parauapebas. Um de nossos ouvidores entrará em contato em breve!',
        wizardState: { ...state, step: 'handover', isHumanHandover: true },
        isHumanHandover: true,
        options: [{ label: '🔄 Voltar ao Assistente Virtual', text: 'menu' }],
        suggestions: ['Aguardando atendimento...'],
      });
    }

    // ── 1. SOLICITAÇÃO EXPLÍCITA DE TRANSBORDO HUMANO ────────────
    const isHandoverRequested =
      queryLower.includes('falar com atendente') ||
      queryLower.includes('falar com ouvidor') ||
      queryLower.includes('atendente humano') ||
      queryLower.includes('suporte humano') ||
      queryLower.includes('falar com pessoa') ||
      queryLower.includes('falar com humano');

    if (isHandoverRequested) {
      return sendSuccess(res, {
        response: 'Transferindo seu atendimento para a equipe de Ouvidores da Prefeitura Municipal de Parauapebas! Por favor, aguarde um instante enquanto notificamos a equipe de plantão.',
        wizardState: { ...state, step: 'handover', isHumanHandover: true },
        isHumanHandover: true,
        options: [{ label: '🔄 Voltar ao Assistente Virtual', text: 'menu' }],
        suggestions: ['Aguardando ouvidor...'],
      });
    }

    // ── 2. RASTREIO DIRETO POR PROTOCOLO ────────────────────────
    const protocolMatch = userQuery.match(/OUV-\d{4}-[A-Z0-9]{3,8}/i);
    if (protocolMatch) {
      const targetProtocol = protocolMatch[0].toUpperCase();
      const submission = await prisma.citizenSubmission.findUnique({
        where: { protocol: targetProtocol },
        include: {
          category: { select: { name: true } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });

      if (submission) {
        const lastUpdate = submission.statusHistory[0]?.comment || 'Em análise técnica.';
        return sendSuccess(res, {
          response: `Encontrei o protocolo **${submission.protocol}**!\n\n` +
            `• **Assunto:** ${submission.title}\n` +
            `• **Status:** ${STATUS_LABELS[submission.status] || submission.status}\n` +
            `• **Local:** ${submission.address || 'Parauapebas - PA'}\n` +
            `• **Última Atualização:** ${lastUpdate}\n\n` +
            `Clique em [Ver Detalhes do Protocolo](/rastrear?protocol=${submission.protocol}) para a linha do tempo completa.`,
          wizardState: { step: 'idle' },
          protocolFound: submission.protocol,
          options: [
            { label: '🔍 Consultar outro protocolo', text: 'Quero rastrear outro protocolo' },
            { label: '📝 Novo Atendimento', text: 'menu' },
          ],
          suggestions: ['Consultar outro protocolo', 'Novo atendimento'],
        });
      } else {
        return sendSuccess(res, {
          response: `Não foi localizada nenhuma manifestação com o protocolo **${targetProtocol}**.\n\nVerifique se o código foi digitado corretamente (Ex: *OUV-2026-000001*).`,
          wizardState: { step: 'idle' },
          options: [{ label: '🔄 Voltar ao Menu', text: 'menu' }],
          suggestions: ['Digitar outro protocolo', 'Novo atendimento'],
        });
      }
    }

    // ── 3. AÇÕES DE MENU RÁPIDO ─────────────────────────────────
    const menuActions = {
      'quero relatar um problema na cidade': 'SOLICITACAO',
      'quero fazer uma denúncia': 'DENUNCIA',
      'quero fazer uma denuncia': 'DENUNCIA',
      'quero fazer uma reclamação': 'RECLAMACAO',
      'quero fazer uma reclamacao': 'RECLAMACAO',
      'quero dar uma sugestão': 'SUGESTAO',
      'quero dar uma sugestao': 'SUGESTAO',
      'quero enviar um elogio': 'ELOGIO'
    };

    console.log("=== CHAT DEBUG ===");
    console.log("queryLower:", JSON.stringify(queryLower));
    console.log("menuActions match?", !!menuActions[queryLower]);
    console.log("==================");

    if (menuActions[queryLower]) {
      const type = menuActions[queryLower];
      return sendSuccess(res, {
        response: 'Certo! Por favor, descreva em detalhes qual é o problema ou a situação:',
        wizardState: { 
          ...state, 
          step: 'collect_problem', 
          type, 
          problem: null, 
          location: null,
          isAnonymous: type === 'DENUNCIA'
        },
        options: [{ label: '🔄 Cancelar e Voltar', text: 'menu' }],
        suggestions: []
      });
    }

    if (queryLower === 'quero rastrear meu protocolo' || queryLower === 'quero rastrear um protocolo' || queryLower === 'rastrear protocolo') {
      return sendSuccess(res, {
        response: 'Por favor, digite o número do protocolo que deseja rastrear (ex: OUV-2026-ABC12):',
        wizardState: { ...state, step: 'track_protocol' },
        options: [{ label: '🔄 Voltar ao Menu', text: 'menu' }],
        suggestions: []
      });
    }

    // ── 4. CARREGA CONTEXTO DE CATEGORIAS E SECRETARIAS DO DB ───
    const [categories, departments] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        include: { department: { select: { id: true, name: true } } },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true },
      }),
    ]);

    // ── 4. PROCESSAMENTO COM IA CONVERSACIONAL (LLM + FALLBACK) ──
    const aiResult = await processConversationalAI({
      userQuery,
      history,
      currentState: state,
      categories,
      departments,
    });

    // ── 5. VALIDA E RECONCILIA CATEGORIA E SECRETARIA CONTRA O DB ─
    let matchedCategory = null;
    if (aiResult.categoryId) {
      matchedCategory = categories.find((c) => c.id === aiResult.categoryId);
    }
    if (!matchedCategory && aiResult.categoryName) {
      matchedCategory = categories.find(
        (c) => c.name.toLowerCase().includes(aiResult.categoryName.toLowerCase()) || 
               aiResult.categoryName.toLowerCase().includes(c.name.toLowerCase())
      );
    }

    const finalCategoryId = matchedCategory?.id || null;
    const finalDepartmentId = matchedCategory?.departmentId || departments[0]?.id || null;

    // ── 6. SE A DEMANDA ESTIVER PRONTA → CRIA NO BANCO DE DADOS ──
    if (aiResult.readyToSubmit && (aiResult.problem || state.problem)) {
      const citizenUser = req.user || (await getChatUser());
      const protocol = await generateProtocol();

      const manifestationType = aiResult.type || state.type || 'SOLICITACAO';
      const rawTitle = aiResult.title || state.title || aiResult.problem || 'Atendimento Ouvidoria';
      const formattedTitle = `[${manifestationType}] ${rawTitle.substring(0, 75)}`;

      const problemText = aiResult.problem || state.problem || userQuery;
      const locationText = aiResult.location || state.location || 'Parauapebas - PA';
      const isAnonymous = Boolean(aiResult.isAnonymous ?? state.isAnonymous ?? (manifestationType === 'DENUNCIA'));

      const fullDescription =
        `[Via Atendente Virtual Inteligente]\n` +
        `[Tipo: ${manifestationType}]\n` +
        (isAnonymous ? `[Sigilo: SIM]\n` : '') +
        `Relato: ${problemText}\n` +
        `Localização: ${locationText}`;

      // Deduplicação inteligente em MasterTicket
      const { masterTicket, isDuplicate } = await deduplicateSubmission({
        title: formattedTitle,
        description: fullDescription,
        categoryId: finalCategoryId,
        departmentId: finalDepartmentId,
        address: locationText,
        neighborhood: locationText,
        aiResult: {
          confidence: aiResult.urgency === 'HIGH' ? 0.9 : 0.8,
          reasoning: `Demanda classificada via assistente inteligente para ${matchedCategory?.name || 'Geral'}`,
          label: matchedCategory?.name || 'Geral',
          urgency: aiResult.urgency || 'MEDIUM',
          summary: formattedTitle,
        },
      });

      // Cria a submissão vinculada ao usuário real (se autenticado)
      const submission = await prisma.citizenSubmission.create({
        data: {
          protocol,
          title: formattedTitle,
          description: fullDescription,
          status: 'RECEIVED',
          address: locationText,
          neighborhood: locationText,
          categoryId: finalCategoryId,
          masterTicketId: masterTicket?.id || null,
          aiProcessed: true,
          isDuplicate,
          isAnonymous,
          userId: citizenUser.id,
        },
      });

      await prisma.statusHistory.create({
        data: {
          submissionId: submission.id,
          status: 'RECEIVED',
          comment: `Manifestação registrada com sucesso via Atendente Virtual Inteligente. Encaminhada para ${matchedCategory?.department?.name || 'secretaria responsável'}.`,
        },
      });

      // Cria notificação para o cidadão
      await prisma.notification.create({
        data: {
          userId: citizenUser.id,
          submissionId: submission.id,
          title: '✅ Demanda registrada com sucesso!',
          message: `Sua manifestação foi protocolada sob o código ${submission.protocol}. Acompanhe as atualizações pela plataforma.`,
        },
      });

      // Registra auditoria LGPD
      await logAudit(
        citizenUser.id,
        'SUBMISSION_CREATED',
        'CitizenSubmission',
        submission.id,
        { protocol, channel: 'chatbot', isAnonymous },
        req
      );

      logger.info(`✅ Demanda criada via Chatbot: ${submission.protocol} para usuário ${citizenUser.id}`);

      return sendSuccess(res, {
        response:
          `🎉 **Sua manifestação foi registrada com sucesso na Ouvidoria Municipal!**\n\n` +
          `• **Protocolo Oficial:** \`${submission.protocol}\`\n` +
          `• **Tipo de Demanda:** ${manifestationType}\n` +
          `• **Secretaria Competente:** ${matchedCategory?.department?.name || 'Secretaria Responsável'}\n` +
          `• **Assunto:** ${matchedCategory?.name || 'Geral'}\n` +
          `• **Local:** ${locationText}\n` +
          (isAnonymous ? `• **Sigilo da Identidade:** 🔒 Protegido com Sigilo Absoluto\n` : '') +
          `\nVocê pode acompanhar todo o andamento do seu chamado clicando em [Acompanhar Protocolo](/rastrear?protocol=${submission.protocol}).`,
        wizardState: { step: 'idle' },
        protocolFound: submission.protocol,
        options: [
          { label: '🔍 Rastrear este Protocolo', text: `Rastrear protocolo ${submission.protocol}` },
          { label: '📝 Iniciar Novo Atendimento', text: 'menu' },
        ],
        suggestions: ['Rastrear meu protocolo', 'Novo atendimento'],
      });
    }

    // ── 7. RESPOSTA CONVERSACIONAL PADRÃO ─────────────────────────
    return sendSuccess(res, {
      response: aiResult.replyMessage,
      wizardState: {
        ...state,
        type: aiResult.type || state.type,
        categoryId: finalCategoryId,
        categoryName: matchedCategory?.name || aiResult.categoryName,
        departmentId: finalDepartmentId,
        departmentName: matchedCategory?.department?.name || aiResult.departmentName,
        title: aiResult.title || state.title,
        problem: aiResult.problem || state.problem,
        location: aiResult.location || state.location,
        isAnonymous: aiResult.isAnonymous ?? state.isAnonymous,
        urgency: aiResult.urgency || state.urgency,
        missingInfo: aiResult.missingInfo || [],
        step: aiResult.step || state.step,
      },
      options: aiResult.options && aiResult.options.length > 0 ? aiResult.options : buildMainMenu(),
      suggestions: aiResult.suggestions || ['Lâmpada apagada', 'Buraco na rua', 'Vazamento de água', 'Rastrear protocolo'],
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return sendSuccess(res, {
        response: 'Desculpe, não consegui entender o formato da mensagem. Como posso ajudar você?',
        wizardState: { step: 'idle' },
        options: buildMainMenu(),
      });
    }
    next(error);
  }
}

function buildMainMenu() {
  return [
    { label: '💡 Relatar Problema / Reparo', text: 'Quero relatar um problema na cidade' },
    { label: '🔒 Fazer Denúncia com Sigilo', text: 'Quero fazer uma denúncia' },
    { label: '📢 Fazer uma Reclamação', text: 'Quero fazer uma reclamação' },
    { label: '✨ Dar Sugestão de Melhoria', text: 'Quero dar uma sugestão' },
    { label: '👏 Enviar Elogio', text: 'Quero enviar um elogio' },
    { label: '👨‍💼 Falar com Atendente Humano', text: 'Falar com ouvidor' },
    { label: '🔍 Rastrear meu Protocolo', text: 'Quero rastrear meu protocolo' },
  ];
}

module.exports = { processChat };
