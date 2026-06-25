import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import orderRoutes from './routes/order.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import contactRoutes from './routes/contact.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any localhost port (5173, 5174, 5175, etc.)
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    // Allow configured FRONTEND_URL
    if (origin === (process.env.FRONTEND_URL || 'http://localhost:5173')) return callback(null, true);
    // Allow any Vercel deployment origin
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve absolute path for uploads
const staticUploads = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(staticUploads));

// Health check
app.get('/api/health', (req, res) => {
  try {
    const files = fs.readdirSync(process.cwd());
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(), 
      cwd: process.cwd(),
      files,
      env: process.env.NODE_ENV 
    });
  } catch (err) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(), 
      cwd: process.cwd(),
      error: err.message,
      env: process.env.NODE_ENV 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/contact', contactRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 TechPulse Smartphone Store API`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}

export default app;
