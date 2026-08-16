// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const env = require('../config/env');
const { AppError } = require('./errorHandler');

/**
 * Verifica o JWT de acesso no header Authorization
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação não fornecido.', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AppError('Token expirado. Faça login novamente.', 401);
      }
      throw new AppError('Token inválido.', 401);
    }

    // Busca o usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Usuário não encontrado ou inativo.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de autorização por perfil (RBAC)
 * @param {...string} roles - Roles permitidas (ex: 'SUPER_ADMIN', 'SECTOR_MANAGER')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Não autenticado.', 401));
    }

    const allowedRoles = new Set(roles);
    if (allowedRoles.has('CITIZEN') || allowedRoles.has('COMUM')) {
      allowedRoles.add('CITIZEN');
      allowedRoles.add('COMUM');
    }

    if (!allowedRoles.has(req.user.role)) {
      return next(new AppError('Acesso negado. Permissões insuficientes.', 403));
    }

    next();
  };
}

/**
 * Middleware opcional de autenticação: se houver token válido, preenche req.user;
 * se não houver, continua a execução sem lançar erro 401.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      return next(); // Token inválido/expirado em rota opcional: continua como anônimo
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}

module.exports = { authenticate, optionalAuthenticate, authorize };
