// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const publicLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_PUBLIC,
  message: {
    success: false,
    message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'development' ? 100 : 15,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Aguarde 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { publicLimiter, loginLimiter };
