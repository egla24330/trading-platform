// routes/notificationRoutes.js
import express from "express";
import NotificationController from "../controllers/notificationController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.use(protect);

// Get notifications with filtering
notificationRouter.get("/", NotificationController.getNotifications);

// Get notification stats
notificationRouter.get("/stats", NotificationController.getNotificationStats);

// Get notification summary for dashboard
notificationRouter.get("/summary", async (req, res) => {
  try {
    const NotificationService = await import("../services/notificationService.js");
    const summary = await NotificationService.default.getNotificationSummary(req.user._id);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notification summary",
      error: error.message
    });
  }
});

// Get notification by ID
notificationRouter.get("/:id", NotificationController.getNotificationById);

// Mark notification as read
notificationRouter.patch("/:id/read", NotificationController.markAsRead);

// Mark all as read
notificationRouter.patch("/read-all", NotificationController.markAllAsRead);

// Delete notification
notificationRouter.delete("/:id", NotificationController.deleteNotification);

// Clear all read notifications
notificationRouter.delete("/clear", NotificationController.clearAllNotifications);

// Batch update notifications
notificationRouter.patch("/batch", NotificationController.batchUpdateNotifications);

// Notification center with pagination
notificationRouter.get("/center/all", NotificationController.getNotificationCenter);

export default notificationRouter;