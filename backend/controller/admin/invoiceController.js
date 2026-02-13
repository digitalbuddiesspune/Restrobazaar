import { 
  generateNextInvoiceNumber, 
  getCurrentInvoiceCounter,
  generateInvoiceNumberForFY,
  validateInvoiceNumber,
  getCurrentFinancialYear
} from '../../services/invoiceNumberService.js';

/**
 * @desc    Generate next invoice number for current financial year
 * @route   POST /api/v1/admin/invoices/generate
 * @access  Super Admin / Admin
 */
export const generateInvoiceNumber = async (req, res) => {
  try {
    const invoiceNumber = await generateNextInvoiceNumber();
    
    const fyInfo = getCurrentFinancialYear();
    
    res.status(200).json({
      success: true,
      message: 'Invoice number generated successfully',
      data: {
        invoiceNumber,
        financialYear: fyInfo.fyString,
      },
    });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice number',
      error: error.message,
    });
  }
};

/**
 * @desc    Get current invoice counter status
 * @route   GET /api/v1/admin/invoices/status
 * @access  Super Admin / Admin
 */
export const getInvoiceCounterStatus = async (req, res) => {
  try {
    const counterInfo = await getCurrentInvoiceCounter();
    
    res.status(200).json({
      success: true,
      data: counterInfo,
    });
  } catch (error) {
    console.error('Error getting invoice counter status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice counter status',
      error: error.message,
    });
  }
};

/**
 * @desc    Validate invoice number format
 * @route   POST /api/v1/admin/invoices/validate
 * @access  Super Admin / Admin
 */
export const validateInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required',
      });
    }

    const isValid = validateInvoiceNumber(invoiceNumber);

    res.status(200).json({
      success: true,
      data: {
        invoiceNumber,
        isValid,
      },
    });
  } catch (error) {
    console.error('Error validating invoice number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate invoice number',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate invoice number for an existing order
 * @route   POST /api/v1/admin/invoices/generate-for-order/:orderId
 * @access  Super Admin / Admin
 */
export const generateInvoiceForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order already has an invoice number
    if (order.invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order already has an invoice number. Invoice numbers cannot be changed once assigned.',
        data: {
          invoiceNumber: order.invoiceNumber,
        },
      });
    }

    // Generate invoice number
    const invoiceNumber = await generateNextInvoiceNumber();

    // Update order with invoice number
    order.invoiceNumber = invoiceNumber;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Invoice number generated and assigned to order',
      data: {
        orderId: order._id,
        invoiceNumber,
        financialYear: getCurrentFinancialYear().fyString,
      },
    });
  } catch (error) {
    console.error('Error generating invoice for order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice number for order',
      error: error.message,
    });
  }
};