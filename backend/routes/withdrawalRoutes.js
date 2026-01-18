// routes/withdrawalRoutes.js
import express from "express";
import {
    createWithdrawal,
    getAllWithdrawals,
    getWithdrawalById,
    approveWithdrawal,
    updateTransactionHash,
    rejectWithdrawal,
   // getUserWithdrawals,
    getWithdrawalStats,
} from "../controllers/withdrawalController.js";
import { protect,authorize } from "../middlewares/authMiddleware.js";

const withdrawalRoute = express.Router();
withdrawalRoute.use(protect);
// User routes
withdrawalRoute.post("/", createWithdrawal);
//withdrawalRoute.get("/user", getUserWithdrawals);
withdrawalRoute.get("/:id", getWithdrawalById);


withdrawalRoute.use(authorize('admin', 'support'));

// Admin routes
withdrawalRoute.get("/", getAllWithdrawals);
withdrawalRoute.get("/stats", getWithdrawalStats);

withdrawalRoute.put("/:id/approve", approveWithdrawal);
withdrawalRoute.put("/:id/reject", rejectWithdrawal);
withdrawalRoute.put("/:id/hash", updateTransactionHash);

export default withdrawalRoute;