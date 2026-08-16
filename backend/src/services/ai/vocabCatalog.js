/**
 * Catálogo Amplo de Vocabulário, Dúvidas e Tópicos Municipais da Ouvidoria
 */

const municipalVocabCatalog = [
  {
    category: 'ILUMINACAO',
    keywords: ['lâmpada', 'lampada', 'poste', 'escuro', 'escuridão', 'iluminação', 'iluminacao', 'luz', 'fiação', 'fiacao', 'poste caído'],
    topic: 'Iluminação Pública',
    response: `💡 **Iluminação Pública & Manutenção de Postes**\n\n` +
      `Para relatar lâmpadas queimadas, postes apagados ou fiação exposta:\n` +
      `• O prazo médio de reparo da equipe de eletricistas é de **48 a 72 horas**.\n` +
      `• Você pode abrir um chamado por aqui ou rastrear um protocolo existente.\n\n` +
      `O que você deseja fazer agora?`,
    options: [
      { label: '💡 Abrir Chamado de Iluminação', text: 'Quero abrir uma solicitação de iluminação pública' },
      { label: '🔍 Rastrear meu Protocolo', text: 'Rastrear meu protocolo' },
      { label: '📞 Telefones da Iluminação', text: 'Quais os telefones de contato?' }
    ]
  },
  {
    category: 'ASFALTO',
    keywords: ['buraco', 'cratera', 'asfalto', 'rua', 'via', 'pavimentação', 'pavimentacao', 'recapeamento', 'calçada', 'calcada', 'meio-fio', 'paralelepípedo'],
    topic: 'Vias, Asfalto & Pavimentação',
    response: `🕳️ **Vias, Asfalto & Pavimentação**\n\n` +
      `Para solicitações de tapa-buraco, pavimentação ou reparo em calçadas:\n` +
      `• As demandas são agrupadas por bairro pela IA para envio da equipe de obras.\n` +
      `• Informar o ponto de referência ajuda a localizar o buraco com precisão.\n\n` +
      `Como posso te ajudar sobre este tema?`,
    options: [
      { label: '🕳️ Relatar Buraco na Rua', text: 'Quero relatar um buraco na rua' },
      { label: '🗺️ Ver Mapa de Obras', text: 'Ver mapa de solicitações' }
    ]
  },
  {
    category: 'AGUA_ESGOTO',
    keywords: ['vazamento', 'água', 'agua', 'esgoto', 'bueiro', 'bueiro entupido', 'alagamento', 'inundação', 'sarjeta', 'cano', 'rompido', 'cheiro'],
    topic: 'Água, Saneamento & Bueiros',
    response: `💧 **Água, Saneamento & Bueiros**\n\n` +
      `Para vazamentos de água potável, esgoto a céu aberto ou desobstrução de bueiros:\n` +
      `• Vazamentos de água potável possuem **prioridade alta** na triagem.\n` +
      `• Bueiros entupidos são encaminhados à equipe de saneamento urbano.\n\n` +
      `O que você gostaria de registrar?`,
    options: [
      { label: '💧 Relatar Vazamento de Água', text: 'Quero relatar um vazamento de água' },
      { label: '🌊 Bueiro Entupido / Esgoto', text: 'Quero relatar bueiro entupido' }
    ]
  },
  {
    category: 'LIMPEZA_LIXO',
    keywords: ['lixo', 'entulho', 'limpeza', 'terreno', 'mato', 'capina', 'varrição', 'varricao', 'coleta', 'caçamba', 'sujeira', 'descarte'],
    topic: 'Limpeza Urbana & Coleta de Lixo',
    response: `🗑️ **Limpeza Urbana, Lixo & Entulho**\n\n` +
      `Para denunciar descarte ilegal de entulho, mato alto em terrenos ou atraso na coleta:\n` +
      `• O descarte irregular em praças ou vias públicas pode ser objeto de **denúncia com sigilo**.\n` +
      `• Solicitações de capina e varrição entram no cronograma do bairro.\n\n` +
      `Como deseja prosseguir?`,
    options: [
      { label: '🗑️ Denunciar Descarte Ilegal', text: 'Quero fazer uma denúncia de descarte de lixo' },
      { label: '🧹 Solicitar Limpeza de Rua', text: 'Quero solicitar limpeza de rua' }
    ]
  },
  {
    category: 'TRANSITO',
    keywords: ['semáforo', 'semaforo', 'trânsito', 'transito', 'ônibus', 'onibus', 'placa', 'lombada', 'faixa', 'parada', 'ponto de ônibus', 'estacionamento'],
    topic: 'Trânsito & Transporte Público',
    response: `🚌 **Trânsito, Sinalização & Transporte Público**\n\n` +
      `Para semáforos com defeito, pintura de faixa de pedestres ou problemas em ônibus:\n` +
      `• Semáforos quebrados em cruzamentos principais têm prioridade de urgência.\n` +
      `• Reclamações sobre horários de ônibus são enviadas ao Departamento de Transportes.\n\n` +
      `Selecione uma opção:`,
    options: [
      { label: '🚦 Semáforo / Sinalização Quebrada', text: 'Quero relatar problema no trânsito' },
      { label: '🚌 Reclamação sobre Ônibus', text: 'Quero fazer reclamação de ônibus' }
    ]
  },
  {
    category: 'SAUDE',
    keywords: ['saúde', 'saude', 'posto', 'ubs', 'upa', 'médico', 'medico', 'remédio', 'remedio', 'vacina', 'consulta', 'dengue', 'mosquito', 'animal', 'zoonoses'],
    topic: 'Saúde & Zoonoses',
    response: `🏥 **Saúde, Postos (UBS/UPA) & Controle de Zoonoses**\n\n` +
      `Para reclamações de atendimento, falta de medicamentos ou focos de dengue/animais soltos:\n` +
      `• Denúncias de focos de dengue geram vistoria dos agentes de endemias.\n` +
      `• Elogios às equipes médicas são repassados diretamente à direção da UBS.\n\n` +
      `Qual atendimento você busca?`,
    options: [
      { label: '🏥 Reclamação / Falta de Remédio', text: 'Quero fazer reclamação da saúde' },
      { label: '🦟 Denúncia de Foco de Dengue', text: 'Quero denunciar foco de dengue' },
      { label: '👏 Elogiar Equipe Médica', text: 'Quero enviar um elogio para a saúde' }
    ]
  },
  {
    category: 'DENUNCIA_SIGILO',
    keywords: ['denúncia', 'denuncia', 'sigilo', 'anônimo', 'anonimo', 'crime', 'corrupção', 'ilegal', 'clandestino', 'infração', 'vigilância'],
    topic: 'Denúncias & Sigilo de Identidade',
    response: `🔒 **Denúncias com Proteção de Sigilo**\n\n` +
      `A Ouvidoria Municipal garante **sigilo absoluto** ao denunciante conforme a Lei de Acesso à Informação.\n` +
      `• Seus dados pessoais **nunca** são repassados aos fiscais ou investigados.\n` +
      `• É possível registrar denúncias ambientais, de obras ilegais ou desvio de conduta.\n\n` +
      `Como deseja registrar sua denúncia?`,
    options: [
      { label: '⚠️ Fazer Denúncia com Sigilo', text: 'Quero fazer uma denúncia com sigilo' },
      { label: '❓ Como funciona o Sigilo?', text: 'Como funciona o sigilo da denúncia?' }
    ]
  },
  {
    category: 'CANAIS_CONTATO',
    keywords: ['telefone', 'whatsapp', 'contato', 'horário', 'horario', 'prefeitura', '156', 'presencial', 'falar', 'atendente'],
    topic: 'Canais Oficiais de Atendimento',
    response: `📞 **Canais Oficiais da Ouvidoria Municipal**\n\n` +
      `Você pode se comunicar pelos seguintes meios oficiais:\n\n` +
      `• **WhatsApp Oficial:** (94) 99999-0156\n` +
      `• **Telefone Gratuito:** Ligue 156 (Segunda a Sexta, 08h às 14h)\n` +
      `• **Atendimento Presencial:** Balcão da Ouvidoria no Prédio da Prefeitura\n` +
      `• **Site / Web:** Registre e rastreie 24 horas por dia por este assistente.\n\n` +
      `O que prefere fazer?`,
    options: [
      { label: '💬 Abrir WhatsApp da Ouvidoria', text: 'Ver WhatsApp da Ouvidoria' },
      { label: '📝 Registrar por Aqui', text: 'Quero abrir uma solicitação' }
    ]
  }
];

/**
 * Busca correspondência no vocabulário amplo
 */
function findInVocabCatalog(query) {
  const qLower = query.toLowerCase();
  for (const item of municipalVocabCatalog) {
    if (item.keywords.some(kw => qLower.includes(kw))) {
      return item;
    }
  }
  return null;
}

module.exports = { municipalVocabCatalog, findInVocabCatalog };
