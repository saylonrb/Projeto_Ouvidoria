// src/server.js
require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');

const PORT = env.PORT;

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`\n🚀 Ouvidoria Backend rodando!`);
      logger.info(`   Porta:       http://localhost:${PORT}`);
      logger.info(`   API:         http://localhost:${PORT}/api`);
      logger.info(`   Docs:        http://localhost:${PORT}/api/docs`);
      logger.info(`   Health:      http://localhost:${PORT}/api/health`);
      logger.info(`   Ambiente:    ${env.NODE_ENV}\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n⚠️  ${signal} recebido. Encerrando servidor graciosamente...`);
      server.close(async () => {
        const { prisma } = require('./config/database');
        await prisma.$disconnect();
        logger.info('✅ Conexões encerradas. Servidor finalizado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
      logger.error('❌ Erro não capturado:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('❌ Promise rejeitada sem tratamento:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
