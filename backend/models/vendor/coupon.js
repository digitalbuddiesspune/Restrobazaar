import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
      // Only applicable for percentage discounts
    },
    minimumOrderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      min: 0,
      // Total usage limit (0 = unlimited)
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 0,
      // Per user usage limit (0 = unlimited)
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Customer assignment: if empty array, available to all customers
    // If has customer IDs, only those customers can use it
    assignedCustomers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Track usage
    usageCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
couponSchema.index({ vendorId: 1, isActive: 1 });
couponSchema.index({ code: 1, vendorId: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if coupon is valid
couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === 0 || this.usageCount < this.usageLimit)
  );
});

// Method to check if user can use this coupon
couponSchema.methods.canBeUsedBy = function (userId) {
  // Check if coupon is valid
  if (!this.isValid) {
    return { canUse: false, reason: "Coupon is not valid or expired" };
  }

  // Check customer assignment (optional - if empty, available to all customers)
  if (this.assignedCustomers.length > 0) {
    const userIdStr = userId.toString();
    const isAssigned = this.assignedCustomers.some(
      (customerId) => customerId.toString() === userIdStr
    );
    if (!isAssigned) {
      return { canUse: false, reason: "This coupon is not available for you" };
    }
  }

  // Check per user limit
  if (this.perUserLimit > 0) {
    const userUsageCount = this.usedBy.filter(
      (usage) => usage.userId.toString() === userId.toString()
    ).length;
    if (userUsageCount >= this.perUserLimit) {
      return { canUse: false, reason: "You have already used this coupon" };
    }
  }

  return { canUse: true };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (cartTotal) {
  if (cartTotal < this.minimumOrderAmount) {
    return { discount: 0, reason: `Minimum order amount is ₹${this.minimumOrderAmount}` };
  }

  let discount = 0;

  if (this.discountType === "percentage") {
    discount = (cartTotal * this.discountValue) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
    // Don't allow discount more than cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }
  }

  return { discount: Math.round(discount * 100) / 100 }; // Round to 2 decimal places
};

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
