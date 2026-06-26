import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Upload to Cloudinary if configured
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      // Detect resource type based on mimetype
      const isVideo = req.file.mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'smartphone-ecommerce',
        resource_type: resourceType,
      });
      
      // Clean up local temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.json({
        success: true,
        message: 'File uploaded to Cloudinary successfully',
        data: {
          url: result.secure_url
        }
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      // Fall back to Base64/local file if upload fails
    }
  }

  // Fallback to Base64 data URL if Cloudinary is not configured or fails
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype;
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    // Clean up local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.json({
      success: true,
      message: 'File converted to Base64 successfully',
      data: {
        url: dataUrl
      }
    });
  } catch (error) {
    console.error('Base64 conversion error:', error);
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = process.env.BASE_URL || `${protocol}://${req.get('host')}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully (local fallback)',
      data: {
        url: `${baseUrl}/uploads/${req.file.filename}`
      }
    });
  }
});

export default router;
