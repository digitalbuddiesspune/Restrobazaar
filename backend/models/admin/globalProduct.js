import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    searchTags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  
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

    /* MRP / Original price (for showing strikethrough when selling price is lower) */
    originalPrice: {
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
