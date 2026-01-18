// controllers/notificationController.js
import Notification from "../models/Notification.js";

class NotificationController {
  // Get user notifications with filtering
  static async getNotifications(req, res) {
    try {
      const userId = req.user._id;
      const { 
        status, 
        type, 
        limit = 15, 
        skip = 0, 
        unreadOnly 
      } = req.query;

      const query = { user: userId };

      if (unreadOnly === 'true') {
        query.status = "unread";
      } else if (status) {
        query.status = status;
      }

      if (type && type !== 'all') {
        query.type = type;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      // Transform data for frontend
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        timeAgo: getTimeAgo(notification.createdAt)
      }));

      const unreadCount = await Notification.countDocuments({
        user: userId,
        status: "unread",
      });

      // Get counts for all types
      const counts = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $facet: {
            all: [{ $count: "count" }],
            unread: [{ $match: { status: "unread" } }, { $count: "count" }],
            deposit: [{ $match: { type: "deposit" } }, { $count: "count" }],
            withdrawal: [{ $match: { type: "withdrawal" } }, { $count: "count" }],
            trade: [{ $match: { type: "trade" } }, { $count: "count" }],
            loan: [{ $match: { type: "loan" } }, { $count: "count" }],
            kyc: [{ $match: { type: "kyc" } }, { $count: "count" }],
            system: [{ $match: { type: "system" } }, { $count: "count" }],
          }
        }
      ]);

      // Format counts
      const notificationCounts = {
        all: counts[0]?.all[0]?.count || 0,
        unread: counts[0]?.unread[0]?.count || 0,
        deposit: counts[0]?.deposit[0]?.count || 0,
        withdrawal: counts[0]?.withdrawal[0]?.count || 0,
        trade: counts[0]?.trade[0]?.count || 0,
        loan: counts[0]?.loan[0]?.count || 0,
        kyc: counts[0]?.kyc[0]?.count || 0,
        system: counts[0]?.system[0]?.count || 0,
      };

      res.json({
        success: true,
        data: transformedNotifications,
        unreadCount,
        counts: notificationCounts,
        hasMore: notifications.length === parseInt(limit)
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching notifications",
        error: error.message
      });
    }
  }

  // Get notification stats (for the header)
  static async getNotificationStats(req, res) {
    try {
      const userId = req.user._id;

      const stats = await Notification.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ["$status", "unread"] }, 1, 0] }
            },
            highPriority: {
              $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] }
            },
            urgentPriority: {
              $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            type: "$_id",
            count: 1,
            unread: 1,
            highPriority: 1,
            urgentPriority: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalUnread = await Notification.countDocuments({
        user: userId,
        status: "unread"
      });

      res.json({
        success: true,
        data: stats,
        totalUnread,
        total: await Notification.countDocuments({ user: userId })
      });
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching notification stats",
        error: error.message
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({ 
        _id: id, 
        user: userId 
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }

      await notification.markAsRead();

      // Get updated counts
      const unreadCount = await Notification.countDocuments({
        user: userId,
        status: "unread",
      });

      res.json({
        success: true,
        message: "Notification marked as read",
        data: notification,
        unreadCount
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Error marking notification as read",
        error: error.message
      });
    }
  }

  // Mark all as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user._id;

      const result = await Notification.updateMany(
        { user: userId, status: "unread" },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

      res.json({
        success: true,
        message: "All notifications marked as read",
        unreadCount: 0,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Error marking all notifications as read",
        error: error.message
      });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({ 
        _id: id, 
        user: userId 
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }

      const wasUnread = notification.status === 'unread';
      await notification.deleteOne();

      // Get updated unread count
      const unreadCount = await Notification.countDocuments({
        user: userId,
        status: "unread",
      });

      res.json({
        success: true,
        message: "Notification deleted",
        wasUnread,
        unreadCount
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting notification",
        error: error.message
      });
    }
  }

  // Clear all read notifications
  static async clearAllNotifications(req, res) {
    try {
      const userId = req.user._id;
      
      const result = await Notification.deleteMany({
        user: userId,
        status: "read"
      });

      res.json({
        success: true,
        message: "All read notifications cleared",
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      res.status(500).json({
        success: false,
        message: "Error clearing notifications",
        error: error.message
      });
    }
  }

  // Get notification by ID with details
  static async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({ 
        _id: id, 
        user: userId 
      })
      .populate('relatedTo.modelId')
      .lean();
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }

      // Add time ago
      notification.timeAgo = getTimeAgo(notification.createdAt);

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching notification",
        error: error.message
      });
    }
  }

  // Get notifications for notification center (paginated)
  static async getNotificationCenter(req, res) {
    try {
      const userId = req.user._id;
      const { 
        page = 1, 
        limit = 50,
        type,
        status,
        priority,
        startDate,
        endDate 
      } = req.query;

      const skip = (page - 1) * limit;
      const query = { user: userId };

      // Apply filters
      if (type && type !== 'all') query.type = type;
      if (status && status !== 'all') query.status = status;
      if (priority && priority !== 'all') query.priority = priority;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Notification.countDocuments(query)
      ]);

      // Transform data
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        timeAgo: getTimeAgo(notification.createdAt)
      }));

      res.json({
        success: true,
        data: transformedNotifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching notification center:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching notifications",
        error: error.message
      });
    }
  }

  // Batch update notifications
  static async batchUpdateNotifications(req, res) {
    try {
      const userId = req.user._id;
      const { ids, action } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No notification IDs provided"
        });
      }

      let update = {};
      let message = "";

      switch (action) {
        case 'mark-read':
          update = { status: 'read', readAt: new Date() };
          message = "Notifications marked as read";
          break;
        case 'mark-unread':
          update = { status: 'unread', readAt: null };
          message = "Notifications marked as unread";
          break;
        case 'archive':
          update = { status: 'archived' };
          message = "Notifications archived";
          break;
        case 'delete':
          const result = await Notification.deleteMany({
            _id: { $in: ids },
            user: userId
          });
          return res.json({
            success: true,
            message: `${result.deletedCount} notifications deleted`,
            deletedCount: result.deletedCount
          });
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid action"
          });
      }

      const result = await Notification.updateMany(
        { _id: { $in: ids }, user: userId },
        { $set: update }
      );

      res.json({
        success: true,
        message,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error("Error batch updating notifications:", error);
      res.status(500).json({
        success: false,
        message: "Error updating notifications",
        error: error.message
      });
    }
  }
}

// Helper function to calculate time ago
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

export default NotificationController;