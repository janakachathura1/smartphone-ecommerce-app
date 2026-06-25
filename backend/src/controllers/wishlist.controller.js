import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getWishlist = async (req, res) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              brand: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wishlist) {
    const newWishlist = await prisma.wishlist.create({ data: { userId: req.user.id }, include: { items: true } });
    return res.json({ success: true, data: { wishlist: newWishlist } });
  }
  res.json({ success: true, data: { wishlist } });
};

export const toggleWishlistItem = async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError('Product ID is required.', 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);

  let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
  if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId: req.user.id } });

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Removed from wishlist.', data: { added: false } });
  }

  await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  res.status(201).json({ success: true, message: 'Added to wishlist.', data: { added: true } });
};

export const removeWishlistItem = async (req, res) => {
  const { productId } = req.params;
  const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
  if (!wishlist) throw new AppError('Wishlist not found.', 404);

  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });
  res.json({ success: true, message: 'Removed from wishlist.' });
};
