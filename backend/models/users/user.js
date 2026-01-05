import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // Ensure phone numbers are unique
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },
    wishlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }

  // Hash password with cost of 10
  const hashedPassword = await bcrypt.hash(this.password, 10);
  this.password = hashedPassword;
});

const User = mongoose.model("User", userSchema);
export default User;
