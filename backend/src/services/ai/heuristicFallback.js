// src/services/ai/heuristicFallback.js
/**
 * Motor Inteligente Local da Ouvidoria Municipal
 * Triagem estruturada, classificação heurística e diálogo conversacional com o cidadão.
 */
const { findInVocabCatalog, municipalVocabCatalog } = require('./vocabCatalog');

/**
 * Normaliza texto: lowercase, remove acentos, pontuação
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula score de correspondência por keyword
 */
function calculateKeywordScore(normalizedText, keywords) {
  let score = 0;
  let matchCount = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;
    if (normalizedText.includes(normalizedKeyword)) {
      score += normalizedKeyword.split(' ').length;
      matchCount++;
    }
  }

  const maxScore = keywords.reduce((sum, kw) => sum + normalizeText(kw).split(' ').length, 0);
  return { score: maxScore > 0 ? score / maxScore : 0, matchCount };
}

/**
 * Classifica a demanda usando heurística de keywords do banco de dados
 */
function classifySubmission(title, description, categories = []) {
  const combinedText = normalizeText(`${title || ''} ${description || ''}`);
  let bestMatch = null;
  let bestScore = 0;

  for (const cat of categories) {
    if (!cat.keywords) continue;
    const keywordList = typeof cat.keywords === 'string'
      ? cat.keywords.split(',').map(k => k.trim())
      : (Array.isArray(cat.keywords) ? cat.keywords : []);

    const { score, matchCount } = calculateKeywordScore(combinedText, keywordList);
    if (score > bestScore && matchCount > 0) {
      bestScore = score;
      bestMatch = {
        categoryId: cat.id,
        departmentId: cat.departmentId,
        label: cat.name,
        departmentName: cat.department?.name || null,
        score,
      };
    }
  }

  // Se não bateu com as categorias do DB, tenta o catálogo municipal temático
  if (!bestMatch || bestScore < 0.05) {
    const vocabMatch = findInVocabCatalog(combinedText);
    if (vocabMatch) {
      // Procura uma categoria correspondente no DB
      const matchedCat = categories.find(c =>
        normalizeText(c.name).includes(normalizeText(vocabMatch.topic)) ||
        (vocabMatch.category && normalizeText(c.id).includes(normalizeText(vocabMatch.category)))
      );
      if (matchedCat) {
        return {
          categoryId: matchedCat.id,
          departmentId: matchedCat.departmentId,
          confidence: 0.75,
          reasoning: `[CATÁLOGO MUNICIPAL] Identificado tema "${vocabMatch.topic}".`,
          label: matchedCat.name,
          departmentName: matchedCat.department?.name || null,
        };
      }
    }

    return {
      categoryId: null,
      departmentId: null,
      confidence: 0,
      reasoning: 'Não foi possível classificar com confiança.',
      label: null,
      departmentName: null,
    };
  }

  return {
    categoryId: bestMatch.categoryId,
    departmentId: bestMatch.departmentId,
    confidence: Math.min(0.9, 0.45 + bestScore * 2),
    reasoning: `[TRIAGEM IA] Classificado como "${bestMatch.label}" com base no relato do cidadão.`,
    label: bestMatch.label,
    departmentName: bestMatch.departmentName,
  };
}

/**
 * Calcula similaridade textual (Jaccard trigramas)
 */
