import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
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

import { sendPasswordResetEmail } from '../lib/notificationService.js';

export const forgotPassword = async (req, res) => {
  const email = req.body.email?.toLowerCase();
  if (!email) throw new AppError('Email is required.', 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success to avoid email enumeration
    return res.json({ success: true, message: 'If an account exists with this email, a reset code has been sent.' });
  }

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const resetToken = jwt.sign({ userId: user.id, email: user.email, otp }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // Send Email Notification
  await sendPasswordResetEmail(user.email, otp, user.firstName);

  res.json({
    success: true,
    message: 'Verification code sent to your email address.',
    data: { resetToken }, // Return reset token to include in reset request
  });
};

export const resetPassword = async (req, res) => {
  const { resetToken, otp, newPassword } = req.body;
  if (!resetToken || !otp || !newPassword) {
    throw new AppError('Reset token, verification code, and new password are required.', 400);
  }
  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired reset token. Please request a new code.', 400);
  }

  if (decoded.otp !== otp.toString().trim()) {
    throw new AppError('Invalid verification code. Please check your email.', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { password: hashedPassword },
  });

  res.json({ success: true, message: 'Password reset successful! You can now log in with your new password.' });
};

import { OAuth2Client } from 'google-auth-library';

export const googleLogin = async (req, res) => {
  const { credential, profile } = req.body;
  let email, firstName, lastName, avatar;

  if (credential) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId) {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        email = payload.email?.toLowerCase();
        firstName = payload.given_name || payload.name?.split(' ')[0] || 'Google';
        lastName = payload.family_name || payload.name?.split(' ')[1] || 'User';
        avatar = payload.picture;
      } else {
        // Parse token payload directly if GOOGLE_CLIENT_ID not explicitly configured yet
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString('utf-8'));
        email = payload.email?.toLowerCase();
        firstName = payload.given_name || payload.name?.split(' ')[0] || 'Google';
        lastName = payload.family_name || payload.name?.split(' ')[1] || 'User';
        avatar = payload.picture;
      }
    } catch (err) {
      console.error('Google token verification error:', err.message);
      throw new AppError('Failed to verify Google login credential.', 400);
    }
  } else if (profile && profile.email) {
    email = profile.email.toLowerCase();
    firstName = profile.given_name || profile.name?.split(' ')[0] || 'Google';
    lastName = profile.family_name || profile.name?.split(' ')[1] || 'User';
    avatar = profile.picture;
  } else {
    throw new AppError('Google login credential is required.', 400);
  }

  if (!email) throw new AppError('Google account email could not be retrieved.', 400);

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (!user.isActive) throw new AppError('Your account has been deactivated.', 403);
    // Update avatar if not already set
    if (avatar && !user.avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }
  } else {
    // Register new user automatically
    const randomPassword = await bcrypt.hash(uuidv4(), 12);
    user = await prisma.user.create({
      data: {
        email,
        password: randomPassword,
        firstName,
        lastName,
        avatar: avatar || null,
      },
    });

    // Auto-create cart & wishlist
    await prisma.cart.create({ data: { userId: user.id } });
    await prisma.wishlist.create({ data: { userId: user.id } });
  }

  // Ensure cart/wishlist exist
  const cartExists = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cartExists) await prisma.cart.create({ data: { userId: user.id } });
  const wishExists = await prisma.wishlist.findUnique({ where: { userId: user.id } });
  if (!wishExists) await prisma.wishlist.create({ data: { userId: user.id } });

  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Google login successful.',
    data: { user: userWithoutPassword, token },
  });
};


