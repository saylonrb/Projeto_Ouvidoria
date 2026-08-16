// src/services/deduplicationService.js
/**
 * Serviço de Deduplicação Inteligente de Demandas
 * Agrupa demandas similares em MasterTickets para evitar duplicidade administrativa
 */
const { prisma } = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const { haversineDistance, generateMasterCode } = require('../utils/protocolGenerator');
const { calculateSimilarityAI } = require('./ai/geminiService');

/**
 * Busca MasterTickets candidatos a deduplicação
 * Critérios: mesma categoria, abertos nas últimas N horas, dentro do raio
 */
async function findCandidateTickets(categoryId, latitude, longitude) {
  const timeWindowStart = new Date();
  timeWindowStart.setHours(timeWindowStart.getHours() - env.DEDUP_TIME_WINDOW_HOURS);

  // Busca tickets da mesma categoria nos últimos N horas (não concluídos/rejeitados)
  const candidates = await prisma.masterTicket.findMany({
    where: {
      categoryId,
      createdAt: { gte: timeWindowStart },
      status: {
        notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'],
      },
    },
    include: {
      submissions: { select: { id: true } },
    },
  });

  // Filtra por raio geográfico (se coordenadas fornecidas)
  if (latitude && longitude) {
    return candidates.filter((ticket) => {
      if (!ticket.latitude || !ticket.longitude) return true; // inclui se sem coords
      const distance = haversineDistance(latitude, longitude, ticket.latitude, ticket.longitude);
      return distance <= env.DEDUP_RADIUS_METERS;
    });
  }

  return candidates;
}

/**
 * Processo completo de deduplicação para uma nova submissão.
 * 
 * @returns { masterTicket, isDuplicate }
 *   - masterTicket: ticket existente (duplicata) ou novo ticket criado
 *   - isDuplicate: true se vinculado a ticket existente
 */
async function deduplicateSubmission({
  title,
  description,
  categoryId,
  departmentId,
  latitude,
  longitude,
  address,
  neighborhood,
  aiResult,
}) {
  // 1. Busca candidatos por localização + categoria + janela temporal
  const candidates = await findCandidateTickets(categoryId, latitude, longitude);

  logger.debug(`Deduplicação: ${candidates.length} candidatos encontrados`);

  // 2. Calcula similaridade textual com cada candidato
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const similarity = await calculateSimilarityAI(
      `${title} ${description}`,
      `${candidate.title} ${candidate.description}`
    );

    logger.debug(`  Candidato ${candidate.internalCode}: similaridade ${similarity.toFixed(2)}`);

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  // 3. Se encontrou match acima do threshold → é duplicata
  if (bestMatch && bestSimilarity >= env.DEDUP_SIMILARITY_THRESHOLD) {
    logger.info(
      `🔗 Duplicata detectada! Vinculando ao ${bestMatch.internalCode} (similaridade: ${bestSimilarity.toFixed(2)})`
    );

    // Incrementa prioridade se muitos cidadãos reportaram
    const submissionCount = bestMatch.submissions.length + 1;
    let newPriority = bestMatch.priority;
    if (submissionCount >= 10) newPriority = 'CRITICAL';
    else if (submissionCount >= 5) newPriority = 'HIGH';
    else if (submissionCount >= 3) newPriority = 'MEDIUM';

    // Atualiza a prioridade do ticket mestre
    const updatedTicket = await prisma.masterTicket.update({
      where: { id: bestMatch.id },
      data: { priority: newPriority },
    });

    return { masterTicket: updatedTicket, isDuplicate: true };
  }

  // 4. Não é duplicata → cria novo MasterTicket
  logger.info('📋 Nova demanda única. Criando MasterTicket...');
  const internalCode = await generateMasterCode();

  const newMasterTicket = await prisma.masterTicket.create({
    data: {
      internalCode,
      title,
      description: aiResult.summary || description.substring(0, 500),
      status: 'TRIAGED',
      priority: mapUrgencyToPriority(aiResult.urgency),
      latitude,
      longitude,
      address,
      neighborhood,
      aiScore: aiResult.confidence,
      aiReasoning: aiResult.reasoning,
      departmentId,
      categoryId,
    },
  });

  return { masterTicket: newMasterTicket, isDuplicate: false };
}

function mapUrgencyToPriority(urgency) {
  const map = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', CRITICAL: 'CRITICAL' };
  return map[urgency] || 'MEDIUM';
}

module.exports = { deduplicateSubmission };
