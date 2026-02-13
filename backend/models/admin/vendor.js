import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const vendorSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
    },
    vendorType: {
      type: String,
      enum: ["individual", "shop", "wholesaler", "manufacturer"],
      default: "shop",
    },
    /* ============================
       AUTH (VENDOR LOGIN)
    ============================ */
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    /* ============================
       CONTACT PERSON
    ============================ */
    contactPerson: {
      name: String,
      phone: String,
      email: String,
    },

    /* ============================
       ADDRESS
    ============================ */
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },

    /* ============================
       TAX & KYC
    ============================ */
    gstNumber: {
      type: String,
      trim: true,
    },

    panNumber: {
      type: String,
      trim: true,
    },

    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },

    kycDocuments: [
      {
        type: {
          type: String, // gst, pan, aadhaar, etc.
        },
        url: String,
      },
    ],

    /* ============================
       SERVICE CITIES
    ============================ */
    serviceCities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        index: true,
      },
    ],

    /* ============================
       COMMISSION & PAYOUT
    ============================ */
    commissionPercentage: {
      type: Number,
      default: 0,
    },

    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifsc: String,
      bankName: String,
      upiId: String,
    },

    /* ============================
       STATUS FLAGS
    ============================ */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    approvedAt: Date,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    lastLoginAt: Date,
    deviceTokens: [
      {
        token: {
          type: String,
          trim: true,
        },
        platform: {
          type: String,
          enum: ["android", "ios", "web", "unknown"],
          default: "unknown",
        },
        deviceId: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
