import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One wishlist per user
    },
    products: [
      {
        vendorProduct: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "VendorProduct",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Note: user field already has unique: true which creates an index
wishlistSchema.index({ "products.vendorProduct": 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
