import Loan from "../models/Loan.js";
import mongoose from "mongoose";
import userModel from "../models/usermodel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import NotificationService from "../services/notificationService.js";

///import { sendPaymentNotification } from "../utils/emailService.js"; // Optional: For email notifications

// @desc    Get all loans with filters
// @route   GET /api/loans
// @access  Private/Admin
export const getLoans = async (req, res) => {

  console.log('get loan re hit server')
  try {
    const {
      status,
      type,
      search,
      startDate,
      endDate,
      userId,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== "All Status") {
      query.status = status.toLowerCase();
    }

    // Search filter
    if (search) {
      query.$or = [
        { loanId: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } }
      ];
    }

    // User filter
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.userId = userId;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.applicationDate = {};
      if (startDate) {
        query.applicationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.applicationDate.$lte = new Date(endDate);
      }
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log('test')

    // Execute query with pagination
    const loans = await Loan.find(query)
      // .populate("userId", "email firstName lastName")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(loans)


    // Get total count for pagination
    const total = await Loan.countDocuments(query);

    res.json({
      success: true,
      count: loans.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      loans
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching loans",
      error: error.message
    });
  }
};

// @desc    Get loan by ID
// @route   GET /api/loans/:id
// @access  Private
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate("userId", "email firstName lastName phone")
      .populate("reviewedBy", "email firstName lastName");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    res.json({
      success: true,
      loan
    });
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching loan",
      error: error.message
    });
  }
};

// @desc    Create new loan
// @route   POST /api/loans
// @access  Private
export const createLoan = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      packageId,
      packageTitle,
      amountRequested,
      interestRate,
      repaymentPeriod,
      currency = "USDT"
    } = req.body;

    if (!userId || !packageId || !amountRequested) {
      return res.json({
        success: false,
        message: "Please provide userId, packageId, and amountRequested"
      });
    }

    const user = await userModel.findById(userId);

    // BLOCK second loan
    if (user.loanStatus !== "no_active_loan") {
      return res.json({
        success: false,
        message: "You already have an unpaid loan. Please settle your previous balance before requesting a new one."
      });
    }

    // Loan calculations
    const interestAmount = amountRequested * (interestRate / 100);
    const totalAmountDue = amountRequested + interestAmount;

    const loanData = {
      userId,
      packageId,
      packageTitle,
      amountRequested,
      interestRate,
      repaymentPeriod,
      currency,
      totalAmountDue,
      remainingBalance: totalAmountDue,
      status: "pending"
    };

    const loan = await Loan.create(loanData);

    // UPDATE USER LOAN STATUS
    user.loanStatus = "pending";
    await user.save();
    await NotificationService.createLoanNotification(userId, loan, "pending");

    res.json({
      success: true,
      message: "Loan application submitted successfully",
      loan
    });

  } catch (error) {
    console.error("Error creating loan:", error);
    res.json({
      success: false,
      message: "Error creating loan",
      error: error.message
    });
  }
};


// @desc    Approve loan
// @route   PUT /api/loans/:id/approve
// @access  Private/Admin
export const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountApproved, interestRate, repaymentPeriod, disbursementDate } = req.body;
    const adminId = req.user.id; // Assuming user is authenticated

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.json({
        success: false,
        message: "Loan not found"
      });
    }

    if (loan.status !== "pending") {
      return res.json({
        success: false,
        message: `Loan cannot be approved. Current status: ${loan.status}`
      });
    }

    const user = await userModel.findById(loan.userId);

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(repaymentPeriod));

    // Update loan with approval details
    loan.amountApproved = amountApproved || loan.amountRequested;
    loan.interestRate = interestRate || loan.interestRate;
    loan.repaymentPeriod = repaymentPeriod || loan.repaymentPeriod;
    loan.status = "approved";
    loan.approvalDate = new Date();
    loan.dueDate = dueDate;
    loan.reviewedBy = adminId;

    // Recalculate total amount due with new interest rate
    const interestAmount = loan.amountApproved * (loan.interestRate / 100);
    loan.totalAmountDue = loan.amountApproved + interestAmount;
    loan.remainingBalance = loan.totalAmountDue;

    if (disbursementDate) {
      loan.disbursementDate = new Date(disbursementDate);
      loan.status = "active";
    }

    await loan.save();
    user.loanStatus = "active";
    user.loanUsdt = amountApproved
    await user.save();
    await NotificationService.createLoanNotification(loan.userId, loan, "approved");

    res.json({
      success: true,
      message: "Loan approved successfully",
      loan
    });
  } catch (error) {
    console.error("Error approving loan:", error);
    res.status(500).json({
      success: false,
      message: "Error approving loan",
      error: error.message
    });
  }
};

