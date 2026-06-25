import { prisma } from '../lib/prisma.js';

export const getDashboardStats = async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueData,
    recentOrders,
    lowStockProducts,
    ordersByStatus,
    monthlySales,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'paid' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { take: 1 },
      },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 10 }, isActive: true },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: 'asc' },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    // Simple monthly simulation
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { totalAmount: true, createdAt: true },
    }),
  ]);

  const totalRevenue = revenueData._sum.totalAmount || 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      monthlySales,
    },
  });
};

export const getBrands = async (req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: { brands } });
};

export const createBrand = async (req, res) => {
  const brand = await prisma.brand.create({ data: req.body });
  res.status(201).json({ success: true, data: { brand } });
};

export const updateBrand = async (req, res) => {
  const brand = await prisma.brand.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: { brand } });
};

export const deleteBrand = async (req, res) => {
  const { id } = req.params;
  const productsCount = await prisma.product.count({ where: { brandId: id } });
  if (productsCount > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot delete brand with ${productsCount} associated products. Delete or reassign products first.` 
    });
  }
  await prisma.brand.delete({ where: { id } });
  res.json({ success: true, message: 'Brand deleted successfully.' });
};

export const getCategories = async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data: { categories } });
};

export const createCategory = async (req, res) => {
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ success: true, data: { category } });
};

export const updateCategory = async (req, res) => {
  const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: { category } });
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const productsCount = await prisma.product.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot delete category with ${productsCount} associated products. Delete or reassign products first.` 
    });
  }
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted successfully.' });
};

export const getReviews = async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
      product: { 
        select: { 
          name: true, 
          slug: true, 
          brandId: true,
          categoryId: true,
          brand: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 } 
        } 
      }
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { reviews } });
};

export const updateReview = async (req, res) => {
  const review = await prisma.review.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ success: true, data: { review } });
};

export const deleteReview = async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Review deleted.' });
};
