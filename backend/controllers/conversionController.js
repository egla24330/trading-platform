// controllers/conversionController.js
import mongoose from 'mongoose';
import userModel from '../models/usermodel.js';
import Transaction from '../models/Transaction.js';
import axios from 'axios';
//import { sendEmailNotification } from '../services/notificationService.js';

// Fetch real-time prices from Binance
const fetchRealTimePrice = async (symbol) => {
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
     
    return parseFloat(response.data.price);
  } catch (error) {
    // Fallback prices if API fails
   // console.error(`Error fetching ${symbol} price:`, error.message);
    return symbol = null
  }
};

// Get 24h price change
const fetchPriceChange = async (symbol) => {
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`);
    return parseFloat(response.data.priceChangePercent);
  } catch (error) {
    return symbol = null
  }
};

// Get current market prices
export const getMarketPrices = async (req, res) => {
  try {
    const [btcPrice, ethPrice, btcChange, ethChange] = await Promise.all([
      fetchRealTimePrice('BTC'),
      fetchRealTimePrice('ETH'),
      fetchPriceChange('BTC'),
      fetchPriceChange('ETH')
    ]);

    

    res.json({
      success: true,
      data: {
        BTC: {
          price: btcPrice,
          change24h: btcChange,
         // name: "Bitcoin",
        //  symbol: "BTC",
         // minAmount: 0.0001,      // Minimum 0.0001 BTC
         // maxAmount: 10,          // Maximum 10 BTC
         // network: "bitcoin"
        },
        ETH: {
          price: ethPrice,
          change24h: ethChange,
         // name: "Ethereum",
       //   symbol: "ETH",
        //  minAmount: 0.001,       // Minimum 0.001 ETH
       //   maxAmount: 50,          // Maximum 50 ETH
      //    network: "ethereum"
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.json({
      success: false,
      message: 'Failed to fetch market prices. Please try again.'
    });
  }
};

// Calculate conversion preview
export const calculateConversion = async (req, res) => {
  try {
    const { fromCurrency, amount } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!fromCurrency || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide currency and amount'
      });
    }

    const currency = fromCurrency.toUpperCase();
    if (!['BTC', 'ETH'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Only BTC and ETH are supported.'
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount greater than 0'
      });
    }

    // Get user and check eligibility
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check account status
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account is temporarily blocked. Please contact support.'
      });
    }

    // Check KYC status
    if (user.kycStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        code: 'KYC_REQUIRED',
        message: 'KYC verification is required for cryptocurrency conversions.',
        kycStatus: user.kycStatus
      });
    }

    // Get current price
    const currentPrice = await fetchRealTimePrice(currency);
    const walletField = currency.toLowerCase();
    const userBalance = user.wallet[walletField] || 0;

    // Validate amount against balance
    if (userBalance < numericAmount) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        message: `Insufficient ${currency} balance. Available: ${userBalance.toFixed(8)} ${currency}`,
        availableBalance: userBalance,
        requiredAmount: numericAmount
      });
    }

    // Check minimum and maximum limits
    const limits = {
      BTC: { min: 0.0001, max: 10 },
      ETH: { min: 0.001, max: 50 }
    };

    const { min, max } = limits[currency];
    
    if (numericAmount < min) {
      return res.status(400).json({
        success: false,
        code: 'BELOW_MINIMUM',
        message: `Minimum conversion amount is ${min} ${currency}`,
        minimum: min
      });
    }

    if (numericAmount > max) {
      return res.status(400).json({
        success: false,
        code: 'EXCEEDS_MAXIMUM',
        message: `Maximum conversion amount is ${max} ${currency}`,
        maximum: max
      });
    }

    // Calculate conversion details
    const estimatedUSDT = numericAmount * currentPrice;
    const feePercentage = 0.001; // 0.1% conversion fee
    const feeAmount = estimatedUSDT * feePercentage;
    const finalAmount = estimatedUSDT - feeAmount;

    res.status(200).json({
      success: true,
      data: {
        preview: {
          fromCurrency: currency,
          fromAmount: numericAmount,
          toCurrency: 'USDT',
          toAmount: finalAmount,
          conversionRate: currentPrice,
          feePercentage: feePercentage * 100,
          feeAmount: feeAmount,
          estimatedTotal: estimatedUSDT
        },
        userInfo: {
          availableBalance: userBalance,
          kycVerified: user.kycStatus === 'approved',
          accountActive: !user.isBlocked
        },
        limits: {
          minimum: min,
          maximum: max,
          dailyLimit: max * 5 // Example: 5x max per day
        },
        timestamp: new Date(),
        expiresIn: 30000 // Price valid for 30 seconds
      }
    });

  } catch (error) {
    console.error('Calculate conversion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate conversion. Please try again.'
    });
  }
};

// Execute conversion
export const executeConversion = async (req, res) => {
 // const session = await mongoose.startSession();
  //session.startTransaction();

  try {
    const { fromCurrency, amount } = req.body;
    const userId = req.user._id;
    console.log(userId)
    console.log(req.body)
  

    // Input validation
    if (!fromCurrency || !amount) {
     //// await session.abortTransaction();
     // session.endSession();
      return res.json({
        success: false,
        message: 'Please provide currency and amount'
      });
    }
/*
Optional confirmation flag for large amounts
 
   if (parseFloat(amount) > 1 && confirm !== true) {
      return res.status(400).json({
        success: false,
        code: 'CONFIRMATION_REQUIRED',
        message: 'Confirmation required for large amounts',
        requiresConfirmation: true
      });
    }

*/ // 
    const currency = fromCurrency.toUpperCase();
    const numericAmount = parseFloat(amount);

    if (!['BTC', 'ETH'].includes(currency) || isNaN(numericAmount) || numericAmount <= 0) {
     // await session.abortTransaction();
     // session.endSession();
      return res.json({
        success: false,
        message: 'Invalid request parameters'
      });
    }

    // Get user with session for transaction
    const user = await userModel.findById(userId)
    if (!user) {
     // await session.abortTransaction();
      //session.endSession();
      return res.json({
        success: false,
        message: 'User not found',
        status: 404
      });
    }

    // Verify account status
    if (user.isBlocked) {
    //  await session.abortTransaction();
    //  session.endSession();
      return res.json({
        success: false,
        message: 'Account is blocked. Please contact support.',
        status: 403
      });
    }

    // Verify KYC
    if (user.kycStatus !== 'approved') {
     // await session.abortTransaction();
      ///session.endSession();
      return res.json({
        success: false,
        message: 'KYC verification required for conversions',
        status: 403
      });
    }

    // Get current price within transaction
    const currentPrice = await fetchRealTimePrice(currency);
    const walletField = currency.toLowerCase();
    const userBalance = user.wallet[walletField] || 0;

    // Final balance check (double-check)
    if (userBalance < numericAmount) {
      //await session.abortTransaction();
      //session.endSession();
      return res.json({
        success: false,
        message: `Insufficient ${currency} balance`,
        status: 400
      });
    }

    // Calculate conversion
    const estimatedUSDT = numericAmount * currentPrice;
    const feePercentage = 0.001;
    const feeAmount = estimatedUSDT * feePercentage;
    const finalAmount = estimatedUSDT - feeAmount;

    // Update user wallet
    user.wallet[walletField] = parseFloat((userBalance - numericAmount).toFixed(8));
    user.wallet.usdt = parseFloat(((user.wallet.usdt || 0) + finalAmount).toFixed(2));

    // Create transaction record
   /*
    const transaction = new Transaction({
      userId: user._id,
      type: 'conversion',
      subtype: `${currency}_to_USDT`,
      fromCurrency: currency,
      toCurrency: 'USDT',
      fromAmount: numericAmount,
      toAmount: finalAmount,
      rate: currentPrice,
      fee: feeAmount,
      feeCurrency: 'USDT',
      status: 'completed',
      description: `Converted ${numericAmount} ${currency} to USDT`,
      metadata: {
        feePercentage: feePercentage * 100,
        network: currency === 'BTC' ? 'bitcoin' : 'ethereum'
      }
    });
   */

    // Save user and transaction
    await user.save();
    ///await transaction.save({ session });

    // Commit transaction
    //await session.commitTransaction();
    //session.endSession();

    // Send notifications (non-blocking)
/*
    sendConversionNotifications(user, {
      fromCurrency: currency,
      fromAmount: numericAmount,
      toAmount: finalAmount,
      fee: feeAmount,
      rate: currentPrice,
      transactionId: transaction._id
    }).catch(console.error);*/

    // Return success response
    res.json({
      success: true,
      message: 'Conversion completed successfully!',
      data: {
      //  conversionId: transaction._id,
        details: {
          from: {
            currency: currency,
            amount: numericAmount,
            previousBalance: userBalance,
            newBalance: user.wallet[walletField]
          },
          to: {
            currency: 'USDT',
            amount: finalAmount,
            previousBalance: (user.wallet.usdt || 0) - finalAmount,
            newBalance: user.wallet.usdt
          },
          rate: currentPrice,
          fee: feeAmount,
          netAmount: finalAmount
        },
        timestamp: new Date()
       // transactionId: transaction._id
      }
    });

  } catch (error) {
    //await session.abortTransaction();
    //session.endSession();
    
    console.error('Execute conversion error:', error);
    
    res.status.json({
      success: false,
      message: error.message.includes('network')
        ? 'Network error. Please check your connection and try again.'
        : 'Conversion failed. Please try again.'
    });
  }
};

// Get conversion history
export const getConversionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;

    const query = { userId, type: 'conversion' };
    if (type) {
      query.subtype = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v -metadata');

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get conversion history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversion history'
    });
  }
};

// Helper function to send notifications
const sendConversionNotifications = async (user, conversionData) => {
  try {
    // Email notification
    /*
await sendEmailNotification({
      to: user.email,
      subject: 'Conversion Completed Successfully',
      template: 'conversion-success',
      data: {
        userName: user.name,
        fromCurrency: conversionData.fromCurrency,
        fromAmount: conversionData.fromAmount,
        toAmount: conversionData.toAmount,
        fee: conversionData.fee,
        rate: conversionData.rate,
        transactionId: conversionData.transactionId,
        timestamp: new Date().toLocaleString(),
        newBalance: {
          crypto: user.wallet[conversionData.fromCurrency.toLowerCase()],
          usdt: user.wallet.usdt
        }
      }
    });
    
    
    */
    // Log for admin monitoring
    console.log(`[CONVERSION] User ${user.email} converted ${conversionData.fromAmount} ${conversionData.fromCurrency} to ${conversionData.toAmount} USDT`);

    // Here you can add:
    // - Telegram bot notification
    // - In-app notification
    // - Webhook to admin dashboard
    // - SMS notification

  } catch (error) {
    console.error('Failed to send notifications:', error);
    // Don't throw error - notifications shouldn't block conversion
  }
};

export const getUserBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await userModel.findById(userId).select('wallet');
    
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
        status: 404
      });
    }

    res.json({
      success: true,
      data: {
        wallet: user.wallet,
       
      }
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    res.json({
      success: false,
      message: 'Failed to fetch balance',
      status: 500
    });
  }
};

/*
 totals: {
          btc: user.wallet.btc || 0,
          eth: user.wallet.eth || 0,
          usdt: user.wallet.usdt || 0,
          btcValue: (user.wallet.btc || 0) * currentPrices.BTC,
          ethValue: (user.wallet.eth || 0) * currentPrices.ETH,
          totalValue: (user.wallet.btc || 0) * currentPrices.BTC + 
                      (user.wallet.eth || 0) * currentPrices.ETH + 
                      (user.wallet.usdt || 0)


        }*/
