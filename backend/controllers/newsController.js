import News from '../models/News.js';
import mongoose from 'mongoose';
//import { deleteImageByPublicId, extractPublicId } from '../middlewares/uploadMiddleware.js';
import { deleteImage } from '../middlewares/uploadMiddleware.js';

// Error handler
const handleError = (error, res) => {
  console.error('Controller Error:', error);

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (error.code === 11000) {
    return res.json({
      success: false,
      message: 'Duplicate field value entered',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  if (error.name === 'CastError') {
    return res.json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  return res.json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
};

// @desc    Create new article
// @route   POST /api/news
// @access  Private (Admin/Editor)
export const createNews = async (req, res) => {
  try {
    const { title, summary, fullContent, category, readTime, trending, status } = req.body;

    // Validate required fields
    if (!title || !summary || !fullContent) {
      return res.json({
        success: false,
        message: 'Title, summary, and content are required'
      });
    }

    // Get image from upload or body
    const image = req.cloudinaryResult?.url || req.body.image || '';
    const imagePublicId = req.cloudinaryResult?.publicId || req.body.imagePublicId || '';

    const articleData = {
      title,
      summary,
      fullContent,
      category: category || 'Market Analysis',
      image,
      imagePublicId,
      readTime: readTime || '3 min read',
      trending: trending === 'true' || trending === true,
      status: status || 'draft',
      author: req.user.id,
      authorName: req.user.name || 'Admin',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    };

    // Set publishedAt if status is published
    if (articleData.status === 'published') {
      articleData.publishedAt = new Date();
    }

    // Set scheduledAt if status is scheduled
    if (articleData.status === 'scheduled' && req.body.scheduledAt) {
      articleData.scheduledAt = new Date(req.body.scheduledAt);
    }

    const article = await News.create(articleData);

    res.json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Update article
// @route   PUT /api/news/:id
// @access  Private (Admin/Editor)


export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        success: false,
        message: 'Invalid article ID'
      });
    }

    // Find existing article
    const existingArticle = await News.findById(id);

    if (!existingArticle) {
      return res.json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check authorization
    if (existingArticle.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.json({
        success: false,
        message: 'Not authorized to update this article'
      });
    }

    // Determine image - prioritize uploaded image, then body image, then existing
    let image = existingArticle.image;
    let imagePublicId = existingArticle.imagePublicId;

    if (req.cloudinaryResult) {
      // New image uploaded
      image = req.cloudinaryResult.url;
      imagePublicId = req.cloudinaryResult.publicId;
    } else if (req.body.image && req.body.image !== existingArticle.image) {
      // Image URL changed in body
      image = req.body.image;
      // Try to extract public ID from new URL or use provided one
      //imagePublicId = req.body.imagePublicId || extractPublicId(req.body.image) || '';
    }

    const updateData = {
      title: req.body.title || existingArticle.title,
      summary: req.body.summary || existingArticle.summary,
      fullContent: req.body.fullContent || existingArticle.fullContent,
      category: req.body.category || existingArticle.category,
      image,
      imagePublicId,
      readTime: req.body.readTime || existingArticle.readTime,
      trending: req.body.trending !== undefined
        ? (req.body.trending === 'true' || req.body.trending === true)
        : existingArticle.trending,
      status: req.body.status || existingArticle.status,
      tags: req.body.tags
        ? req.body.tags.split(',').map(tag => tag.trim())
        : existingArticle.tags
    };

    // Handle publishedAt date
    if (req.body.status === 'published' && existingArticle.status !== 'published') {
      updateData.publishedAt = new Date();
    } else if (req.body.status !== 'published' && existingArticle.status === 'published') {
      updateData.publishedAt = null;
    }

    const updatedArticle = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Update article status only
// @route   PATCH /api/news/:id/status
// @access  Private (Admin/Editor)
export const updateNewsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        success: false,
        message: 'Invalid article ID'
      });
    }

    if (!status || !['draft', 'published', 'scheduled', 'archived'].includes(status)) {
      return res.json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const article = await News.findById(id);

    if (!article) {
      return res.json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check authorization
    if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.json({
        success: false,
        message: 'Not authorized to update this article'
      });
    }

    const updateData = { status };
    const updatedArticle = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: `Article status updated to ${status}`,
      data: updatedArticle
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Delete article
// @route   DELETE /api/news/:id
// @access  Private (Admin/Editor)
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        success: false,
        message: 'Invalid article ID'
      });
    }

    const article = await News.findById(id);

    if (!article) {
      return res.json({
        success: false,
        message: 'Article not found'
      });
    }

    // Check authorization
    if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.json({
        success: false,
        message: 'Not authorized to delete this article'
      });
    }

    // Delete image from Cloudinary if exists
    if (article.imagePublicId) {
      try {
         // await deleteImageByPublicId(article.imagePublicId);
          await deleteImage(article.imagePublicId)
      } catch (deleteError) {
        console.warn('Failed to delete image from Cloudinary:', deleteError.message);
      }
    }

    // Delete article from database
    await News.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Get all articles
// @route   GET /api/news
// @access  Public/Private
export const getNews = async (req, res) => {
  try {
    const { search, status, category,
      trending,
      author,
      sortBy = '-createdAt',
      limit = 20,
      page = 1
    } = req.query;

    const skip = (page - 1) * limit;

    const filters = {
      //  status: req.user?.role === 'admin' ? status : 'published',
      category,
      trending: trending === 'true' ? true : trending === 'false' ? false : undefined,
      author,
      sortBy,
      limit,
      skip
    };
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    // Build query
    let query = News.find();
    /* // Search
     if (search) {
       query = query.or([
         { title: { $regex: search, $options: 'i' } },
         { summary: { $regex: search, $options: 'i' } },
         { fullContent: { $regex: search, $options: 'i' } }
       ]);
     }
     
     */
    // Apply filters
    Object.keys(filters).forEach(key => {
      if (key !== 'sortBy' && key !== 'limit' && key !== 'skip') {
        query = query.where(key).equals(filters[key]);
      }
    });
    const articles = await query
      .sort(filters.sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      //.populate('author', 'name email')
      //.lean();
    const totalQuery = News.find();
    if (search) {
      totalQuery.or([
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ]);
    }
    if (filters.status) {
      totalQuery.where('status').equals(filters.status);
    }
    if (category) {
      totalQuery.where('category').equals(category);
    }

    const total = await totalQuery.countDocuments();
    console.log({
      success: true,
      count: articles.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: articles

    })

    res.json({
      success: true,
      count: articles.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: articles
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Get single article
// @route   GET /api/news/:id
// @access  Public
export const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        success: false,
        message: 'Invalid article ID'
      });
    }

    const article = await News.findById(id)
      .populate('author', 'name email avatar')
      .lean();

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Only show published articles to non-admins
    if (article.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Article is not published'
      });
    }

    // Increment views if published
    if (article.status === 'published') {
      await News.findByIdAndUpdate(id, { $inc: { views: 1 } });
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Get trending articles
// @route   GET /api/news/trending
// @access  Public
export const getTrendingNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const articles = await News.find({
      status: 'published',
      trending: true
    })
      .sort({ views: -1, publishedAt: -1 })
      .limit(limit)
      .select('title summary category image readTime views publishedAt slug authorName')
      .lean();

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    handleError(error, res);
  }
};

// @desc    Increment article views
// @route   POST /api/news/:id/view
// @access  Public
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({
        success: false,
        message: 'Invalid article ID'
      });
    }

    const article = await News.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).select('views');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      views: article.views
    });
  } catch (error) {
    handleError(error, res);
  }
};

