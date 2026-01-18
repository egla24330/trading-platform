// controllers/withdrawalController.js
import Withdrawal from "../models/Withdrawal.js";
import userModel from "../models/usermodel.js";
import NotificationService from "../services/notificationService.js";


// Generate unique withdrawal ID
const generateTransactionId = async () => {
    const count = await Withdrawal.countDocuments();
    return `WDID${String(count + 1).padStart(9, "0")}`;
};

// Create withdrawal request
export const createWithdrawal = async (req, res) => {
    try {
        const userId = req.userId;
        const { amount, currency, network, toAddress } = req.body;

        // Validate required fields
        if (!amount || !currency || !network || !toAddress) {
            return res.json({ message: "All fields are required" });
        }

        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ message: "user not found" });
        }

        // Check KYC status
        if (user.kycStatus !== "approved") {
            return res.json({
                message: "KYC verification required for withdrawals"
            });
        }

        // Check user balance
        const userBalance = user.wallet[currency.toLowerCase()] || 0;
        if (amount > userBalance) {
            return res.json({
                message: "Insufficient balance"
            });
        }

        // Calculate fee (example: 0.5% or fixed based on network)
        const fee = calculateWithdrawalFee(amount, currency, network);
        console.log(req.body)
        console.log(amount - fee)
        // Create withdrawal record
        const withdrawal = new Withdrawal({
            transactionId: await generateTransactionId(),
            user: userId,
            amount: amount - fee,
            requestedAmount: amount,
            currency,
            network,
            toAddress,
            fee,
            userBalanceAtTime: userBalance,
        });

        await withdrawal.save();

        // Deduct from user's balance immediately (pending withdrawal)
        user.wallet[currency.toLowerCase()] -= amount;
        await user.save();
        await NotificationService.createWithdrawalNotification(userId, withdrawal, "Pending");

        res.json({
            success: true,
            message: "Withdrawal request submitted successfully",
            data: withdrawal,
        });
    } catch (error) {
        console.error("Create withdrawal error:", error);
        res.json({ message: "Server error", error: error.message });
    }
};

