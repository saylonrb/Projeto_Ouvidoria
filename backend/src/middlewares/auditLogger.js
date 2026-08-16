// src/middlewares/auditLogger.js
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

function isExpressRequest(obj) {
  return Boolean(obj && (obj.headers || obj.ip || obj.connection || obj.socket || obj.method));
}

function safeStringify(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Registra uma ação de auditoria no banco de dados com suporte flexível a parâmetros.
 */
async function logAudit(...args) {
  try {
    let userId = null;
    let action = 'UNKNOWN_ACTION';
    let entityType = null;
    let entityId = null;
    let targetResource = null;
    let oldValue = null;
    let newValue = null;
    let req = null;

    if (args.length === 1 && typeof args[0] === 'object' && !isExpressRequest(args[0])) {
      const opts = args[0];
      userId = opts.userId;
      action = opts.action;
      entityType = opts.entityType;
      entityId = opts.entityId;
      targetResource = typeof opts.targetResource === 'object' ? safeStringify(opts.targetResource) : opts.targetResource;
      oldValue = opts.oldValue;
      newValue = opts.newValue;
      req = opts.req;
    } else {
      userId = args[0];
      action = args[1];
      entityType = args[2];
      entityId = args[3];

      const remaining = args.slice(4);
      const reqIndex = remaining.findIndex(isExpressRequest);
      if (reqIndex !== -1) {
        req = remaining[reqIndex];
        remaining.splice(reqIndex, 1);
      }

      if (remaining.length === 1) {
        const item = remaining[0];
        if (typeof item === 'string') {
          targetResource = item;
        } else {
          newValue = item;
          targetResource = safeStringify(item);
        }
      } else if (remaining.length >= 2) {
        oldValue = remaining[0];
        newValue = remaining[1];
        if (remaining.length >= 3 && typeof remaining[2] === 'string') {
          targetResource = remaining[2];
        }
      }
    }

    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || req?.socket?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: String(action || 'UNKNOWN'),
        entityType: entityType || null,
        entityId: entityId ? String(entityId) : null,
        targetResource: typeof targetResource === 'object' ? safeStringify(targetResource) : (targetResource ? String(targetResource) : null),
        oldValue: safeStringify(oldValue),
        newValue: safeStringify(newValue),
        ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 100) : null,
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 500) : null,
      },
    });
  } catch (error) {
    logger.error('Falha ao registrar log de auditoria:', error);
  }
}

module.exports = { logAudit };
