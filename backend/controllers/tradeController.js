// controllers/tradeController.js - UPDATED AND CORRECTED VERSION
import Order from "../models/Order.js";
import userModel from "../models/usermodel.js";
import Transaction from "../models/Transaction.js";
//import PriceFeedService from "../services/priceFeed.js";


export const tradeController = {
  // Place a new order with balance check - FIXED VERSION


  placeOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log('Place order request body:', req.body);

      const {
        symbol,
        symbolName,
        coinId,
        direction,
        amount,
        leverage = 1,
        duration,
        entryPrice
      } = req.body;
      ;


      // Validate inputs
      const requiredFields = ['symbol', 'direction', 'amount', 'duration'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Check if duration is valid
      const validDurations = [30, 50, 60, 120];
      if (!validDurations.includes(parseInt(duration))) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration. Allowed: 30, 50, 60, 120 seconds"
        });
      }

      // Check minimum amount
      const minAmount = 100;
      if (parseFloat(amount) < minAmount) {
        return res.json({
          success: false,
          message: `Minimum amount is $${minAmount}`
        });
      }

      // Check maximum amount based on duration
      const maxAmounts = {
        30: 5000,
        50: 10000,
        60: 20000,
        120: 50000
      };

      if (parseFloat(amount) > maxAmounts[duration]) {
        return res.json({
          success: false,
          message: `Maximum amount for ${duration}s is $${maxAmounts[duration]}`
        });
      }

      if (leverage > 1) {

        return res.json({
          success: false,
          message: "Leverage trading is currently disabled"
        });
      }

      // Check leverage limits
      /*
      if (leverage < 1 || leverage > 20) {
        return res.status(400).json({
          success: false,
          message: "Leverage must be between 1x and 20x"
        });
      }
        */

      // Get user with current balance
      const user = await userModel.findById(userId);

      if (!user) {
        return res.json({
          success: false,
          message: "User not found"
        });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.json({
          success: false,
          message: "Account is blocked"
        });
      }

      // Calculate required balance (amount + fee)
      const feeRate = 0.02; // 2% fee
      const fee = parseFloat(amount) * feeRate;
      const requiredBalance = parseFloat(amount) + fee;

      // if(user.wallet.usdt < ){

      //}
      // i use this when leaverage is enabled
      /* if (user.wallet.usdt < requiredBalance) {
         return res.status(400).json({
           success: false,
           message: "Insufficient balance",
           currentBalance: user.wallet.usdt,
           requiredBalance: requiredBalance
         });
       }
         */

      // Get current price if not provided
      let finalEntryPrice = entryPrice;
      if (!finalEntryPrice) {
        try {
          finalEntryPrice = await fetchRealTimePrice(coinId) || 0;
          if (!finalEntryPrice || finalEntryPrice <= 0) {
            throw new Error('Unable to fetch current price');
          }
        } catch (priceError) {
          return res.status(400).json({
            success: false,
            message: "Unable to get current market price. Please try again."
          });
        }
      }

      // Calculate duration rate for expected return
      const durationRates = {
        30: 12,
        50: 13,
        60: 14,
        120: 15
      };

      const rate = durationRates[duration] || 12;
      const expectedReturn = (parseFloat(amount) * (rate / 100)) * leverage;

      // Create order - FIXED: Let pre-save middleware handle calculations
      const orderData = {
        user: userId,
        symbol: symbol.toUpperCase(),
        symbolName: symbolName || symbol.replace('USDT', ''),
        coinId: coinId || symbol.toLowerCase(),
        direction: direction.toLowerCase(),
        amount: parseFloat(amount),
        leverage: parseInt(leverage),
        duration: parseInt(duration),
        entryPrice: parseFloat(finalEntryPrice),
        fee: fee,
        status: 'active'
      };

      const order = new Order(orderData);

      // Deduct from user balance (amount + fee)
      user.wallet.usdt -= requiredBalance;
      user.totalTrades += 1;
      await user.save();

      // Create investment transaction
      /*
      const transactionData = {
        user: userId,
        type: 'trade_investment',
        asset: 'USDT',
        amount: -parseFloat(amount), // Negative for investment
        fee: fee,
        netAmount: -requiredBalance,
        order: order._id,
        status: 'completed',
        description: `Trade investment for ${symbol} ${direction} position`
      };
      */

      // const transaction = new Transaction(transactionData);

      // Save order and transaction
      await Promise.all([order.save(), /*transaction.save()*/]);

      // Get the saved order with calculated fields
      const savedOrder = await Order.findById(order._id);

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        data: {
          order: {
            id: savedOrder._id,
            symbol: savedOrder.symbol,
            symbolName: savedOrder.symbolName,
            direction: savedOrder.direction,
            amount: savedOrder.amount,
            leverage: savedOrder.leverage,
            duration: savedOrder.duration,
            entryPrice: savedOrder.entryPrice,
            expectedReturn: savedOrder.expectedReturn,
            totalPayout: savedOrder.totalPayout,
            fee: savedOrder.fee,
            startTime: savedOrder.startTime,
            endTime: savedOrder.endTime,
            timeLeft: savedOrder.timeLeft,
            progress: savedOrder.progress,
            status: savedOrder.status
          },
          user: {
            balance: user.wallet.usdt,
            forceWin: user.forceWin,
            totalTrades: user.totalTrades
          },
          transaction: {
            id: '',
            netAmount: ''
          }
        }
      });

    } catch (error) {
      console.error("Place order error:", error);
      res.status(500).json({
        success: false,
        message: "Error placing order",
        error: error.message,
        details: error.stack
      });
    }
  },

  // Get active orders with live data - FIXED VERSION
  getActiveOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, coinId } = req.query;

      const filter = {
        user: userId,
        status: 'active'
      };

      if (coinId) {
        filter.coinId = coinId;
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(filter)
      ]);

      // Add live P&L calculation
      const ordersWithLiveData = await Promise.all(
        orders.map(async (order) => {
          try {
            // First, check if global instance exists
            const priceService = global.priceFeedService;
            const currentPrice = (priceService && priceService.getPrice)
              ? priceService.getPrice(order.coinId)
              : order.entryPrice;

            // If getPrice returns an object with usd property
            let actualPrice = currentPrice;
            if (currentPrice && typeof currentPrice === 'object' && currentPrice.usd) {
              actualPrice = currentPrice.usd;
            }


            //   const currentPrice = PriceFeedService.getPrice(order.coinId) || order.entryPrice;
            let livePnl = 0;
            let livePercentage = 0;

            // Get user to check forceWin status
            const user = await userModel.findById(order.user).select('forceWin');
            const userForceWin = user ? user.forceWin : false;

            if (userForceWin) {
              // If forceWin is true, show positive P&L
              const rate = order.expectedReturn / order.amount * 100;
              livePercentage = Math.abs(rate) || 0;
              livePnl = order.expectedReturn || 0;
            } else {
              // Normal calculation
              if (order.direction === 'buy') {
                const priceChange = ((currentPrice - order.entryPrice) / order.entryPrice) * 100;
                livePercentage = priceChange * order.leverage;
                livePnl = (order.amount * livePercentage) / 100;
              } else {
                const priceChange = ((order.entryPrice - currentPrice) / order.entryPrice) * 100;
                livePercentage = priceChange * order.leverage;
                livePnl = (order.amount * livePercentage) / 100;
              }
            }

            const timeLeft = order.endTime ? Math.max(0, Math.ceil((new Date(order.endTime) - new Date()) / 1000)) : 0;
            let progress = 0;

            if (order.startTime && order.endTime) {
              const totalDuration = new Date(order.endTime) - new Date(order.startTime);
              const elapsed = new Date() - new Date(order.startTime);
              progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            }

            return {
              ...order,
              currentPrice,
              livePnl: parseFloat(livePnl.toFixed(2)),
              livePercentage: parseFloat(livePercentage.toFixed(2)),
              timeLeft,
              progress: parseFloat(progress.toFixed(1)),
              userForceWin
            };
          } catch (error) {
            console.error(`Error processing order ${order._id}:`, error);
            return {
              ...order,
              currentPrice: order.entryPrice,
              livePnl: 0,
              livePercentage: 0,
              timeLeft: 0,
              progress: 100,
              userForceWin: false,
              error: 'Failed to calculate live data'
            };
          }
        })
      );

      res.json({
        success: true,
        data: {
          orders: ordersWithLiveData,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error("Get active orders error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching active orders",
        error: error.message
      });
    }
  },

  // Get completed orders - FIXED VERSION
  getCompletedOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        coinId,
        startDate,
        endDate,
        result
      } = req.query;

      const filter = {
        user: userId,
        status: 'completed'
      };

      if (coinId) {
        filter.coinId = coinId;
      }

      if (result && ['win', 'loss', 'break_even'].includes(result)) {
        filter.result = result;
      }

      if (startDate || endDate) {
        filter.completedAt = {};
        if (startDate) {
          filter.completedAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          filter.completedAt.$lte = endDateObj;
        }
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ completedAt: -1 })
          .skip((page - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(filter)
      ]);

      // Format dates and numbers
      const formattedOrders = orders.map(order => ({
        ...order,
        profit: order.profit ? parseFloat(order.profit.toFixed(2)) : 0,
        profitPercentage: order.profitPercentage ? parseFloat(order.profitPercentage.toFixed(2)) : 0,
        amount: order.amount ? parseFloat(order.amount.toFixed(2)) : 0,
        entryPrice: order.entryPrice ? parseFloat(order.entryPrice.toFixed(8)) : 0,
        exitPrice: order.exitPrice ? parseFloat(order.exitPrice.toFixed(8)) : 0,
        actualPayout: order.actualPayout ? parseFloat(order.actualPayout.toFixed(2)) : 0,
        formattedDate: order.completedAt ? new Date(order.completedAt).toLocaleString() : ''
      }));

      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error("Get completed orders error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching completed orders",
        error: error.message
      });
    }
  },

  // Get order by ID - FIXED VERSION
  getOrderById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const order = await Order.findOne({
        _id: orderId,
        user: userId
      }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Get related transaction
      /*
       const transaction = await Transaction.findOne({
         order: orderId,
         user: userId
       }).lean();
      */

      // Get current price for active orders
      let currentPrice = order.entryPrice;
      if (order.status === 'active') {

        // First, check if global instance exists
        const priceService = global.priceFeedService;
        currentPrice = (priceService && priceService.getPrice)
          ? priceService.getPrice(order.coinId)
          : order.entryPrice;

        // If getPrice returns an object with usd property
        let actualPrice = currentPrice;
        if (currentPrice && typeof currentPrice === 'object' && currentPrice.usd) {
          actualPrice = currentPrice.usd;
        }
        //currentPrice = PriceFeedService.getPrice(order.coinId) || order.entryPrice;
      }

      const formattedOrder = {
        ...order,
        currentPrice,
        profit: order.profit ? parseFloat(order.profit.toFixed(2)) : 0,
        profitPercentage: order.profitPercentage ? parseFloat(order.profitPercentage.toFixed(2)) : 0,
        amount: order.amount ? parseFloat(order.amount.toFixed(2)) : 0,
        entryPrice: order.entryPrice ? parseFloat(order.entryPrice.toFixed(8)) : 0,
        exitPrice: order.exitPrice ? parseFloat(order.exitPrice.toFixed(8)) : 0,
        actualPayout: order.actualPayout ? parseFloat(order.actualPayout.toFixed(2)) : 0,
        timeLeft: order.timeLeft || 0,
        progress: order.progress || 0,
        relatedTransaction: transaction
      };

      res.json({
        success: true,
        data: formattedOrder
      });

    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching order",
        error: error.message
      });
    }
  },

  // Cancel order with refund - FIXED VERSION
  cancelOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { reason } = req.body || {};

      // Find active order
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: 'active'
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Active order not found or already completed/cancelled"
        });
      }

      // Check if order can be cancelled (minimum 5 seconds remaining)
      const now = new Date();
      const timeRemaining = Math.ceil((order.endTime - now) / 1000);

      if (timeRemaining < 5) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel order with less than 5 seconds remaining",
          timeRemaining
        });
      }

      // Get user and refund balance (amount + fee)
      const user = await userModel.findById(userId);
      const refundAmount = order.amount + order.fee;
      user.wallet.usdt += refundAmount;

      // Update order status
      order.status = 'cancelled';
      order.cancelledAt = now;
      order.cancellationReason = reason || 'User cancelled';
      order.isLive = false;
      order.completedAt = now;

      // Create refund transaction
      /*
      const transaction = new Transaction({
        user: userId,
        type: 'refund',
        asset: 'USDT',
        amount: refundAmount,
        fee: 0,
        netAmount: refundAmount,
        order: order._id,
        status: 'completed',
        description: `Order cancellation refund for ${order.symbol} trade`,
        metadata: {
          originalFee: order.fee,
          cancellationTime: now
        }
      });
      */

      // Save all changes
      await Promise.all([
        user.save(),
        order.save(),
        // transaction.save()
      ]);

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: {
          orderId: order._id,
          refundAmount: refundAmount,
          newBalance: user.wallet.usdt,
          cancellationReason: order.cancellationReason,
          cancelledAt: order.cancelledAt
        }
      });

    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({
        success: false,
        message: "Error cancelling order",
        error: error.message
      });
    }
  },
  /*
  getTradingStats: async (req, res) => {
      try {
        const userId = req.user.id;
  
        const [orderStats, user, balance, activeOrdersCount] = await Promise.all([
          Order.getUserStats(userId),
          userModel.findById(userId).select('wallet totalTrades totalProfit totalLoss winningTrades losingTrades forceWin isBlocked kycStatus'),
          Transaction.getUserBalance(userId, 'USDT'),
          Order.countDocuments({ user: userId, status: 'active' })
        ]);
  
        // Calculate additional stats
        const netProfit = (orderStats.totalProfit || 0) - (orderStats.totalLoss || 0);
        const netReturn = orderStats.totalInvested > 0 ?
          (netProfit / orderStats.totalInvested) * 100 : 0;
  
        const avgProfitPerTrade = orderStats.totalTrades > 0 ?
          netProfit / orderStats.totalTrades : 0;
  
        const response = {
          success: true,
          data: {
            wallet: {
              usdt: user.wallet.usdt,
              btc: user.wallet.btc || 0,
              eth: user.wallet.eth || 0,
              availableBalance: balance.availableBalance || 0,
              loanUsdt: user.wallet.loanUsdt || 0
            },
            trading: {
              totalTrades: orderStats.totalTrades || 0,
              activeTrades: activeOrdersCount,
              completedTrades: (orderStats.totalTrades || 0) - activeOrdersCount,
              winningTrades: orderStats.winningTrades || 0,
              losingTrades: orderStats.losingTrades || 0,
              breakEvenTrades: orderStats.breakEvenTrades || 0,
              forceWinTrades: orderStats.forceWinTrades || 0,
              randomLossTrades: orderStats.randomLossTrades || 0,
              winRate: parseFloat((orderStats.winRate || 0).toFixed(2)),
              lossRate: parseFloat((orderStats.lossRate || 0).toFixed(2)),
              successRate: parseFloat((orderStats.successRate || 0).toFixed(2)),
              totalProfit: parseFloat((orderStats.totalProfit || 0).toFixed(2)),
              totalLoss: parseFloat((orderStats.totalLoss || 0).toFixed(2)),
              netProfit: parseFloat(netProfit.toFixed(2)),
              totalInvested: parseFloat((orderStats.totalInvested || 0).toFixed(2)),
              totalPayout: parseFloat((orderStats.totalPayout || 0).toFixed(2)),
              totalFees: parseFloat((orderStats.totalFees || 0).toFixed(2)),
              averageProfit: parseFloat((orderStats.averageProfit || 0).toFixed(2)),
              averageProfitPercentage: parseFloat((orderStats.averageProfitPercentage || 0).toFixed(2)),
              netReturn: parseFloat(netReturn.toFixed(2)),
              avgProfitPerTrade: parseFloat(avgProfitPerTrade.toFixed(2)),
              maxProfit: parseFloat((orderStats.maxProfit || 0).toFixed(2)),
              minProfit: parseFloat((orderStats.minProfit || 0).toFixed(2))
            },
            account: {
              forceWin: user.forceWin || false,
              isBlocked: user.isBlocked || false,
              kycStatus: user.kycStatus || 'pending'
            }
          }
        };
  
        res.json(response);
  
      } catch (error) {
        console.error("Get trading stats error:", error);
        res.status(500).json({
          success: false,
          message: "Error fetching trading statistics",
          error: error.message
        });
      }
    },
  */
  // Get user trading statistics - FIXED VERSION


  // Admin: Toggle force win for user
  toggleForceWin: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }

      const { userId } = req.params;
      const { forceWin } = req.body;

      if (typeof forceWin !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "forceWin must be a boolean value"
        });
      }

      const user = await userModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      user.forceWin = forceWin;
      await user.save();

      res.json({
        success: true,
        message: `Force win ${forceWin ? 'enabled' : 'disabled'} for user`,
        data: {
          userId: user._id,
          email: user.email,
          username: user.username,
          forceWin: user.forceWin,
          updatedAt: new Date()
        }
      });

    } catch (error) {
      console.error("Toggle force win error:", error);
      res.status(500).json({
        success: false,
        message: "Error toggling force win",
        error: error.message
      });
    }
  },

  // Admin: Process expired orders manually
  processExpiredOrders: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }

      const results = await Order.processExpiredOrders();

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.json({
        success: true,
        message: `Processed ${successful.length} orders successfully, ${failed.length} failed`,
        data: {
          processed: successful,
          failed: failed,
          summary: {
            totalOrders: results.length,
            successful: successful.length,
            failed: failed.length,
            totalProfit: successful.reduce((sum, order) => sum + (order.profit || 0), 0),
            forceWinOrders: successful.filter(o => o.wasForceWin).length,
            randomLossOrders: successful.filter(o => o.wasRandomLose).length
          }
        }
      });

    } catch (error) {
      console.error("Process expired orders error:", error);
      res.status(500).json({
        success: false,
        message: "Error processing expired orders",
        error: error.message
      });
    }
  },

  // User: Get current balance
  getBalance: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('Fetching balance for user:', userId);


      const [user, balance] = await Promise.all([
        userModel.findById(userId).select('wallet forceWin totalTrades totalProfit totalLoss'),
        // Transaction.getUserBalance(userId, 'USDT')
      ]);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        data: {
          wallet: {
            usdt: user.wallet.usdt,
            btc: user.wallet.btc || 0,
            eth: user.wallet.eth || 0,
            loanUsdt: user.wallet.loanUsdt || 0
          },

          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error("Get balance error:", error);
      res.status(400).json({
        success: false,
        message: "Error fetching balance",
        error: error.message
      });
    }
  },

  // Get order history with filters - NEW METHOD
  getOrderHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 50,
        status,
        result,
        symbol,
        startDate,
        endDate,
        sortBy = '-createdAt'
      } = req.query;

      const filter = { user: userId };

      if (status && ['active', 'completed', 'cancelled', 'expired'].includes(status)) {
        filter.status = status;
      }

      if (result && ['win', 'loss', 'break_even'].includes(result)) {
        filter.result = result;
      }

      if (symbol) {
        filter.symbol = { $regex: symbol, $options: 'i' };
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = endDateObj;
        }
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort(sortBy)
          .skip((page - 1) * parseInt(limit))
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(filter)
      ]);

      const formattedOrders = orders.map(order => ({
        ...order,
        profit: order.profit ? parseFloat(order.profit.toFixed(2)) : 0,
        profitPercentage: order.profitPercentage ? parseFloat(order.profitPercentage.toFixed(2)) : 0,
        amount: order.amount ? parseFloat(order.amount.toFixed(2)) : 0,
        formattedDate: order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
        durationLabel: order.duration ? `${order.duration}s` : ''
      }));

      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          filters: {
            status,
            result,
            symbol,
            startDate,
            endDate
          }
        }
      });

    } catch (error) {
      console.error("Get order history error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching order history",
        error: error.message
      });
    }
  }
};