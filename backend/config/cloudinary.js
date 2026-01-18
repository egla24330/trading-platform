import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Call on startup
testCloudinaryConnection();

// Upload buffer to Cloudinary
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const uploadOptions = {
      folder: options.folder || 'news-images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      resource_type: 'image',
      transformation: [{
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good'
      }],
      ...options
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw error;
  }
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Extract public ID from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract from URL like: https://res.cloudinary.com/demo/image/upload/v1234567/folder/filename.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      // Get everything after 'upload' except version
      const pathParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
      const publicIdWithExtension = pathParts.join('/');
      
      // Remove file extension
      const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
      return lastDotIndex !== -1 
        ? publicIdWithExtension.substring(0, lastDotIndex)
        : publicIdWithExtension;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Upload file from path (if needed)
export const uploadFile = async (filePath, options = {}) => {
  try {
    return await cloudinary.uploader.upload(filePath, options);
  } catch (error) {
    throw error;
  }
};

export default cloudinary;