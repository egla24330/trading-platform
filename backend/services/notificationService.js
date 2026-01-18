// services/notificationService.js
import Notification from "../models/Notification.js";

class NotificationService {
  // Enhanced deposit notification with more details
  static async createDepositNotification(userId, deposit, status) {
    try {
      const titles = {
        pending: "Deposit Submitted",
        processing: "Deposit Processing",
        completed: "Deposit Completed",
        rejected: " Deposit Rejected",
        failed: " Deposit Failed",
        under_review: " Deposit Under Review",
      };

      const messages = {
        pending: `Your ${deposit.currency} deposit of ${deposit.amount} is pending confirmation. Transaction: ${deposit.txHash?.substring(0, 12)}...`,
        processing: `Your ${deposit.currency} deposit is being processed. This usually takes 10-30 minutes.`,
        completed: `Your ${deposit.currency} deposit of ${deposit.amount} has been approved and credited to your account.`,
        rejected: `Your ${deposit.currency} deposit of ${deposit.amount} has been rejected. ${deposit.rejectReason || "Contact support for more information."}`,
        failed: `Your ${deposit.currency} deposit of ${deposit.amount} has failed. Please check the transaction and try again.`,
        under_review: `Your ${deposit.currency} deposit of ${deposit.amount} is under review. This may take up to 24 hours.`,
      };

      const priority = {
        completed: "high",
        rejected: "high",
        failed: "high",
        pending: "medium",
        processing: "medium",
        under_review: "medium",
      };

      const colors = {
        completed: "success",
        rejected: "danger",
        failed: "danger",
        pending: "warning",
        processing: "info",
        under_review: "warning",
      };

      const badges = {
        completed: `+${deposit.approvedAmount || deposit.amount} ${deposit.currency}`,
        rejected: "Rejected",
        failed: "Failed",
        pending: "Pending",
        processing: "Processing",
        under_review: "Review",
      };

      return await Notification.create({
        user: userId,
        title: titles[status] || " Deposit Update",
        message: messages[status] || "Your deposit status has been updated.",
        type: "deposit",
        priority: priority[status] || "medium",
        color: colors[status] || "info",
        badge: badges[status],
        relatedTo: {
          modelType: "Deposit",
          modelId: deposit._id,
        },
        actions: [
          {
            label: status === 'completed' ? "View Balance" : "View Details",
            url: status === 'completed'
              ? "/dashboard/wallet"
              : `/dashboard/deposits/${deposit._id}`,
            method: "GET",
            style: status === 'completed' ? "success" : "primary",
          },
          {
            label: "View All Deposits",
            url: "/dashboard/deposits",
            method: "GET",
            style: "secondary",
          }
        ],
        icon: "deposit",
        metadata: {
          amount: deposit.amount,
          currency: deposit.currency,
          network: deposit.network,
          transactionHash: deposit.txHash,
          status: status
        }
      });
    } catch (error) {
      console.error("Error creating deposit notification:", error);
      return null;
    }
  }

