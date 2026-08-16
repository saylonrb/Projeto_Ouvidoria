// src/config/env.js
require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  DEDUP_RADIUS_METERS: parseFloat(process.env.DEDUP_RADIUS_METERS) || 500,
  DEDUP_TIME_WINDOW_HOURS: parseInt(process.env.DEDUP_TIME_WINDOW_HOURS) || 72,
  DEDUP_SIMILARITY_THRESHOLD: parseFloat(process.env.DEDUP_SIMILARITY_THRESHOLD) || 0.75,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_PUBLIC: parseInt(process.env.RATE_LIMIT_MAX_PUBLIC) || 100,
  RATE_LIMIT_MAX_AUTH: parseInt(process.env.RATE_LIMIT_MAX_AUTH) || 300,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

// ── Validação obrigatória de secrets ──────────────────────────
// Em produção, NUNCA permita inicializar sem secrets reais.
// Em desenvolvimento, gera secrets aleatórios temporários com aviso.
if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
  if (env.IS_PRODUCTION) {
    console.error('❌ FATAL: JWT_ACCESS_SECRET e JWT_REFRESH_SECRET são OBRIGATÓRIOS em produção.');
    console.error('   Configure no .env antes de iniciar o servidor.');
    process.exit(1);
  } else {
    const crypto = require('crypto');
    env.JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
    env.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
    console.warn('⚠️  JWT secrets não definidos no .env. Usando secrets temporários (somente desenvolvimento).');
    console.warn('   Sessões serão invalidadas ao reiniciar o servidor.');
  }
}

module.exports = env;
