import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Transaction Details
    type: {
      type: String,
      enum: [
        'deposit', 'withdrawal', 'trade_investment', 
        'trade_payout', 'fee', 'bonus', 'refund',
        'loan_disbursement', 'loan_repayment'
      ],
      required: true
    },
    
    // Asset Details
    asset: {
      type: String,
      enum: ['USDT', 'BTC', 'ETH'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    
    // Financial Details
    fee: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number
    },
    
    // Related References
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    
    // Additional Details
    description: {
      type: String,
      trim: true
    },
    
    // Force Win/Random Loss Metadata
    metadata: {
      profit: { type: Number },
      profitPercentage: { type: Number },
      wasForceWin: { type: Boolean, default: false },
      wasRandomLose: { type: Boolean, default: false },
      randomLossPercentage: { type: Number }
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    
    // Notes
    notes: {
      type: String
    },
    
    // System
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ user: 1, type: 1 });

// Virtuals
transactionSchema.virtual('isCredit').get(function() {
  const creditTypes = ['deposit', 'bonus', 'refund', 'trade_payout', 'loan_disbursement'];
  return creditTypes.includes(this.type);
});

transactionSchema.virtual('isDebit').get(function() {
  const debitTypes = ['withdrawal', 'trade_investment', 'fee', 'loan_repayment'];
  return debitTypes.includes(this.type);
});

// Pre-save middleware - FIXED VERSION
transactionSchema.pre('save', async function(next) {
  console.log('Transaction pre-save middleware called. Type:', this.type);
  
  // Check if next is a function (Mongoose might not pass it in some cases)
  if (typeof next !== 'function') {
    console.log('Direct save detected, handling without next()');
    try {
      await this.preSaveLogic();
      return;
    } catch (error) {
      console.error('Error in transaction pre-save:', error);
      throw error;
    }
  }
  
  try {
    await this.preSaveLogic();
    next();
  } catch (error) {
    console.error('Error in transaction pre-save middleware:', error);
    next(error);
  }
});

// Extract pre-save logic to separate method
transactionSchema.methods.preSaveLogic = async function() {
  console.log('Running preSaveLogic for transaction type:', this.type);
  
  // Auto-calculate netAmount if not provided
  if (this.netAmount === undefined || this.netAmount === null) {
    console.log('Calculating netAmount');
    this.netAmount = this.amount - (this.fee || 0);
  }
  
  // Set processedAt for completed transactions
  if (this.status === 'completed' && !this.processedAt) {
    console.log('Setting processedAt for completed transaction');
    this.processedAt = new Date();
  }
  
  // Auto-generate description if not provided
  if (!this.description) {
    this.description = this.generateDescription();
    console.log('Generated description:', this.description);
  }
  
  console.log('Transaction preSaveLogic completed');
};

// Instance method to generate description
transactionSchema.methods.generateDescription = function() {
  const descriptions = {
    deposit: `Deposit of ${this.amount} ${this.asset}`,
    withdrawal: `Withdrawal of ${Math.abs(this.amount)} ${this.asset}`,
    trade_investment: `Trade investment of ${Math.abs(this.amount)} ${this.asset}`,
    trade_payout: `Trade payout of ${this.amount} ${this.asset}`,
    fee: `Transaction fee of ${Math.abs(this.amount)} ${this.asset}`,
    bonus: `Bonus credit of ${this.amount} ${this.asset}`,
    refund: `Refund of ${this.amount} ${this.asset}`,
    loan_disbursement: `Loan disbursement of ${this.amount} ${this.asset}`,
    loan_repayment: `Loan repayment of ${Math.abs(this.amount)} ${this.asset}`
  };
  
  return descriptions[this.type] || `${this.type} transaction`;
};

// Static method to get user balance
transactionSchema.statics.getUserBalance = async function(userId, asset = 'USDT') {
  try {
    const result = await this.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          asset: asset,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: {
              $cond: [
                { $in: ['$type', ['deposit', 'bonus', 'refund', 'trade_payout', 'loan_disbursement']] },
                '$netAmount',
                0
              ]
            }
          },
          totalDebits: {
            $sum: {
              $cond: [
                { $in: ['$type', ['withdrawal', 'trade_investment', 'fee', 'loan_repayment']] },
                { $abs: '$netAmount' },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          totalCredits: 1,
          totalDebits: 1,
          availableBalance: { $subtract: ['$totalCredits', '$totalDebits'] }
        }
      }
    ]);
    
    return result[0] || {
      totalCredits: 0,
      totalDebits: 0,
      availableBalance: 0
    };
  } catch (error) {
    console.error('Error getting user balance:', error);
    return {
      totalCredits: 0,
      totalDebits: 0,
      availableBalance: 0
    };
  }
};

// Static method to create trade investment transaction
transactionSchema.statics.createTradeInvestment = async function(userId, orderId, amount, fee = 0) {
  try {
    console.log('Creating trade investment transaction');
    
    const transaction = new this({
      user: userId,
      type: 'trade_investment',
      asset: 'USDT',
      amount: -Math.abs(amount),
      fee: fee,
      order: orderId,
      status: 'completed',
      description: `Trade investment for order ${orderId}`
    });
    
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating trade investment transaction:', error);
    throw error;
  }
};

// Static method to create trade payout transaction
transactionSchema.statics.createTradePayout = async function(userId, orderId, payout, metadata = {}) {
  try {
    console.log('Creating trade payout transaction');
    
    const transaction = new this({
      user: userId,
      type: 'trade_payout',
      asset: 'USDT',
      amount: Math.abs(payout),
      fee: 0,
      order: orderId,
      status: 'completed',
      description: `Trade payout for order ${orderId}`,
      metadata: metadata
    });
    
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating trade payout transaction:', error);
    throw error;
  }
};

// Static method to create deposit transaction
transactionSchema.statics.createDeposit = async function(userId, amount, paymentMethod = 'crypto', transactionHash = null) {
  try {
    console.log('Creating deposit transaction');
    
    const transaction = new this({
      user: userId,
      type: 'deposit',
      asset: 'USDT',
      amount: Math.abs(amount),
      fee: 0,
      order: null,
      status: 'pending',
      description: `Deposit via ${paymentMethod}`,
      metadata: { transactionHash }
    });
    
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating deposit transaction:', error);
    throw error;
  }
};

// Static method to create withdrawal transaction
transactionSchema.statics.createWithdrawal = async function(userId, amount, fee = 0) {
  try {
    console.log('Creating withdrawal transaction');
    
    const transaction = new this({
      user: userId,
      type: 'withdrawal',
      asset: 'USDT',
      amount: -Math.abs(amount),
      fee: fee,
      order: null,
      status: 'pending',
      description: `Withdrawal request`
    });
    
    await transaction.save();
    return transaction;
  } catch (error) {
    console.error('Error creating withdrawal transaction:', error);
    throw error;
  }
};

// Check if model is already compiled
let Transaction;
try {
  Transaction = mongoose.model('Transaction');
  console.log('Transaction model already exists');
} catch {
  Transaction = mongoose.model('Transaction', transactionSchema);
  console.log('Transaction model created');
}

export default Transaction;