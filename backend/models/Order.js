// models/Order.js - CORRECTED VERSION
import mongoose from "mongoose";
import userModel from "./usermodel.js";

const durationRates = {
  30: 12,  // 12% return for 30 seconds
  50: 13,  // 13% return for 50 seconds  
  60: 14   // 14% return for 60 seconds
};

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Trade Details
    symbol: {
      type: String,
      required: true,
      trim: true
    },
    symbolName: {
      type: String,
      required: true
    },
    coinId: {
      type: String,
      required: true
    },
    
    // Position Details
    direction: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 100  // Minimum $100
    },
    leverage: {
      type: Number,
      default: 1,
      min: 1,
      max: 20
    },
    
    // Price Details
    entryPrice: {
      type: Number,
      required: true
    },
    exitPrice: {
      type: Number
    },
    
    // Time Management
    duration: {
      type: Number,
      enum: [30, 50, 60, 120],
      required: true
    },
    startTime: {
      type: Date,
      index: true
    },
    endTime: {
      type: Date,
      index: true
    },
    completedAt: {
      type: Date
    },
    
    // Financial Details
    expectedReturn: {
      type: Number
    },
    fee: {
      type: Number,
      required: true,
      default: 0
    },
    totalPayout: {
      type: Number
    },
    actualPayout: {
      type: Number
    },
    
    // P&L
    profit: {
      type: Number,
      default: 0
    },
    profitPercentage: {
      type: Number,
      default: 0
    },
    
    // Force Win/Lose Logic
    wasForceWin: {
      type: Boolean,
      default: false
    },
    wasRandomLose: {
      type: Boolean,
      default: false
    },
    randomLossPercentage: {
      type: Number,
      default: 0
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
      default: 'pending',
      index: true
    },
    
    result: {
      type: String,
      enum: ['win', 'loss', 'break_even', null],
      default: null
    },
    
    // Additional Details
    description: {
      type: String,
      trim: true
    },
    
    // System Info
    isLive: {
      type: Boolean,
      default: true
    },
    orderType: {
      type: String,
      enum: ['time_based', 'manual'],
      default: 'time_based'
    },
    
    // Audit
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancellationReason: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ user: 1, completedAt: -1 });
orderSchema.index({ status: 1, endTime: 1 });
orderSchema.index({ coinId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtuals
orderSchema.virtual('timeLeft').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const timeLeftMs = this.endTime - now;
  return Math.max(0, Math.ceil(timeLeftMs / 1000));
});

orderSchema.virtual('progress').get(function() {
  if (this.status !== 'active') return 100;
  const now = new Date();
  const totalDuration = this.endTime - this.startTime;
  const elapsed = now - this.startTime;
  return Math.min(100, (elapsed / totalDuration) * 100);
});

orderSchema.virtual('isProfitable').get(function() {
  return this.profit > 0;
});

orderSchema.virtual('isLoss').get(function() {
  return this.profit < 0;
});

orderSchema.virtual('durationLabel').get(function() {
  const labels = {
    30: '30 seconds',
    50: '50 seconds',
    60: '1 minute',
    120: '2 minutes'
  };
  return labels[this.duration] || `${this.duration} seconds`;
});

// Pre-save middleware - FIXED VERSION
orderSchema.pre('save', async function(next) {
  // Debug: Check if next is a function
  console.log('Order pre-save middleware called. Next is function?', typeof next === 'function');
  
  // If next is not a function, this might be a direct save call
  if (typeof next !== 'function') {
    console.log('Direct save call detected, handling without next()');
    await this.preSaveLogic();
    return;
  }
  
  try {
    await this.preSaveLogic();
    next();
  } catch (error) {
    console.error('Error in order pre-save middleware:', error);
    next(error);
  }
});

