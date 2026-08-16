// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { prisma } = require('../config/database');
const env = require('../config/env');
const { AppError } = require('../middlewares/errorHandler');
const { sendSuccess, sendCreated } = require('../utils/apiResponse');
const { logAudit } = require('../middlewares/auditLogger');

// ── Zod Schemas ────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().max(30).optional(),
  name_confirm: z.string().optional(), // campo honeypot anti-bot (ignorado)
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(1, 'Senha obrigatória'),
});

// ── Token Helpers ──────────────────────────────────────────────
function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function setRefreshTokenCookie(res, token) {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: env.IS_PRODUCTION ? 'strict' : 'lax',
    maxAge: SEVEN_DAYS,
    path: '/api/auth',
  });
}

async function saveRefreshToken(userId, token) {
  // Revoga tokens antigos antes de criar novo
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

function buildUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    googleLinked: !!user.googleId,
  };
}

// ── Register ───────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    // Ignora honeypot
    const { name_confirm, ...rawData } = req.body;
    const data = registerSchema.parse(rawData);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Este e-mail já está cadastrado.', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: 'CITIZEN',
        emailVerified: false,
      },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    await logAudit(user.id, 'USER_CREATED', 'User', user.id, { email: user.email }, req);
    setRefreshTokenCookie(res, refreshToken);

    return sendCreated(
      res,
      { user: buildUserResponse(user), accessToken },
      'Conta criada com sucesso! Bem-vindo(a) à Ouvidoria.'
    );
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

// ── Login (Email + Senha) ──────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Sempre realiza bcrypt compare para mitigar timing attacks
    const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxx';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash || dummyHash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !user.isActive || !passwordMatch) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    // Usuário Google-only sem senha definida
    if (!user.passwordHash) {
      throw new AppError('Esta conta usa login com Google. Por favor, entre com o Google.', 400);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    await logAudit(user.id, 'LOGIN', 'User', user.id, { method: 'email' }, req);
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(res, {
      user: buildUserResponse(user),
      accessToken,
    }, 'Login realizado com sucesso!');
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

// ── Google OAuth Callback ──────────────────────────────────────
// Fluxo: Frontend envia o idToken recebido do Google Sign-In SDK.
// Backend verifica o token com a Google API e cria/autentica o usuário.
async function googleLogin(req, res, next) {
  try {
    const { idToken } = z.object({
      idToken: z.string().min(10, 'Token Google inválido'),
    }).parse(req.body);

    // Verifica o token com a API do Google
    const googleUserInfo = await verifyGoogleToken(idToken);
    if (!googleUserInfo) throw new AppError('Token do Google inválido ou expirado.', 401);

    const { sub: googleId, email, name, picture } = googleUserInfo;

    // Busca ou cria o usuário
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user) {
      // Usuário existente: vincula googleId se ainda não vinculado
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true },
        });
      }
      if (!user.isActive) throw new AppError('Conta desativada. Entre em contato com o suporte.', 403);
    } else {
      // Novo usuário via Google: cria conta automaticamente
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          passwordHash: null, // conta Google-only
          role: 'CITIZEN',
          emailVerified: true,
        },
      });
      await logAudit(user.id, 'USER_CREATED', 'User', user.id, { email, method: 'google' }, req);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    await logAudit(user.id, 'LOGIN', 'User', user.id, { method: 'google' }, req);
    setRefreshTokenCookie(res, refreshToken);

    return sendSuccess(res, {
      user: buildUserResponse(user),
      accessToken,
      isNewUser: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 5000,
    }, 'Login com Google realizado com sucesso!');
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

/**
 * Verifica o Google ID Token usando a API tokeninfo
 */
async function verifyGoogleToken(idToken) {
  try {
    const clientId = env.GOOGLE_CLIENT_ID;
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();

    if (clientId && data.aud !== clientId) {
      return null;
    }

    if (data.exp && Date.now() / 1000 > parseInt(data.exp)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ── Refresh Token ──────────────────────────────────────────────
async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError('Sessão não encontrada. Faça login novamente.', 401);

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Sessão expirada. Faça login novamente.', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });

    if (!storedToken || storedToken.revokedAt || !storedToken.user.isActive) {
      throw new AppError('Sessão inválida. Faça login novamente.', 401);
    }

    const newAccessToken = generateAccessToken(storedToken.user.id, storedToken.user.role);
    return sendSuccess(res, { accessToken: newAccessToken }, 'Token renovado.');
  } catch (error) {
    next(error);
  }
}

// ── Logout ─────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (req.user) await logAudit(req.user.id, 'LOGOUT', 'User', req.user.id, {}, req);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return sendSuccess(res, null, 'Logout realizado com sucesso.');
  } catch (error) {
    next(error);
  }
}

// ── Get Profile ─────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, emailVerified: true, createdAt: true,
        googleId: true,
        _count: { select: { submissions: true } },
      },
    });
    return sendSuccess(res, {
      ...user,
      googleLinked: !!user.googleId,
      googleId: undefined,
    });
  } catch (error) {
    next(error);
  }
}

// ── Update Profile ──────────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const updateSchema = z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
      phone: z.string().max(30).optional(),
    });
    const data = updateSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, emailVerified: true, createdAt: true,
      },
    });

    await logAudit(req.user.id, 'USER_PROFILE_UPDATED', 'User', req.user.id, data, req);
    return sendSuccess(res, updatedUser, 'Perfil atualizado com sucesso!');
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError('Dados inválidos.', 400, error.errors));
    next(error);
  }
}

module.exports = { register, login, googleLogin, refreshToken, logout, getProfile, updateProfile };
