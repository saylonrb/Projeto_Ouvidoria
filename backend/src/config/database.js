// src/config/database.js
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Banco de dados conectado (SQLite via Prisma)');
  } catch (error) {
    logger.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

module.exports = { prisma, connectDatabase };
