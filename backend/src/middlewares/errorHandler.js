// src/middlewares/errorHandler.js
const logger = require('../utils/logger');
const { IS_PRODUCTION } = require('../config/env');

/**
 * Classe de erros customizados da aplicação
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware global de tratamento de erros
 * Garante que stack traces nunca vazem para o cliente em produção
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Ocorreu um erro interno no servidor.';

  // Log detalhado no servidor
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${statusCode}:`, err);
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${statusCode}: ${err.message}`);
  }

  const response = {
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    // Stack trace APENAS em desenvolvimento local
    ...(!IS_PRODUCTION && statusCode >= 500 && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
}

/**
 * Handler para rotas não encontradas
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { AppError, errorHandler, notFoundHandler };
