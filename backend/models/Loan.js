import mongoose from "mongoose";

const loanPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["external_wallet", "deposit_account", "card", "other"],
    default: "external_wallet"
  },
  currency: { type: String, required: true },
  network: String, // For external wallet payments
  txHash: String, // For external wallet payments
  fromAddress: String, // For external wallet payments
  toAddress: String, // For external wallet payments
  proofImage: {    
    url: String,
    publicId: String,
    filename: String
  },
    // For external wallet payments
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending"
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewNote: String,
  date: { type: Date, default: Date.now },
  depositTransactionId: String, // For deposit account payments
  metadata: mongoose.Schema.Types.Mixed // Additional data
});


const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  loanId: {
    type: String,
    unique: true,
    default: () => `LOAN${Date.now()}${Math.floor(Math.random() * 1000)}`
  },

  packageId: { type: String, required: true },
  packageTitle: String,
  interestRate: Number,
  repaymentPeriod: Number, // in days

  amountRequested: { type: Number, required: true },
  amountApproved: { type: Number, default: 0 },
  currency: {
    type: String,
    default: "USDT",
    enum: ["USDT", "USDC", "BTC", "ETH", "USD"]
  },

  totalAmountDue: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["pending", "approved", "active", "rejected", "completed", "defaulted"],
    default: "pending"
  },

  purpose: String,
  creditScore: Number,

  applicationDate: { type: Date, default: Date.now },
  approvalDate: Date,
  disbursementDate: Date,
  dueDate: Date,
  completionDate: Date,

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rejectReason: String,

  // Collateral information
  collateral: {
    type: String,
    enum: ["crypto", "property", "vehicle", "none"],
    default: "none"
  },
  collateralValue: Number,
  collateralDetails: String,

  payments: [loanPaymentSchema],

  // Auto-calculate fields
  isOverdue: { type: Boolean, default: false },
  daysOverdue: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});



// Static method to get dashboard stats
loanSchema.statics.getDashboardStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalLoans: { $sum: 1 },
        totalAmountRequested: { $sum: "$amountRequested" },
        totalAmountApproved: { $sum: "$amountApproved" },
        totalAmountPaid: { $sum: "$amountPaid" },
        pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        activeCount: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        approvedCount: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        rejectedCount: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        defaultedCount: { $sum: { $cond: [{ $eq: ["$status", "defaulted"] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    totalLoans: 0,
    totalAmountRequested: 0,
    totalAmountApproved: 0,
    totalAmountPaid: 0,
    pendingCount: 0,
    activeCount: 0,
    approvedCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    defaultedCount: 0
  };
};


loanSchema.post('save', async function(doc) {
  if (doc.isModified('status')) {
    const NotificationService = await import('../services/notificationService.js');
    await NotificationService.default.notifyLoanUpdate(doc);
  }
});
const Loan = mongoose.model("Loan", loanSchema);
export default Loan;