function calculateTextSimilarity(text1, text2) {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  const words1 = norm1.split(' ').filter(Boolean);
  const words2 = norm2.split(' ').filter(Boolean);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Detecta o tipo de manifestação a partir do texto
 */
function detectManifestationType(text) {
  const norm = normalizeText(text);

  if (norm.includes('denuncia') || norm.includes('sigilo') || norm.includes('ilegal') || norm.includes('crime') || norm.includes('clandestin')) {
    return 'DENUNCIA';
  }
  if (norm.includes('elogio') || norm.includes('elogiar') || norm.includes('parabens') || norm.includes('agradecer') || norm.includes('agradeco')) {
    return 'ELOGIO';
  }
  if (norm.includes('sugestao') || norm.includes('ideia') || norm.includes('proposta') || norm.includes('sugiro') || norm.includes('projeto')) {
    return 'SUGESTAO';
  }
  if (norm.includes('reclamacao') || norm.includes('reclamar') || norm.includes('atraso') || norm.includes('mau atendimento') || norm.includes('pessimo') || norm.includes('nao resolveram')) {
    return 'RECLAMACAO';
  }
  return 'SOLICITACAO';
}

/**
 * Tenta extrair localização do texto livre
 */
function extractLocationFromText(text) {
  if (!text) return null;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // Padrões de endereçamento comuns
  const patterns = [
    /(?:rua|av\.|avenida|travessa|alameda|rodovia|estrada|praca|praça)\s+[^,\.\n]+(?:,\s*\d+)?(?:\s*-\s*[^,\.\n]+)?/i,
    /(?:bairro|setor|vila|jardim|parque)\s+[^,\.\n]+/i,
    /(?:em frente|proximo|perto|ao lado)\s+[^,\.\n]+/i,
  ];

  for (const pat of patterns) {
    const match = raw.match(pat);
    if (match) {
      return match[0].trim();
    }
  }

  // Se o usuário digitou uma resposta curta após ser perguntado sobre local
  if (lower.startsWith('rua ') || lower.startsWith('av ') || lower.startsWith('avenida ') || lower.startsWith('bairro ') || lower.includes('bairro ')) {
    return raw;
  }

  return null;
}

/**
 * Motor conversacional inteligente local
 * Implementa a mesma interface estruturada que o LLM Gemini
 */
async function processConversationalFallback({ userQuery, history = [], currentState = {}, categories = [], departments = [] }) {
  const normQuery = normalizeText(userQuery);
  const qLower = (userQuery || '').toLowerCase().trim();

  // 1. Verificação de Saudações e Menu
  const isGreeting = ['oi', 'ola', 'oie', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'hey', 'hello', 'iniciar'].includes(normQuery);
  const isMenu = ['menu', 'voltar', 'recomecar', 'inicio', 'cancelar'].includes(normQuery);

  if (isMenu) {
    return {
      intent: 'CONVERSATION',
      type: null,
      categoryId: null,
      categoryName: null,
      departmentId: null,
      departmentName: null,
      title: null,
      problem: null,
      location: null,
      isAnonymous: false,
      urgency: 'LOW',
      missingInfo: [],
      readyToSubmit: false,
      replyMessage: 'Atendimento reiniciado! Como posso ajudar você hoje na Ouvidoria Municipal de Parauapebas?',
      options: [
        { label: '💡 Relatar Problema / Manutenção', text: 'Quero relatar um problema na cidade' },
        { label: '🔒 Fazer Denúncia com Sigilo', text: 'Quero fazer uma denúncia' },
        { label: '📢 Fazer uma Reclamação', text: 'Quero fazer uma reclamação' },
        { label: '✨ Dar Sugestão de Melhoria', text: 'Quero dar uma sugestão' },
        { label: '👏 Enviar Elogio', text: 'Quero enviar um elogio' },
        { label: '🔍 Rastrear meu Protocolo', text: 'Quero rastrear um protocolo' },
      ],
      suggestions: ['Lâmpada apagada', 'Buraco na rua', 'Vazamento de água', 'Rastrear protocolo'],
    };
  }

  if (isGreeting && !currentState.problem) {
    return {
      intent: 'CONVERSATION',
      type: null,
      categoryId: null,
      categoryName: null,
      departmentId: null,
      departmentName: null,
      title: null,
      problem: null,
      location: null,
      isAnonymous: false,
      urgency: 'LOW',
      missingInfo: [],
      readyToSubmit: false,
      replyMessage: 'Olá! Sou a assistente inteligente da Ouvidoria Municipal de Parauapebas.\n\nVocê pode me contar o seu problema em linguagem simples (por exemplo: *"a lâmpada do poste da minha rua está apagada"*) que eu identificarei automaticamente a secretaria responsável.',
      options: [
        { label: '💡 Relatar Problema Urbano', text: 'Quero relatar um problema na cidade' },
        { label: '🔒 Denúncia com Sigilo', text: 'Quero fazer uma denúncia' },
        { label: '🔍 Rastrear Protocolo', text: 'Quero rastrear meu protocolo' },
      ],
      suggestions: ['Luz do poste apagada', 'Buraco no asfalto', 'Bueiro entupido', 'Descarte de lixo'],
    };
  }

  // 2. Transbordo Humano
  if (
    normQuery.includes('falar com atendente') ||
    normQuery.includes('falar com ouvidor') ||
    normQuery.includes('atendente humano') ||
    normQuery.includes('falar com pessoa')
  ) {
    return {
      intent: 'HANDOVER',
      type: currentState.type || 'SOLICITACAO',
      categoryId: currentState.categoryId,
      categoryName: currentState.categoryName,
      departmentId: currentState.departmentId,
      departmentName: currentState.departmentName,
      title: currentState.title,
      problem: currentState.problem,
      location: currentState.location,
      isAnonymous: currentState.isAnonymous || false,
      urgency: 'MEDIUM',
      missingInfo: [],
      readyToSubmit: false,
      replyMessage: 'Transferindo seu atendimento para a equipe de Ouvidores da Prefeitura Municipal de Parauapebas! Um de nossos atendentes entrará em contato em instantes.',
      options: [{ label: 'Voltar ao Atendimento Virtual', text: 'menu' }],
      suggestions: ['Aguardando ouvidor...'],
    };
  }

  // 3. Verificação de Rastreamento de Protocolo
  const protocolMatch = userQuery.match(/OUV-\d{4}-[A-Z0-9]{3,8}/i);
  if (protocolMatch) {
    return {
      intent: 'TRACK_PROTOCOL',
      protocolToSearch: protocolMatch[0].toUpperCase(),
      replyMessage: `Localizando o protocolo ${protocolMatch[0].toUpperCase()} no sistema...`,
      options: [{ label: 'Consultar outro protocolo', text: 'Rastrear outro protocolo' }],
      suggestions: ['Voltar ao menu'],
    };
  }

  // 4. Confirmação do Cidadão para Finalizar Criação
  const isConfirmation =
    normQuery === 'confirmar' ||
    normQuery === 'sim' ||
    normQuery === 'pode enviar' ||
    normQuery === 'confirmar e enviar' ||
    normQuery === 'confirmar demanda' ||
    normQuery === 'ok' ||
    normQuery === 'certo' ||
    userQuery === '__CONFIRMAR__';

  if (isConfirmation && currentState.problem && (currentState.location || currentState.type === 'ELOGIO' || currentState.type === 'SUGESTAO')) {
    return {
      intent: 'CREATE_DEMAND',
      type: currentState.type || 'SOLICITACAO',
      categoryId: currentState.categoryId,
      categoryName: currentState.categoryName,
      departmentId: currentState.departmentId,
      departmentName: currentState.departmentName,
      title: currentState.title || currentState.problem.substring(0, 70),
      problem: currentState.problem,
      location: currentState.location || 'Parauapebas - PA',
      isAnonymous: currentState.isAnonymous || false,
      urgency: currentState.urgency || 'MEDIUM',
      missingInfo: [],
      readyToSubmit: true,
      replyMessage: 'Registrando sua demanda na Ouvidoria Municipal e gerando seu protocolo oficial...',
      options: [],
      suggestions: [],
    };
  }

  // 5. Extração e Acumulação de Dados
  let type = currentState.type || detectManifestationType(userQuery);
  let isAnonymous = currentState.isAnonymous ?? (type === 'DENUNCIA');

  // Se o usuário respondeu sobre sigilo
  if (normQuery.includes('sim sigilo') || normQuery === 'sim manter sigilo absoluto' || normQuery === 'sim sigilo') {
    isAnonymous = true;
  } else if (normQuery.includes('nao sigilo') || normQuery === 'nao me identificar') {
    isAnonymous = false;
  }

  // Atualização ou extração do Problema
  let problem = currentState.problem;
  if (!problem && currentState.step === 'collect_problem') {
    problem = userQuery.trim();
  } else if (!problem) {
    problem = userQuery.trim();
  }

  // LÓGICA DO FALLBACK: Escolha manual de categoria
  let categoryId = currentState.categoryId;
  let categoryName = currentState.categoryName;
  let departmentId = currentState.departmentId;

  // Se o usuário clicou em uma categoria sugerida
  if (currentState.step === 'pick_category') {
    const matchedCategory = categories.find(c => c.name.toLowerCase() === qLower || c.id === userQuery);
    if (matchedCategory) {
      categoryId = matchedCategory.id;
      categoryName = matchedCategory.name;
      departmentId = matchedCategory.departmentId;
    }
  }

  // Se temos o problema mas não temos a categoria, forçamos o usuário a escolher
  let replyMessage = '';
  let options = [];
  let suggestions = [];
  let missingInfo = [];
  let intent = 'CONVERSATION';
  let readyToSubmit = false;

  if (problem && !categoryId) {
    replyMessage = `Entendi a sua solicitação. Como nosso motor de Inteligência Artificial está temporariamente indisponível, preciso que você selecione manualmente qual é a **categoria** mais adequada para o seu relato:`;
    
    // Mostra as 8 primeiras categorias como botões para não poluir
    options = categories.slice(0, 8).map(c => ({
      label: `👉 ${c.name}`,
      text: c.name
    }));
    options.push({ label: '🔄 Cancelar', text: 'menu' });
    
    return {
      intent,
      type,
      categoryId: null,
      categoryName: null,
      departmentId: null,
      departmentName: null,
      title: null,
      problem,
      location: currentState.location,
      isAnonymous,
      urgency: 'MEDIUM',
      missingInfo: ['category'],
      readyToSubmit: false,
      replyMessage,
      options,
      suggestions: [],
      step: 'pick_category' // Estado customizado para o fallback
    };
  }

  // Extração ou atualização de Localização
  let location = currentState.location;
  if (!location && currentState.step === 'collect_location') {
    location = userQuery.trim();
  } else if (!location) {
    location = extractLocationFromText(userQuery);
  }

  // Busca nome da secretaria
  let departmentName = currentState.departmentName;
  if (!departmentName && departmentId) {
    const d = departments.find(dept => dept.id === departmentId);
    departmentName = d?.name || 'Secretaria Competente';
  }

  // Título resumido
  let title = currentState.title;
  if (!title && categoryName && problem) {
    title = `${categoryName}: ${problem.substring(0, 60)}`;
    if (title.length > 80) title = title.substring(0, 77) + '...';
  }

  // Determinação de Campos Faltantes
  if (type !== 'ELOGIO' && type !== 'SUGESTAO' && !location) {
    missingInfo.push('location');
  }

  // 6. Resposta Conversacional Inteligente (Fase 2)
  if (missingInfo.includes('location')) {
    replyMessage = `Ótimo! Categoria selecionada: **${categoryName}**.\n\nPara que a equipe técnica possa ser enviada ao local correto, por favor, digite agora o **endereço completo** (rua, número aproximado, ponto de referência ou bairro):`;
    options = [
      { label: '📍 Informar Local', text: 'Bairro Cidade Nova, Rua...' },
      { label: '🔄 Recomeçar', text: 'menu' },
    ];
    suggestions = ['Bairro Cidade Nova', 'Bairro Rio Verde', 'Bairro Centro'];
  } else {
    // Temos informações suficientes: gera resumo estruturado e pede confirmação
    replyMessage = `Excelente! Reuni todas as informações necessárias:\n\n` +
      `• **Tipo de Demanda:** ${type}\n` +
      `• **Assunto Selecionado:** ${categoryName}\n` +
      `• **Secretaria Responsável:** ${departmentName || 'Secretaria Competente'}\n` +
      `• **Localização:** ${location || 'Parauapebas - PA'}\n` +
      `${type === 'DENUNCIA' ? `• **Sigilo da Identidade:** ${isAnonymous ? '🔒 SIM (Sigilo Absoluto Garantido)' : 'Identificado'}\n` : ''}` +
      `\nPodemos registrar sua demanda e gerar seu protocolo de acompanhamento?`;

    options = [
      { label: '✅ Sim, registrar protocolo', text: '__CONFIRMAR__' },
      { label: '✏️ Alterar dados', text: 'menu' },
    ];
    suggestions = ['Confirmar e enviar', 'Quero alterar'];
    intent = 'CONFIRM_DEMAND';
  }

  return {
    intent,
    type,
    categoryId,
    categoryName,
    departmentId,
    departmentName,
    title,
    problem,
    location,
    isAnonymous,
    urgency: 'MEDIUM',
    missingInfo,
    readyToSubmit,
    replyMessage,
    options,
    suggestions,
    step: missingInfo.includes('location') ? 'collect_location' : 'confirm'
  };
}

module.exports = {
  normalizeText,
  classifySubmission,
  calculateTextSimilarity,
  detectManifestationType,
  extractLocationFromText,
  processConversationalFallback,
};
