import Deposit from '../models/Deposit.js';
import userModel from '../models/usermodel.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

import NotificationService from '../services/notificationService.js';

// Get deposit addresses
const DEPOSIT_ADDRESSES = {
  BTC: {
    Bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    Lightning: "lnbc1u1pjn9r5dpp5f8e9r2e8w9r3e8w9r4e8w9r5e8w9r6e8w9r7e8w9r8e8w9r9e8w9r0"
  },
  ETH: {
    Ethereum: "0xA1b32c59f98d0e31B410d98a2F9f77c9c12c9A10",
    Arbitrum: "0xD29f1F2A8a44A221f7344Ac08ac77c99c64Fa22b"
  },
  USDT: {
    TronTRC20: "TYm89nsF93AA9je392jsuA8d92msZZ912",
    ERC20: "0xA1b32c59f98d0e31B410d98a2F9f77c9c12c9A10"
  },
  //BNB: {
  //BEP20: "0xA1b32c59f98d0e31B410d98a2F9f77c9c12c9A10"
  //}
};

// ==================== USER CONTROLLERS ====================

// Get deposit addresses
export const getDepositAddresses = async (req, res) => {

  try {
    res.json({
      success: true,
      data: DEPOSIT_ADDRESSES
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.json({
      success: false,
      message: 'Failed to fetch addresses'
    });
  }
};

// Create deposit
export const createDeposit = async (req, res) => {
  try {
    const { currency, network, amount, txHash, toAddress, fromAddress } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currency || !network || !amount || !txHash || !toAddress) {
      return res.json({
        success: false,
        message: 'All fields are required: currency, network, amount, txHash, toAddress'
      });
    }

    // Check KYC status
    if (req.user.kycStatus !== 'approved') {
      return res.json({
        success: false,
        message: 'KYC verification required'
      });
    }

    // Check account verification
    if (!req.user.isAccountVerified) {
      return res.json({
        success: false,
        message: 'Account verification required'
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.json({
        success: false,
        message: 'Valid amount required'
      });
    }

    // Minimum amounts
    const minAmounts = {
      'BTC': 0.0001,
      'ETH': 0.001,
      'USDT': 10,
      'BNB': 0.01
    };

    const minAmount = minAmounts[currency] || 1;
    if (amountNum < minAmount) {
      return res.json({
        success: false,
        message: `Minimum deposit for ${currency} is ${minAmount}`
      });
    }

    // Check for duplicate transaction
    const existingDeposit = await Deposit.findOne({ txHash });
    if (existingDeposit) {
      return res.json({
        success: false,
        message: 'Transaction already exists'
      });
    }

    // Check network availability
    if (!DEPOSIT_ADDRESSES[currency]?.[network]) {
      return res.json({
        success: false,
        message: `Network ${network} not available for ${currency}`
      });
    }

    // Upload proof image
    let proofImage = null;
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          public_id: `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          folder: `deposits/users/${userId}`,
          tags: ['deposit', `user_${userId}`, currency.toLowerCase()]
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

    // Create deposit
    const deposit = new Deposit({
      userId,
      currency,
      network,
      amount: amountNum,
      txHash,
      toAddress,
      fromAddress: fromAddress || 'Unknown',
      proofImage,
      status: 'pending'
    });

    await deposit.save();
    await NotificationService.createDepositNotification(userId, deposit, 'pending');

    res.json({
      success: true,
      message: 'Deposit submitted successfully',
      data: {
        status: deposit.status,
        amount: deposit.amount,
        currency: deposit.currency,
        network: deposit.network,
        createdAt: deposit.createdAt
      }
    });

  } catch (error) {
    console.error('Create deposit error:', error);

    // Cleanup uploaded file if error
    if (req.uploadedFile?.publicId) {
      await deleteFromCloudinary(req.uploadedFile.publicId);
    }

    res.json({
      success: false,
      message: 'Failed to create deposit'
    });
  }
};

// Get user deposits
export const getuserModelDeposits = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, status, currency } = req.query;
    const skip = (page - 1) * parseInt(limit);

    // Build query
    const query = { userId };
    if (status && status !== 'all') query.status = status;
    if (currency && currency !== 'all') query.currency = currency;

    // Pagination validation
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deposit.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get deposits error:', error);
    res.json({
      success: false,
      message: 'Failed to fetch deposits'
    });
  }
};

// Get deposit by ID
export const getDepositById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is admin or the deposit owner
    const isAdmin = ['admin'].includes(req.user.role);
    const query = isAdmin ?
      { $or: [{ _id: id }, { transactionId: id }] } :
      { $or: [{ _id: id }, { transactionId: id }], userId };

    const deposit = await Deposit.findOne(query)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name')
      .lean();

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }


    const u = await userModel.findById(deposit.userId)

    const user = {
      email: u.email,
      name: u.name
    }


    res.json({
      success: true,
      data: { ...deposit, ...user }
    });

  } catch (error) {
    console.error('Get deposit error:', error);
    res.json({
      success: false,
      message: 'Failed to fetch deposit'
    });
  }
};

// Get deposit statistics for user
export const getDepositStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [stats, recent] = await Promise.all([
      Deposit.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalDeposits: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            completedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'under_review']] }, 1, 0] }
            }
          }
        }
      ]),
      Deposit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('transactionId amount currency status createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        ...(stats[0] || {}),
        recent
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const [summary, recentActivity] = await Promise.all([
      Deposit.aggregate([
        { $match: { userId } },
        {
          $facet: {
            byCurrency: [{
              $group: {
                _id: '$currency',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0] }
                }
              }
            }],
            byStatus: [{
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$amount' }
              }
            }]
          }
        }
      ]),
      Deposit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('transactionId amount currency status network createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          byCurrency: summary[0]?.byCurrency || [],
          byStatus: summary[0]?.byStatus || []
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.json({
      success: false,
      message: 'Failed to fetch dashboard summary'
    });
  }
};

// Upload additional proof
export const uploadAdditionalProof = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.json({
        success: false,
        message: 'Proof file is required'
      });
    }

    const deposit = await Deposit.findOne({
      $or: [{ _id: id }, { transactionId: id }],
      userId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found or cannot accept additional proof'
      });
    }

    // Upload new proof
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `additional_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      folder: `deposits/users/${userId}/additional`,
      tags: ['additional_proof', `deposit_${deposit.transactionId}`]
    });

    // Update deposit with additional proof
    deposit.proofImage = {
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname
    };

    // Change status if it was under review
    if (deposit.status === 'under_review') {
      deposit.status = 'processing';
    }

    await deposit.save();

    res.json({
      success: true,
      message: 'Additional proof uploaded successfully',
      data: deposit
    });

  } catch (error) {
    console.error('Upload additional proof error:', error);
    res.json({
      success: false,
      message: 'Failed to upload additional proof'
    });
  }
};

// ==================== ADMIN CONTROLLERS ====================

// Get all deposits (admin)
export const getAllDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, currency, search } = req.query;
    const skip = (page - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (currency && currency !== 'all') query.currency = currency;

    // Search functionality
    if (search) {
      const users = await userModel.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(user => user._id);

      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { txHash: { $regex: search, $options: 'i' } },
        { userId: { $in: userIds } }
      ];
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name')
        .populate('rejectedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Deposit.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits'
    });
  }
};