  // Enhanced withdrawal notification
  static async createWithdrawalNotification(userId, withdrawal, status) {
    try {
      const titles = {
        Pending: " Withdrawal Requested",
        Processing: " Withdrawal Processing",
        Completed: " Withdrawal Completed",
        Failed: " Withdrawal Failed",
        Rejected: " Withdrawal Rejected",
      };
      //Completed: ` Your ${withdrawal.currency} withdrawal of ${withdrawal.amount} has been sent to your wallet. Transaction: ${withdrawal.transactionHash?.substring(0, 12)}...`,
      const messages = {
        Pending: `Your ${withdrawal.currency} withdrawal of ${withdrawal.amount} has been requested and is pending approval.`,
        Processing: `Your ${withdrawal.currency} withdrawal is being processed and will be sent to ${withdrawal.toAddress?.substring(0, 8)}...`,
        Completed: `Your ${withdrawal.currency} withdrawal of ${withdrawal.amount} has been sent to your wallet.`,
        Rejected: `Your ${withdrawal.currency} withdrawal of ${withdrawal.amount} has been rejected. ${withdrawal.rejectReason || "Contact support for more information."}`,
        Failed: `Your ${withdrawal.currency} withdrawal of ${withdrawal.amount} has failed. The funds have been returned to your account.`,
      };

      const colors = {
        Completed: "success",
        Rejected: "danger",
        Failed: "danger",
        Pending: "warning",
        Processing: "info",
      };

      return await Notification.create({
        user: userId,
        title: titles[status] || " Withdrawal Update",
        message: messages[status] || "Your withdrawal status has been updated.",
        type: "withdrawal",
        priority: status === "Completed" || status === "Rejected" || status === "Failed" ? "high" : "medium",
        color: colors[status] || "info",
        badge: status === "Completed" ? `-${withdrawal.amount} ${withdrawal.currency}` : status,
        relatedTo: {
          modelType: "Withdrawal",
          modelId: withdrawal._id,
        },
        actions: [
          {
            label: "View Transaction",
            url: `/dashboard/withdrawals/${withdrawal._id}`,
            method: "GET",
            style: status === "Completed" ? "success" : "primary",
          },
          {
            label: "View All Withdrawals",
            url: "/dashboard/withdrawals",
            method: "GET",
            style: "secondary",
          }
        ],
        icon: "withdrawal",
        metadata: {
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          toAddress: withdrawal.toAddress,
          transactionHash: withdrawal.transactionHash,
          status: status
        }
      });
    } catch (error) {
      console.error("Error creating withdrawal notification:", error);
      return null;
    }
  }

  // Enhanced loan notification
  static async createLoanNotification(userId, loan, status) {
    try {
      const titles = {
        pending: " Loan Application Submitted",
        approved: "Loan Approved",
        active: " Loan Activated",
        rejected: " Loan Application Rejected",
        completed: "Loan Repaid",
        defaulted: "Loan Defaulted",
      };

      const messages = {
        pending: `Your loan application for ${loan.currency} ${loan.amountRequested} is under review.`,
        approved: ` Your loan application for ${loan.currency} ${loan.amountApproved} has been approved!`,
        active: `Your loan of ${loan.currency} ${loan.amountApproved} has been disbursed to your account.`,
        rejected: `Your loan application has been rejected. ${loan.rejectReason || "Contact support for more information."}`,
        completed: `Congratulations! You have successfully repaid your loan of ${loan.currency} ${loan.amountApproved}.`,
        defaulted: ` Your loan of ${loan.currency} ${loan.amountApproved} has been marked as defaulted. Please contact support immediately.`,
      };

      const colors = {
        approved: "success",
        active: "success",
        completed: "success",
        rejected: "danger",
        defaulted: "danger",
        pending: "warning",
      };

      const badges = {
        approved: `Approved: ${loan.amountApproved} ${loan.currency}`,
        active: `Active: ${loan.amountApproved} ${loan.currency}`,
        completed: "Repaid",
        rejected: "Rejected",
        defaulted: "Defaulted",
        pending: "Pending",
      };

      return await Notification.create({
        user: userId,
        title: titles[status] || " Loan Update",
        message: messages[status] || "Your loan status has been updated.",
        type: "loan",
        priority: status === "approved" || status === "rejected" || status === "defaulted" ? "high" : "medium",
        color: colors[status] || "info",
        badge: badges[status],
        relatedTo: {
          modelType: "Loan",
          modelId: loan._id,
        },
        actions: [
          {
            label: "View Loan",
            url: `/dashboard/loans/${loan._id}`,
            method: "GET",
            style: status === "approved" || status === "active" ? "success" : "primary",
          },
          {
            label: "Make Payment",
            url: `/dashboard/loans/${loan._id}/pay`,
            method: "GET",
            style: "secondary",
            show: ["active", "defaulted"].includes(status)
          }
        ].filter(action => action.show === undefined || action.show),
        icon: "loan",
        metadata: {
          amountRequested: loan.amountRequested,
          amountApproved: loan.amountApproved,
          currency: loan.currency,
          status: status,
          dueDate: loan.dueDate
        }
      });
    } catch (error) {
      console.error("Error creating loan notification:", error);
      return null;
    }
  }

