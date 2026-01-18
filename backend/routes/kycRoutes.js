import express from "express";
import {
  submitKYC,
  getAllKYC,
  getKYCById,
  getUserKYCStatus,
  approveKYC,
  rejectKYC,
  markForReview,
  getKYCStats,
  deleteKYC,
  updateKYC,
  checkKYCRequirement
} from "../controllers/kycController.js";
import { protect,authorize} from "../middlewares/authMiddleware.js";
import { kycUploadMiddleware, validateKYCFiles, cleanupOldKYCDocuments } from "../middlewares/kycUploadMiddleware.js";

const kycRouter = express.Router();

// Protected routes (user routes)
kycRouter.use(protect);

kycRouter.post("/submit", kycUploadMiddleware, validateKYCFiles, submitKYC);
kycRouter.get("/user/status", getUserKYCStatus);
kycRouter.get("/check-requirement", checkKYCRequirement);
kycRouter.get("/:id", getKYCById);
kycRouter.put("/:id", kycUploadMiddleware, validateKYCFiles, cleanupOldKYCDocuments, updateKYC);

// Admin routes
//kycRouter.use(admin);
kycRouter.use(authorize('admin', 'editor'))
kycRouter.get("/", getAllKYC);
kycRouter.get("/dashboard/stats", getKYCStats);
kycRouter.put("/:id/approve", approveKYC);
kycRouter.put("/:id/reject", rejectKYC);
kycRouter.put("/:id/review", markForReview);
kycRouter.delete("/:id", deleteKYC);

export default kycRouter;