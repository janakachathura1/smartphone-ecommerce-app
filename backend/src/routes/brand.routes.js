import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: { brands } });
});

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: { categories } });
});

export default router;