// @desc    Reject loan
// @route   PUT /api/loans/:id/reject
// @access  Private/Admin
export const rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectReason } = req.body;
    const adminId = req.user.id; // Assuming user is authenticated

    if (!rejectReason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason"
      });
    }

    const loan = await Loan.findById(id);
    const user = await userModel.findById(loan.userId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    if (loan.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Loan cannot be rejected. Current status: ${loan.status}`
      });
    }

    loan.status = "rejected";
    loan.rejectReason = rejectReason;
    loan.reviewedBy = adminId;

    await loan.save();
    user.loanStatus = "no_active_loan";
    user.loanUsdt = ''
    await user.save();

    await NotificationService.createLoanNotification(loan.userId, loan, "rejected");

    res.json({
      success: true,
      message: "Loan rejected successfully",
      loan
    });
  } catch (error) {
    console.error("Error rejecting loan:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting loan",
      error: error.message
    });
  }
};

// @desc    Disburse loan (move from approved to active)
// @route   PUT /api/loans/:id/disburse
// @access  Private/Admin
export const disburseLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, disbursementNotes } = req.body;

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    if (loan.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Loan cannot be disbursed. Current status: ${loan.status}`
      });
    }

    loan.status = "active";
    loan.disbursementDate = new Date();

    // Create initial payment record for disbursement
    loan.payments.push({
      amount: loan.amountApproved,
      proofImage: "", // Empty for disbursement
      transactionId,
      paymentMethod: "crypto",
      status: "approved",
      date: new Date()
    });

    await loan.save();

    res.json({
      success: true,
      message: "Loan disbursed successfully",
      loan
    });
  } catch (error) {
    console.error("Error disbursing loan:", error);
    res.status(500).json({
      success: false,
      message: "Error disbursing loan",
      error: error.message
    });
  }
};

