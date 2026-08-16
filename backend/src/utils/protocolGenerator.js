// src/utils/protocolGenerator.js
const { prisma } = require('../config/database');

/**
 * Gera protocolo único para o cidadão: OUV-ANO-XXXXXX
 */
async function generateProtocol() {
  const year = new Date().getFullYear();
  const prefix = `OUV-${year}-`;

  // Busca o último protocolo do ano atual
  const lastSubmission = await prisma.citizenSubmission.findFirst({
    where: { protocol: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
  });

  let nextNumber = 1;
  if (lastSubmission && lastSubmission.protocol) {
    const parts = lastSubmission.protocol.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      } else {
        const count = await prisma.citizenSubmission.count();
        nextNumber = count + 1;
      }
    }
  }

  let candidate = `${prefix}${String(nextNumber).padStart(6, '0')}`;

  // Garante unicidade verificando no banco
  const existing = await prisma.citizenSubmission.findUnique({
    where: { protocol: candidate },
  });

  if (existing) {
    const totalCount = await prisma.citizenSubmission.count();
    candidate = `${prefix}${String(totalCount + 1 + Math.floor(Math.random() * 100)).padStart(6, '0')}`;
  }

  return candidate;
}

/**
 * Gera código interno para o MasterTicket: MT-ANO-XXXX
 */
async function generateMasterCode() {
  const year = new Date().getFullYear();
  const prefix = `MT-${year}-`;

  const lastTicket = await prisma.masterTicket.findFirst({
    where: { internalCode: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
  });

  let nextNumber = 1;
  if (lastTicket && lastTicket.internalCode) {
    const parts = lastTicket.internalCode.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      } else {
        const count = await prisma.masterTicket.count();
        nextNumber = count + 1;
      }
    }
  }

  let candidate = `${prefix}${String(nextNumber).padStart(4, '0')}`;

  const existing = await prisma.masterTicket.findUnique({
    where: { internalCode: candidate },
  });

  if (existing) {
    const totalCount = await prisma.masterTicket.count();
    candidate = `${prefix}${String(totalCount + 1 + Math.floor(Math.random() * 100)).padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * Calcula distância em metros entre dois pontos (Haversine)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { generateProtocol, generateMasterCode, haversineDistance };
