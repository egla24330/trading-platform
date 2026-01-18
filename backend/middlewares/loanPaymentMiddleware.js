import multer from 'multer';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// Configuration for loan payments
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
  console.error('Loan payment upload error:', err.message);

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

// Loan payment proof upload middleware
export const loanPaymentUpload = async (req, res, next) => {
  upload.single('paymentProof')(req, res, async (err) => {
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
      console.error('Loan payment upload middleware error:', error);
      return res.json({
        success: false,
        message: 'Upload processing error',
        code: 'UPLOAD_PROCESSING_ERROR'
      });
    }
  });
};

// Validate loan payment file middleware
export const validateLoanPaymentFile = (req, res, next) => {
  // File is required for loan payments
  if (!req.file) {
    return res.json({
      success: false,
      message: 'Payment proof is required',
      code: 'PROOF_REQUIRED'
    });
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

// Cleanup old payment proof files middleware
export const cleanupOldPaymentProof = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    
    // Only proceed if we're updating an existing payment
    if (!paymentId || !req.file) {
      return next();
    }

    // Import Loan model here to avoid circular dependency
    const Loan = (await import('../models/Loan.js')).default;
    
    // Find the loan containing this payment
    const loan = await Loan.findOne({
      'payments._id': paymentId
    }).select('payments');

    if (!loan) {
      return next();
    }

    // Find the specific payment
    const payment = loan.payments.id(paymentId);
    
    // Delete old proof from Cloudinary if exists
    if (payment && payment.proofImage?.publicId) {
      await deleteFromCloudinary(payment.proofImage.publicId);
    }
    
    next();
  } catch (error) {
    console.error('Cleanup error:', error.message);
    next(); // Continue even if cleanup fails
  }
};

export default {
  loanPaymentUpload,
  validateLoanPaymentFile,
  cleanupOldPaymentProof
};