// Get all withdrawals (admin)
export const getAllWithdrawals = async (req, res) => {
    try {
        const {
            status,
            currency,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== "All Status") {
            query.status = status;
        }

        // Filter by currency
        if (currency && currency !== "All Currency") {
            query.currency = currency;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: "i" } },
                { toAddress: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find(query)
            .populate("user", "name email userId")
            .populate("processedBy", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Withdrawal.countDocuments(query);

        res.json({
            success: true,
            data: withdrawals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get withdrawals error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get withdrawal by ID
export const getWithdrawalById = async (req, res) => {
    try {
        const { id } = req.params;

        const withdrawal = await Withdrawal.findById(id)
            .populate("user", "name email userId wallet")
            .populate("processedBy", "name");

        if (!withdrawal) {
            return res.status(404).json({ message: "Withdrawal not found" });
        }

        res.json({
            success: true,
            data: withdrawal,
        });
    } catch (error) {
        console.error("Get withdrawal error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Approve withdrawal (admin)
export const approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedAmount } = req.body;
        const adminId = req.user.id; // Assuming admin is authenticated

        const withdrawal = await Withdrawal.findById(id).populate("user");
        if (!withdrawal) {
            return res.status(404).json({ message: "Withdrawal not found" });
        }

        if (withdrawal.status !== "Pending") {
            return res.json({
                message: "Withdrawal is not in pending state"
            });
        }

        // Validate approved amount
        if (!approvedAmount || approvedAmount <= 0) {
            return res.json({
                message: "Invalid approved amount"
            });
        }

        if (approvedAmount > withdrawal.userBalanceAtTime) {
            return res.json({
                message: "Approved amount exceeds user's balance at request time"
            });
        }

        // Update withdrawal status
        withdrawal.status = "Completed";
        withdrawal.approvedAmount = approvedAmount;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();

        await withdrawal.save();
        await NotificationService.createWithdrawalNotification(withdrawal.user, withdrawal, "Completed");

        // Send notification to user (implement your notification system)
        sendNotification(withdrawal.user._id, {
            title: "Withdrawal Approved",
            message: `Your withdrawal of ${approvedAmount} ${withdrawal.currency} has been approved and is being processed.`,
        });

        res.json({
            success: true,
            message: "Withdrawal approved successfully",
            data: withdrawal,
        });
    } catch (error) {
        console.error("Approve withdrawal error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update transaction hash (admin)
export const updateTransactionHash = async (req, res) => {
    try {
        const { id } = req.params;
        const { transactionHash } = req.body;
        const adminId = req.user.id;

        if (!transactionHash || transactionHash.length < 64) {
            return res.json({
                message: "Valid transaction hash required (64+ characters)"
            });
        }

        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            return res.status(404).json({ message: "Withdrawal not found" });
        }

        if (withdrawal.status !== "Processing") {
            return res.json({
                message: "Withdrawal is not in processing state"
            });
        }

        withdrawal.transactionHash = transactionHash;
        withdrawal.status = "Completed";
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();

        await withdrawal.save();

        // Send notification to user
        sendNotification(withdrawal.user, {
            title: "Withdrawal Completed",
            message: `Your withdrawal of ${withdrawal.amount} ${withdrawal.currency} has been completed. Transaction hash: ${transactionHash.substring(0, 20)}...`,
        });

        res.json({
            success: true,
            message: "Transaction hash updated and withdrawal marked as completed",
            data: withdrawal,
        });
    } catch (error) {
        console.error("Update hash error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Reject withdrawal (admin)
export const rejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectReason } = req.body;
        const adminId = req.user.id;

        if (!rejectReason || rejectReason.trim() === "") {
            return res.json({
                message: "Rejection reason is required"
            });
        }

        const withdrawal = await Withdrawal.findById(id).populate("user");
        if (!withdrawal) {
            return res.status(404).json({ message: "Withdrawal not found" });
        }

        if (withdrawal.status !== "Pending") {
            return res.json({
                message: "Withdrawal is not in pending state"
            });
        }

        // Refund amount to user's wallet
        const user = await userModel.findById(withdrawal.user._id);
        user.wallet[withdrawal.currency.toLowerCase()] += withdrawal.requestedAmount;
        await user.save();

        // Update withdrawal status
        withdrawal.status = "Rejected";
        withdrawal.rejectReason = rejectReason;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();

        await withdrawal.save();

        // Send notification to user
        sendNotification(withdrawal.user._id, {
            title: "Withdrawal Rejected",
            message: `Your withdrawal request has been rejected. Reason: ${rejectReason}`,
        });

        await NotificationService.createWithdrawalNotification(withdrawal.user, withdrawal, "Rejected");

        res.json({
            success: true,
            message: "Withdrawal rejected successfully",
            data: withdrawal,
        });
    } catch (error) {
        console.error("Reject withdrawal error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get user's withdrawal history
export const getuserModelWithdrawals = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Withdrawal.countDocuments({ user: userId });

        res.json({
            success: true,
            data: withdrawals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get user withdrawals error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get withdrawal statistics (admin)
export const getWithdrawalStats = async (req, res) => {
    try {
        const stats = await Withdrawal.aggregate([
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                    },
                    processingCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Processing"] }, 1, 0] },
                    },
                    completedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
                    },
                    rejectedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
                    },
                    failedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] },
                    },
                    byCurrency: {
                        $push: {
                            currency: "$currency",
                            amount: "$amount",
                        },
                    },
                },
            },
        ]);

        // Process currency breakdown
        const currencyBreakdown = {};
        if (stats[0]?.byCurrency) {
            stats[0].byCurrency.forEach((item) => {
                if (!currencyBreakdown[item.currency]) {
                    currencyBreakdown[item.currency] = { count: 0, amount: 0 };
                }
                currencyBreakdown[item.currency].count += 1;
                currencyBreakdown[item.currency].amount += item.amount;
            });
        }

        res.json({
            success: true,
            data: {
                ...stats[0],
                currencyBreakdown,
            },
        });
    } catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Helper function to calculate withdrawal fee
const calculateWithdrawalFee = (amount, currency, network) => {
    // Implement your fee calculation logic
    // This is just an example


    const feeRates = {
        USDT: {
            TRC20: 1,
            ERC20: 12,
            BEP20: 2.8
        },
        BTC: 0.0005,
        ETH: 0.002,
        BNB: 0.001,
    };

    if (currency === "USDT" && feeRates.USDT[network]) {
        return feeRates.USDT[network];
    }

    return feeRates[currency] || 0;
};

// Helper function for notifications (implement based on your notification system)
const sendNotification = async (userId, notification) => {
    // Implement your notification logic (email, push, in-app, etc.)
    console.log("Notification sent:", userId, notification);
};