// src/controllers/submissionsController.js
const { z } = require('zod');
const xss = require('xss');
const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { classifySubmissionAI } = require('../services/ai/geminiService');
const { deduplicateSubmission } = require('../services/deduplicationService');
const { generateProtocol } = require('../utils/protocolGenerator');
const { logAudit } = require('../middlewares/auditLogger');
const logger = require('../utils/logger');

const submissionSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(200),
  description: z.string().min(5, 'Descrição muito curta').max(2000),
  type: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().max(300).optional(),
  neighborhood: z.string().max(100).optional(),
  location: z.string().max(300).optional(),
  categoryId: z.string().optional(),
});

/**
 * POST /api/submissions
 * Cria nova demanda com triagem IA e deduplicação
 */
async function createSubmission(req, res, next) {
  try {
    const rawData = submissionSchema.parse(req.body);

    // Sanitiza contra XSS
    const data = {
      ...rawData,
      title: xss(rawData.title),
      description: xss(rawData.description),
      address: rawData.address ? xss(rawData.address) : (rawData.location ? xss(rawData.location) : undefined),
      neighborhood: rawData.neighborhood ? xss(rawData.neighborhood) : undefined,
    };

    const protocol = await generateProtocol();

    // Cria a submissão inicialmente com status RECEIVED
    const formattedTitle = data.type ? `[${data.type}] ${data.title}` : data.title;

    let validCategoryId = undefined;
    if (data.categoryId) {
      const catObj = await prisma.category.findUnique({ where: { id: data.categoryId } }).catch(() => null);
      if (catObj) validCategoryId = catObj.id;
    }

    const isAnonymousSubmission = Boolean(
      data.isAnonymous ||
      (data.type === 'DENUNCIA' && data.isAnonymous !== false) ||
      data.description.includes('[Sigilo: SIM]') ||
      data.description.includes('[Sigilo Solicitado: SIM')
    );

    const submission = await prisma.citizenSubmission.create({
      data: {
        protocol,
        title: formattedTitle,
        description: data.description,
        status: 'RECEIVED',
        address: data.address || data.location,
        neighborhood: data.neighborhood,
        categoryId: validCategoryId,
        isAnonymous: isAnonymousSubmission,
        userId: req.user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        submissionId: submission.id,
        status: 'RECEIVED',
        comment: 'Demanda recebida pelo sistema. Aguardando triagem.',
      },
    });

    // Processa IA em background (não bloqueia a resposta)
    processSubmissionAI(submission, req).catch((err) => {
      logger.error('Erro no processamento IA da submissão:', err);
    });

    await logAudit(req.user.id, 'SUBMISSION_CREATED', 'CitizenSubmission', submission.id, {
      protocol,
    }, req);

    return sendCreated(res, {
      submission: {
        id: submission.id,
        trackingProtocol: submission.protocol,
        status: submission.status,
      },
      message: 'Sua demanda foi recebida e está sendo processada pela nossa IA.',
    }, 'Demanda registrada com sucesso!');
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Dados inválidos.', 400, error.errors));
    }
    next(error);
  }
}

/**
 * Processa a triagem de IA e deduplicação em background
 */
async function processSubmissionAI(submission, req) {
  try {
    // Atualiza status para AI_PROCESSING
    await updateSubmissionStatus(submission.id, 'AI_PROCESSING', 'Triagem automática pela IA em andamento.');

    // Busca categorias ativas no DB para passar para a IA
    const activeCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: { department: { select: { id: true, name: true } } }
    });

    // 1. Classifica a demanda via IA
    const aiResult = await classifySubmissionAI(submission.title, submission.description, activeCategories);

    let categoryId = aiResult.categoryId;
    let departmentId = aiResult.departmentId;

    // Verifica se a categoria/departamento existem
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) { categoryId = null; departmentId = null; }
    }
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) departmentId = null;
    }

    // Se não classificou, usa primeira categoria disponível como fallback
    if (!categoryId) {
      const firstCat = await prisma.category.findFirst({ where: { isActive: true } });
      if (firstCat) {
        categoryId = firstCat.id;
        departmentId = firstCat.departmentId;
      }
    }

    // 2. Deduplicação
    const { masterTicket, isDuplicate } = await deduplicateSubmission({
      title: submission.title,
      description: submission.description,
      categoryId,
      departmentId,
      latitude: submission.latitude,
      longitude: submission.longitude,
      address: submission.address,
      neighborhood: submission.neighborhood,
      aiResult,
    });

    // 3. Atualiza a submissão com os resultados
    await prisma.citizenSubmission.update({
      where: { id: submission.id },
      data: {
        categoryId,
        masterTicketId: masterTicket.id,
        aiProcessed: true,
        isDuplicate,
        status: 'TRIAGED',
      },
    });

    const triageComment = isDuplicate
      ? `[IA] Demanda vinculada ao protocolo mestre ${masterTicket.internalCode}. Um problema similar já foi reportado na mesma área.`
      : `[IA] Classificado como "${aiResult.label}". Encaminhando para o setor competente. (Confiança: ${Math.round((aiResult.confidence || 0) * 100)}%)`;

    await updateSubmissionStatus(submission.id, 'TRIAGED', triageComment);

    // 4. Encaminha para o setor
    if (departmentId) {
      await updateSubmissionStatus(submission.id, 'FORWARDED', `Demanda encaminhada para processamento pelo setor responsável.`);

      await prisma.citizenSubmission.update({
        where: { id: submission.id },
        data: { status: 'FORWARDED' },
      });
    }

    // 5. Notifica o cidadão
    await prisma.notification.create({
      data: {
        userId: submission.userId,
        submissionId: submission.id,
        title: isDuplicate ? '🔗 Demanda vinculada a chamado existente' : '✅ Demanda triada com sucesso',
        message: isDuplicate
          ? `Sua demanda (${submission.protocol}) foi identificada como similar a um problema já registrado. Você continuará recebendo atualizações normalmente.`
          : `Sua demanda (${submission.protocol}) foi classificada como "${aiResult.label}" e encaminhada para o setor competente.`,
      },
    });

    logger.info(`✅ Submissão ${submission.protocol} processada. Duplicata: ${isDuplicate}`);
  } catch (error) {
    logger.error(`❌ Erro ao processar IA para submissão ${submission.protocol}:`, error);

    // Notifica sobre falha na triagem
    await prisma.citizenSubmission.update({
      where: { id: submission.id },
      data: { aiProcessed: false },
    });
  }
}

