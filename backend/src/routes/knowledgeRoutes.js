// src/routes/knowledgeRoutes.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/knowledge-base/meta/categories
// IMPORTANTE: Rotas estáticas ANTES de rotas com parâmetros dinâmicos
router.get('/meta/categories', async (req, res, next) => {
  try {
    const cats = await prisma.knowledgeBase.findMany({
      where: { isActive: true, category: { not: null } },
      distinct: ['category'],
      select: { category: true },
    });
    return sendSuccess(res, cats.map(c => c.category));
  } catch (error) {
    next(error);
  }
});

// GET /api/knowledge-base  (público)
router.get('/', async (req, res, next) => {
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

    // Transforma tags de comma-separated string para array no response
    const articlesWithTagsArray = articles.map(a => ({
      ...a,
      tags: a.tags ? a.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }));

    return sendSuccess(res, articlesWithTagsArray);
  } catch (error) {
    next(error);
  }
});

// GET /api/knowledge-base/:id  (incrementa views)
router.get('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.knowledgeBase.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado.' });
    }

    const article = await prisma.knowledgeBase.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } },
    });
    return sendSuccess(res, {
      ...article,
      tags: article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
