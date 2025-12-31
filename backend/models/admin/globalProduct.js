import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
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
    productPurchasedFrom: String,
    purchasedMode: String,
    purchasedAmount: String,
    shortDescription: String,

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    subCategory: {
      type: String,
      index: true,
    },

    otherCategory: String,

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
      index: true,
    },

    /* IMAGES */
    images: [
      {
        url: String,
        alt: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
