import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public: validate coupon for checkout
router.post('/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) throw new AppError('Coupon code is required.', 400);

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon) throw new AppError('Invalid coupon code.', 404);
  if (!coupon.isActive) throw new AppError('This coupon is no longer active.', 400);
  if (coupon.usedCount >= coupon.maxUses) throw new AppError('Coupon usage limit reached.', 400);
  if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new AppError('Coupon has expired.', 400);
  if (subtotal < coupon.minOrderValue) {
    throw new AppError(`Minimum order value for this coupon is $${coupon.minOrderValue}.`, 400);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percent') {
    discountAmount = parseFloat(subtotal) * (coupon.discountValue / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  res.json({
    success: true,
    message: `Coupon applied! You save $${discountAmount.toFixed(2)}`,
    data: { coupon, discountAmount: Math.round(discountAmount * 100) / 100 },
  });
});

// Admin routes
router.use(authenticate, requireAdmin);

router.get('/all', async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { coupons } });
});

router.post('/', async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;
  
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw new AppError('Coupon code already exists.', 400);

  const coupon = await prisma.coupon.create({
    data: { 
      code: code.toUpperCase(), 
      discountType, 
      discountValue, 
      minOrderValue, 
      maxUses, 
      expiresAt 
    }
  });
  res.status(201).json({ success: true, data: { coupon } });
});

router.patch('/:id/toggle', async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) throw new AppError('Coupon not found.', 404);
  
  const updated = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { isActive: !coupon.isActive }
  });
  res.json({ success: true, data: { coupon: updated } });
});

router.delete('/:id', async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted.' });
});

export default router;
