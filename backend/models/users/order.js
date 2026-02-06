import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      // Format: INV-<FY>-<SERIAL> (e.g., INV-2526-0001)
      // Max length: 16 characters
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null/undefined
          // Format: INV-<FY>-<SERIAL>
          return /^INV-\d{4}-\d{4}$/.test(v) && v.length <= 16;
        },
        message: 'Invoice number must be in format INV-YYYY-XXXX and max 16 characters',
      },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        productImage: {
          type: String,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        gstPercentage: {
          type: Number,
          default: 0,
          min: 0,
        },
        gstAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    deliveryAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      addressLine1: {
        type: String,
        required: true,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      landmark: {
        type: String,
      },
      gstNumber: {
        type: String,
      },
    },
    billingDetails: {
      cartTotal: {
        type: Number,
        required: true,
        min: 0,
      },
      gstAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      shippingCharges: {
        type: Number,
        required: true,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentId: {
      type: String, // For online payments - Razorpay payment ID
    },
    transactionId: {
      type: String, // For tracking transactions
    },
    couponAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    deliveryDate: {
      type: Date,
    },
    // Vendor information - which vendor and service city this order belongs to
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      index: true,
    },
    vendorServiceCityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      index: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
// Note: orderNumber and invoiceNumber already have unique: true which creates an index
// vendorId and vendorServiceCityId already have index: true in their field definition
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ vendorId: 1, vendorServiceCityId: 1 }); // Compound index for vendor queries

// Note: orderNumber is generated in the controller (orderController.js)
// to ensure uniqueness before order creation

const Order = mongoose.model('Order', orderSchema);
export default Order;