// Extract pre-save logic to separate method
orderSchema.methods.preSaveLogic = async function() {
  console.log('Running preSaveLogic for order:', this.symbol, this.direction);
  
  if (this.isNew) {
    console.log('New order detected, calculating fields...');
    const rate = durationRates[this.duration] || 12;
    this.expectedReturn = (this.amount * (rate / 100));
    this.fee = this.amount * 0.02;
    this.totalPayout = this.amount + this.expectedReturn - this.fee;
    if (!this.startTime) {
      this.startTime = new Date();
    }
    
    if (!this.endTime) {
      const endTime = new Date(this.startTime);
      endTime.setSeconds(endTime.getSeconds() + this.duration);
      this.endTime = endTime;
    }
    
    if (!this.description) {
      this.description = `${this.direction.toUpperCase()} ${this.symbol} for ${this.duration}s`;
      console.log('Description set:', this.description);
    }

    if (!this.status) {
      this.status = 'active';
      console.log('Status set to active');
    }
  }
  
  // Calculate profit when exit price is set
  if (this.exitPrice && this.isModified('exitPrice')) {
    //console.log('Exit price modified, calculating profit/loss...');
    await this.calculateProfitLoss();
  }
  
  // Auto-complete if end time has passed and still active
  if (this.status === 'active' && this.endTime && this.endTime < new Date()) {
    //console.log('Order expired, marking as expired...');
    this.status = 'expired';
    this.isLive = false;
  }
  
 // console.log('preSaveLogic completed');
};

// Method to calculate profit/loss with force win logic
orderSchema.methods.calculateProfitLoss = async function() {
  if (!this.exitPrice || !this.entryPrice) {
    console.log('Missing exitPrice or entryPrice, skipping profit calculation');
    return null;
  }
  
  try {
  //  console.log('Calculating profit/loss for order:', this._id);
    // Get user to check forceWin status
    const user = await userModel.findById(this.user);
    if (!user) {
      throw new Error('User not found');
    }
    
    let percentage = 0;
    let isRandomLoss = false;
    let randomLossPercent = 0;
    
    // Check if user has forceWin enabled
    if (user.forceWin) {
      //console.log('Force win enabled for user');
      // Force win - always profitable
      this.wasForceWin = true;
      //percentage = Math.abs(this.expectedReturn / this.amount) * 100;

      randomLossPercent = 1 + Math.random() *  durationRates[this.duration] 
        percentage = randomLossPercent * this.leverage;
    } else {
      // Generate random loss (1-20% loss) with 90% probability
      const shouldLose = Math.random() < 0.9; // 90% chance of losing
      
      if (true) {
        // Generate random loss percentage between 1% and 50%
        randomLossPercent = 3 + Math.random() *  durationRates[this.duration]-3; 
        percentage = -randomLossPercent * this.leverage; // Apply leverage to loss
        this.wasRandomLose = true;
        this.randomLossPercentage = randomLossPercent;
        isRandomLoss = true;
       // console.log('Random loss applied:', randomLossPercent.toFixed(2), '%');
      } else {
        // Normal calculation based on price movement
        if (this.direction === 'buy') {
          // For buy (long): profit when price goes up
          const priceChange = ((this.exitPrice - this.entryPrice) / this.entryPrice) * 100;
          percentage = priceChange * this.leverage;
        } else {
          // For sell (short): profit when price goes down
          const priceChange = ((this.entryPrice - this.exitPrice) / this.entryPrice) * 100;
          percentage = priceChange * this.leverage;
        }
        console.log('Normal calculation, percentage:', percentage.toFixed(2));
      }
    }
    
    this.profitPercentage = parseFloat(percentage.toFixed(2));
    this.profit = (this.amount * percentage) / 100;
    this.actualPayout = this.amount + this.profit
    
    // Ensure actual payout is not negative
    if (this.actualPayout < 0) this.actualPayout = 0;
    
    // Determine result
    if (this.profit > 0) {
      this.result = 'win';
    } else if (this.profit < 0) {
      this.result = 'loss';
    } else {
      this.result = 'break_even';
    }
    
    /*console.log('Profit calculation complete:', {
      profit: this.profit,
      profitPercentage: this.profitPercentage,
      actualPayout: this.actualPayout,
      result: this.result
    });
    */
    
    return {
      profit: this.profit,
      profitPercentage: this.profitPercentage,
      wasForceWin: this.wasForceWin,
      wasRandomLose: isRandomLoss,
      randomLossPercentage: randomLossPercent
    };
    
  } catch (error) {
    console.error('Error calculating profit/loss:', error);
    throw error;
  }
};

