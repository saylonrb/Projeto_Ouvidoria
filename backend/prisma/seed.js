// prisma/seed.js
// Seed com APENAS dados estruturais reais do sistema.
// Nenhum dado de demonstração, usuário fictício ou submissão fake.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  console.log('   (Apenas dados estruturais — sem dados fictícios)\n');

  // ─── Departments ─────────────────────────────────────────────
  const departments = [
    {
      id: 'dept-obras',
      name: 'Secretaria de Obras e Infraestrutura',
      description: 'Responsável por vias públicas, calçadas, bueiros e infraestrutura urbana.',
      email: 'obras@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-saude',
      name: 'Secretaria de Saúde',
      description: 'Gestão de postos de saúde, vigilância sanitária e saúde pública.',
      email: 'saude@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-urbanismo',
      name: 'Secretaria de Urbanismo e Planejamento',
      description: 'Licenciamento, zoneamento, ordenamento urbano e fiscalização.',
      email: 'urbanismo@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-meioambiente',
      name: 'Secretaria de Meio Ambiente',
      description: 'Arborização, parques, resíduos sólidos e meio ambiente.',
      email: 'meioambiente@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-iluminacao',
      name: 'Secretaria de Iluminação Pública',
      description: 'Manutenção e instalação de iluminação pública.',
      email: 'iluminacao@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-transporte',
      name: 'Secretaria de Transportes e Trânsito',
      description: 'Sinalização, transporte público e trânsito.',
      email: 'transporte@municipio.gov.br',
      phone: '',
    },
    {
      id: 'dept-zeladoria',
      name: 'Zeladoria Urbana',
      description: 'Limpeza pública, varrição, poda de árvores e manutenção geral.',
      email: 'zeladoria@municipio.gov.br',
      phone: '',
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name, description: dept.description, email: dept.email },
      create: dept,
    });
  }
  console.log(`✅ ${departments.length} secretarias configuradas`);

  // ─── Categories ───────────────────────────────────────────────
  const categories = [
    {
      id: 'cat-buraco',
      name: 'Buraco / Cratera na Via',
      description: 'Buracos, afundamentos e crateras em vias públicas.',
      icon: '🕳️',
      keywords: ['buraco', 'cratera', 'afundamento', 'asfalto', 'pavimento', 'remendo', 'cava'],
      departmentId: 'dept-obras',
    },
    {
      id: 'cat-calcada',
      name: 'Calçada Danificada',
      description: 'Problemas em calçadas, meio-fios e passeios públicos.',
      icon: '🚶',
      keywords: ['calçada', 'passeio', 'meio-fio', 'calcamento', 'pedestre'],
      departmentId: 'dept-obras',
    },
    {
      id: 'cat-bueiro',
      name: 'Bueiro Entupido / Rompido',
      description: 'Bueiros obstruídos causando alagamento.',
      icon: '🌊',
      keywords: ['bueiro', 'alagamento', 'enchente', 'entupido', 'galeria', 'drenagem'],
      departmentId: 'dept-obras',
    },
    {
      id: 'cat-iluminacao',
      name: 'Lâmpada Apagada / Poste Danificado',
      description: 'Problemas de iluminação pública.',
      icon: '💡',
      keywords: ['lâmpada', 'poste', 'luz', 'escuro', 'iluminação', 'apagada', 'sem luz'],
      departmentId: 'dept-iluminacao',
    },
    {
      id: 'cat-arvore',
      name: 'Árvore com Risco de Queda',
      description: 'Árvores mortas, inclinadas ou com galhos perigosos.',
      icon: '🌳',
      keywords: ['árvore', 'galho', 'queda', 'poda', 'risco', 'raiz', 'tronco'],
      departmentId: 'dept-meioambiente',
    },
    {
      id: 'cat-lixo',
      name: 'Descarte Irregular de Lixo / Entulho',
      description: 'Pontos de descarte irregular de resíduos.',
      icon: '🗑️',
      keywords: ['lixo', 'entulho', 'descarte', 'bota-fora', 'resíduo', 'sujeira'],
      departmentId: 'dept-meioambiente',
    },
    {
      id: 'cat-dengue',
      name: 'Foco de Dengue / Água Parada',
      description: 'Pontos de água parada com risco de proliferação do mosquito.',
      icon: '🦟',
      keywords: ['dengue', 'mosquito', 'água parada', 'foco', 'aedes', 'zika', 'chikungunya'],
      departmentId: 'dept-saude',
    },
    {
      id: 'cat-sinalizacao',
      name: 'Sinalização de Trânsito Danificada',
      description: 'Placas, semáforos e faixas de pedestres danificadas.',
      icon: '🚦',
      keywords: ['semáforo', 'placa', 'sinalização', 'faixa', 'pedestre', 'sinal'],
      departmentId: 'dept-transporte',
    },
    {
      id: 'cat-limpeza',
      name: 'Limpeza / Varrição de Vias',
      description: 'Limpeza de ruas, praças e espaços públicos.',
      icon: '🧹',
      keywords: ['limpeza', 'varrição', 'varrer', 'sujo', 'sujeira', 'coleta'],
      departmentId: 'dept-zeladoria',
    },
    {
      id: 'cat-esgoto',
      name: 'Vazamento de Esgoto',
      description: 'Esgoto a céu aberto, mau cheiro e vazamentos na rede.',
      icon: '💧',
      keywords: ['esgoto', 'vazamento', 'cheiro', 'fossa', 'mau cheiro', 'rede de esgoto'],
      departmentId: 'dept-obras',
    },
    {
      id: 'cat-obras-irregulares',
      name: 'Obras Irregulares / Construção Clandestina',
      description: 'Denúncias de obras sem licença ou em desacordo com a legislação.',
      icon: '🏗️',
      keywords: ['obra irregular', 'construção clandestina', 'sem licença', 'embargo', 'fiscalização'],
      departmentId: 'dept-urbanismo',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, keywords: cat.keywords.join(','), icon: cat.icon },
      create: { ...cat, keywords: cat.keywords.join(',') },
    });
  }
  console.log(`✅ ${categories.length} categorias configuradas`);

  // ─── Admin do Sistema ─────────────────────────────────────────
  // Cria APENAS o usuário admin inicial a partir das variáveis de ambiente.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ouvidoria.gov.br';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn('⚠️  ADMIN_PASSWORD não definida no .env. Pulando criação do admin.');
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: {
        name: process.env.ADMIN_NAME || 'Administrador',
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        emailVerified: true,
      },
    });
    console.log(`✅ Administrador criado: ${adminEmail}`);
    console.log('   ⚠️  Altere a senha padrão imediatamente após o primeiro login!');
  }

  // ─── Base de Conhecimento (FAQ) ───────────────────────────────
  // Conteúdo institucional real — não são dados fictícios.
  const faqs = [
    {
      question: 'Como abrir uma demanda na ouvidoria?',
      answer: 'Você pode abrir uma demanda de duas formas: pelo formulário passo a passo (clique em "Nova Demanda") ou pelo chatbot conversacional no canto inferior direito. Após o envio, você receberá um número de protocolo para acompanhamento em tempo real.',
      tags: ['demanda', 'protocolo', 'abrir', 'como', 'registrar'],
      category: 'Geral',
    },
    {
      question: 'Quanto tempo leva para minha demanda ser atendida?',
      answer: 'O prazo varia conforme a categoria e prioridade: Emergências (24h), Alta prioridade (3 dias úteis), Demandas gerais (15 dias úteis). O prazo exato é informado após a triagem automática da IA. Você acompanha tudo em tempo real pelo número de protocolo.',
      tags: ['prazo', 'tempo', 'atendimento', 'sla', 'quanto tempo'],
      category: 'Prazos',
    },
    {
      question: 'O que significa quando minha demanda aparece como "vinculada"?',
      answer: 'Nossa IA identificou que o problema relatado já foi registrado por outro(s) cidadão(ãos). Um chamado único foi criado para o município, mas você possui seu protocolo individual e receberá todas as atualizações normalmente. Isso agiliza o atendimento ao evitar processos duplicados.',
      tags: ['duplicado', 'vinculado', 'ia', 'protocolo', 'agrupado'],
      category: 'IA e Deduplicação',
    },
    {
      question: 'Como acompanhar o andamento da minha demanda?',
      answer: 'Acesse "Rastrear Demanda" no menu e informe seu número de protocolo (formato OUV-ANO-XXXXXX). Você verá a timeline completa com cada etapa. Estando logado, todas as suas demandas aparecem em "Minha Área" com atualizações automáticas.',
      tags: ['rastrear', 'acompanhar', 'protocolo', 'status', 'timeline'],
      category: 'Acompanhamento',
    },
    {
      question: 'Preciso fazer cadastro para registrar uma demanda?',
      answer: 'Sim, é necessário um cadastro simples (nome, e-mail e senha) para garantir o sigilo, a autenticidade e o acompanhamento personalizado da sua demanda. Você também pode entrar com sua conta Google. Seus dados são protegidos pela LGPD.',
      tags: ['cadastro', 'login', 'google', 'lgpd', 'conta'],
      category: 'Cadastro e Login',
    },
    {
      question: 'Meus dados pessoais estão seguros?',
      answer: 'Sim. O sistema é desenvolvido em conformidade com a LGPD (Lei Geral de Proteção de Dados). Seus dados são criptografados, não são compartilhados com terceiros não autorizados, e seu nome não é exibido publicamente nas demandas. Você pode solicitar exclusão da conta a qualquer momento.',
      tags: ['lgpd', 'privacidade', 'dados', 'segurança', 'proteção'],
      category: 'Privacidade e LGPD',
    },
    {
      question: 'O que fazer em caso de emergência (risco de vida, acidente grave)?',
      answer: 'Para situações de risco imediato à vida, acione os serviços de emergência: Bombeiros (193), SAMU (192), Polícia Militar (190) ou Defesa Civil (199). A Ouvidoria Municipal é o canal adequado para demandas de melhoria urbana que não configuram emergência.',
      tags: ['emergência', 'urgência', 'bombeiros', 'samu', 'perigo', 'risco de vida'],
      category: 'Emergências',
    },
    {
      question: 'Como reportar um buraco na rua?',
      answer: 'Clique em "Nova Demanda", selecione a categoria "Infraestrutura > Buraco na Via", informe o endereço exato ou marque o local no mapa e, se possível, adicione uma foto. Quanto mais detalhes você fornecer (tamanho, risco, etc.), mais rápido o atendimento será priorizado.',
      tags: ['buraco', 'rua', 'asfalto', 'obras', 'infraestrutura', 'via'],
      category: 'Infraestrutura',
    },
    {
      question: 'Posso acompanhar problemas já reportados no meu bairro?',
      answer: 'Sim! Na seção "Mapa" ou em "Pesquisar Demandas", você pode visualizar todas as ocorrências ativas no seu bairro ou rua. Isso permite verificar se um problema já foi registrado antes de abrir uma nova demanda.',
      tags: ['mapa', 'bairro', 'ocorrências', 'pesquisar', 'problema reportado'],
      category: 'Transparência',
    },
    {
      question: 'Posso cancelar ou editar minha demanda após o envio?',
      answer: 'Demandas enviadas não podem ser editadas para garantir a integridade do registro. Você pode solicitar o cancelamento acessando "Minha Área" e clicando em "Cancelar Demanda", desde que ela ainda não tenha sido encaminhada ao setor responsável.',
      tags: ['cancelar', 'editar', 'alterar', 'demanda enviada'],
      category: 'Geral',
    },
  ];

  for (const faq of faqs) {
    // Usa os primeiros 36 chars do question como id determinístico
    const id = Buffer.from(faq.question).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 36);
    await prisma.knowledgeBase.upsert({
      where: { id },
      update: { answer: faq.answer, tags: faq.tags.join(',') },
      create: { id, ...faq, tags: faq.tags.join(',') },
    });
  }
  console.log(`✅ ${faqs.length} artigos do FAQ configurados`);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('   Sistema pronto para receber demandas reais.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
