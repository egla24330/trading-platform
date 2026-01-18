import express from 'express';
import {getNews,getNewsById, createNews,updateNews,deleteNews,updateNewsStatus, getTrendingNews,incrementViews,} from '../controllers/newsController.js';

import {protect,authorize,optionalAuth,authorizeOwnership} from '../middlewares/authMiddleware.js';
import {uploadNewsImage,uploadNewsImages, cleanupOldImage} from '../middlewares/uploadMiddleware.js';



const newsRouter = express.Router();

// ==================== PUBLIC ROUTES ====================

newsRouter.get('/', getNews);
newsRouter.get('/trending', getTrendingNews);
newsRouter.get('/:id', getNewsById)
newsRouter.post('/:id/view', incrementViews);

newsRouter.use(protect);
newsRouter.post('/',authorize('admin', 'editor'),uploadNewsImage,createNews);
newsRouter.put(
  '/:id',
  authorize('admin', 'editor'),  // Check role
  authorizeOwnership('author'),  // Check ownership (admin bypasses)
  uploadNewsImage,               // Handle new image upload
  cleanupOldImage,               // Delete old image if new one uploaded
  updateNews                     // Update article
);

newsRouter.delete(
  '/:id',
  authorize('admin', 'editor'),  // Check role
  authorizeOwnership('author'),  // Check ownership
  deleteNews                     // Delete article
);



/*

// PATCH update article status only
router.patch(
  '/:id/status',
  authorize('admin', 'editor'),  // Check role
  authorizeOwnership('author'),  // Check ownership
  updateNewsStatus               // Update status
);

// PATCH schedule article
router.patch(
  '/:id/schedule',
  authorize('admin', 'editor'),  // Check role
  authorizeOwnership('author'),  // Check ownership
  scheduleArticle                // Schedule article
);

// DELETE article with image cleanup
router.delete(
  '/:id',
  authorize('admin', 'editor'),  // Check role
  authorizeOwnership('author'),  // Check ownership
  deleteNews                     // Delete article
);

// POST upload multiple images for gallery
router.post(
  '/:id/gallery',
  authorize('admin', 'editor'),
  authorizeOwnership('author'),
  uploadNewsImages,
  async (req, res) => {
    // Handle gallery images in controller
    res.status(200).json({
      success: true,
      message: 'Gallery images uploaded',
      images: req.cloudinaryResults
    });
  }
);

// ==================== ADMIN ONLY ROUTES ====================
// GET dashboard statistics
router.get(
  '/dashboard/stats',
  authorize('admin'),  // Admin only
  getDashboardStats
);

// GET all articles (including drafts) - admin only
router.get(
  '/admin/all',
  authorize('admin'),
  async (req, res, next) => {
    // Modify query to include all statuses
    req.query.includeAll = true;
    next();
  },
  getNews
);

// PATCH admin can update any article
router.patch(
  '/admin/:id',
  authorize('admin'),
  uploadNewsImage,
  cleanupOldImage,
  updateNews
);

// ==================== ROUTE VALIDATION MIDDLEWARE ====================
// Validate article ID parameter
router.param('id', (req, res, next, id) => {
  // Basic validation for MongoDB ObjectId
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id) && !id.includes('-')) { // Allow slugs too
    return res.status(400).json({
      success: false,
      message: 'Invalid article identifier'
    });
  }
  
  // Store identifier type for controller
  req.isObjectId = objectIdRegex.test(id);
  req.articleIdentifier = id;
  
  next();
});

// ==================== ERROR HANDLING ====================
// 404 for undefined news routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'News API route not found',
    availableRoutes: {
      public: ['GET /', 'GET /trending', 'GET /category/:category', 'GET /:id', 'POST /search'],
      protected: ['POST /', 'PUT /:id', 'DELETE /:id', 'GET /user/my-articles'],
      admin: ['GET /dashboard/stats', 'GET /admin/all', 'PATCH /admin/:id']
    }
  });
});

*/

export default newsRouter;