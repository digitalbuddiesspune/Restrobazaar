import mongoose from 'mongoose';

/**
 * Invoice Number Counter Schema
 * Tracks the last invoice number for each financial year
 * Financial Year in India: April 1 to March 31
 * Format: INV-<FY>-<SERIAL>
 * Example: INV-2526-0001 (FY 2025-26, Serial 1)
 */
const invoiceNumberCounterSchema = new mongoose.Schema(
  {
    financialYear: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // Format: YYYY-YY (e.g., "2025-26")
      // This represents the financial year (April YYYY to March YY+1)
      validate: {
        validator: function (v) {
          // Validate format: YYYY-YY (e.g., "2025-26")
          return /^\d{4}-\d{2}$/.test(v);
        },
        message: 'Financial year must be in format YYYY-YY (e.g., 2025-26)',
      },
    },
    lastSerialNumber: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Track when the counter was last updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness
invoiceNumberCounterSchema.index({ financialYear: 1 }, { unique: true });

// Static method to get current financial year
invoiceNumberCounterSchema.statics.getCurrentFinancialYear = function () {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Financial year starts from April (month 4)
  // If current month is April or later, FY is current year to next year
  // If current month is Jan-Mar, FY is previous year to current year
  let fyStartYear, fyEndYear;

  if (currentMonth >= 4) {
    // April to December: FY is current year to next year
    fyStartYear = currentYear;
    fyEndYear = currentYear + 1;
  } else {
    // January to March: FY is previous year to current year
    fyStartYear = currentYear - 1;
    fyEndYear = currentYear;
  }

  // Format: YYYY-YY (e.g., 2025-26)
  const fyString = `${fyStartYear}-${String(fyEndYear).slice(-2)}`;
  return {
    fyString,
    startYear: fyStartYear,
    endYear: fyEndYear,
    startDate: new Date(fyStartYear, 3, 1), // April 1
    endDate: new Date(fyEndYear, 2, 31, 23, 59, 59, 999), // March 31
  };
};

// Static method to get or create counter for a financial year
invoiceNumberCounterSchema.statics.getOrCreateCounter = async function (financialYear) {
  let counter = await this.findOne({ financialYear });

  if (!counter) {
    counter = await this.create({
      financialYear,
      lastSerialNumber: 0,
    });
  }

  return counter;
};

// Method to get next invoice number
invoiceNumberCounterSchema.methods.getNextInvoiceNumber = async function () {
  // Increment serial number
  this.lastSerialNumber += 1;
  this.lastUpdated = new Date();
  await this.save();

  // Format: INV-<FY>-<SERIAL>
  // FY format: YY-YY (e.g., 25-26 for 2025-26)
  const fyParts = this.financialYear.split('-');
  const fyShort = `${fyParts[0].slice(-2)}${fyParts[1]}`; // e.g., "2526" from "2025-26"

  // Serial number: 4 digits with leading zeros (e.g., 0001, 0002, ..., 9999)
  const serial = String(this.lastSerialNumber).padStart(4, '0');

  // Format: INV-2526-0001
  const invoiceNumber = `INV-${fyShort}-${serial}`;

  // Validate length (max 16 characters)
  if (invoiceNumber.length > 16) {
    throw new Error(`Invoice number exceeds 16 characters: ${invoiceNumber}`);
  }

  return invoiceNumber;
};

const InvoiceNumberCounter = mongoose.model('InvoiceNumberCounter', invoiceNumberCounterSchema);

export default InvoiceNumberCounter;
