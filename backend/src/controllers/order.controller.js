import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUnitPrice } from './cart.controller.js';
import { v4 as uuidv4 } from 'uuid';

const generateOrderNumber = () => {
  const prefix = 'TP';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const createOrder = async (req, res) => {
  const { addressId, paymentMethod, notes, couponCode, shippingAddress } = req.body;
  if (!paymentMethod) throw new AppError('Payment method is required.', 400);

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!cart || cart.items.length === 0) throw new AppError('Your cart is empty.', 400);

  // Validate stock
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${item.product.name}.`, 400);
    }
  }

  let subtotal = 0;
  const orderItems = cart.items.map((item) => {
    const unitPrice = getUnitPrice(item.product, item.storage);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      productId: item.productId,
      productName: item.product.name,
      productImage: null,
      color: item.color,
      storage: item.storage,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const deliveryFee = subtotal >= 500 ? 0 : 10;
  let discountAmount = 0;
  let couponId = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses) {
      if (subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percent') {
          discountAmount = subtotal * (coupon.discountValue / 100);
        } else {
          discountAmount = Math.min(coupon.discountValue, subtotal);
        }
        couponId = coupon.id;
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }
  }

  const totalAmount = subtotal + deliveryFee - discountAmount;

  // Resolve address
  let finalAddressId = addressId;
  if (!addressId && shippingAddress) {
    const addr = await prisma.address.create({
      data: { userId: req.user.id, ...shippingAddress },
    });
    finalAddressId = addr.id;
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      addressId: finalAddressId,
      couponId,
      orderNumber: generateOrderNumber(),
      paymentMethod,
      notes,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      items: { create: orderItems },
    },
    include: {
      items: true,
      address: true,
    },
  });

  // Deduct stock and increment soldCount
  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  res.status(201).json({ success: true, message: 'Order placed successfully.', data: { order } });
};

export const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true, address: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where: { userId: req.user.id } }),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
  });
};

export const getOrderById = async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, address: true, coupon: true },
  });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.userId !== req.user.id && req.user.role !== 'admin') throw new AppError('Access denied.', 403);
  res.json({ success: true, data: { order } });
};

export const cancelOrder = async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.userId !== req.user.id) throw new AppError('Access denied.', 403);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage.', 400);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  });

  // Restore stock
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
    });
  }

  res.json({ success: true, message: 'Order cancelled successfully.' });
};

// Admin: get all orders
export const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = status ? { status } : {};

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
  });
};

export const createAdminOrder = async (req, res) => {
  const { customerInfo, items: inputItems, paymentMethod, paymentStatus, notes, shippingAddress, couponCode } = req.body;
  
  if (!inputItems || inputItems.length === 0) throw new AppError('No items provided.', 400);
  if (!paymentMethod) throw new AppError('Payment method is required.', 400);

  // 1. Resolve or Create User
  let userId;
  let finalNotes = notes;
  if (customerInfo?.email) {
    let user = await prisma.user.findUnique({ where: { email: customerInfo.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customerInfo.email,
          firstName: customerInfo.firstName || 'Guest',
          lastName: customerInfo.lastName || 'Customer',
          phone: customerInfo.phone || '',
          password: uuidv4(), // Random password
        },
      });
    }
    userId = user.id;
  } else {
    // Default to admin or a generic "Shop Customer"
    userId = req.user.id;
    if (!finalNotes) finalNotes = 'POS Walk-in Sale';
  }

  // 2. Process Items and validate stock
  let subtotal = 0;
  const orderItems = [];
  
  for (const item of inputItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new AppError(`Product ${item.productId} not found.`, 404);
    if (product.stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}.`, 400);

    const unitPrice = item.price || getUnitPrice(product, item.storage);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      color: item.color,
      storage: item.storage,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    });
  }

  // 3. Totals and Coupon
  const deliveryFee = subtotal >= 50000 ? 0 : 1000;
  let discountAmount = 0;
  let couponId = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses) {
      if (subtotal >= coupon.minOrderValue) {
        discountAmount = coupon.discountType === 'percent' ? (subtotal * coupon.discountValue / 100) : Math.min(coupon.discountValue, subtotal);
        couponId = coupon.id;
        await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }
  }

  const totalAmount = subtotal + deliveryFee - discountAmount;

  // 4. Resolve Address
  let finalAddressId = null;
  if (shippingAddress) {
    const addr = await prisma.address.create({
      data: { userId, ...shippingAddress },
    });
    finalAddressId = addr.id;
  }

  // 5. Create Order
  const order = await prisma.order.create({
    data: {
      userId,
      addressId: finalAddressId,
      couponId,
      orderNumber: generateOrderNumber(),
      status: 'delivered',
      deliveredAt: new Date(),
      paymentMethod,
      paymentStatus: paymentStatus || 'paid', // Default to paid for in-shop buying
      notes: finalNotes,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      items: { create: orderItems },
    },
    include: { items: true, address: true },
  });

  // 6. Deduct stock
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
    });
  }

  res.status(201).json({ success: true, message: 'Order created successfully.', data: { order } });
};

export const updateOrderStatus = async (req, res) => {
  const { status, paymentStatus } = req.body;
  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) throw new AppError('Invalid status.', 400);

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(status === 'delivered' && { deliveredAt: new Date() }),
    },
  });
  res.json({ success: true, message: 'Order updated.', data: { order } });
};
