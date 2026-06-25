import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// Public: list all active categories
router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: { categories } });
});

export default router;
