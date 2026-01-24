import express from 'express';
import {
  generateInvoiceNumber,
  getInvoiceCounterStatus,
  validateInvoice,
  generateInvoiceForOrder,
} from '../../controller/admin/invoiceController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const invoiceRouter = express.Router();

// All routes require authentication and admin/super_admin authorization
invoiceRouter.post(
  '/admin/invoices/generate',
  authenticate,
  authorize('admin', 'super_admin'),
  generateInvoiceNumber
);

invoiceRouter.get(
  '/admin/invoices/status',
  authenticate,
  authorize('admin', 'super_admin'),
  getInvoiceCounterStatus
);

invoiceRouter.post(
  '/admin/invoices/validate',
  authenticate,
  authorize('admin', 'super_admin'),
  validateInvoice
);

invoiceRouter.post(
  '/admin/invoices/generate-for-order/:orderId',
  authenticate,
  authorize('admin', 'super_admin'),
  generateInvoiceForOrder
);

export default invoiceRouter;
