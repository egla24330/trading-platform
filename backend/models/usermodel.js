import mongoose from "mongoose";
import bcrypt from "bcryptjs";



const KYCSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idType: { type: String, required: true }, // Passport, National ID, etc.
  idNumber: { type: String },
  idFrontImage: { type: String, required: true }, // file path or cloud URL
  idBackImage: { type: String }, // optional
  submittedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    telegramId: { type: String, unique: true, sparse: true },

    name: { type: String, required: true },
    userName: { type: String },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    password: { type: String }, // optional, only for manual signup

    // OTP for email/phone verification
    verifyOtp: { type: String, default: "" },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },


    // KYC

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "under_review", "approved", "rejected"],
      default: "not_submitted",
    },
    kyc: {
      type: KYCSchema,
      default: null, // null means not yet submitted
    },
    isKyc: { type: Boolean, default: false },
    // Password reset
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Wallet / Balance
    wallet: {
      usdt: { type: Number, default: 0 },
      btc: { type: Number, default: 0 },
      eth: { type: Number, default: 0 },
      loanUsdt: { type: Number, default: 0 }, // outstanding loan amount
    },

    loanUsdt: { type: Number, default: 0 }, // total outstanding debt
    loanStatus: {
      type: String,
      enum: ["no_active_loan", "active", "overdue", 'pending'],
      default: "no_active_loan"
    },

    // Account Status
    isBlocked: { type: Boolean, default: false },
    forceWin: { type: Boolean, default: false },
     // Statistics
    totalTrades: { type: Number, default: 0 },
    //winRate: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    totalLoss: { type: Number, default: 0 },


    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //nextEligibleLoanDate: { type: Date }

    
  },
  { timestamps: true }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