// @desc    Record payment
// @route   POST /api/loans/:id/payments
// @access  Private
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, proofImage, transactionId, paymentMethod = "crypto" } = req.body;

    if (!amount || !proofImage) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount and proof image"
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    if (loan.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Payments cannot be recorded for loans with status: ${loan.status}`
      });
    }

    // Create payment record
    loan.payments.push({
      amount,
      proofImage,
      transactionId,
      paymentMethod,
      status: "pending"
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment: loan.payments[loan.payments.length - 1]
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message
    });
  }
};

// @desc    Review payment
// @route   PUT /api/loans/:loanId/payments/:paymentId
// @access  Private/Admin



// @desc    Get dashboard statistics
// @route   GET /api/loans/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await Loan.getDashboardStats();

    // Additional calculations
    const activeLoans = await Loan.find({ status: "active" });
    const overdueLoans = activeLoans.filter(loan => loan.isOverdue);

    stats.activeLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    stats.overdueCount = overdueLoans.length;
    stats.overdueAmount = overdueLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
};

// @desc    Get loans by user
// @route   GET /api/loans/user/:userId
// @access  Private
export const getUserLoans = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query = { userId };

    if (status && status !== "all") {
      query.status = status;
    }

    const loans = await Loan.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: loans.length,
      loans
    });
  } catch (error) {
    console.error("Error fetching user loans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user loans",
      error: error.message
    });
  }
};

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private/Admin
export const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.userId;
    delete updates.loanId;
    delete updates.createdAt;

    const loan = await Loan.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    res.json({
      success: true,
      message: "Loan updated successfully",
      loan
    });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Error updating loan",
      error: error.message
    });
  }
};

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Private/Admin
export const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByIdAndDelete(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    res.json({
      success: true,
      message: "Loan deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting loan",
      error: error.message
    });
  }
};


// @desc    Submit loan payment (updated to handle both external and deposit payments)
// @route   POST /api/loans/payments/submit
// @access  Private


export const submitLoanPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      loanId,
      currency = 'USDT',
      network,
      amount,
      txHash,
      toAddress,
      fromAddress,
      note,
      loanReference,
      paymentMethod = "external_wallet"
    } = req.body;





    // Validate required fields
    if (!loanId || !amount || !currency) {
      return res.json({
        success: false,
        message: "Please provide loanId, amount, and currency"
      });
    }

    // Find the loan
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.json({
        success: false,
        message: "Loan not found"
      });
    }

    // Verify loan belongs to user
    if (loan.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay this loan"
      });
    }



    // Validate loan status
    if (loan.status !== "approved") {
      return res.json({
        success: false,
        message: `Cannot make payment for loan with status: ${loan.status}`
      });
    }

    // Validate payment amount
    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.json({
        success: false,
        message: "Payment amount must be greater than 0"
      });
    }

    // Check minimum payment 
    /*
     const minPayment = loan.dueAmount || loan.totalAmountDue * 0.1; // 10% minimum or due amount
     if (paymentAmount < minPayment) {
       return res.json({
         success: false,
         message: `Minimum payment amount is ${minPayment} ${loan.currency}`
       });
     }
    */





    // Check if payment exceeds remaining balance
    if (paymentAmount > loan.remainingBalance) {
      return res.json({
        success: false,
        message: `Payment amount cannot exceed remaining balance of ${loan.remainingBalance} ${loan.currency}`
      });
    }

    let paymentRecord;
    let user = null;

    if (paymentMethod === "external_wallet") {
      // External wallet payment validation
      if (!txHash) {
        return res.json({
          success: false,
          message: "Transaction hash is required for external wallet payments"
        });
      }

      // Check if file was uploaded
      let proofImage = null;
      if (req.file) {
        try {
          const result = await uploadToCloudinary(req.file.buffer, {
            public_id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            folder: `loan/users/${userId}`,
            tags: ['loan', `user_${userId}`, currency.toLowerCase()]
          });

          proofImage = {
            url: result.secure_url,
            publicId: result.public_id,
            filename: req.file.originalname
          };
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return res.json({
            success: false,
            message: 'Failed to upload proof image'
          });
        }
      }
      // Create payment record for external wallet
      paymentRecord = {
        amount: paymentAmount,
        currency,
        network,
        txHash,
        fromAddress: fromAddress || "Unknown",
        toAddress,
        proofImage,
        paymentMethod: "external_wallet",
        status: "pending",
        metadata: {
          note,
          loanReference
        }
      };
    } else if (paymentMethod === "deposit_account") {
      // Deposit account payment logic
      const user = await userModel.findById(userId);

      if (!user) {
        return res.json({
          success: false,
          message: "User not found"
        });
      }

      // Get wallet balance
      const walletBalance = user.wallet ? (user.wallet['usdt'] || 0) : 0;

      // Check if user has sufficient balance
      if (walletBalance < paymentAmount) {
        return res.json({
          success: false,
          message: `Insufficient ${currency} balance. Available: ${walletBalance}`
        });
      }

      // Handle currency conversion if needed
      let finalAmount = paymentAmount;
      let conversionRate = 1;
      let conversionNote = "";


      // Currency conversion logic (if needed)
      //if (currency !== loan.currency) {
      // const conversion = await convertCurrency(currency, loan.currency, paymentAmount);
      // finalAmount = conversion.convertedAmount;
      // conversionRate = conversion.rate;
      // conversionNote = `Converted from ${paymentAmount} ${currency} at rate ${conversionRate}`;
      //}


      // Deduct from user's wallet
      user.wallet['usdt'] -= paymentAmount;
      await user.save();

      // Update loan amounts
      loan.amountPaid += finalAmount;
      loan.remainingBalance = Math.max(0, loan.totalAmountDue - loan.amountPaid);

      // Create payment record for deposit payment
      paymentRecord = {
        amount: finalAmount,
        paymentMethod: "deposit_account",
        currency: 'USDT',
        status: "completed", // Auto-complete since it's from deposit
        depositTransactionId: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          note,
          conversionRate,
          conversionNote
        }
      };

      // Check if loan is fully paid
      if (loan.remainingBalance <= 0) {
        loan.status = "completed";
        loan.completionDate = new Date();

        // Update user loan status
        if (user) {
          user.loanStatus = "no_active_loan";
          await user.save();
        }
      }

      // Send notification to user (implement this function)

      //  sendPaymentNotification(user, {
      //    type: "deposit_payment",
      //    amount: finalAmount,
      //   currency: loan.currency,
      //  loanReference: loan.loanId,
      //  remainingBalance: loan.remainingBalance
      // });

    } else {
      return res.json({
        success: false,
        message: "Invalid payment method"
      });
    }

    // Add payment to loan
    loan.payments.push(paymentRecord);
    loan.updatedAt = new Date();
    await loan.save();
    
    res.status(201).json({
      success: true,
      message: paymentMethod === "deposit_account"
        ? "Payment processed successfully from your deposit account"
        : "Payment submitted successfully. Waiting for verification",
      data: {
        payment: paymentRecord,
        loan: {
          id: loan._id,
          remainingBalance: loan.remainingBalance,
          amountPaid: loan.amountPaid,
          status: loan.status
        }
      }
    });
  } catch (error) {
    console.error("Error submitting loan payment:", error);
    res.json({
      success: false,
      message: "Error submitting payment",
      error: error.message
    });
  }
};


// @desc    Convert currency for deposit payments
// @route   POST /api/loans/wallet/convert
// @access  Private
export const convertCurrency = async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;

    if (!fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please provide fromCurrency, toCurrency, and amount"
      });
    }

    // Get conversion rates from external API or database
    const conversionRate = await getConversionRate(fromCurrency, toCurrency);

    if (!conversionRate) {
      return res.status(400).json({
        success: false,
        message: `Unable to convert ${fromCurrency} to ${toCurrency}`
      });
    }

    const convertedAmount = amount * conversionRate;

    res.json({
      success: true,
      data: {
        fromCurrency,
        toCurrency,
        originalAmount: amount,
        convertedAmount,
        conversionRate,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({
      success: false,
      message: "Error converting currency",
      error: error.message
    });
  }
};

// @desc    Get active loans for user
// @route   GET /api/loans/active
// @access  Private
export const getActiveLoans = async (req, res) => {
  try {
    const userId = req.userId;
    const loans = await Loan.find({
      userId,
      status: { $in: ["active", "approved"] }
    }).select("loanId amountRequested amountApproved currency remainingBalance status dueDate");

    res.json({
      success: true,
      data: loans,
      length: loans.length
    });
  } catch (error) {
    console.error("Error fetching active loans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active loans",
      error: error.message
    });
  }
};

// @desc    Get loan details by ID
// @route   GET /api/loans/:id/details
// @access  Private
export const getLoanDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const loan = await Loan.findOne({
      _id: id,
      userId
    }).select("loanId amountRequested amountApproved currency remainingBalance totalAmountDue amountPaid status dueDate nextPayment dueAmount");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    // Calculate due amount if not already set
    if (!loan.dueAmount) {
      // Calculate next payment (simplified)
      const daysRemaining = Math.ceil((loan.dueDate - new Date()) / (1000 * 60 * 60 * 24));
      const dailyPayment = loan.totalAmountDue / loan.repaymentPeriod;
      loan.dueAmount = Math.min(dailyPayment * Math.max(daysRemaining, 1), loan.remainingBalance);
    }

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error("Error fetching loan details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching loan details",
      error: error.message
    });
  }
};

// Helper function to get conversion rates
async function getConversionRate(fromCurrency, toCurrency) {
  // This is a simplified implementation
  // In production, use an external API like CoinGecko, CoinMarketCap, or Binance

  const conversionRates = {
    "USDT_USDT": 1,
    "USDT_BTC": 0.000025, // Example rate
    "USDT_ETH": 0.0004,   // Example rate
    "BTC_USDT": 40000,    // Example rate
    "BTC_ETH": 16,        // Example rate
    "ETH_USDT": 2500,     // Example rate
    "ETH_BTC": 0.0625     // Example rate
  };

  const key = `${fromCurrency}_${toCurrency}`;
  return conversionRates[key] || null;
}


///

// Add to loanController.js

// @desc    Get all payments for admin review
// @route   GET /api/admin/payments
// @access  Private/Admin
//////////////////////////////////////////////////////////////////////
/*
export const getPaymentsForReview = async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Use aggregation to get payments from all loans
    const aggregation = [
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          loanId: "$_id",
          loanReference: "$loanId",
          amount: "$payments.amount",
          currency: "$payments.currency",
          paymentMethod: "$payments.paymentMethod",
          network: "$payments.network",
          txHash: "$payments.txHash",
          fromAddress: "$payments.fromAddress",
          toAddress: "$payments.toAddress",
          proofImage: "$payments.proofImage",
          status: "$payments.status",
          reviewedBy: "$payments.reviewedBy",
          reviewNote: "$payments.reviewNote",
          date: "$payments.date",
          metadata: "$payments.metadata",
          createdAt: "$payments._id.getTimestamp()",
          user: {
            _id: "$user._id",
            name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
            email: "$user.email"
          },
          loan: {
            totalAmountDue: "$totalAmountDue",
            remainingBalance: "$remainingBalance"
          }
        }
      },
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const payments = await Loan.aggregate(aggregation);

    // Get total count
    const countAggregation = [
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: query },
      { $count: "total" }
    ];

    const countResult = await Loan.aggregate(countAggregation);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: payments,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Error fetching payments for review:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message
    });
  }
};

*/

/////////////////////////////////////////////////////////////////////

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
/////////////////////////////////////////////////////////////////////
/*
export const getPaymentStats = async (req, res) => {
  try {
    const stats = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: "$payments.amount" },
          pending: {
            $sum: { $cond: [{ $eq: ["$payments.status", "pending"] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$payments.status", "approved"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$payments.status", "rejected"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$payments.status", "completed"] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        totalAmount: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      }
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment statistics",
      error: error.message
    });
  }
};

*/
//////////////////////////////////////////////////////////////////

// @desc    Export payments to CSV
// @route   GET /api/admin/payments/export
// @access  Private/Admin
//////////////////////////////////////////////////////////////////////

/*export const exportPayments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const payments = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: { "payments.status": { $exists: true } } },
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          loanId: "$loanId",
          amount: "$payments.amount",
          currency: "$payments.currency",
          paymentMethod: "$payments.paymentMethod",
          status: "$payments.status",
          txHash: "$payments.txHash",
          network: "$payments.network",
          paymentDate: "$payments.date",
          submissionDate: { $toDate: "$payments._id" },
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          userEmail: "$user.email",
          reviewedBy: "$payments.reviewedBy",
          reviewNote: "$payments.reviewNote"
        }
      },
      { $sort: { submissionDate: -1 } }
    ]);

    // Convert to CSV
    const headers = [
      'Loan ID', 'Amount', 'Currency', 'Payment Method', 'Status',
      'Transaction Hash', 'Network', 'Payment Date', 'Submission Date',
      'User Name', 'User Email', 'Reviewed By', 'Review Note'
    ];

    const csvRows = payments.map(payment => [
      payment.loanId,
      payment.amount,
      payment.currency,
      payment.paymentMethod,
      payment.status,
      payment.txHash || '',
      payment.network || '',
      new Date(payment.paymentDate).toISOString(),
      new Date(payment.submissionDate).toISOString(),
      payment.userName,
      payment.userEmail,
      payment.reviewedBy || '',
      payment.reviewNote || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting payments",
      error: error.message
    });
  }
};

*/

///////////////////////////////////////////////////////////////////////


//v2///

// loanController.js - Updated with Admin Payment Review Features



// @desc    Get all payments for admin review (with advanced filtering)
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getPaymentsForReview = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
      sortBy = "date",
      sortOrder = "desc"
    } = req.query;

    // Build match query
    const matchQuery = {
      "payments.status": { $exists: true }
    };

    // Status filter
    if (status && status !== 'all') {
      matchQuery["payments.status"] = status;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      matchQuery["payments.paymentMethod"] = paymentMethod;
    }

    // Date range filter
    if (startDate || endDate) {
      matchQuery["payments.date"] = {};
      if (startDate) {
        matchQuery["payments.date"].$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery["payments.date"].$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };

      // Check if search is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(search)) {
        matchQuery.$or = [
          { _id: new mongoose.Types.ObjectId(search) },
          { "payments._id": new mongoose.Types.ObjectId(search) },
          { userId: new mongoose.Types.ObjectId(search) }
        ];
      } else {
        // Search by loanId, txHash, or user email/name
        matchQuery.$or = [
          { loanId: searchRegex },
          { "payments.txHash": searchRegex },
          { "payments.fromAddress": searchRegex }
        ];
      }
    }

    // Aggregation pipeline
    const aggregation = [
      // Match loans with payments
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },

      // Unwind payments array
      { $unwind: "$payments" },

      // Apply filters
      { $match: matchQuery },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Lookup reviewer details
      {
        $lookup: {
          from: "users",
          localField: "payments.reviewedBy",
          foreignField: "_id",
          as: "reviewer"
        }
      },
      { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },

      // Project fields
      {
        $project: {
          _id: "$payments._id",
          loanId: "$_id",
          loanReference: "$loanId",
          amount: "$payments.amount",
          currency: "$payments.currency",
          paymentMethod: "$payments.paymentMethod",
          network: "$payments.network",
          txHash: "$payments.txHash",
          fromAddress: "$payments.fromAddress",
          toAddress: "$payments.toAddress",
          proofImage: "$payments.proofImage",
          status: "$payments.status",
          reviewedBy: "$payments.reviewedBy",
          reviewerName: { $concat: ["$reviewer.firstName", " ", "$reviewer.lastName"] },
          reviewerEmail: "$reviewer.email",
          reviewNote: "$payments.reviewNote",
          date: "$payments.date",
          createdAt: "$payments._id.getTimestamp()",
          updatedAt: "$payments._id.getTimestamp()",
          metadata: "$payments.metadata",
          depositTransactionId: "$payments.depositTransactionId",

          // User info
          user: {
            _id: "$user._id",
            name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
            email: "$user.email",
            phone: "$user.phone"
          },

          // Loan info
          loan: {
            totalAmountDue: "$totalAmountDue",
            amountPaid: "$amountPaid",
            remainingBalance: "$remainingBalance",
            status: "$status",
            dueDate: "$dueDate"
          }
        }
      },

      // Sort
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },

      // Pagination
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    // Execute aggregation
    const payments = await Loan.aggregate(aggregation);

    // Get total count
    const countAggregation = [
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: matchQuery },
      { $count: "total" }
    ];

    const countResult = await Loan.aggregate(countAggregation);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching payments for review:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message
    });
  }
};

// @desc    Get payment details by ID
// @route   GET /api/admin/payments/:paymentId
// @access  Private/Admin
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log({ paymentId })



    // Find the loan containing this payment
    const loan = await Loan.findOne(
      { "payments._id": paymentId },
      {
        "payments.$": 1,
        loanId: 1,
        userId: 1,
        totalAmountDue: 1,
        amountPaid: 1,
        remainingBalance: 1,
        status: 1,
        dueDate: 1
      }
    )

    console.log({ loan })

    if (!loan || !loan.payments || loan.payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = loan.payments[0];


    // If payment was reviewed, get reviewer details
    let reviewer = null;
    if (payment.reviewedBy) {
      reviewer = await userModel.findById(payment.reviewedBy)
        .select("firstName lastName email");
    }

    const responseData = {
      _id: payment._id,
      loanId: loan._id,
      loanReference: loan.loanId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      network: payment.network,
      txHash: payment.txHash,
      fromAddress: payment.fromAddress,
      toAddress: payment.toAddress,
      proofImage: payment.proofImage,
      status: payment.status,
      reviewNote: payment.reviewNote,
      date: payment.date,
      createdAt: payment._id.getTimestamp(),
      metadata: payment.metadata,
      depositTransactionId: payment.depositTransactionId,



      // User info
      user: {
        _id: loan.userId._id,
        name: `${loan.userId.firstName} ${loan.userId.lastName}`,
        email: loan.userId.email,
        phone: loan.userId.phone
      },

      // Loan info
      loan: {
        totalAmountDue: loan.totalAmountDue,
        amountPaid: loan.amountPaid,
        remainingBalance: loan.remainingBalance,
        status: loan.status,
        dueDate: loan.dueDate
      },

      // Reviewer info (if exists)
      reviewer: reviewer ? {
        name: `${reviewer.firstName} ${reviewer.lastName}`,
        email: reviewer.email
      } : null
    };

    console.log(responseData)

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment details",
      error: error.message
    });
  }
};

// @desc    Review and update payment status
// @route   PUT /api/admin/payments/:paymentId/review
// @access  Private/Admin
export const reviewPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, reviewNote } = req.body;
    const adminId = req.userId; // Assuming admin ID from auth middleware

    // Validate input
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    // Find the loan containing this payment
    const loan = await Loan.findOne(
      { "payments._id": paymentId },
      {
        payments: { $elemMatch: { _id: paymentId } },
        userId: 1,
        loanId: 1,
        totalAmountDue: 1,
        amountPaid: 1,
        remainingBalance: 1,
        status: 1
      }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = loan.payments[0];

    // Check if payment can be reviewed
    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Payment is already ${payment.status}`
      });
    }

    // Check if loan is active
    if (loan.status !== "approved") { // Changed from "approved" to "active" as loans are active when disbursed
      return res.json({
        success: false,
        message: `Cannot process payment for loan with status: ${loan.status}`
      });
    }

    // Get user for notifications
    const user = await userModel.findById(loan.userId);

    // Declare newRemainingBalance variable in outer scope
    let newRemainingBalance = loan.remainingBalance;
    let newAmountPaid = loan.amountPaid;
    let updatedLoanStatus = loan.status;

    // If payment is approved, calculate new amounts
    if (status === "approved") {
      newAmountPaid = loan.amountPaid + payment.amount;
      newRemainingBalance = Math.max(0, loan.totalAmountDue - newAmountPaid);

      // Check if loan will be fully paid
      if (newRemainingBalance <= 0) {
        updatedLoanStatus = "completed";
      }
    }

    // Update payment first
    const updatedLoan = await Loan.findOneAndUpdate(
      { "payments._id": paymentId },
      {
        $set: {
          "payments.$.status": status,
          "payments.$.reviewedBy": adminId,
          "payments.$.reviewNote": reviewNote || `Payment ${status} by admin`,
          "payments.$.reviewedAt": new Date()
        }
      },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(500).json({
        success: false,
        message: "Failed to update payment"
      });
    }

    // If payment is approved, update loan amounts
    if (status === "approved") {
      const updateData = {
        $set: {
          amountPaid: newAmountPaid,
          remainingBalance: newRemainingBalance,
          updatedAt: new Date()
        }
      };

      // If loan is completed, add completion date
      if (newRemainingBalance <= 0) {
        updateData.$set.status = "completed";
        updateData.$set.completionDate = new Date();
      }

      // Update loan
      await Loan.findByIdAndUpdate(loan._id, updateData);

      // Update user loan status if fully paid
      if (newRemainingBalance <= 0 && user) {
        user.loanStatus = "no_active_loan";
        user.loanUsdt = Math.max(0, user.loanUsdt - payment.amount);
        await user.save();
      } else if (user) {
        // Just update the loan amount if not fully paid
        user.loanUsdt = Math.max(0, user.loanUsdt - payment.amount);
        await user.save();
      }

      // Send approval notification
      /*
      if (user) {
        sendPaymentNotification(user, {
          type: "payment_approved",
          amount: payment.amount,
          currency: payment.currency,
          loanId: loan.loanId,
          remainingBalance: newRemainingBalance,
          reviewNote: reviewNote
        });
      }
      */

    } else if (status === "rejected") {
      // Send rejection notification
      /*
      if (user) {
        sendPaymentNotification(user, {
          type: "payment_rejected",
          amount: payment.amount,
          currency: payment.currency,
          loanId: loan.loanId,
          reviewNote: reviewNote || "Payment rejected by admin"
        });
      }
      */
    }

    // Get updated payment data
    const updatedPayment = updatedLoan.payments.id(paymentId);

    res.json({
      success: true,
      message: `Payment ${status} successfully`,
      data: {
        payment: {
          _id: updatedPayment._id,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: updatedPayment.status,
          reviewedBy: updatedPayment.reviewedBy,
          reviewNote: updatedPayment.reviewNote,
          reviewedAt: updatedPayment.reviewedAt
        },
        loan: {
          _id: loan._id,
          loanId: loan.loanId,
          amountPaid: status === "approved" ? newAmountPaid : loan.amountPaid,
          remainingBalance: status === "approved" ? newRemainingBalance : loan.remainingBalance,
          status: status === "approved" ? (newRemainingBalance <= 0 ? "completed" : "active") : loan.status
        }
      }
    });

  } catch (error) {
    console.error("Error reviewing payment:", error);
    res.status(500).json({
      success: false,
      message: "Error reviewing payment",
      error: error.message
    });
  }
};
////////////////////////////////////////
// @desc    Bulk update payment statuses
// @route   PUT /api/admin/payments/bulk-review
// @access  Private/Admin
export const bulkReviewPayments = async (req, res) => {
  try {
    const { paymentIds, status, reviewNote } = req.body;
    const adminId = req.userId;

    // Validate input
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide payment IDs array"
      });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'"
      });
    }

    const results = {
      total: paymentIds.length,
      successful: 0,
      failed: 0,
      details: []
    };

    // Process each payment
    for (const paymentId of paymentIds) {
      try {
        // Find the loan containing this payment
        const loan = await Loan.findOne(
          { "payments._id": paymentId },
          {
            payments: { $elemMatch: { _id: paymentId } },
            userId: 1,
            loanId: 1,
            totalAmountDue: 1,
            amountPaid: 1,
            remainingBalance: 1,
            status: 1
          }
        );

        if (!loan) {
          results.failed++;
          results.details.push({
            paymentId,
            success: false,
            message: "Payment not found"
          });
          continue;
        }

        const payment = loan.payments[0];

        // Check if payment can be reviewed
        if (payment.status !== "pending") {
          results.failed++;
          results.details.push({
            paymentId,
            success: false,
            message: `Payment is already ${payment.status}`
          });
          continue;
        }

        // Check if loan is active
        if (loan.status !== "active") {
          results.failed++;
          results.details.push({
            paymentId,
            success: false,
            message: `Loan status is ${loan.status}`
          });
          continue;
        }

        // Update payment
        const updatedLoan = await Loan.findOneAndUpdate(
          { "payments._id": paymentId },
          {
            $set: {
              "payments.$.status": status,
              "payments.$.reviewedBy": adminId,
              "payments.$.reviewNote": reviewNote || `Payment ${status} by admin (bulk)`
            }
          },
          { new: true }
        );

        if (!updatedLoan) {
          results.failed++;
          results.details.push({
            paymentId,
            success: false,
            message: "Failed to update payment"
          });
          continue;
        }

        // If approved, update loan amounts
        if (status === "approved") {
          const newAmountPaid = loan.amountPaid + payment.amount;
          const newRemainingBalance = Math.max(0, loan.totalAmountDue - newAmountPaid);

          // Update loan
          await Loan.findByIdAndUpdate(loan._id, {
            $set: {
              amountPaid: newAmountPaid,
              remainingBalance: newRemainingBalance,
              updatedAt: new Date()
            }
          });

          // Update loan status if fully paid
          if (newRemainingBalance <= 0) {
            await Loan.findByIdAndUpdate(loan._id, {
              $set: {
                status: "completed",
                completionDate: new Date()
              }
            });

            // Update user loan status
            const user = await userModel.findById(loan.userId);
            if (user) {
              user.loanStatus = "no_active_loan";
              await user.save();
            }
          }
        }

        results.successful++;
        results.details.push({
          paymentId,
          success: true,
          message: `Payment ${status} successfully`
        });

      } catch (error) {
        console.error(`Error processing payment ${paymentId}:`, error);
        results.failed++;
        results.details.push({
          paymentId,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk review completed. Successful: ${results.successful}, Failed: ${results.failed}`,
      data: results
    });

  } catch (error) {
    console.error("Error in bulk review:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk review",
      error: error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {
      "payments.status": { $exists: true }
    };

    // Date range filter
    if (startDate || endDate) {
      matchQuery["payments.date"] = {};
      if (startDate) {
        matchQuery["payments.date"].$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery["payments.date"].$lte = new Date(endDate);
      }
    }

    // Get statistics with aggregation
    const stats = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: "$payments.amount" },
          pending: {
            $sum: { $cond: [{ $eq: ["$payments.status", "pending"] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$payments.status", "pending"] }, "$payments.amount", 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$payments.status", "approved"] }, 1, 0] }
          },
          approvedAmount: {
            $sum: { $cond: [{ $eq: ["$payments.status", "approved"] }, "$payments.amount", 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$payments.status", "rejected"] }, 1, 0] }
          },
          rejectedAmount: {
            $sum: { $cond: [{ $eq: ["$payments.status", "rejected"] }, "$payments.amount", 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$payments.status", "completed"] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ["$payments.status", "completed"] }, "$payments.amount", 0] }
          }
        }
      }
    ]);

    // Get payment method distribution
    const methodStats = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: matchQuery },
      {
        $group: {
          _id: "$payments.paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$payments.amount" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentPayments = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: matchQuery },
      { $sort: { "payments.date": -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$payments._id",
          loanId: "$loanId",
          amount: "$payments.amount",
          currency: "$payments.currency",
          status: "$payments.status",
          paymentMethod: "$payments.paymentMethod",
          date: "$payments.date",
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          userEmail: "$user.email"
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      totalAmount: 0,
      pending: 0,
      pendingAmount: 0,
      approved: 0,
      approvedAmount: 0,
      rejected: 0,
      rejectedAmount: 0,
      completed: 0,
      completedAmount: 0
    };

    result.paymentMethods = methodStats;
    result.recentActivity = recentPayments;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment statistics",
      error: error.message
    });
  }
};

// @desc    Export payments to CSV
// @route   GET /api/admin/payments/export
// @access  Private/Admin
export const exportPayments = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      format = 'csv'
    } = req.query;

    // Build match query
    const matchQuery = {
      "payments.status": { $exists: true }
    };

    if (status && status !== 'all') {
      matchQuery["payments.status"] = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      matchQuery["payments.paymentMethod"] = paymentMethod;
    }

    if (startDate || endDate) {
      matchQuery["payments.date"] = {};
      if (startDate) matchQuery["payments.date"].$gte = new Date(startDate);
      if (endDate) matchQuery["payments.date"].$lte = new Date(endDate);
    }

    // Get payments with user and loan info
    const payments = await Loan.aggregate([
      { $match: { payments: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$payments" },
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "users",
          localField: "payments.reviewedBy",
          foreignField: "_id",
          as: "reviewer"
        }
      },
      { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          paymentId: "$payments._id",
          loanId: "$loanId",
          amount: "$payments.amount",
          currency: "$payments.currency",
          paymentMethod: "$payments.paymentMethod",
          network: "$payments.network",
          txHash: "$payments.txHash",
          fromAddress: "$payments.fromAddress",
          status: "$payments.status",
          reviewNote: "$payments.reviewNote",
          paymentDate: "$payments.date",
          createdAt: { $toDate: "$payments._id" },
          depositTransactionId: "$payments.depositTransactionId",

          // User info
          userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          userEmail: "$user.email",
          userPhone: "$user.phone",

          // Reviewer info
          reviewerName: { $concat: ["$reviewer.firstName", " ", "$reviewer.lastName"] },
          reviewerEmail: "$reviewer.email",

          // Loan info
          loanTotalAmount: "$totalAmountDue",
          loanAmountPaid: "$amountPaid",
          loanRemainingBalance: "$remainingBalance",
          loanStatus: "$status",
          loanDueDate: "$dueDate"
        }
      },
      { $sort: { paymentDate: -1 } }
    ]);

    if (format === 'json') {
      // Export as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=payments-${new Date().toISOString().split('T')[0]}.json`);
      res.send(JSON.stringify(payments, null, 2));
    } else {
      // Export as CSV
      const headers = [
        'Payment ID', 'Loan ID', 'Amount', 'Currency', 'Payment Method',
        'Network', 'Transaction Hash', 'From Address', 'Status',
        'Review Note', 'Payment Date', 'Created At', 'Deposit Transaction ID',
        'User Name', 'User Email', 'User Phone', 'Reviewer Name', 'Reviewer Email',
        'Loan Total', 'Loan Paid', 'Loan Balance', 'Loan Status', 'Loan Due Date'
      ];

      const csvRows = payments.map(payment => [
        payment.paymentId,
        payment.loanId,
        payment.amount,
        payment.currency,
        payment.paymentMethod,
        payment.network || '',
        payment.txHash || '',
        payment.fromAddress || '',
        payment.status,
        payment.reviewNote || '',
        new Date(payment.paymentDate).toISOString(),
        new Date(payment.createdAt).toISOString(),
        payment.depositTransactionId || '',
        payment.userName,
        payment.userEmail,
        payment.userPhone || '',
        payment.reviewerName || '',
        payment.reviewerEmail || '',
        payment.loanTotalAmount,
        payment.loanAmountPaid,
        payment.loanRemainingBalance,
        payment.loanStatus,
        payment.loanDueDate ? new Date(payment.loanDueDate).toISOString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell).replace(/"/g, '""');
          return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
        }).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payments-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    }

  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting payments",
      error: error.message
    });
  }
};

