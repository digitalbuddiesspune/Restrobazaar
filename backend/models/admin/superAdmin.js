import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const superAdminSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: {
      type: String,
      required: true,
      trim: true,
    },

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
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // VERY IMPORTANT
    },

    /* ABSOLUTE CONTROL FLAGS */
    permissions: {
      fullAccess: {
        type: Boolean,
        default: true,
      },

      canCreateAdmin: {
        type: Boolean,
        default: true,
      },

      canDeleteAdmin: {
        type: Boolean,
        default: true,
      },

      canManageSystemSettings: {
        type: Boolean,
        default: true,
      },
    },

    /* SECURITY */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
    },

    lastPasswordChangeAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


export default mongoose.model("SuperAdmin", superAdminSchema);