import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: { type: String, required: true, unique: true },

    // Search and tags
    searchTags: [{ type: String }],

    // Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: { type: String },
    otherCategory: { type: String },

    // Location
    city: { type: String },

    // Pricing
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    purchaseAmount: { type: Number },
    purchaseMode: { 
      type: String, 
      enum: ['Cash', 'Online', 'Bank Transfer', 'Cash & Online', 'Cash & Bank Transfer', 'Online & Bank Transfer', 'Cash & Online & Bank Transfer'],
      default: 'Cash & Online & Bank Transfer'
    },

    // Product details
    shortDescription: { type: String },
    description: { type: String },
    weight: { type: Number }, // in Kg
    units: { 
      type: String, 
      enum: ['Kg', 'g', 'L', 'ml', 'Piece', 'Pieces', 'Box', 'Pack', 'Pkt', 'Jar', 'Bottle', 'Tray', 'Roll'],
      default: 'Kg'
    },

    // Stock management
    quantity: { type: Number, default: 0 },
    availableStock: { type: Number, default: 0 },
    maintainQtyForNotification: { type: Number },
    stockStatus: { 
      type: String, 
      enum: ['instock', 'outofstock', 'lowstock'],
      default: 'instock'
    },
    minimumOrderableQuantity: { type: Number, default: 1 },
    incrementor: { type: Number }, // Optional

    // Tax and GST
    hsnCode: { type: String },
    gstOrTaxPercent: { type: Number },
    igst: { type: Number },
    cgst: { type: Number },
    sgst: { type: Number },

    // Product settings
    isReturnable: { type: Boolean, default: false },
    sequenceListing: { type: Number, default: 0 },
    allProductsOrder: { type: Number, default: 0 }, // Order for All Products page
    isActive: { type: Boolean, default: true },

    // Images
    images: [{ type: String, required: true }],
    galleryImages: [{ type: String }],

    // Specifications and features
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    features: [String],

    // Bulk offers
    bulkOffers: [
      {
        minQty: Number,
        pricePerPiece: Number,
      },
    ],

    // Purchase info
    productPurchaseFrom: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

