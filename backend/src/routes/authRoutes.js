// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { loginLimiter } = require('../middlewares/rateLimiter');

// POST /api/auth/register  — Cadastro com email + senha
router.post('/register', loginLimiter, register);

// POST /api/auth/login     — Login com email + senha
router.post('/login', loginLimiter, login);

// POST /api/auth/google    — Login/Cadastro via Google (envia idToken do Google SDK)
router.post('/google', loginLimiter, googleLogin);

// POST /api/auth/refresh   — Renova access token via refreshToken (cookie HttpOnly)
router.post('/refresh', refreshToken);

// POST /api/auth/logout    — Encerra sessão (requer auth)
router.post('/logout', authenticate, logout);

// GET  /api/auth/me        — Perfil do usuário autenticado
router.get('/me', authenticate, getProfile);

// PUT  /api/auth/profile   — Atualizar dados do perfil (nome, telefone)
router.put('/profile', authenticate, updateProfile);

module.exports = router;
