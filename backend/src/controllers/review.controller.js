import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { reviews } });
};

export const addReview = async (req, res) => {
  const { productId, rating, title, body } = req.body;
  if (!productId || !rating || !body) throw new AppError('Product, rating, and review body are required.', 400);
  if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5.', 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: req.user.id } },
  });
  if (existing) throw new AppError('You have already reviewed this product.', 409);

  const review = await prisma.review.create({
    data: { productId, userId: req.user.id, rating: parseInt(rating), title, body },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });

  // Update product rating avg
  const stats = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count.rating,
    },
  });

  res.status(201).json({ success: true, message: 'Review added.', data: { review } });
};

export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, title, body } = req.body;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('Review not found.', 404);
  if (review.userId !== req.user.id) throw new AppError('Access denied.', 403);

  const updated = await prisma.review.update({
    where: { id },
    data: { ...(rating && { rating: parseInt(rating) }), ...(title && { title }), ...(body && { body }) },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
  res.json({ success: true, data: { review: updated } });
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new AppError('Review not found.', 404);
  if (review.userId !== req.user.id && req.user.role !== 'admin') throw new AppError('Access denied.', 403);

  await prisma.review.delete({ where: { id } });
  res.json({ success: true, message: 'Review deleted.' });
};
