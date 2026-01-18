import multer from 'multer';
import path from 'path';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

// ==================== CONFIGURATION ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// ==================== FILE VALIDATION ====================
const validateFile = (file) => {
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
    validateFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

// ==================== ERROR HANDLING ====================
const handleUploadError = (err, res) => {
  console.error('Upload error:', err.message);

  if (err instanceof multer.MulterError) {
    const errorMap = {
      'LIMIT_FILE_SIZE': `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      'LIMIT_FILE_COUNT': 'Too many files uploaded',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field',
      'LIMIT_PART_COUNT': 'Too many parts',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields'
    };

    return res.json({
      success: false,
      message: errorMap[err.code] || `Upload error: ${err.message}`,
      code: err.code
    });
  }

  // Custom validation errors
  return res.json({
    success: false,
    message: err.message,
    code: 'FILE_VALIDATION_ERROR'
  });
};

// ==================== UPLOAD MIDDLEWARE ====================
/**
 * Upload single news image to Cloudinary
 * Expects req.user to be set from auth middleware
 */
export const uploadNewsImage = async (req, res, next) => {
  // First, handle multer upload
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    // If no file uploaded, continue (article might not need image)
    if (!req.file) {
      return next();
    }

    try {
      // Validate user is authenticated
      if (!req.user || !req.user._id) {
        throw new Error('User authentication required for upload');
      }

      // Log upload attempt
      console.log(`📤 Uploading image for user: ${req.user.email}, Size: ${req.file.size} bytes`);

      // Prepare upload options
      const uploadOptions = {
        folder: `news/users/${req.user._id}`,
        public_id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tags: ['news', 'article', req.user.email.split('@')[0]],
        context: {
          uploader: req.user.email,
          articleTitle: req.body.title?.substring(0, 50) || 'Untitled'
        }
      };

      // Upload to Cloudinary
      const uploadStartTime = Date.now();
      const result = await uploadToCloudinary(req.file.buffer, uploadOptions);
      const uploadTime = Date.now() - uploadStartTime;

      console.log(`✅ Image uploaded to Cloudinary in ${uploadTime}ms: ${result.public_id}`);

      // Attach Cloudinary result to request
      req.cloudinaryResult = {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        folder: result.folder,
        createdAt: result.created_at,
        uploadTime: uploadTime
      };

      // Add to request body for controller
      req.body.image = result.secure_url;
      req.body.imagePublicId = result.public_id;

      // Clean up memory buffer
      req.file.buffer = null;
      
      next();
    } catch (error) {
      console.error('❌ Cloudinary upload failed:', error.message);
      
      return res.json({
        success: false,
        message: 'Failed to upload image to cloud storage',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: 'CLOUDINARY_UPLOAD_ERROR'
      });
    }
  });
};

/**
 * Cleanup old image when updating article
 * Runs after upload middleware, before controller
 */
export const cleanupOldImage = async (req, res, next) => {
  try {
    // Only proceed if we have a new image uploaded
    if (!req.cloudinaryResult || !req.params.id) {
      return next();
    }

    const { id } = req.params;
    
    // Import News model (avoid circular dependency)
    const News = (await import('../models/News.js')).default;
    const article = await News.findById(id).select('imagePublicId author');

    if (!article) {
      console.log(`Article ${id} not found, skipping image cleanup`);
      return next();
    }

    // Check ownership (optional but good for security)
    if (article.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.warn(`User ${req.user.email} attempted to cleanup image they don't own`);
      return next();
    }

    // Delete old image if exists
    if (article.imagePublicId) {
      console.log(`🗑️ Deleting old image: ${article.imagePublicId}`);
      const deleteResult = await deleteFromCloudinary(article.imagePublicId);
      
      if (deleteResult.success) {
        console.log(`✅ Old image deleted: ${article.imagePublicId}`);
      } else {
        console.warn(`⚠️ Failed to delete old image: ${deleteResult.result}`);
      }
    }

    next();
  } catch (error) {
    console.error('Cleanup error:', error.message);
    // Don't fail the request if cleanup fails
    next();
  }
};

/**
 * Upload multiple images (for galleries)
 */
export const uploadNewsImages = async (req, res, next) => {
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      return handleUploadError(err, res);
    }

    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      if (!req.user) {
        throw new Error('Authentication required');
      }

      console.log(`📤 Uploading ${req.files.length} images for ${req.user.email}`);

      const uploadPromises = req.files.map((file, index) => 
        uploadToCloudinary(file.buffer, {
          folder: `news/galleries/${req.user._id}`,
          public_id: `gallery_${Date.now()}_${index}`,
          tags: ['news-gallery', req.user.email.split('@')[0]]
        })
      );

      const results = await Promise.all(uploadPromises);

      req.cloudinaryResults = results.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        index: index
      }));

      // Add to request body
      req.body.images = results.map(r => r.secure_url);
      req.body.imagePublicIds = results.map(r => r.public_id);

      // Cleanup memory
      req.files.forEach(file => {
        file.buffer = null;
      });

      console.log(`✅ ${results.length} images uploaded successfully`);
      next();
    } catch (error) {
      console.error('Multiple upload failed:', error);
      return res.json({
        success: false,
        message: 'Failed to upload images',
        code: 'MULTIPLE_UPLOAD_ERROR'
      });
    }
  });
};

// ==================== UTILITY FUNCTIONS ====================
export const validateAndUploadSingle = async (fileBuffer, userId, options = {}) => {
  try {
    const result = await uploadToCloudinary(fileBuffer, {
      folder: `news/users/${userId}`,
      public_id: `news_${Date.now()}`,
      ...options
    });
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await deleteFromCloudinary(publicId);
    return {
      success: result.success,
      message: result.result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Export multer instance for custom usage
//export default upload;