async function updateSubmissionStatus(submissionId, status, comment) {
  await prisma.statusHistory.create({
    data: { submissionId, status, comment },
  });
}

/**
 * GET /api/submissions/me
 * Histórico de demandas do cidadão autenticado
 */
async function getMySubmissions(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status }),
    };

    const [submissions, total] = await prisma.$transaction([
      prisma.citizenSubmission.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true, icon: true } },
          masterTicket: { select: { internalCode: true, priority: true } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.citizenSubmission.count({ where }),
    ]);

    return sendPaginated(res, submissions, page, limit, total);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/track/:protocol
 * Rastreio público de demanda por protocolo
 */
async function trackByProtocol(req, res, next) {
  try {
    const { protocol } = req.params;

    const submission = await prisma.citizenSubmission.findUnique({
      where: { protocol: protocol.toUpperCase() },
      include: {
        category: { select: { name: true, icon: true } },
        masterTicket: {
          select: {
            internalCode: true,
            priority: true,
            status: true,
            department: { select: { name: true } },
            _count: { select: { submissions: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        // Não inclui dados do usuário (proteção LGPD)
      },
    });

    if (!submission) {
      throw new AppError('Protocolo não encontrado.', 404);
    }

    // Mascara informações sensíveis para acesso público
    return sendSuccess(res, {
      protocol: submission.protocol,
      title: submission.title,
      description: submission.description,
      status: submission.status,
      category: submission.category,
      neighborhood: submission.neighborhood,
      address: submission.address,
      location: submission.address,
      isDuplicate: submission.isDuplicate,
      masterTicketId: submission.masterTicketId,
      masterTicket: submission.masterTicket ? {
        internalCode: submission.masterTicket.internalCode,
        priority: submission.masterTicket.priority,
        department: submission.masterTicket.department?.name,
        totalReports: submission.masterTicket._count.submissions,
      } : null,
      trackingProtocol: submission.protocol,
      statusHistory: submission.statusHistory,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/public
 * Demandas públicas para o mapa
 */
async function getPublicSubmissions(req, res, next) {
  try {
    const { neighborhood, categoryId, limit = 100 } = req.query;

    const where = {
      NOT: { status: 'CANCELLED' },
      ...(neighborhood && { neighborhood: { contains: neighborhood } }),
      ...(categoryId && { categoryId }),
    };

    const submissions = await prisma.citizenSubmission.findMany({
      where,
      take: parseInt(limit),
      select: {
        id: true,
        protocol: true,
        title: true,
        description: true,
        status: true,
        latitude: true,
        longitude: true,
        neighborhood: true,
        address: true,
        masterTicketId: true,
        createdAt: true,
        category: { select: { name: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtra e mascara informações sensíveis conforme LAI e LGPD
    const sanitizedSubmissions = submissions.map(sub => {
      const isDenuncia = sub.title?.startsWith('[Denúncia]') || sub.description?.includes('[Denúncia');

      if (isDenuncia) {
        return {
          ...sub,
          title: 'Denúncia Registrada (Em Apuração)',
          description: 'Conteúdo mantido em sigilo institucional para proteção da investigação e dos envolvidos.',
          address: sub.neighborhood ? `Bairro ${sub.neighborhood}` : 'Parauapebas - PA (Local Mantido em Sigilo)',
          latitude: null, // Protege coordenadas exatas de denúncias
          longitude: null,
        };
      }

      return sub;
    });

    return sendSuccess(res, sanitizedSubmissions);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/notifications
 * Notificações do cidadão
 */
async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Marca como lidas
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSubmission,
  getMySubmissions,
  trackByProtocol,
  getPublicSubmissions,
  getNotifications,
};
