// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    
    title: {
      type: String,
      required: true,
      trim: true,
    },
    
    message: {
      type: String,
      required: true,
      trim: true,
    },
    
    type: {
      type: String,
      enum: [
        "deposit",          // Deposit status updates
        "withdrawal",       // Withdrawal status updates
        "loan",            // Loan application updates
        "kyc",             // KYC verification updates
        "trade",           // Trade/Order updates
        "system",          // System notifications
        "promotion",       // Promotional offers
        "security",        // Security alerts
        "account"          // Account updates
      ],
      default: "system",
    },
    
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true,
    },
    
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    
    // Link to related document (optional)
    relatedTo: {
      modelType: {
        type: String,
        enum: ["Deposit", "Withdrawal", "Loan", "KYC", "Order", "User"],
      },
      modelId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedTo.modelType",
      },
    },
    
    // Action buttons
    actions: [{
      label: String,
      url: String,
      method: String,
      style: String,
    }],
    
    // Expiry for time-sensitive notifications
    expiresAt: {
      type: Date,
    },
    
    // Metadata for UI display
    icon: String,
    color: String,
    badge: String,
    
    // Read tracking
    readAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtuals
notificationSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual("timeAgo").get(function () {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return Math.floor(seconds) + " seconds ago";
});

// Methods
notificationSchema.methods.markAsRead = async function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = async function () {
  this.status = "unread";
  this.readAt = null;
  return this.save();
};

notificationSchema.methods.archive = async function () {
  this.status = "archived";
  return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;