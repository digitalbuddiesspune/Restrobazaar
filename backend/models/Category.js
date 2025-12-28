import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
    description: { type: String },
    subcategories: [{ type: String }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // For controlling display order in sidebar
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);

