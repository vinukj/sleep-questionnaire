import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { processFileOCR, ocrHealthCheck } from '../controllers/ocrController.js';

const router = express.Router();

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'ocr');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allowed MIME types
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
    ];

    const allowedExtensions = [
      '.pdf',
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.bmp',
      '.webp',
      '.tiff',
      '.tif',
      '.docx',
      '.doc',
    ];

    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: PDF, DOCX, DOC, Images (PNG, JPG, GIF, BMP, WebP, TIFF)`
        ),
        false
      );
    }
  },
});

/**
 * @route POST /ocr/process
 * @description Upload a file (PDF, DOCX, DOC, or image) and extract text using OCR
 * @access Public
 * @param {File} file - The file to process (PDF, DOCX, DOC, PNG, JPG, JPEG, GIF, BMP, WebP)
 * @returns {Object} Extracted text and metadata
 */
router.post('/process', upload.single('file'), processFileOCR);

/**
 * @route GET /ocr/health
 * @description Check if OCR service is healthy
 * @access Public
 * @returns {Object} Service status and supported formats
 */
router.get('/health', ocrHealthCheck);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB',
      });
    }
    return res.status(400).json({
      error: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message || 'File upload error',
    });
  }

  next();
});

export default router;