  // Enhanced trade notification
  static async createTradeNotification(userId, order, result) {
    try {
      const titles = {
        win: "🎉 Trade Won!",
        loss: "📉 Trade Closed",
        break_even: "➖ Trade Break Even",
        completed: "✅ Trade Completed",
        expired: "⏰ Trade Expired",
        cancelled: "❌ Trade Cancelled",
      };

      const messages = {
        win: `Congratulations! Your ${order.symbol} ${order.direction} trade made a profit of $${order.profit?.toFixed(2) || 0}.`,
        loss: `Your ${order.symbol} ${order.direction} trade resulted in a loss of $${Math.abs(order.profit || 0).toFixed(2)}.`,
        break_even: `Your ${order.symbol} ${order.direction} trade closed at break even.`,
        completed: `Your ${order.symbol} ${order.direction} trade has been completed.`,
        expired: `Your ${order.symbol} ${order.direction} trade has expired.`,
        cancelled: `Your ${order.symbol} ${order.direction} trade has been cancelled.`,
      };

      const colors = {
        win: "success",
        loss: "danger",
        break_even: "warning",
        completed: "info",
        expired: "warning",
        cancelled: "danger",
      };

      const badges = {
        win: `+$${order.profit?.toFixed(2)}`,
        loss: `-$${Math.abs(order.profit || 0).toFixed(2)}`,
        break_even: "Break Even",
        completed: "Completed",
        expired: "Expired",
        cancelled: "Cancelled",
      };

      return await Notification.create({
        user: userId,
        title: titles[result] || "Trade Update",
        message: messages[result] || "Your trade status has been updated.",
        type: "trade",
        priority: result === "win" ? "high" : "medium",
        color: colors[result] || "info",
        badge: badges[result],
        relatedTo: {
          modelType: "Order",
          modelId: order._id,
        },
        actions: [
          {
            label: "View Trade",
            url: `/dashboard/trades/${order._id}`,
            method: "GET",
            style: result === "win" ? "success" : "primary",
          },
          {
            label: "New Trade",
            url: "/dashboard/trade",
            method: "GET",
            style: "secondary",
          }
        ],
        icon: "trade",
        metadata: {
          symbol: order.symbol,
          direction: order.direction,
          amount: order.amount,
          profit: order.profit,
          result: result,
          leverage: order.leverage
        }
      });
    } catch (error) {
      console.error("Error creating trade notification:", error);
      return null;
    }
  }

  // Enhanced KYC notification
  static async createKYCNotification(userId, kyc, status) {
    try {
      const titles = {
        pending: " KYC Submitted",
        under_review: "KYC Under Review",
        approved: "KYC Approved",
        rejected: "KYC Rejected",
      };

      const messages = {
        pending: "Your KYC documents have been submitted successfully.",
        under_review: "Your KYC documents are under review. This may take 24-48 hours.",
        approved: " Congratulations! Your KYC verification has been approved. You now have access to all platform features.",
        rejected: `Your KYC verification has been rejected. ${kyc.rejectionReason || "Please submit valid documents."}`,
      };

      const colors = {
        approved: "success",
        rejected: "danger",
        pending: "warning",
        under_review: "info",
      };

      const badges = {
        approved: "Verified",
        rejected: "Rejected",
        pending: "Pending",
        under_review: "Review",
      };

      const actions = [
        {
          label: "View KYC",
          url: `/dashboard/kyc/${kyc._id}`,
          method: "GET",
          style: status === "approved" ? "success" : "primary",
        }
      ];

      if (status === "rejected") {
        actions.push({
          label: "Resubmit KYC",
          url: "/dashboard/kyc/submit",
          method: "GET",
          style: "danger",
        });
      }

      return await Notification.create({
        user: userId,
        title: titles[status] || " KYC Update",
        message: messages[status] || "Your KYC status has been updated.",
        type: "kyc",
        priority: status === "approved" || status === "rejected" ? "high" : "medium",
        color: colors[status] || "info",
        badge: badges[status],
        relatedTo: {
          modelType: "KYC",
          modelId: kyc._id,
        },
        actions: actions,
        icon: "kyc",
        metadata: {
          status: status,
          rejectionReason: kyc.rejectionReason,
          riskLevel: kyc.riskLevel
        }
      });
    } catch (error) {
      console.error("Error creating KYC notification:", error);
      return null;
    }
  }