// @desc    Get payment audit trail
// @route   GET /api/admin/payments/:paymentId/audit
// @access  Private/Admin
export const getPaymentAuditTrail = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment with full history
    const loan = await Loan.findOne(
      { "payments._id": paymentId },
      {
        "payments.$": 1,
        loanId: 1,
        userId: 1
      }
    ).populate("userId", "firstName lastName email");

    if (!loan || !loan.payments || loan.payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = loan.payments[0];

    // Get reviewer details if exists
    let reviewer = null;
    if (payment.reviewedBy) {
      reviewer = await userModel.findById(payment.reviewedBy)
        .select("firstName lastName email");
    }

    // Create audit trail
    const auditTrail = [
      {
        action: "payment_created",
        timestamp: payment._id.getTimestamp(),
        description: "Payment submitted by user",
        user: {
          name: `${loan.userId.firstName} ${loan.userId.lastName}`,
          email: loan.userId.email
        }
      }
    ];

    if (payment.reviewedBy) {
      auditTrail.push({
        action: `payment_${payment.status}`,
        timestamp: payment._id.getTimestamp(), // You might want to track when reviewed
        description: payment.reviewNote || `Payment ${payment.status} by admin`,
        user: {
          name: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Admin",
          email: reviewer?.email || "admin@system"
        }
      });
    }

    res.json({
      success: true,
      data: {
        paymentId,
        loanId: loan.loanId,
        user: {
          name: `${loan.userId.firstName} ${loan.userId.lastName}`,
          email: loan.userId.email
        },
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        auditTrail
      }
    });

  } catch (error) {
    console.error("Error fetching payment audit trail:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment audit trail",
      error: error.message
    });
  }
};



///

// Helper function to send payment notification
async function sendPaymentNotification(user, paymentData) {
  try {
    // Send email notification
    if (user.email) {
      // Implement email sending logic here
      console.log(`Payment notification sent to ${user.email}:`, paymentData);
    }

    // You can also add push notifications, SMS, etc.
  } catch (error) {
    console.error("Error sending payment notification:", error);
  }
}

// Update the existing recordPayment function to use the new schema
