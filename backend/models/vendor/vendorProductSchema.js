import mongoose from "mongoose";

const bulkPriceSchema = new mongoose.Schema(
  {
    minQty: {
      type: Number,
      required: true,
    },

    maxQty: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const vendorProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    /* 🔥 PRICE TYPE SELECTOR */
    priceType: {
      type: String,
      enum: ["single", "bulk"],
      required: true,
    },
    defaultPrice: {
      type: Number,
      default: 0,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    productPurchasedFrom: String,
    purchasedMode: String,
    purchasedAmount: String,
    gst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    /* 🔥 PRICING (SINGLE FIELD) */
    pricing: {
      single: {
        price: {
          type: Number,
        },
      },

      bulk: {
        type: [bulkPriceSchema],
        default: [],
      },
    },

    /* STOCK */
    availableStock: {
      type: Number,
      default: 0,
    },

    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },
    notifyQuantity: {
      type: Number,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
vendorProductSchema.pre("save", function (next) {
  try {
    // Cleanup pricing based on priceType
    if (this.priceType === "single") {
      // Clear bulk pricing when using single
      if (this.pricing && this.pricing.bulk) {
        this.pricing.bulk = [];
      }
    }

    if (this.priceType === "bulk") {
      // Clear single pricing when using bulk
      if (this.pricing && this.pricing.single) {
        this.pricing.single = undefined;
      }
    }

    // Only call next if it's a function (for callback-based saves)
    if (next && typeof next === "function") {
      next();
    }
  } catch (error) {
    // If next is available, pass the error
    if (next && typeof next === "function") {
      return next(error);
    }
    // Otherwise, throw the error (for promise-based saves)
    throw error;
  }
});
const VendorProduct = mongoose.model("VendorProduct", vendorProductSchema);
export default VendorProduct;