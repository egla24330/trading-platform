// routes/tradeRoutes.js
import express from "express";
import { tradeController } from "../controllers/tradeController.js";
//import { authenticate, isAdmin } from "../middleware/auth.js";
import { protect,authorize} from "../middlewares/authMiddleware.js";

const tradeRouter = express.Router();

// All routes require authentication
tradeRouter.use(protect);

// Order Management
//tradeRouter.post("/place", tradeController.placeOrder);
tradeRouter.post("/place", tradeController.placeOrder);
tradeRouter.get("/active", tradeController.getActiveOrders);
tradeRouter.get("/completed", tradeController.getCompletedOrders);

tradeRouter.get("/balance", tradeController.getBalance);

tradeRouter.get("/:orderId", tradeController.getOrderById);
tradeRouter.post("/:orderId/cancel", tradeController.cancelOrder);



// Statistics & Balance
///tradeRouter.get("/stats/summary", tradeController.getTradingStats);

tradeRouter.use(authorize('admin', 'support'));
// Admin routes
tradeRouter.post("/admin/force-win/:userId", tradeController.toggleForceWin);
tradeRouter.post("/admin/process-expired", tradeController.processExpiredOrders);

export default tradeRouter;