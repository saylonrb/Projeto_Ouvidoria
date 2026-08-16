// src/services/ai/geminiService.js
/**
 * Integração com Google Gemini AI e Motor de Inteligência da Ouvidoria Municipal.
 * Realiza triagem conversacional profunda, classificação inteligente e extração de dados estruturados.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const {
  classifySubmission,
  calculateTextSimilarity,
  processConversationalFallback,
} = require('./heuristicFallback');

const AI_TIMEOUT_MS = 8000;

// Valida se a chave da API é válida
const hasValidKey = Boolean(
  env.GEMINI_API_KEY &&
  !['your_gemini_api_key_here', 'ainda vou configurar isso', 'none', '', 'test'].includes(
    env.GEMINI_API_KEY.trim().toLowerCase()
  )
);

let geminiClient = null;
let geminiModel = null;

if (hasValidKey) {
  try {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    geminiModel = geminiClient.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-3.5-flash' });
    logger.info('✅ Google Gemini AI inicializado com sucesso.');
  } catch (err) {
    logger.warn('⚠️ Falha ao inicializar Gemini SDK:', err.message);
  }
} else {
  logger.info('ℹ️ Operando com motor de inteligência local integrado.');
}

/**
 * Cria o prompt de sistema com categorias e secretarias reais do banco de dados
 */
function buildCategoriesPrompt(categories, departments) {
  const deptsMap = {};
  for (const d of departments) {
    deptsMap[d.id] = d.name;
  }

  const lines = categories.map((c) => {
    const deptName = deptsMap[c.departmentId] || c.department?.name || 'Geral';
    return `- ID: "${c.id}" | Setor: "${deptName}" (DeptID: "${c.departmentId}") | Categoria: "${c.name}" | Descrição: "${c.description || ''}" | Palavras-chave: [${c.keywords || ''}]`;
  });

  return lines.length > 0 ? lines.join('\n') : '- Nenhuma categoria específica cadastrada.';
}

/**
 * Triagem Inteligente via LLM para submissões individuais
 */
async function classifySubmissionAI(title, description, categories = []) {
  if (geminiModel) {
    try {
      const categoriesText = categories.map(c => `- ${c.id} / ${c.departmentId}: ${c.name} (${c.description || ''}) [Keywords: ${c.keywords || ''}]`).join('\n');
      const systemPrompt = `Você é um assistente de triagem da Ouvidoria Pública Municipal.
Analise a demanda do cidadão e retorne EXCLUSIVAMENTE um JSON válido no seguinte formato:
{
  "categoryId": "<id_da_categoria>",
  "departmentId": "<id_do_departamento>",
  "confidence": <número entre 0.0 e 1.0>,
  "reasoning": "<justificativa curta em português>",
  "label": "<nome da categoria>",
  "urgency": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "extractedLocation": "<endereço/local mencionado na demanda, ou null>",
  "summary": "<resumo de 1 linha do problema>"
}

Categorias disponíveis:
${categoriesText}

Retorne APENAS o JSON, sem markdown ou explicações.`;

      const userPrompt = `Título: ${title}\nDescrição: ${description}`;

      const geminiPromise = geminiModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), AI_TIMEOUT_MS)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = result.response.text().trim();
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        ...parsed,
        source: 'gemini',
      };
    } catch (err) {
      logger.warn(`⚠️ Gemini fallback ativado para classificação (${err.message})`);
    }
  }

  const heuristicResult = classifySubmission(title, description, categories);
  return {
    ...heuristicResult,
    urgency: heuristicResult.confidence > 0.7 ? 'MEDIUM' : 'LOW',
    extractedLocation: null,
    summary: `${title} - ${description.substring(0, 100)}`,
    source: 'heuristic_fallback',
  };
}

/**
 * Ciclo Conversacional Inteligente do Atendente Virtual da Ouvidoria
 * Analisa a fala livre do cidadão, extrai dados estruturados e orienta a resolução.
 */
