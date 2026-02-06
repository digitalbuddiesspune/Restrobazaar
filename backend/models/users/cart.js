import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One cart per user
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Can reference GlobalProduct or VendorProduct
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        // Store product details snapshot at time of adding to cart
        productName: {
          type: String,
        },
        productImage: {
          type: String,
        },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Optional: Store city/pincode for delivery calculation
    deliveryCity: {
      type: String,
    },
    deliveryPincode: {
      type: String,
    },
  },
  { timestamps: true }
);

// Calculate total amount before saving
cartSchema.pre("save", function () {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  } else {
    this.totalAmount = 0;
  }
});

// Note: user field already has unique: true which creates an index

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;



