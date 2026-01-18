// models/Withdrawal.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USDT", "BTC", "ETH", "BNB"],
      required: true,
    },
    network: {
      type: String,
      required: true,
    },
    toAddress: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed", "Rejected"],
      default: "Pending",
    },
    approvedAmount: {
      type: Number,
    },
    rejectReason: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
    confirmations: {
      type: Number,
      default: 0,
    },
    userBalanceAtTime: {
      type: Number,
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Generate unique withdrawal ID
/*withdrawalSchema.pre("save", async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.models.Withdrawal.countDocuments();
    this.transactionId = `WDID${String(count + 1).padStart(9, "0")}`;
  }
  next();
});
*/
withdrawalSchema.post('save', async function(doc) {
  try {
    // Use setTimeout to avoid blocking the save operation
    setTimeout(async () => {
      try {
        if (doc.isModified('status')) {
          console.log(`🔄 Withdrawal ${doc._id} status changed to: ${doc.status}`);
          
          // Use dynamic import to avoid circular dependencies
          const NotificationHelper = (await import('../utils/notificationHelper.js')).default;
          
          if (NotificationHelper && typeof NotificationHelper.createWithdrawalNotification === 'function') {
            const notification = await NotificationHelper.createWithdrawalNotification(doc);
            if (notification) {
              console.log(`✅ Notification created: ${notification._id}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error in notification timeout:', error.message);
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in withdrawal post-save hook:', error.message);
  }
});

const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;