  // Create system notification with rich features
  static async createSystemNotification(userId, title, message, options = {}) {
    try {
      const notificationData = {
        user: userId,
        title,
        message,
        type: "system",
        priority: options.priority || "medium",
        color: options.color || "info",
        badge: options.badge,
        relatedTo: options.relatedTo,
        actions: options.actions || [],
        icon: options.icon || "system",
        metadata: options.metadata,
        expiresAt: options.expiresAt
      };

      // Add emoji if not present
      if (!notificationData.title.match(/[\u{1F300}-\u{1F9FF}]/gu)) {
        const emojis = {
          info: "ℹ",
          success: "",
          warning: "",
          danger: "",
          update: "",
          maintenance: "",
          announcement: ""
        };
        notificationData.title = `${emojis[options.color] || "📌"} ${notificationData.title}`;
      }

      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (error) {
      console.error("Error creating system notification:", error);
      return null;
    }
  }

  // Get user notifications with enhanced filtering
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        status,
        type,
        limit = 15,
        skip = 0,
        unreadOnly = false,
        priority,
        startDate,
        endDate
      } = options;

      const query = { user: userId };

      if (unreadOnly) {
        query.status = "unread";
      } else if (status) {
        query.status = status;
      }

      if (type && type !== 'all') {
        query.type = type;
      }

      if (priority) {
        query.priority = priority;
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      // Add time ago for each notification
      const notificationsWithTime = notifications.map(notification => ({
        ...notification,
        timeAgo: getTimeAgo(notification.createdAt)
      }));

      const unreadCount = await Notification.countDocuments({
        user: userId,
        status: "unread",
      });

      return {
        notifications: notificationsWithTime,
        unreadCount,
        hasMore: notifications.length === limit,
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return { notifications: [], unreadCount: 0, hasMore: false };
    }
  }

  // Mark multiple notifications as read
  static async markMultipleAsRead(userId, notificationIds) {
    try {
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          user: userId,
          status: "unread"
        },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error("Error marking multiple notifications as read:", error);
      return 0;
    }
  }

  // Get notification summary for dashboard
  static async getNotificationSummary(userId) {
    try {
      const summary = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ["$status", "unread"] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
            urgentPriority: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },

            // Count by type
            depositCount: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, 1, 0] } },
            withdrawalCount: { $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, 1, 0] } },
            tradeCount: { $sum: { $cond: [{ $eq: ["$type", "trade"] }, 1, 0] } },
            loanCount: { $sum: { $cond: [{ $eq: ["$type", "loan"] }, 1, 0] } },
            kycCount: { $sum: { $cond: [{ $eq: ["$type", "kyc"] }, 1, 0] } },
            systemCount: { $sum: { $cond: [{ $eq: ["$type", "system"] }, 1, 0] } },

            // Latest notification
            latest: { $max: "$createdAt" }
          }
        }
      ]);

      // Get recent notifications
      const recent = await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // Add time ago to recent notifications
      const recentWithTime = recent.map(notification => ({
        ...notification,
        timeAgo: getTimeAgo(notification.createdAt)
      }));

      return {
        summary: summary[0] || {
          total: 0,
          unread: 0,
          highPriority: 0,
          urgentPriority: 0,
          depositCount: 0,
          withdrawalCount: 0,
          tradeCount: 0,
          loanCount: 0,
          kycCount: 0,
          systemCount: 0,
          latest: null
        },
        recent: recentWithTime
      };
    } catch (error) {
      console.error("Error getting notification summary:", error);
      return {
        summary: {
          total: 0,
          unread: 0,
          highPriority: 0,
          urgentPriority: 0,
          depositCount: 0,
          withdrawalCount: 0,
          tradeCount: 0,
          loanCount: 0,
          kycCount: 0,
          systemCount: 0,
          latest: null
        },
        recent: []
      };
    }
  }
}

// Helper function for time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = [
    { label: 'y', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
    { label: 's', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label}`;
    }
  }

  return 'just now';
}

export default NotificationService;