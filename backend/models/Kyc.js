import mongoose from "mongoose";

const kycSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  kycId: {
    type: String,
    unique: true,
    default: () => `KYC${Date.now()}${Math.floor(Math.random() * 1000)}`
  },

  // Basic Information (minimal)
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
  //  required: true
  },
  
  
  // Document Information
  documentType: {
    type: String,
    enum: ["passport", "national_id", "driving_license", "other"],
    required: true
  },
  documentNumber: {
    type: String,
    //required: true
  },

  // Cloudinary URLs (only document images)
  documentFrontImage: {
    type: String,
    required: true
  },
  documentBackImage: String,
  
  // Cloudinary Public IDs
  documentFrontPublicId: {
    type: String,
    select: false
  },
  documentBackPublicId: {
    type: String,
    select: false
  },

  // Verification Status
  status: {
    type: String,
    enum: ["pending", "under_review", "approved", "rejected"],
    default: "pending"
  },
  
  // Verification Details
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  verificationDate: Date,
  rejectionReason: String,
  verificationNotes: String,
  
  // Risk Assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  riskLevel: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  
  // Timeline
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,


  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/*

// Indexes
kycSchema.index({ userId: 1 });
kycSchema.index({ status: 1 });
kycSchema.index({ documentNumber: 1 });
kycSchema.index({ submittedAt: -1 });

// Pre-save middleware
kycSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update risk level based on score
  if (this.riskScore <= 30) {
    this.riskLevel = 'low';
  } else if (this.riskScore <= 70) {
    this.riskLevel = 'medium';
  } else {
    this.riskLevel = 'high';
  }
  
  next();
});

// Static methods
kycSchema.statics.getDashboardStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        underReview: { $sum: { $cond: [{ $eq: ["$status", "under_review"] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        
        // Risk distribution
        lowRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "low"] }, 1, 0] } },
        mediumRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "medium"] }, 1, 0] } },
        highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "high"] }, 1, 0] } },
        
        // Document type distribution
        passportCount: { $sum: { $cond: [{ $eq: ["$documentType", "passport"] }, 1, 0] } },
        nationalIdCount: { $sum: { $cond: [{ $eq: ["$documentType", "national_id"] }, 1, 0] } },
        drivingLicenseCount: { $sum: { $cond: [{ $eq: ["$documentType", "driving_license"] }, 1, 0] } }
      }
    }
  ]);
};

kycSchema.statics.getUserKYC = async function(userId) {
  return await this.findOne({ userId }).sort({ createdAt: -1 });
};

// Pre-remove hook to delete Cloudinary files
kycSchema.pre('remove', async function(next) {
  try {
    const publicIds = [
      this.documentFrontPublicId,
      this.documentBackPublicId
    ].filter(Boolean);
    
    if (publicIds.length > 0) {
      const { deleteFromCloudinary } = await import('../config/cloudinary.js');
      
      await Promise.allSettled(
        publicIds.map(publicId => deleteFromCloudinary(publicId))
      );
      
      console.log(`Deleted Cloudinary files for KYC: ${this._id}`);
    }
    
    next();
  } catch (error) {
    console.error('Error deleting Cloudinary files:', error);
    next(error);
  }
});

// For findByIdAndDelete
kycSchema.pre('findOneAndDelete', async function(next) {
  try {
    const doc = await this.model.findOne(this.getQuery());
    
    if (doc) {
      const publicIds = [
        doc.documentFrontPublicId,
        doc.documentBackPublicId
      ].filter(Boolean);
      
      if (publicIds.length > 0) {
        const { deleteFromCloudinary } = await import('../config/cloudinary.js');
        
        await Promise.allSettled(
          publicIds.map(publicId => deleteFromCloudinary(publicId))
        );
        
        console.log(`Deleted Cloudinary files for KYC: ${doc._id}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error deleting Cloudinary files:', error);
    next(error);
  }
});

*/

// Add this after your KYC model definition
kycSchema.post('save', async function(doc) {
  if (doc.isModified('status')) {
    const NotificationService = await import('../services/notificationService.js');
    await NotificationService.default.notifyKYCUpdate(doc);
  }
});

const KYC = mongoose.model("KYC", kycSchema);
export default KYC;