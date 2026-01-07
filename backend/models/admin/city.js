import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    /* ============================
       CORE CITY IDENTITY
    ============================ */
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,        // pune, mumbai, delhi
      index: true,
    },

    displayName: {
      type: String,
      required: true,     // Pune, Mumbai
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "India",
    },

    /* ============================
       DELIVERY / SERVICE DATA
    ============================ */
    pincodePrefixes: [
      {
        type: String,     // "411", "400"
      },
    ],

    isServiceable: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ============================
       ADMIN CONTROL
    ============================ */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    priority: {
      type: Number,
      default: 0,         // useful for sorting cities in UI
    },
  },
  { timestamps: true }
);

/* ============================
   INDEXES
============================ */
citySchema.index({ name: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ isServiceable: 1 });

export default mongoose.model("City", citySchema);
