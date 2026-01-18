import multer from 'multer';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// ==================== CONFIGURATION ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// ==================== FILE VALIDATION ====================
const validateFile = (file, fieldName) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  // Check MIME type
  if (!ALLOWED_MIMETYPES.includes(mimetype)) {
    throw new Error(
      `Invalid MIME type. Allowed: ${ALLOWED_MIMETYPES.join(', ')}`
    );
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  return true;
};

// ==================== MULTER SETUP ====================
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  try {
    validateFile(file, file.fieldname);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2
  },
  fileFilter
});

// ==================== ERROR HANDLING ====================
const handleUploadError = (err, res) => {
  //console.error('KYC Upload error:', err.message);

  if (err instanceof multer.MulterError) {
    const errorMap = {
      'LIMIT_FILE_SIZE': `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      'LIMIT_FILE_COUNT': 'Maximum 2 files allowed',
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

// ==================== KYC UPLOAD MIDDLEWARE ====================
/**
 * Main KYC upload middleware - only document images
 */
export const kycUploadMiddleware = async (req, res, next) => {
  upload.fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    try {
      // Validate required files
      if (!req.files || !req.files.documentFront) {
        return res.json({
          success: false,
          message: 'Document front image is required'
        });
      }

      // Validate user is authenticated
      if (!req.user || !req.user._id) {
        return res.json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user._id;
      const timestamp = Date.now();
      const uploadResults = {};

//      //console.log(`📤 Uploading KYC documents for user: ${userId}`);

      // Process document front
      if (req.files.documentFront && req.files.documentFront[0]) {
        const file = req.files.documentFront[0];
        
        // Prepare upload options
        const uploadOptions = {
          folder: `kyc/users/${userId}`,
          public_id: `document_front_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          tags: ['kyc', 'document_front', `user_${userId}`]
        };

        //console.log(`📄 Uploading document front: ${file.originalname}`);

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file.buffer, uploadOptions);

        //console.log(`✅ Document front uploaded: ${result.public_id}`);

        // Store result
        uploadResults.documentFront = {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes
        };

        // Add to request body
        req.body.documentFrontImage = result.secure_url;
        req.body.documentFrontPublicId = result.public_id;

        // Clean up memory buffer
        file.buffer = null;
      }

      // Process document back (optional)
      if (req.files.documentBack && req.files.documentBack[0]) {
        const file = req.files.documentBack[0];
        
        const uploadOptions = {
          folder: `kyc/users/${userId}`,
          public_id: `document_back_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          tags: ['kyc', 'document_back', `user_${userId}`]
        };

        //console.log(`📄 Uploading document back: ${file.originalname}`);

        const result = await uploadToCloudinary(file.buffer, uploadOptions);

        //console.log(`✅ Document back uploaded: ${result.public_id}`);

        uploadResults.documentBack = {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes
        };

        req.body.documentBackImage = result.secure_url;
        req.body.documentBackPublicId = result.public_id;

        file.buffer = null;
      }

      // Store all upload results
      req.cloudinaryResults = uploadResults;

      //console.log(`✅ KYC documents uploaded successfully for user ${userId}`);
      next();
    } catch (error) {
      //console.error('❌ KYC upload failed:', error.message);
      
      // Cleanup uploaded files if upload fails
      if (req.cloudinaryResults) {
        const publicIds = Object.values(req.cloudinaryResults)
          .filter(r => r && r.publicId)
          .map(r => r.publicId);
        
        if (publicIds.length > 0) {
          await Promise.allSettled(
            publicIds.map(publicId => deleteFromCloudinary(publicId))
          );
          //console.log('🗑️ Cleaned up partially uploaded files');
        }
      }
      
      return res.json({
        success: false,
        message: 'Failed to upload KYC documents',
        code: 'KYC_UPLOAD_ERROR'
      });
    }
  });
};

/**
 * Cleanup old KYC documents when updating
 */
export const cleanupOldKYCDocuments = async (req, res, next) => {
  try {
    // Only proceed if we have new uploads
    if (!req.cloudinaryResults) {
      return next();
    }

    const { id } = req.params;
    
    // Import KYC model
    const KYC = (await import('../models/KYC.js')).default;
    const kyc = await KYC.findById(id).select('+documentFrontPublicId +documentBackPublicId userId');

    if (!kyc) {
      //console.log(`KYC ${id} not found, skipping cleanup`);
      return next();
    }

    // Check ownership
    if (kyc.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      //console.warn(`User ${req.user.email} attempted to cleanup documents they don't own`);
      return next();
    }

    // Delete old files that are being replaced
    const publicIds = [];
    
    if (req.body.documentFrontImage && kyc.documentFrontPublicId) {
      publicIds.push(kyc.documentFrontPublicId);
    }
    if (req.body.documentBackImage && kyc.documentBackPublicId) {
      publicIds.push(kyc.documentBackPublicId);
    }
    
    if (publicIds.length > 0) {
      await Promise.allSettled(
        publicIds.map(publicId => deleteFromCloudinary(publicId))
      );
      //console.log(`✅ Cleaned up ${publicIds.length} old KYC documents`);
    }

    next();
  } catch (error) {
    //console.error('Cleanup error:', error.message);
    next();
  }
};

/**
 * Validate KYC files
 */
export const validateKYCFiles = (req, res, next) => {
  if (!req.files) {
    return res.json({
      success: false,
      message: 'No files uploaded'
    });
  }

  // Check required file
  if (!req.files.documentFront) {
    return res.json({
      success: false,
      message: 'Document front image is required'
    });
  }

  next();
};

export default kycUploadMiddleware;