import InvoiceNumberCounter from '../models/admin/invoiceNumberCounter.js';

/**
 * Invoice Number Generation Service
 * Generates GST-compliant invoice numbers as per Indian Government rules
 * 
 * Rules:
 * - Invoice number must be UNIQUE for each financial year
 * - Must be CONSECUTIVE (no random numbers)
 * - Maximum length: 16 CHARACTERS
 * - Format: INV-<FY>-<SERIAL>
 * - Resets every financial year (Apr 1 – Mar 31)
 * - Once generated, invoice number must NEVER change
 */

/**
 * Get current financial year information
 * @returns {Object} Financial year details
 */
export const getCurrentFinancialYear = () => {
  return InvoiceNumberCounter.getCurrentFinancialYear();
};

/**
 * Generate next invoice number for the current financial year
 * This function is thread-safe and ensures consecutive numbering
 * 
 * @returns {Promise<string>} Next invoice number (e.g., "INV-2526-0001")
 */
export const generateNextInvoiceNumber = async () => {
  try {
    // Get current financial year
    const fyInfo = InvoiceNumberCounter.getCurrentFinancialYear();
    const financialYear = fyInfo.fyString;

    // Get or create counter for this financial year
    const counter = await InvoiceNumberCounter.getOrCreateCounter(financialYear);

    // Generate next invoice number (this increments the counter)
    const invoiceNumber = await counter.getNextInvoiceNumber();

    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    throw new Error(`Failed to generate invoice number: ${error.message}`);
  }
};

/**
 * Generate invoice number for a specific financial year
 * (Useful for testing or manual generation)
 * 
 * @param {string} financialYear - Financial year in format YYYY-YY (e.g., "2025-26")
 * @returns {Promise<string>} Next invoice number for that FY
 */
export const generateInvoiceNumberForFY = async (financialYear) => {
  try {
    // Validate financial year format
    if (!/^\d{4}-\d{2}$/.test(financialYear)) {
      throw new Error('Financial year must be in format YYYY-YY (e.g., 2025-26)');
    }

    // Get or create counter for this financial year
    const counter = await InvoiceNumberCounter.getOrCreateCounter(financialYear);

    // Generate next invoice number
    const invoiceNumber = await counter.getNextInvoiceNumber();

    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number for FY:', error);
    throw new Error(`Failed to generate invoice number: ${error.message}`);
  }
};

/**
 * Get the last invoice number for current financial year
 * (Useful for displaying current status)
 * 
 * @returns {Promise<Object>} Counter information
 */
export const getCurrentInvoiceCounter = async () => {
  try {
    const fyInfo = InvoiceNumberCounter.getCurrentFinancialYear();
    const financialYear = fyInfo.fyString;

    const counter = await InvoiceNumberCounter.findOne({ financialYear });

    if (!counter) {
      return {
        financialYear,
        lastSerialNumber: 0,
        nextInvoiceNumber: `INV-${fyInfo.fyString.split('-').map(y => y.slice(-2)).join('')}-0001`,
      };
    }

    const nextSerial = counter.lastSerialNumber + 1;
    const fyParts = financialYear.split('-');
    const fyShort = `${fyParts[0].slice(-2)}${fyParts[1]}`;
    const nextInvoiceNumber = `INV-${fyShort}-${String(nextSerial).padStart(4, '0')}`;

    return {
      financialYear,
      lastSerialNumber: counter.lastSerialNumber,
      nextInvoiceNumber,
      lastUpdated: counter.lastUpdated,
    };
  } catch (error) {
    console.error('Error getting current invoice counter:', error);
    throw new Error(`Failed to get invoice counter: ${error.message}`);
  }
};

/**
 * Validate invoice number format
 * 
 * @param {string} invoiceNumber - Invoice number to validate
 * @returns {boolean} True if valid format
 */
export const validateInvoiceNumber = (invoiceNumber) => {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') {
    return false;
  }

  // Format: INV-<FY>-<SERIAL>
  // Example: INV-2526-0001
  const pattern = /^INV-\d{4}-\d{4}$/;
  
  if (!pattern.test(invoiceNumber)) {
    return false;
  }

  // Check length (max 16 characters)
  if (invoiceNumber.length > 16) {
    return false;
  }

  // Check allowed characters: A-Z, 0-9, hyphen (-)
  const allowedChars = /^[A-Z0-9-]+$/;
  if (!allowedChars.test(invoiceNumber)) {
    return false;
  }

  return true;
};