import express from "express";
import {
  getDepositAddresses,
  createDeposit,
  //getUserDeposits,
  getDepositById,
  getDepositStats,
  getDashboardSummary,
  uploadAdditionalProof,
  
  // Admin functions
  getAllDeposits,
  updateDepositStatus,
  approveDeposit,
  rejectDeposit,
  markForReview,
  getAdminStats,
  deleteDeposit
} from "../controllers/depositController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { 
  depositProofUpload, 
  validateDepositFile,
  cleanupOldProof 
} from "../middlewares/depositUploadMiddleware.js";

const depositRouter = express.Router();

// ==================== USER ROUTES ====================
// All routes require authentication
depositRouter.use(protect);

// Get deposit addresses
depositRouter.get("/addresses", getDepositAddresses);

// Create new deposit
depositRouter.post(
  "/submit", 
  depositProofUpload, 
  validateDepositFile, 
  createDeposit
);

// Get user's deposits
//depositRouter.get("/my", getUserDeposits);

// Get user deposit stats
depositRouter.get("/stats", getDepositStats);

// Get dashboard summary
depositRouter.get("/dashboard/summary", getDashboardSummary);

// Get single deposit by ID
depositRouter.get("/:id", getDepositById);

// Upload additional proof for deposit
depositRouter.post(
  "/:id/proof", 
  depositProofUpload, 
  validateDepositFile, 
  cleanupOldProof,
  uploadAdditionalProof
);

// ==================== ADMIN ROUTES ====================
// Only admin and support roles can access these
depositRouter.use(authorize('admin', 'support'));

// Get all deposits (with filters)
depositRouter.get("/", getAllDeposits);

// Get admin dashboard statistics
depositRouter.get("/admin/stats", getAdminStats);

// Approve deposit
depositRouter.put("/:id/approve", approveDeposit);

// Reject deposit
depositRouter.put("/:id/reject", rejectDeposit);

// Mark deposit for review
depositRouter.put("/:id/review", markForReview);

// Update deposit status
depositRouter.put("/:id/status", updateDepositStatus);

// Delete deposit (soft delete)
depositRouter.delete("/:id", deleteDeposit);

export default depositRouter;