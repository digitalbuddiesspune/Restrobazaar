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
  if (this.priceType === "single") {
    if (!this.pricing?.single?.price) {
      return next(new Error("Single price is required"));
    }
    this.pricing.bulk = [];
  }

  if (this.priceType === "bulk") {
    if (!this.pricing?.bulk?.length) {
      return next(new Error("At least one bulk price slab is required"));
    }
    this.pricing.single = undefined;
  }

  next();
});
const VendorProduct = mongoose.model("VendorProduct", vendorProductSchema);
export default VendorProduct;