// Method to complete order with user balance update
orderSchema.methods.completeOrder = async function(exitPrice) {
  try {
   /// console.log('Completing order:', this._id);
    
    this.exitPrice = exitPrice;
    await this.calculateProfitLoss();
    this.status = 'completed';
    this.completedAt = new Date();
    this.isLive = false;
    
    // Save order first
    await this.save();
   // console.log('Order saved with completed status');
    
    // Update user balance and stats
    const user = await userModel.findById(this.user);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add payout to user balance
    user.wallet.usdt += this.actualPayout;
    
    // Update user stats
    user.totalTrades += 1;
    
    if (this.profit > 0) {
      user.totalProfit += this.profit;
      user.winningTrades += 1;
    } else if (this.profit < 0) {
      user.totalLoss += Math.abs(this.profit);
      user.losingTrades += 1;
    }
    
    // Update win rate
    if (user.totalTrades > 0) {
      user.winRate = (user.winningTrades / user.totalTrades) * 100;
    }
    
    await user.save();
   // console.log('User balance updated to:', user.wallet.usdt);
    
    // Create transaction record
    //await this.createTransaction();
    
    return {
      order: this,
      userBalance: user.wallet.usdt,
      profit: this.profit,
      actualPayout: this.actualPayout
    };
    
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
};

// Method to create transaction record
orderSchema.methods.createTransaction = async function() {
  try {
    console.log('Creating transaction for order:', this._id);
    
    // Use mongoose.model to get Transaction model
    const Transaction = mongoose.model('Transaction');
    
    const transaction = new Transaction({
      user: this.user,
      type: 'trade_payout',
      asset: 'USDT',
      amount: this.actualPayout,
      fee: 0,
      netAmount: this.actualPayout,
      order: this._id,
      status: 'completed',
      description: `Trade payout for ${this.symbol} ${this.direction} order`,
      metadata: {
        profit: this.profit,
        profitPercentage: this.profitPercentage,
        wasForceWin: this.wasForceWin,
        wasRandomLose: this.wasRandomLose,
        randomLossPercentage: this.randomLossPercentage,
        entryPrice: this.entryPrice,
        exitPrice: this.exitPrice,
        leverage: this.leverage,
        duration: this.duration
      }
    });
    
    await transaction.save();
    console.log('Transaction created:', transaction._id);
    return transaction;
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Method to cancel order
orderSchema.methods.cancelOrder = async function(userId, reason = '') {
  try {
    console.log('Cancelling order:', this._id);
    
    if (this.status !== 'pending' && this.status !== 'active') {
      throw new Error(`Cannot cancel order with status: ${this.status}`);
    }
    
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
    this.cancellationReason = reason;
    this.isLive = false;
    
    // Refund amount to user if order was active
    if (this.status === 'active') {
      const user = await userModel.findById(this.user);
      if (user) {
        user.wallet.usdt += this.amount;
        await user.save();
        console.log('Refunded amount to user:', this.amount);
      }
    }
    
    await this.save();
    
    return {
      order: this,
      message: 'Order cancelled successfully',
      refundAmount: this.status === 'active' ? this.amount : 0
    };
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Static method to get expired active orders
orderSchema.statics.getExpiredOrders = function() {
  return this.find({
    status: 'active',
    endTime: { $lte: new Date() }
  });
};

// Static method to process expired orders automatically
orderSchema.statics.processExpiredOrders = async function() {
  const expiredOrders = await this.getExpiredOrders();
  console.log('Processing', expiredOrders.length, 'expired orders');
  
  const results = [];
  
  for (const order of expiredOrders) {
    try {
      // Get current price (use entry price as fallback)
      const currentPrice = order.entryPrice;
      
      const result = await order.completeOrder(currentPrice);
      results.push({
        orderId: order._id,
        success: true,
        profit: order.profit,
        actualPayout: order.actualPayout,
        wasForceWin: order.wasForceWin,
        wasRandomLose: order.wasRandomLose
      });
      
    } catch (error) {
      console.error('Error processing expired order', order._id, ':', error.message);
      results.push({
        orderId: order._id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Static method to get active orders
orderSchema.statics.getActiveOrders = function(userId = null) {
  const query = { status: 'active', isLive: true };
  if (userId) {
    query.user = userId;
  }
  return this.find(query).sort({ endTime: 1 });
};

// Static method to get user orders
/*
orderSchema.statics.getUserOrders = function(userId, options = {}) {
  const {
    status = null,
    limit = 50,
    skip = 0,
    sortBy = '-createdAt'
  } = options;
  
  const query = { user: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort(sortBy)
    .limit(limit)
    .skip(skip)
    .populate('user', 'username email')
    .populate('cancelledBy', 'username');
};


// Static method to get user stats
orderSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalInvested: { $sum: '$amount' },
          totalProfit: { 
            $sum: { 
              $cond: [{ $gt: ['$profit', 0] }, '$profit', 0] 
            } 
          },
          totalLoss: { 
            $sum: { 
              $cond: [{ $lt: ['$profit', 0] }, { $abs: '$profit' }, 0] 
            } 
          },
          totalPayout: { $sum: '$actualPayout' },
          winningTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losingTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          breakEvenTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'break_even'] }, 1, 0] }
          },
          forceWinTrades: {
            $sum: { $cond: [{ $eq: ['$wasForceWin', true] }, 1, 0] }
          },
          randomLossTrades: {
            $sum: { $cond: [{ $eq: ['$wasRandomLose', true] }, 1, 0] }
          },
          totalFees: { $sum: '$fee' }
        }
      },
      {
        $project: {
          totalTrades: 1,
          totalInvested: 1,
          totalProfit: 1,
          totalLoss: 1,
          totalPayout: 1,
          totalFees: 1,
          winningTrades: 1,
          losingTrades: 1,
          breakEvenTrades: 1,
          forceWinTrades: 1,
          randomLossTrades: 1,
          winRate: {
            $cond: [
              { $gt: ['$totalTrades', 0] },
              { $multiply: [{ $divide: ['$winningTrades', '$totalTrades'] }, 100] },
              0
            ]
          },
          lossRate: {
            $cond: [
              { $gt: ['$totalTrades', 0] },
              { $multiply: [{ $divide: ['$losingTrades', '$totalTrades'] }, 100] },
              0
            ]
          },
          netProfit: { $subtract: ['$totalProfit', '$totalLoss'] },
          netReturn: {
            $cond: [
              { $gt: ['$totalInvested', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalProfit', '$totalLoss'] }, '$totalInvested'] }, 100] },
              0
            ]
          }
        }
      }
    ]);
    
    return stats[0] || {
      totalTrades: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalLoss: 0,
      totalPayout: 0,
      totalFees: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      forceWinTrades: 0,
      randomLossTrades: 0,
      winRate: 0,
      lossRate: 0,
      netProfit: 0,
      netReturn: 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalTrades: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalLoss: 0,
      totalPayout: 0,
      totalFees: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      forceWinTrades: 0,
      randomLossTrades: 0,
      winRate: 0,
      lossRate: 0,
      netProfit: 0,
      netReturn: 0
    };
  }
};
*/

// Add this after your Order model definition
/*
orderSchema.post('save', async function(doc) {
  if (doc.isModified('status') && ['completed', 'expired', 'cancelled'].includes(doc.status)) {
    const NotificationService = await import('../services/notificationService.js');
    await NotificationService.default.notifyTradeUpdate(doc);
  }
});
*/

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;