// src/routes/submissionRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getMySubmissions,
  trackByProtocol,
  getPublicSubmissions,
  getNotifications,
} = require('../controllers/submissionsController');
const { authenticate } = require('../middlewares/authMiddleware');

// Rotas públicas
router.get('/public', getPublicSubmissions);
router.get('/track/:protocol', trackByProtocol);

// Rotas autenticadas
router.use(authenticate);
router.post('/', createSubmission);
router.get('/me', getMySubmissions);
router.get('/notifications', getNotifications);

module.exports = router;
