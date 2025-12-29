import mongoose from "mongoose";

/* ================================
   BULK PRICE TIER SCHEMA
   ================================ */
const bulkPriceTierSchema = new mongoose.Schema(
  {
    minQty: {
      type: Number,
      required: true, // 50, 200, 500
    },

    pricePerUnit: {
      type: Number,
      required: true, // 0.91, 0.88
    },

    unit: {
      type: String,
      default: "piece",
    },
  },
  { _id: false }
);

/* ================================
   PRODUCT SCHEMA
   ================================ */
const productSchema = new mongoose.Schema(
  {
    /* BASIC DETAILS */
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    searchTags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    shortDescription: {
      type: String,
      trim: true,
    },

    /* CATEGORY */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategory: {
      type: String,
      index: true,
    },

    otherCategory: String,

    /* LOCATION (SINGLE CITY) */
    city: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    /* UNIT & WEIGHT */
    unit: {
      type: String,
      default: "piece",
    },

    weight: String,
    capacity: String,
    size: {
      height: String,
      width: String,
      base: String,
    },

    /* TAX */
    hsnCode: String,

    gst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    /* PRICING TYPE */
    priceType: {
      type: String,
      enum: ["single", "bulk", "both"],
      required: true,
    },

    /* DISCOUNTED PRICE */
    discountedPrice: {
      type: Number,
    },

    /* SINGLE PRICE */
    singlePrice: {
      type: Number,
    },

    /* BULK PRICE TIERS */
    bulkPrices: {
      type: [bulkPriceTierSchema],
      default: [],
    },

    /* ORDER & STOCK */
    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },

    availableStock: {
      type: Number,
      default: 0,
    },

    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock", "limited"],
      default: "in_stock",
    },

    maintainQtyForNotification: {
      type: Number,
      default: 0,
    },

    /* FLAGS */
    isReturnable: {
      type: Boolean,
      default: false,
    },

    showOnSpecialPage: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },

    /* IMAGES */
    images: [
      {
        url: String,
        alt: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* ================================
   INDEXES
   ================================ */
productSchema.index({ category: 1 });
productSchema.index({ city: 1 });
productSchema.index({ status: 1 });

export default mongoose.model("ProductV2", productSchema);
