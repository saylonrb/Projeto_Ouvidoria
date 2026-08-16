const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedObras() {
  try {
    console.log('Seeding Secretaria de Obras...');

    // 1. Criar o Gestor
    const hashPassword = await bcrypt.hash('Obras123!', 10);
    const gestor = await prisma.user.upsert({
      where: { email: 'gestor_obras@email.com' },
      update: {
        role: 'SECTOR_MANAGER',
        passwordHash: hashPassword
      },
      create: {
        name: 'Gestor Obras',
        email: 'gestor_obras@email.com',
        passwordHash: hashPassword,
        role: 'SECTOR_MANAGER',
        phone: '11999999999',
      },
    });
    console.log('Gestor criado:', gestor.email);

    // 2. Criar Departamento
    let departamento = await prisma.department.findUnique({
      where: { managerId: gestor.id }
    });
    if (!departamento) {
      departamento = await prisma.department.create({
        data: {
          name: 'Secretaria de Obras',
          description: 'Responsável pela manutenção urbana',
          managerId: gestor.id
        }
      });
    } else {
      departamento = await prisma.department.update({
        where: { managerId: gestor.id },
        data: { name: 'Secretaria de Obras' }
      });
    }
    console.log('Departamento criado:', departamento.name);

    // 3. Criar Categoria
    let categoria = await prisma.category.findFirst({
      where: { name: 'Buraco na Via' }
    });
    if (!categoria) {
      categoria = await prisma.category.create({
        data: {
          name: 'Buraco na Via',
          description: 'Problemas no asfalto e calçamento',
          departmentId: departamento.id,
          icon: 'lucide-alert-triangle',
          keywords: 'buraco,asfalto'
        }
      });
    }
    console.log('Categoria criada:', categoria.name);

    // 4. Criar Demanda de teste para não ficar vazio
    const protocolo = 'OUV-TESTE-' + Math.floor(Math.random() * 10000);
    const userComum = await prisma.user.findFirst({ where: { role: 'COMUM' } });
    
    if (userComum) {
      await prisma.citizenSubmission.create({
        data: {
          protocol: protocolo,
          title: 'Buraco gigante na rua',
          description: 'Carro caiu no buraco e quebrou a suspensão. Muito perigoso.',
          status: 'RECEIVED',
          userId: userComum.id,
          categoryId: categoria.id,
          neighborhood: 'Centro'
        }
      });
      console.log('Demanda de teste criada para Obras.');
    }

    console.log('Seeding concluído com sucesso!');
  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedObras();
