import multer from 'multer';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

// File validation
const validateFile = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check MIME type
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error(`Invalid MIME type. Allowed: ${ALLOWED_MIMETYPES.join(', ')}`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return true;
};

// Multer setup
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    validateFile(file);
    cb(null, true);
  } catch (error) {
    cb(new Error(error.message), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

// Error handling
const handleUploadError = (err, res) => {
  console.error('Deposit upload error:', err.message);

  if (err instanceof multer.MulterError) {
    const errorMap = {
      'LIMIT_FILE_SIZE': `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      'LIMIT_FILE_COUNT': 'Maximum 1 file allowed',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field'
    };

    return res.json({
      success: false,
      message: errorMap[err.code] || `Upload error: ${err.message}`,
      code: err.code
    });
  }

  return res.json({
    success: false,
    message: err.message,
    code: 'FILE_VALIDATION_ERROR'
  });
};

// Deposit proof upload middleware
export const depositProofUpload = async (req, res, next) => {
  upload.single('proofImage')(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    try {
      // Store file info for later use
      if (req.file) {
        req.uploadedFile = {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        };
      }

      next();
    } catch (error) {
      console.error('Upload middleware error:', error);
      return res.json({
        success: false,
        message: 'Upload processing error',
        code: 'UPLOAD_PROCESSING_ERROR'
      });
    }
  });
};

// Validate deposit file middleware
export const validateDepositFile = (req, res, next) => {
  // File is optional for deposits
  if (!req.file) {
    return next();
  }

  try {
    validateFile(req.file);
    next();
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
      code: 'FILE_VALIDATION_ERROR'
    });
  }
};

// Cleanup old proof files middleware
export const cleanupOldProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Only proceed if we're updating an existing deposit
    if (!id || !req.file) {
      return next();
    }

    const Deposit = (await import('../models/Deposit.js')).default;
    const deposit = await Deposit.findById(id).select('proofImage');

    if (!deposit || !deposit.proofImage?.publicId) {
      return next();
    }

    // Delete old proof from Cloudinary
    await deleteFromCloudinary(deposit.proofImage.publicId);
    
    next();
  } catch (error) {
    console.error('Cleanup error:', error.message);
    next(); // Continue even if cleanup fails
  }
};

export default {
  depositProofUpload,
  validateDepositFile,
  cleanupOldProof
};