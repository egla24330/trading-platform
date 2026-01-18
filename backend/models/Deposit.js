import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  
  // Basic Info
  //transactionId: {
   // type: String,
   // required: true,
   // unique: true,
   // index: true
  //},
  reference: String,
  
  // Deposit Details
  currency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH', 'USDT','BNB'],
    uppercase: true
  },
  network: {
    type: String,
    required: true,
    enum: ['Bitcoin', 'Lightning', 'Ethereum', 'Arbitrum', 'TronTRC20', 'ERC20', 'BEP20']
  },
  
  // Amounts
  amount: {
    type: Number,
    required: true,
    min: 0.00000001
  },
  /////xxxxx
  /*
  requestedAmount: {
    type: Number,
    required: true,
    min: 0.00000001
  },

  */
  approvedAmount: Number,
  ////xxxxx
  //fee: {
    //type: Number,
    //default: 0,
    //min: 0
  //},
  
  // Blockchain Info
  fromAddress: String,
  toAddress: {
    type: String,
  //  required: true
  },
  txHash: {
    type: String,
    required: true,
   // index: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'rejected', 'failed', 'under_review'],
    default: 'pending',
    //index: true
  },
  
  // Files
  proofImage: {
    url: String,
    publicId: String,
    filename: String
  },
  
  // Admin Actions
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  rejectedAt: Date,
  rejectReason: String,
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  approvedAt: Date,
  approvalNote: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    //index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Indexes
/*
depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });
depositSchema.index({ currency: 1, createdAt: -1 });
*/
// Virtuals
depositSchema.virtual('user', {
  ref: 'user',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

depositSchema.virtual('formattedAmount').get(function() {
  if (!this.amount) return '0';
  const decimals = this.currency === 'BTC' ? 8 : this.currency === 'ETH' ? 6 : 2;
  return this.amount.toFixed(decimals);
});

depositSchema.virtual('isPending').get(function() {
  return ['pending', 'processing', 'under_review'].includes(this.status);
});

depositSchema.virtual('statusText').get(function() {
  const map = {
    'pending': 'Pending',
    'processing': 'Processing',
    'completed': 'Completed',
    'rejected': 'Rejected',
    'failed': 'Failed',
    'under_review': 'Under Review'
  };
  return map[this.status] || this.status;
});

// Methods
depositSchema.methods.approve = async function(approvedBy, note = '') {
  this.status = 'completed';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalNote = note;
  this.completedAt = new Date();
  
  if (!this.approvedAmount) {
    this.approvedAmount = this.amount;
  }
  
  return this.save();
};

depositSchema.methods.reject = async function(rejectedBy, reason = '') {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectReason = reason;
  return this.save();
};

// Statics
depositSchema.statics.generateTxId = function() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEP${timestamp}${random}`;
};

// Add this after your Deposit model definition
depositSchema.post('save', async function(doc) {
  if (doc.isModified('status')) {
    const NotificationService = await import('../services/notificationService.js');
    await NotificationService.default.notifyDepositUpdate(doc);
  }
});

export default mongoose.model('Deposit', depositSchema);