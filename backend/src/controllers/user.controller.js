import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, createdAt: true },
  });
  res.json({ success: true, data: { user } });
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone !== undefined && { phone }), ...(avatar !== undefined && { avatar }) },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true },
  });
  res.json({ success: true, message: 'Profile updated.', data: { user } });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both current and new password are required.', 400);
  if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters.', 400);

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });
  res.json({ success: true, message: 'Password changed successfully.' });
};

export const getAddresses = async (req, res) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
  res.json({ success: true, data: { addresses } });
};

export const addAddress = async (req, res) => {
  const { label, fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { userId: req.user.id, label, fullName, phone, street, city, state, zipCode, country: country || 'Bangladesh', isDefault: isDefault || false },
  });
  res.status(201).json({ success: true, data: { address } });
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== req.user.id) throw new AppError('Address not found.', 404);

  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const updated = await prisma.address.update({ where: { id }, data: req.body });
  res.json({ success: true, data: { address: updated } });
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== req.user.id) throw new AppError('Address not found.', 404);
  await prisma.address.delete({ where: { id } });
  res.json({ success: true, message: 'Address deleted.' });
};

// Admin
export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = search
    ? { OR: [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }] }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: { users, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } } });
};

export const toggleUserStatus = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('User not found.', 404);
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  });
  res.json({ success: true, message: `User ${updated.isActive ? 'activated' : 'deactivated'}.`, data: { user: updated } });
};
