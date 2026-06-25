import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const register = async (req, res) => {
  const { password, firstName, lastName, phone } = req.body;
  const email = req.body.email?.toLowerCase();

  if (!email || !password || !firstName || !lastName) {
    throw new AppError('Please provide all required fields.', 400);
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName, phone },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true },
  });

  // auto-create cart and wishlist
  await prisma.cart.create({ data: { userId: user.id } });
  await prisma.wishlist.create({ data: { userId: user.id } });

  const token = generateToken(user.id, user.role);
  res.status(201).json({ success: true, message: 'Account created successfully.', data: { user, token } });
};

export const login = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email?.toLowerCase();
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  // ensure cart/wishlist exist
  const cartExists = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cartExists) await prisma.cart.create({ data: { userId: user.id } });
  const wishExists = await prisma.wishlist.findUnique({ where: { userId: user.id } });
  if (!wishExists) await prisma.wishlist.create({ data: { userId: user.id } });

  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, message: 'Login successful.', data: { user: userWithoutPassword, token } });
};

export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true },
  });
  res.json({ success: true, data: { user } });
};
