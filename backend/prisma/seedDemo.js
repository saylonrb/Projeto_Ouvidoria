const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function getRandomOffset() {
  return (Math.random() - 0.5) * 0.03;
}

async function main() {
  console.log('🌱 Inserindo dados fictícios de demonstração (Parauapebas)...');

  let user = await prisma.user.findUnique({ where: { email: 'demo@ouvidoria.gov.br' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Cidadão Demo',
        email: 'demo@ouvidoria.gov.br',
        passwordHash: bcrypt.hashSync('demo123', 12),
        role: 'CITIZEN',
      }
    });
  }

  const baseLat = -6.0689;
  const baseLng = -49.9038;

  const demoSubmissions = [
    {
      title: 'Buraco perigoso na via principal',
      description: 'Uma cratera abriu na rua após as chuvas.',
      categoryId: 'cat-buraco',
      status: 'RECEIVED',
      latitude: baseLat + getRandomOffset(),
      longitude: baseLng + getRandomOffset(),
      address: 'R. 14, Cidade Nova, Parauapebas - PA',
      neighborhood: 'Cidade Nova',
      protocol: 'OUV-2026-BUR001'
    },
    {
      title: 'Lâmpada queimada no poste',
      description: 'Rua totalmente escura, lâmpada do poste queimou há uma semana.',
      categoryId: 'cat-iluminacao',
      status: 'IN_PROGRESS',
      latitude: baseLat + getRandomOffset(),
      longitude: baseLng + getRandomOffset(),
      address: 'Rua A, Primavera, Parauapebas - PA',
      neighborhood: 'Primavera',
      protocol: 'OUV-2026-LUZ002'
    },
    {
      title: 'Descarte irregular de lixo',
      description: 'Estão jogando entulho na esquina da praça.',
      categoryId: 'cat-lixo',
      status: 'RECEIVED',
      latitude: baseLat + getRandomOffset(),
      longitude: baseLng + getRandomOffset(),
      address: 'Praça da Bíblia, Parauapebas - PA',
      neighborhood: 'Centro',
      protocol: 'OUV-2026-LIX003'
    },
    {
      title: 'Bueiro entupido',
      description: 'Bueiro cheio de folhas causando alagamento.',
      categoryId: 'cat-bueiro',
      status: 'COMPLETED',
      latitude: baseLat + getRandomOffset(),
      longitude: baseLng + getRandomOffset(),
      address: 'Rua E, Rio Verde, Parauapebas - PA',
      neighborhood: 'Rio Verde',
      protocol: 'OUV-2026-BUE004'
    }
  ];

  for (const sub of demoSubmissions) {
    await prisma.citizenSubmission.upsert({
      where: { protocol: sub.protocol },
      update: {},
      create: {
        ...sub,
        userId: user.id
      }
    });
  }

  console.log('✅ Dados de demonstração inseridos com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
