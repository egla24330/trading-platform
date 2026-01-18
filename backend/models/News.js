import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  fullContent: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Market Analysis',
      'Regulation',
      'Market Update',
      'DeFi',
      'CBDC',
      'Technology'
    ],
    default: 'Market Analysis'
  },
  image: {
    type: String,
    default: ''
  },
  imagePublicId: {
    type: String, // For Cloudinary or similar services
    default: ''
  },
  readTime: {
    type: String,
    default: '3 min read'
  },
  trending: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    default: 'Admin'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug before saving
/*
newsSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
  
  // Set publishedAt date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Set publishedAt to null if status changes from published
  if (this.isModified('status') && this.status !== 'published' && this.publishedAt) {
    this.publishedAt = null;
  }
  
  next();
});

*/

// Index for better query performance
newsSchema.index({ title: 'text', summary: 'text' });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ trending: 1, publishedAt: -1 });

// Virtual for time ago
newsSchema.virtual('time').get(function() {
  if (!this.createdAt) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Static method to increment views
newsSchema.statics.incrementViews = async function(id) {
  try {
    return await this.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
};

/*

// Static method for search
newsSchema.statics.searchArticles = async function(query, filters = {}) {
  try {
    const { status, category, trending, author, sortBy = '-createdAt', limit = 20, skip = 0 } = filters;
    
    const searchQuery = {};
    
    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    // Filters
    if (status) searchQuery.status = status;
    if (category) searchQuery.category = category;
    if (trending !== undefined) searchQuery.trending = trending;
    if (author) searchQuery.author = author;
    
    // Only show published articles to non-admins
    if (!filters.includeAll) {
      searchQuery.status = 'published';
    }
    
    const articles = await this.find(searchQuery)
      .sort(sortBy)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('author', 'name email')
      .lean();
    
    const total = await this.countDocuments(searchQuery);
    
    return {
      articles,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw error;
  }
};
*/
const News = mongoose.model('News', newsSchema);

export default News;