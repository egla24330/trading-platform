// controllers/adminNotificationController.js
import Notification from "../models/Notification.js";

class AdminNotificationController {
  // Get all notifications (admin)
  static async getAllNotifications(req, res) {
    try {
      const { 
        userId, 
        type, 
        status, 
        startDate, 
        endDate,
        limit = 50,
        skip = 0
      } = req.query;

      const query = {};

      if (userId) query.user = userId;
      if (type) query.type = type;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const notifications = await Notification.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      const total = await Notification.countDocuments(query);

      res.json({
        success: true,
        data: notifications,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching notifications",
        error: error.message
      });
    }
  }

  // Send notification to user (admin)
  static async sendNotification(req, res) {
    try {
      const { userId, title, message, type, priority } = req.body;

      const notification = new Notification({
        user: userId,
        title,
        message,
        type: type || 'system',
        priority: priority || 'medium',
        icon: 'admin-icon',
        color: 'info'
      });

      await notification.save();

      res.json({
        success: true,
        message: "Notification sent successfully",
        data: notification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error sending notification",
        error: error.message
      });
    }
  }

  // Broadcast notification to all users (admin)
  static async broadcastNotification(req, res) {
    try {
      const { title, message, type, priority } = req.body;

      // Get all active users
      const users = await User.find({ isBlocked: false }).select('_id');

      const notifications = users.map(user => ({
        user: user._id,
        title,
        message,
        type: type || 'system',
        priority: priority || 'medium',
        icon: 'broadcast-icon',
        color: 'info'
      }));

      await Notification.insertMany(notifications);

      res.json({
        success: true,
        message: `Notification broadcasted to ${users.length} users`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error broadcasting notification",
        error: error.message
      });
    }
  }
}

export default AdminNotificationController;