import express from "express";
import {
  getLoans,
  getLoanById,
  createLoan,
  approveLoan,
  rejectLoan,
  disburseLoan,
  recordPayment,
  reviewPayment,
  getDashboardStats,
  getUserLoans,
  updateLoan,
  deleteLoan,
  getPaymentsForReview,
  getPaymentStats,
  exportPayments,
  getActiveLoans,
  submitLoanPayment,
  getPaymentDetails,
  bulkReviewPayments,
  getPaymentAuditTrail
} from "../controllers/loanController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { loanPaymentUpload } from "../middlewares/loanPaymentMiddleware.js";

const loanRouter = express.Router();

// Public routes (if any)
// router.post("/", createLoan); // Usually protected

// Protected routes
loanRouter.use(protect);

// User-specific routes
loanRouter.post("/", createLoan);
loanRouter.get("/user/:userId", getUserLoans);
loanRouter.post("/:id/payments", recordPayment);
loanRouter.post('/payments/submit',  loanPaymentUpload,submitLoanPayment);
loanRouter.post('/payments/deposit', submitLoanPayment);

 //loanRouter.get("/:id", getLoanById);

loanRouter.get("/active", getActiveLoans);


// Admin routes
loanRouter.use(authorize('admin', 'editor'))

// Admin payment review routes



///////

loanRouter.get("/admin/payments", getPaymentsForReview);
loanRouter.get("/admin/payments/:paymentId", getPaymentDetails);
loanRouter.put("/admin/payments/:paymentId/review", reviewPayment);
loanRouter.put("/admin/payments/bulk-review", bulkReviewPayments);
loanRouter.get("/admin/payments/stats", getPaymentStats);
loanRouter.get("/admin/payments/export", exportPayments);
loanRouter.get("/admin/payments/:paymentId/audit", protect, authorize('admin'), getPaymentAuditTrail);

////

loanRouter.get("/", getLoans);
loanRouter.put("/:id", updateLoan);
loanRouter.delete("/:id", deleteLoan);
loanRouter.put("/:id/approve", approveLoan);
loanRouter.put("/:id/reject", rejectLoan);
loanRouter.put("/:id/disburse", disburseLoan);
loanRouter.put("/:loanId/payments/:paymentId", reviewPayment);
loanRouter.get("/dashboard/stats", getDashboardStats);

export default loanRouter;