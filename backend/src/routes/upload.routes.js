import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Ensure uploads directory exists
const uploadDir = process.env.VERCEL
  ? '/tmp'
  : path.join(process.cwd(), 'uploads');

if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|mp4|webm|avi/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Images and Videos only!', 400));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post('/', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const baseUrl = process.env.BASE_URL || `${protocol}://${req.get('host')}`;
  
  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: `${baseUrl}/uploads/${req.file.filename}`
    }
  });
});

export default router;