async function processConversationalAI({
  userQuery,
  history = [],
  currentState = {},
  categories = [],
  departments = [],
}) {
  if (geminiModel) {
    try {
      const categoriesText = buildCategoriesPrompt(categories, departments);
      const recentHistory = Array.isArray(history)
        ? history.slice(-4).map(h => `${h.sender === 'user' ? 'Cidadão' : 'Assistente'}: ${h.text}`).join('\n')
        : '';

      const systemPrompt = `Você é o Atendente Virtual Inteligente da Ouvidoria Municipal de Parauapebas - PA.
Sua missão é conversar com o cidadão de forma simples, atenciosa e resolutiva, entender o problema relatado em linguagem natural, classificar automaticamente a demanda e extrair todas as informações essenciais para a abertura do chamado.

O cidadão NÃO precisa saber termos técnicos nem qual secretaria é responsável. VOCÊ deve identificar isso automaticamente.

REGRAS DE NEGÓCIO:
1. Identifique o Tipo de Manifestação:
   - "SOLICITACAO": Pedidos de reparo urbano, manutenção, tapa-buraco, lâmpada queimada, bueiro, poda, etc. (Requer localização/endereço).
   - "DENUNCIA": Relato de infrações, crimes ambientais, descarte irregular de lixo, corrupção, irregularidades. (Ofereça sigilo de identidade por padrão).
   - "RECLAMACAO": Insatisfação com atrasos, mau atendimento público ou serviços não executados.
   - "SUGESTAO": Ideias de melhoria, projetos urbanos, novas vias ou praças.
   - "ELOGIO": Agradecimento ou reconhecimento a servidores, médicos, escolas ou equipes.
2. Identifique a Categoria e Secretaria correspondente a partir da lista oficial abaixo:
${categoriesText}
3. Extraia os dados estruturados:
   - "title": Título claro e conciso (máx. 60 caracteres).
   - "problem": Descrição completa e clara do problema.
   - "location": Rua, número aproximado, bairro ou ponto de referência mencionado pelo cidadão.
   - "isAnonymous": Se o cidadão solicitou sigilo (padrão true para denúncias).
   - "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL".
4. Verifique se faltam dados essenciais:
   - Se a mensagem do cidadão for genérica (ex: "Quero solicitar um reparo", "Problema na rua"), extraia o intent, mas NÃO avance sem antes pedir os detalhes reais.
   - Se for SOLICITACAO ou DENUNCIA e faltar a localização Específica (nome da rua, bairro, etc), VOCÊ DEVE OBRIGATORIAMENTE colocar "location" na array "missingInfo", definir "readyToSubmit": false, e pedir o endereço na resposta. NUNCA preencha a "location" com a descrição do problema ou com frases genéricas.
5. Quando TODAS as informações essenciais estiverem presentes, retorne "readyToSubmit": false e intent "CONFIRM_DEMAND", apresentando o resumo para o cidadão e incluindo a option de "__CONFIRMAR__". Só marque "readyToSubmit": true DEPOIS que o usuário clicar em Confirmar.
6. Se o cidadão pedir para falar com ouvidor ou atendente humano, marque intent: "HANDOVER".
7. Se o cidadão fornecer um código de protocolo (ex: OUV-2026-XXXXXX), marque intent: "TRACK_PROTOCOL".

Retorne ESTRITAMENTE um objeto JSON válido no formato:
{
  "intent": "CONVERSATION" | "CREATE_DEMAND" | "TRACK_PROTOCOL" | "INFORMATIONAL" | "HANDOVER" | "CONFIRM_DEMAND",
  "type": "SOLICITACAO" | "DENUNCIA" | "RECLAMACAO" | "SUGESTAO" | "ELOGIO",
  "categoryId": "<ID exato da categoria correspondente da lista ou null>",
  "categoryName": "<Nome da categoria>",
  "departmentId": "<ID exato do departamento ou null>",
  "departmentName": "<Nome da secretaria>",
  "title": "<Título resumido>",
  "problem": "<Texto completo do problema relatado>",
  "location": "<Endereço/bairro extraído ou null>",
  "isAnonymous": <true | false>,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "missingInfo": ["location"],
  "readyToSubmit": <true | false>,
  "replyMessage": "<Mensagem de resposta conversacional, acolhedora e clara para o cidadão>",
  "options": [
    { "label": "<Texto do Botão>", "text": "<Ação enviada pelo botão>" }
  ],
  "suggestions": ["<Pílula de sugestão 1>", "<Pílula 2>"]
}
Retorne APENAS o JSON válido, sem qualquer texto fora do JSON.`;

      const userPrompt = `Histórico de Conversa Recente:
${recentHistory || '(Início do atendimento)'}

Estado Atual Acumulado:
${JSON.stringify(currentState)}

Nova Mensagem do Cidadão: "${userQuery}"`;

      const geminiPromise = geminiModel.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini conversation timeout')), AI_TIMEOUT_MS)
      );

      const result = await Promise.race([geminiPromise, timeoutPromise]);
      const rawText = result.response.text().trim();
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // VALIDAÇÕES ESTritas PARA IMPEDIR ALUCINAÇÕES DE IA (BURLAR ROTAS)
      if (parsed.type === 'SOLICITACAO' || parsed.type === 'DENUNCIA') {
        // Se a IA achar que está pronta pra enviar, mas o local for igual à mensagem (ex: "quero relatar")
        if (parsed.location && (
          parsed.location.toLowerCase() === userQuery.toLowerCase() ||
          parsed.location.toLowerCase().includes('quero') ||
          parsed.location.length < 5
        )) {
          parsed.location = null;
        }

        if (!parsed.location && !parsed.missingInfo?.includes('location')) {
          parsed.missingInfo = parsed.missingInfo || [];
          parsed.missingInfo.push('location');
          parsed.readyToSubmit = false;
          parsed.replyMessage = `Entendi a situação! Para enviar a equipe ao local correto, por favor, me informe o **endereço completo** (Rua, bairro, ponto de referência):`;
          parsed.options = [
            { label: '📍 Informar Local', text: 'Bairro Centro, Rua...' },
            { label: '🔄 Cancelar', text: 'menu' }
          ];
        }
      }

      // Evitar que o bot finalize sem a confirmação explícita no passo final
      if (parsed.readyToSubmit && !userQuery.includes('__CONFIRMAR__')) {
        parsed.readyToSubmit = false;
        parsed.intent = 'CONFIRM_DEMAND';
      }

      logger.info(`🤖 LLM Conversacional processou com sucesso (tipo: ${parsed.type}, categoria: ${parsed.categoryName})`);
      return parsed;
    } catch (err) {
      logger.warn(`⚠️ Gemini conversational fallback ativado (${err.message})`);
    }
  }

  // Fallback para o motor local inteligente
  return processConversationalFallback({
    userQuery,
    history,
    currentState,
    categories,
    departments,
  });
}

/**
 * Similaridade semântica para deduplicação
 */
async function calculateSimilarityAI(text1, text2) {
  return calculateTextSimilarity(text1, text2);
}

module.exports = {
  classifySubmissionAI,
  calculateSimilarityAI,
  processConversationalAI,
};
