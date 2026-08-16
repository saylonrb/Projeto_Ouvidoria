const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2] || process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('❌ Uso: node update_admin.js <nova_senha>');
    console.error('   Ou defina ADMIN_PASSWORD como variável de ambiente.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email: 'admin@ouvidoria.gov.br' },
    data: { passwordHash }
  });
  console.log('✅ Senha do admin atualizada com sucesso.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
