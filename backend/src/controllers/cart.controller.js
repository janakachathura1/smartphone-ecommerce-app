import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getUnitPrice = (product, storage) => {
  let basePrice = product.basePrice;
  if (storage && product.storageOptions) {
    try {
      const opts = typeof product.storageOptions === 'string' ? JSON.parse(product.storageOptions) : product.storageOptions;
      if (Array.isArray(opts)) {
        const found = opts.find(o => (typeof o === 'object' && o.capacity === storage) || o === storage);
        if (found && typeof found === 'object' && found.price !== undefined && found.price !== null && found.price !== '') {
          basePrice = Number(found.price);
        }
      }
    } catch(e) {}
  }
  return basePrice * (1 - (product.discountPercent || 0) / 100);
};

export const getCart = async (req, res) => {
  const cart = await prisma.cart.findUnique({
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
      },
    },
  });

  if (!cart) {
    const newCart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: { items: true },
    });
    return res.json({ success: true, data: { cart: newCart, itemCount: 0, subtotal: 0 } });
  }

  const processedItems = cart.items.map(item => {
    const unitPrice = getUnitPrice(item.product, item.storage);
    return { ...item, unitPrice, totalPrice: unitPrice * item.quantity };
  });

  const subtotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  res.json({
    success: true,
    data: { 
      cart: { ...cart, items: processedItems }, 
      itemCount: processedItems.length, 
      subtotal: Math.round(subtotal * 100) / 100 
    },
  });
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1, color, storage } = req.body;
  if (!productId) throw new AppError('Product ID is required.', 400);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found.', 404);
  if (product.stock < quantity) throw new AppError(`Only ${product.stock} items available in stock.`, 400);

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id } });

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, color: color || null, storage: storage || null },
  });

  let item;
  if (existingItem) {
    const newQty = existingItem.quantity + parseInt(quantity);
    if (product.stock < newQty) throw new AppError(`Only ${product.stock} items available.`, 400);
    item = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity: parseInt(quantity), color, storage },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
    });
  }

  res.status(201).json({ success: true, message: 'Item added to cart.', data: { item } });
};

export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1.', 400);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== req.user.id) throw new AppError('Cart item not found.', 404);
  if (item.product.stock < quantity) throw new AppError(`Only ${item.product.stock} items available.`, 400);

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: parseInt(quantity) },
    include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
  });
  res.json({ success: true, data: { item: updated } });
};

export const removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== req.user.id) throw new AppError('Cart item not found.', 404);

  await prisma.cartItem.delete({ where: { id: itemId } });
  res.json({ success: true, message: 'Item removed from cart.' });
};

export const clearCart = async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  res.json({ success: true, message: 'Cart cleared.' });
};
