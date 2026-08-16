// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Todos requerem autenticação
router.use(authenticate);
router.use(authorize('ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN', 'AUDITOR'));

// Dashboard
router.get('/dashboard/metrics', getDashboardMetrics);

// Demandas (admin)
router.get('/submissions', getAdminSubmissions);
router.get('/submissions/:id', getAdminSubmissionById);
router.patch('/submissions/:id/status', authorize('ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN'), updateSubmissionStatus);

// Master Tickets (IA Agrupados)
router.get('/master-tickets', getMasterTickets);
router.get('/master-tickets/:id', getMasterTicketById);

// Conhecimento
router.get('/knowledge-base', getKnowledgeBase);

// Secretarias + Categorias
router.get('/departments', getDepartments);
router.post('/departments', authorize('SUPER_ADMIN'), createDepartment);
router.get('/categories', getCategories);

// Usuários
router.get('/users', authorize('SUPER_ADMIN', 'SECTOR_MANAGER'), getUsers);
router.patch('/users/:id', authorize('SUPER_ADMIN', 'SECTOR_MANAGER'), updateUser);
router.delete('/users/:id', authorize('SUPER_ADMIN', 'SECTOR_MANAGER'), deleteUser);

// Auditoria
router.get('/audit-logs', authorize('SUPER_ADMIN', 'AUDITOR'), getAuditLogs);

module.exports = router;