// Get admin statistics
export const getAdminStats = async (req, res) => {
  try {
    const stats = await Deposit.aggregate([
      {
        $facet: {
          totals: [{
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              pending: {
                $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'under_review']] }, 1, 0] }
              },
              completed: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              }
            }
          }],
          byCurrency: [{
            $group: {
              _id: '$currency',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              pending: {
                $sum: { $cond: [{ $in: ['$status', ['pending', 'processing', 'under_review']] }, 1, 0] }
              }
            }
          }],
          byStatus: [{
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              total: { $sum: '$amount' }
            }
          }],
          recent: [{
            $sort: { createdAt: -1 }
          },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $project: {
              transactionId: 1,
              amount: 1,
              currency: 1,
              status: 1,
              createdAt: 1,
              'user.name': 1,
              'user.email': 1
            }
          }]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totals: stats[0]?.totals[0] || {},
        byCurrency: stats[0]?.byCurrency || [],
        byStatus: stats[0]?.byStatus || [],
        recent: stats[0]?.recent || []
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
};

// Approve deposit
export const approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount } = req.body;
    const adminId = req.user._id;

    const deposit = await Deposit.findById(id)
      .populate('userId', 'name email wallet');

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status === 'completed') {
      return res.json({
        success: false,
        message: 'Deposit already approved'
      });
    }

    const amount = parseFloat(approvedAmount) || deposit.amount;

    // Update user wallet balance
    const walletField = `wallet.${deposit.currency.toLowerCase()}`;
    await userModel.findByIdAndUpdate(deposit.userId._id, {
      $inc: { [walletField]: amount }
    });

    await deposit.approve(adminId, `Approved by ${req.user.name}`);

    // Get updated deposit
    const updatedDeposit = await Deposit.findById(id)
      .populate('userId', 'name email')
      .populate('approvedBy', 'name');

    await NotificationService.createDepositNotification(
      deposit.userId,
      deposit,
      'completed'
    );

    res.json({
      success: true,
      message: 'Deposit approved successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Approve deposit error:', error);
    res.json({
      success: false,
      message: 'Failed to approve deposit'
    });
  }
};

// Reject deposit
export const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    if (!reason?.trim()) {
      return res.json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status === 'rejected') {
      return res.json({
        success: false,
        message: 'Deposit already rejected'
      });
    }

    await deposit.reject(adminId, reason.trim());

    // Get updated deposit
    const updatedDeposit = await Deposit.findById(id)
      .populate('userId', 'name email')
      .populate('rejectedBy', 'name');


    await NotificationService.createDepositNotification(
      deposit.userId,
      deposit,
      'rejected'
    );

    res.json({
      success: true,
      message: 'Deposit rejected successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Reject deposit error:', error);
    res.json({
      success: false,
      message: 'Failed to reject deposit'
    });
  }
};

// Mark deposit for review
export const markForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }

    deposit.status = 'under_review';
    await deposit.save();

    res.json({
      success: true,
      message: 'Deposit marked for review',
      data: deposit
    });

  } catch (error) {
    console.error('Mark for review error:', error);
    res.json({
      success: false,
      message: 'Failed to mark deposit for review'
    });
  }
};

// Update deposit status
export const updateDepositStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['processing', 'completed', 'rejected', 'failed', 'under_review'];

    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: 'Invalid status'
      });
    }

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }

    deposit.status = status;
    await deposit.save();

    res.json({
      success: true,
      message: 'Deposit status updated',
      data: deposit
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.json({
      success: false,
      message: 'Failed to update deposit status'
    });
  }
};

// Delete deposit (soft delete)
export const deleteDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return res.json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Soft delete
    deposit.isDeleted = true;
    deposit.deletedAt = new Date();
    deposit.deletedBy = req.user._id;
    await deposit.save();

    res.json({
      success: true,
      message: 'Deposit deleted successfully'
    });

  } catch (error) {
    console.error('Delete deposit error:', error);
    res.json({
      success: false,
      message: 'Failed to delete deposit'
    });
  }
};