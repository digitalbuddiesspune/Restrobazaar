import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["signup", "login"],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiration
    },
  },
  { timestamps: true }
);

// Index for faster lookups
otpSchema.index({ phone: 1, type: 1, verified: 1 });
otpSchema.index({ email: 1, type: 1, verified: 1 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
