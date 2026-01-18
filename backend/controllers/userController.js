import userModel from '../models/usermodel.js';
import mongoose from 'mongoose';

// Get all users with filtering and pagination
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role,
      isBlocked,
      kycStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { deletedAt: null };

    // Search by email, name, or userName
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { email: searchRegex },
        { name: searchRegex },
        { userName: searchRegex }
      ];
    }

    // Filters
    if (role) query.role = role;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
    if (kycStatus) query.kycStatus = kycStatus;

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with pagination
    const users = await userModel.find(query)
      .select('-password -verifyOtp -resetOtp -__v')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Format users for frontend
    const formattedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      userId: user._id.toString().substring(18, 26).toUpperCase(), // Generate from ObjectId
      name: user.name,
      userName: user.userName,
      balances: {
        usd: user.wallet?.usdt || 0,
        btc: user.wallet?.btc || 0,
        eth: user.wallet?.eth || 0
      },
      createdAt: user.createdAt.toLocaleDateString('en-GB'),
      isBlocked: user.isBlocked || false,
      forceWin: user.forceWin || false,
      kycStatus: user.kycStatus,
      role: user.role,
      totalTrades: user.totalTrades || 0,
      totalProfit: user.totalProfit || 0,
      totalLoss: user.totalLoss || 0,
      loanStatus: user.loanStatus,
      loanUsdt: user.loanUsdt || 0
    }));

    // Get total count
    const total = await userModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get single user
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await userModel.findById(id)
      .select('-password -verifyOtp -resetOtp -__v');

    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const formattedUser = {
      _id: user._id,
      email: user.email,
      userId: user._id.toString().substring(18, 26).toUpperCase(),
      name: user.name,
      userName: user.userName,
      avatar: user.avatar,
      balances: {
        usd: user.wallet?.usdt || 0,
        btc: user.wallet?.btc || 0,
        eth: user.wallet?.eth || 0
      },
      createdAt: user.createdAt.toLocaleDateString('en-GB'),
      isBlocked: user.isBlocked,
      forceWin: user.forceWin,
      kycStatus: user.kycStatus,
      kyc: user.kyc,
      isAccountVerified: user.isAccountVerified,
      role: user.role,
      loanStatus: user.loanStatus,
      loanUsdt: user.loanUsdt,
      totalTrades: user.totalTrades,
      totalProfit: user.totalProfit,
      totalLoss: user.totalLoss
    };

    res.status(200).json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.deletedAt;
    delete updates.deletedBy;

    // Handle wallet updates (converting from frontend format)
    if (updates.balances) {
      updates.wallet = updates.wallet || {};
      updates.wallet.usdt = updates.balances.usd || 0;
      updates.wallet.btc = updates.balances.btc || 0;
      updates.wallet.eth = updates.balances.eth || 0;
      delete updates.balances;
    }

    // Handle loan updates
    if (updates.loanStatus === 'no_active_loan') {
      updates.loanUsdt = 0;
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -verifyOtp -resetOtp -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Update user balance
export const updateUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { currency, amount, operation = 'set' } = req.body;

    // Validate currency
    const currencyMap = {
      'usd': 'usdt',
      'btc': 'btc',
      'eth': 'eth',
      'loan': 'loanUsdt'
    };

    const dbCurrency = currencyMap[currency] || currency;
    
    if (!['usdt', 'btc', 'eth', 'loanUsdt'].includes(dbCurrency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency. Use: usd, btc, eth, or loan'
      });
    }

    const user = await userModel.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let newBalance;
    const currentBalance = user.wallet[dbCurrency] || 0;

    switch (operation) {
      case 'add':
        newBalance = currentBalance + parseFloat(amount);
        break;
      case 'subtract':
        newBalance = currentBalance - parseFloat(amount);
        if (newBalance < 0) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance'
          });
        }
        break;
      case 'set':
        newBalance = parseFloat(amount);
        if (newBalance < 0) {
          return res.status(400).json({
            success: false,
            message: 'Balance cannot be negative'
          });
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Use: add, subtract, or set'
        });
    }

    // Update balance
    if (dbCurrency === 'loanUsdt') {
      user.loanUsdt = newBalance;
      // Update loan status based on amount
      if (newBalance > 0) {
        user.loanStatus = 'active';
      } else {
        user.loanStatus = 'no_active_loan';
      }
    } else {
      user.wallet[dbCurrency] = newBalance;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Balance ${operation}ed successfully`,
      data: {
        currency: currency,
        previousBalance: currentBalance,
        newBalance: newBalance,
        operation: operation
      }
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update balance',
      error: error.message
    });
  }
};

// Toggle user block status
export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: {
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Toggle block error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// Toggle force win
export const toggleForceWin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.forceWin = !user.forceWin;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Force win ${user.forceWin ? 'enabled' : 'disabled'}`,
      data: {
        forceWin: user.forceWin
      }
    });
  } catch (error) {
    console.error('Toggle force win error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update force win',
      error: error.message
    });
  }
};

// Delete user (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Bulk delete users
export const deleteManyUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users selected'
      });
    }

    const result = await userModel.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          deletedAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} users deleted successfully`,
      data: {
        deletedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete users',
      error: error.message
    });
  }
};

// Update KYC status
export const updateKYCStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KYC status'
      });
    }

    const user = await userModel.findById(id);
    if (!user || user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.kycStatus = status;
    user.isKyc = status === 'approved';
    
    if (status === 'rejected' && rejectionReason) {
      // Store rejection reason in kyc document
      if (user.kyc) {
        user.kyc.rejectionReason = rejectionReason;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      data: {
        kycStatus: user.kycStatus,
        isKyc: user.isKyc
      }
    });
  } catch (error) {
    console.error('Update KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update KYC status',
      error: error.message
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const stats = await userModel.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ["$isBlocked", false] }, 1, 0] } },
          blockedUsers: { $sum: { $cond: [{ $eq: ["$isBlocked", true] }, 1, 0] } },
          verifiedUsers: { $sum: { $cond: [{ $eq: ["$isAccountVerified", true] }, 1, 0] } },
          kycApproved: { $sum: { $cond: [{ $eq: ["$kycStatus", "approved"] }, 1, 0] } },
          kycPending: { $sum: { $cond: [{ $eq: ["$kycStatus", "pending"] }, 1, 0] } },
          totalUsdt: { $sum: "$wallet.usdt" },
          totalBtc: { $sum: "$wallet.btc" },
          totalEth: { $sum: "$wallet.eth" },
          totalLoan: { $sum: "$loanUsdt" },
          totalTrades: { $sum: "$totalTrades" },
          totalProfit: { $sum: "$totalProfit" },
          totalLoss: { $sum: "$totalLoss" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {}
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};