import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  alternatePhone: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Index for faster queries
supplierSchema.index({ vendorId: 1 });
supplierSchema.index({ vendorId: 1, isActive: 1 });
supplierSchema.index({ vendorId: 1, name: 'text', phone: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
