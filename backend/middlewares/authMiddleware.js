import jwt from 'jsonwebtoken';
import userModel from '../models/usermodel.js';

// Authentication middleware - verifies JWT token
 const protect = async (req, res, next) => {
  console.log("Auth Middleware Invoked");
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    else if (req.query?.token) {
      token = req.query.token;
    }

    // No token found
    if (!token) {
      return res.json({
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user without password
    req.user = await userModel.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');

    // User not found
    if (!req.user) {
      return res.json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    // Check if account is active
    /*if (req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${req.user.status}. Please contact administrator.`
      });
    }
     */


    // Add user ID to request for easier access
    req.userId = req.user._id;

    
    
    // Log authentication (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Authenticated: ${req.user.email} (${req.user.role})`);
    }

    next();
  } catch (error) {

     if (process.env.NODE_ENV === 'development') {
      console.log('🔴 Auth middleware error:', error.message);
    }
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Generic error
    return res.json({
      success: false,
      message: 'Authentication failed. Please login again.',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
 const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    
    if (!req.user) {
      return res.json({
        success: false,
        message: 'Not authenticated. Please login first.'
      });
    }

    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      console.warn(`⚠️ Unauthorized access attempt by ${req.user.email} (${req.user.role})`);
      
      return res.json({
        success: false,
        message: `Access denied. ${roles.join(' or ')} role required.`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    // Log authorization (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Authorized: ${req.user.email} as ${req.user.role}`);
    }

    next();
  };
};

/**
 * Optional authentication - adds user if token exists, but doesn't require it
 */
 const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Same token extraction logic as protect
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await userModel.findById(decoded.id).select('-password');
      req.userId = req.user?._id;
      
      if (req.user && process.env.NODE_ENV === 'development') {
        console.log(`✅ Optional auth: ${req.user.email} (${req.user.role})`);
      }
    }
  } catch (error) {
    // Don't fail the request for optional auth errors
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ Optional auth failed:', error.message);
    }
  }

  next();
};

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceId - The resource ID to check ownership
 * @param {string} modelName - The model name for logging
 */
 const authorizeOwnership = (resourceOwnerField = 'author') => {
  return async (req, res, next) => {
    try {
      // Skip if user is admin
      if (req.user.role === 'admin') {
        return next();
      }

      const { id } = req.params;
      
      // Import model dynamically to avoid circular dependencies
      const News = await import('../models/News.js').then(m => m.default);
      const resource = await News.findById(id);

      if (!resource) {
        return res.json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource
      const ownerId = resource[resourceOwnerField].toString();
      if (ownerId !== req.user._id.toString()) {
        return res.json({
          success: false,
          message: 'Not authorized to modify this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

export { protect, authorize, optionalAuth, authorizeOwnership };

