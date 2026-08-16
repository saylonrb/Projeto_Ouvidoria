const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function getRandomOffset() {
  return (Math.random() - 0.5) * 0.03; // espalhamento ~1.5km
}

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados (Removendo fantasmas)...');

  // Mantém apenas o Admin (se existir) e o Chatbot
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ouvidoria.gov.br';
  const chatbotEmail = 'chatbot@ouvidoria.gov.br';

  const usersToKeep = await prisma.user.findMany({
    where: {
      email: { in: [adminEmail, chatbotEmail] }
    }
  });

  const idsToKeep = usersToKeep.map(u => u.id);

  console.log('Apagando Master Tickets...');
  await prisma.masterTicket.deleteMany({});
  
  console.log('Apagando Demandas Individuais...');
  await prisma.citizenSubmission.deleteMany({});
  
  console.log('Apagando Histórico de Status...');
  await prisma.statusHistory.deleteMany({});
  
  console.log('Apagando Notificações...');
  await prisma.notification.deleteMany({});
  
  console.log('Apagando Logs de Auditoria...');
  await prisma.auditLog.deleteMany({});
  
  console.log('Apagando Refresh Tokens...');
  await prisma.refreshToken.deleteMany({});

  console.log('Apagando Usuários irreais/testes...');
  await prisma.user.deleteMany({
    where: {
      id: { notIn: idsToKeep }
    }
  });

  console.log('🌱 Inserindo 10 usuários reais de cidadãos...');
  const passwordHash = await bcrypt.hash('senha123', 10);
  
  const realUsers = [];
  for (let i = 1; i <= 10; i++) {
    const u = await prisma.user.create({
      data: {
        name: `Cidadão Voluntário ${i}`,
        email: `cidadao${i}@email.com`,
        passwordHash,
        role: 'CITIZEN',
        emailVerified: true,
      }
    });
    realUsers.push(u);
  }

  console.log('🌱 Inserindo 10 demandas reais em Parauapebas...');
  // Coordenadas centrais aproximadas de Parauapebas-PA
  const baseLat = -6.0689;
  const baseLng = -49.9038;

  const categories = await prisma.category.findMany();
  
  if (categories.length > 0) {
    const titles = [
      'Buraco perigoso causando acidentes',
      'Lâmpada queimada há 3 semanas',
      'Descarte de entulho na calçada',
      'Bueiro sem tampa',
      'Árvore com risco de queda sobre fiação',
      'Foco de água parada em terreno abandonado',
      'Semáforo apagado no cruzamento',
      'Vazamento de esgoto a céu aberto',
      'Rua precisando de varrição',
      'Calçada destruída impedindo passagem'
    ];
    const catKeys = [
      'cat-buraco', 'cat-iluminacao', 'cat-lixo', 'cat-bueiro', 'cat-arvore', 
      'cat-dengue', 'cat-sinalizacao', 'cat-esgoto', 'cat-limpeza', 'cat-calcada'
    ];

    for (let i = 0; i < 10; i++) {
      const catId = categories.find(c => c.id === catKeys[i])?.id || categories[0].id;
      
      const lat = baseLat + getRandomOffset();
      const lng = baseLng + getRandomOffset();
      
      await prisma.citizenSubmission.create({
        data: {
          protocol: `OUV-2026-REAL0${i < 9 ? '0'+(i+1) : (i+1)}`,
          title: titles[i],
          description: `Identifiquei o problema reportado hoje pela manhã no meu trajeto. Aguardo uma solução.`,
          categoryId: catId,
          status: 'RECEIVED',
          userId: realUsers[i].id,
          latitude: lat,
          longitude: lng,
          address: `Rua Exemplo ${i+1}, Parauapebas - PA`,
          neighborhood: i % 2 === 0 ? 'Cidade Nova' : 'Rio Verde',
        }
      });
    }
  }

  console.log('✅ Banco de dados limpo e configurado com dados reais com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro na limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
