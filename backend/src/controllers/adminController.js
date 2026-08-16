// src/controllers/adminController.js
const { z } = require('zod');
const { prisma } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');
const { maskPII } = require('../utils/lgpdFormatter');

// ── Dashboard Metrics ──────────────────────────────────────────
async function getDashboardMetrics(req, res, next) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let sectorCategoryIds = undefined;
    let deptWhere = {};
    if (req.user.role === 'SECTOR_MANAGER') {
      const dept = await prisma.department.findUnique({
        where: { managerId: req.user.id },
        include: { categories: true }
      });
      if (dept) {
        sectorCategoryIds = dept.categories.map(c => c.id);
        deptWhere = { departmentId: dept.id };
      } else {
        sectorCategoryIds = ['none'];
        deptWhere = { id: 'none' }; // Failsafe
      }
    }

    const baseWhere = sectorCategoryIds ? { categoryId: { in: sectorCategoryIds } } : {};

    const [
      totalSubmissions,
      activeSubmissions,
      completedSubmissions,
      submissionsLast30Days,
      submissionsLast7Days,
      byStatus,
      byCategory,
      byNeighborhood,
      masterTicketsTotal,
      deduplicatedCount,
      totalUsers,
    ] = await prisma.$transaction([
      prisma.citizenSubmission.count({ where: baseWhere }),
      prisma.citizenSubmission.count({
        where: { ...baseWhere, NOT: { status: { in: ['COMPLETED', 'REJECTED', 'CANCELLED'] } } },
      }),
      prisma.citizenSubmission.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.citizenSubmission.count({ where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.citizenSubmission.count({ where: { ...baseWhere, createdAt: { gte: sevenDaysAgo } } }),
      prisma.citizenSubmission.groupBy({ by: ['status'], _count: { id: true }, where: baseWhere }),
      prisma.citizenSubmission.groupBy({
        by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5,
        where: baseWhere
      }),
      prisma.masterTicket.groupBy({
        by: ['neighborhood'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10,
        where: { ...deptWhere, neighborhood: { not: null } },
      }),
      prisma.masterTicket.count({ where: deptWhere }),
      prisma.citizenSubmission.count({ where: { ...baseWhere, isDuplicate: true } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // Calcula tempo médio de resolução via JavaScript (compatível SQLite)
    let avgResolutionHours = 0;
    try {
      const resolvedTickets = await prisma.masterTicket.findMany({
        where: { ...deptWhere, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      });
      if (resolvedTickets.length > 0) {
        const totalHours = resolvedTickets.reduce((sum, t) => {
          return sum + (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = (totalHours / resolvedTickets.length).toFixed(1);
      }
    } catch {
      avgResolutionHours = 0;
    }

    // Converte statusCount para objeto
    const statusCount = {};
    byStatus.forEach(s => { statusCount[s.status] = s._count.id; });

    // Converte categoryCount para objeto
    const categoryCount = {};
    for (const c of byCategory) {
      if (c.categoryId) {
        const cat = await prisma.category.findUnique({ where: { id: c.categoryId }, select: { name: true } });
        categoryCount[cat?.name || c.categoryId] = c._count.id;
      }
    }

    return sendSuccess(res, {
      totalSubmissions,
      activeSubmissions,
      completedSubmissions,
      totalMasterTickets: masterTicketsTotal,
      totalUsers,
      averageResolutionTimeDays: (avgResolutionHours / 24).toFixed(1),
      statusCount,
      categoryCount,
      byNeighborhood: byNeighborhood.map(n => ({ neighborhood: n.neighborhood, count: n._count.id })),
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Submissions ──────────────────────────────────────────
async function getAdminSubmissions(req, res, next) {
  try {
    const {
      page = 1, limit = 20, status, categoryId,
      neighborhood, startDate, endDate, search,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Monta filtro de datas combinado para evitar sobrescrita
    const createdAtFilter = {};
    if (startDate) createdAtFilter.gte = new Date(startDate);
    if (endDate) createdAtFilter.lte = new Date(endDate);

    let sectorCategoryIds = undefined;
    if (req.user.role === 'SECTOR_MANAGER') {
      const dept = await prisma.department.findUnique({
        where: { managerId: req.user.id },
        include: { categories: true }
      });
      if (dept) {
        sectorCategoryIds = dept.categories.map(c => c.id);
      } else {
        sectorCategoryIds = ['none'];
      }
    }

    const where = {
      ...(status && { status }),
      ...(categoryId ? { categoryId } : (sectorCategoryIds ? { categoryId: { in: sectorCategoryIds } } : {})),
      ...(neighborhood && { neighborhood: { contains: neighborhood } }),
      ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { protocol: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [submissions, total] = await prisma.$transaction([
      prisma.citizenSubmission.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { name: true, icon: true } },
          masterTicket: {
            select: {
              internalCode: true,
              priority: true,
              _count: { select: { submissions: true } },
            },
          },
        },
      }),
      prisma.citizenSubmission.count({ where }),
    ]);

    let results = submissions;
    if (req.user.role === 'AUDITOR') {
      results = submissions.map(maskPII);
    } else if (req.user.role !== 'SUPER_ADMIN') {
      results = submissions.map((sub) => {
        if (sub.isAnonymous) {
          return {
            ...sub,
            user: {
              id: sub.user?.id,
              name: '[IDENTIDADE PROTEGIDA POR SIGILO]',
              email: '[SIGILO PROTEGIDO]',
            },
          };
        }
        return sub;
      });
    }

    return sendPaginated(res, results, page, limit, total);
  } catch (error) {
    next(error);
  }
}

// ── Update Submission Status ───────────────────────────────────
async function updateSubmissionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const validStatuses = ['RECEIVED', 'AI_PROCESSING', 'TRIAGED', 'FORWARDED', 'IN_PROGRESS', 'TEAM_DISPATCHED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    const { status, comment } = z.object({
      status: z.string().refine(s => validStatuses.includes(s), { message: 'Status inválido' }),
      comment: z.string().min(5).max(1000),
    }).parse(req.body);

    const submission = await prisma.citizenSubmission.findUnique({ where: { id } });
    if (!submission) throw new AppError('Demanda não encontrada.', 404);

    const updated = await prisma.citizenSubmission.update({
      where: { id },
      data: { status },
    });

    await prisma.statusHistory.create({
      data: { submissionId: id, status, comment, changedById: req.user.id },
    });

    // Notifica o cidadão sobre a mudança
    const statusLabels = {
      IN_PROGRESS: 'Em Atendimento',
      TEAM_DISPATCHED: 'Equipe em Deslocamento',
      COMPLETED: 'Concluído ✅',
      REJECTED: 'Indeferido',
      FORWARDED: 'Encaminhado ao Setor',
    };

    if (statusLabels[status]) {
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          submissionId: id,
          title: `📋 Atualização na sua demanda ${submission.protocol}`,
          message: `Status atualizado para: ${statusLabels[status]}. ${comment}`,
        },
      });
    }

    await logAudit(req.user.id, 'SUBMISSION_STATUS_CHANGED', 'CitizenSubmission', id, {
      protocol: submission.protocol, oldStatus: submission.status, newStatus: status, comment,
    }, req);

    return sendSuccess(res, updated, 'Status atualizado com sucesso.');
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

// ── Master Tickets ─────────────────────────────────────────────
async function getMasterTickets(req, res, next) {
  try {
    const { page = 1, limit = 20, status, priority, departmentId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sectorDeptId = undefined;
    if (req.user.role === 'SECTOR_MANAGER') {
      const dept = await prisma.department.findUnique({
        where: { managerId: req.user.id }
      });
      sectorDeptId = dept ? dept.id : 'none';
    }

    const finalDeptId = sectorDeptId ? sectorDeptId : departmentId;

    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(finalDeptId && { departmentId: finalDeptId }),
      ...(search && {
        OR: [
          { internalCode: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    // Since Prisma doesn't support _count in where for this configuration,
    // we fetch all matching without skip/take, filter in JS, then apply pagination.
    const allTickets = await prisma.masterTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        category: { select: { name: true, icon: true } },
        assignedTo: { select: { name: true } },
        submissions: {
          select: {
            id: true, protocol: true, status: true, createdAt: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });

    const groupedTickets = allTickets.filter(t => t._count.submissions >= 2);
    const total = groupedTickets.length;
    const tickets = groupedTickets.slice(skip, skip + parseInt(limit));

    let results = tickets;
    if (req.user.role === 'AUDITOR') {
      results = tickets.map(maskPII);
    } else if (req.user.role !== 'SUPER_ADMIN') {
      results = tickets.map((t) => ({
        ...t,
        submissions: t.submissions?.map((s) => (s.isAnonymous ? {
          ...s,
          user: { name: '[IDENTIDADE PROTEGIDA POR SIGILO]', email: '[SIGILO PROTEGIDO]' },
        } : s)),
      }));
    }

    return sendPaginated(res, results, page, limit, total);
  } catch (error) {
    next(error);
  }
}

// ── Users CRUD ─────────────────────────────────────────────────
async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const roleFilter = role
      ? (['CITIZEN', 'COMUM'].includes(role) ? { in: ['CITIZEN', 'COMUM'] } : role)
      : undefined;

    const where = {
      ...(roleFilter && { role: roleFilter }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true,
          role: true, isActive: true, createdAt: true,
          googleId: false, passwordHash: false,
          _count: { select: { submissions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    let results = users;
    if (req.user.role === 'AUDITOR') {
      results = users.map(maskPII);
    }

    return sendPaginated(res, results, page, limit, total);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const validRoles = ['CITIZEN', 'COMUM', 'ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN'];
    const data = z.object({
      name: z.string().min(3).max(100).optional(),
      email: z.string().email().optional(),
      role: z.string().refine(r => validRoles.includes(r), { message: 'Role inválido' }).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new AppError('Usuário não encontrado', 404);

    // Proteção de escalonamento de privilégio
    if (data.role && data.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new AppError('Apenas um Super Administrador pode promover outro usuário a Super Administrador.', 403);
    }

    // Proteção contra auto-bloqueio ou rebaixamento do último SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && (data.isActive === false || (data.role && data.role !== 'SUPER_ADMIN'))) {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } });
      if (superAdminCount <= 1) {
        throw new AppError('Não é possível desativar ou rebaixar o último Super Administrador ativo.', 400);
      }
    }

    // Se estiver mudando email, verifica se já existe
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        throw new AppError('Este e-mail já está em uso.', 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await logAudit(
      req.user.id, 
      'USER_UPDATED', 
      'User', 
      id, 
      { role: targetUser.role, isActive: targetUser.isActive }, 
      { role: updated.role, isActive: updated.isActive }, 
      req
    );
    return sendSuccess(res, updated, 'Usuário atualizado.');
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Impede deletar a si mesmo
    if (id === req.user.id) {
      throw new AppError('Você não pode excluir sua própria conta.', 400);
    }

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { submissions: true, assignedTickets: true }
        }
      }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // Se tiver relacionamentos vitais (ex: tickets atribuídos ou demandas criadas)
    // O ideal seria soft delete (inativar) ou transferir posses. 
    // Como a instrução é apagar, vamos tentar deletar ou falhar com restrição
    if (user._count.submissions > 0 || user._count.assignedTickets > 0) {
      // Fazemos o soft delete
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
      return sendSuccess(res, null, 'O usuário possui demandas ou tickets vinculados, então ele foi Inativado em vez de excluído.');
    }

    // Exclusão completa (Apesar da regra NUNCA DELETAR, mantemos o if de relations como segurança)
    // No entanto, conforme o princípio NUNCA DELETAR, nós iremos SEMPRE forçar o Soft Delete:
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    await logAudit(req.user.id, 'USER_DEACTIVATED', 'User', id, { isActive: user.isActive }, { isActive: false }, req);

    return sendSuccess(res, null, 'Usuário inativado com sucesso (Soft Delete).');
  } catch (error) {
    next(error);
  }
}

// ── Departments CRUD ────────────────────────────────────────────────
async function getDepartments(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: { select: { name: true, email: true } },
        _count: { select: { masterTickets: true, categories: true } },
      },
    });
    return sendSuccess(res, departments);
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const data = z.object({
      name: z.string().min(3).max(150),
      description: z.string().max(500).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
    }).parse(req.body);

    const dept = await prisma.department.create({ data });
    await logAudit(req.user.id, 'DEPARTMENT_CREATED', 'Department', dept.id, { name: dept.name }, req);
    return sendSuccess(res, dept, 'Secretaria criada com sucesso.', 201);
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

// ── Categories ─────────────────────────────────────────────────
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        department: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
    });
    return sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
}

// ── Audit Logs ─────────────────────────────────────────────────
async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(action && { action }),
      ...(userId && { userId }),
    };

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendPaginated(res, logs, page, limit, total);
  } catch (error) {
    next(error);
  }
}

// ── Knowledge Base ─────────────────────────────────────────────
async function getKnowledgeBase(req, res, next) {
  try {
    const { search, category } = req.query;

    const where = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { question: { contains: search } },
          { answer: { contains: search } },
          { tags: { contains: search.toLowerCase() } },
        ],
      }),
    };

    const articles = await prisma.knowledgeBase.findMany({
      where,
      orderBy: { views: 'desc' },
    });

    return sendSuccess(res, articles);
  } catch (error) {
    next(error);
  }
}

// ── Submission Detail ───────────────────────────────────────────
async function getAdminSubmissionById(req, res, next) {
  try {
    const { id } = req.params;
    const submission = await prisma.citizenSubmission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        category: { select: { id: true, name: true, icon: true, departmentId: true } },
        masterTicket: { select: { id: true, internalCode: true, priority: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!submission) throw new AppError('Demanda não encontrada', 404);

    // Proteção contra IDOR: se for gestor de setor, verifica se a demanda pertence à sua secretaria
    if (req.user.role === 'SECTOR_MANAGER') {
      const dept = await prisma.department.findUnique({
        where: { managerId: req.user.id },
        include: { categories: true },
      });
      if (!dept) {
        throw new AppError('Acesso negado. Secretário não vinculado a uma secretaria.', 403);
      }
      const allowedCatIds = new Set(dept.categories.map((c) => c.id));
      if (submission.categoryId && !allowedCatIds.has(submission.categoryId)) {
        throw new AppError('Acesso negado. Demanda pertence a outra secretaria.', 403);
      }
    }

    let result = submission;
    if (req.user.role === 'AUDITOR') {
      result = maskPII(submission);
    } else if (submission.isAnonymous && req.user.role !== 'SUPER_ADMIN') {
      result = {
        ...submission,
        user: {
          id: submission.user?.id,
          name: '[IDENTIDADE PROTEGIDA POR SIGILO]',
          email: '[SIGILO PROTEGIDO]',
          phone: '[SIGILO PROTEGIDO]',
        },
      };
    }

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

// ── Master Ticket Detail ───────────────────────────────────────
async function getMasterTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const ticket = await prisma.masterTicket.findUnique({
      where: { id },
      include: {
        category: true,
        department: true,
        assignedTo: { select: { name: true, email: true } },
        submissions: {
          include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        },
      },
    });

    if (!ticket) throw new AppError('Master Ticket não encontrado.', 404);

    // Proteção contra IDOR: se for gestor de setor, verifica se a demanda mestre pertence à sua secretaria
    if (req.user.role === 'SECTOR_MANAGER') {
      const dept = await prisma.department.findUnique({
        where: { managerId: req.user.id },
      });
      if (!dept || ticket.departmentId !== dept.id) {
        throw new AppError('Acesso negado. Demanda agrupada pertence a outra secretaria.', 403);
      }
    }

    let result = ticket;
    if (req.user.role === 'AUDITOR') {
      result = maskPII(ticket);
    } else if (req.user.role !== 'SUPER_ADMIN' && result.submissions) {
      result = {
        ...ticket,
        submissions: ticket.submissions.map((sub) => {
          if (sub.isAnonymous) {
            return {
              ...sub,
              user: {
                id: sub.user?.id,
                name: '[IDENTIDADE PROTEGIDA POR SIGILO]',
                email: '[SIGILO PROTEGIDO]',
                phone: '[SIGILO PROTEGIDO]',
              },
            };
          }
          return sub;
        }),
      };
    }

    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardMetrics,
  getAdminSubmissions,
  getAdminSubmissionById,
  updateSubmissionStatus,
  getMasterTickets,
  getMasterTicketById,
  getUsers,
  updateUser,
  deleteUser,
  getDepartments,
  createDepartment,
  getCategories,
  getAuditLogs,
  getKnowledgeBase,
};
