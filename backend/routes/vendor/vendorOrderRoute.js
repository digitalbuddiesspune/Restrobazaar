import express from 'express';
const vendorOrderRouter = express.Router();
import {
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  updateVendorPaymentStatus,
  updateVendorOrderItems,
  getVendorOrderStats,
} from '../../controller/vendor/vendorOrderController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

// Vendor order routes - All require vendor authentication
vendorOrderRouter.get('/vendor/orders', authenticate, authorize('vendor'), getVendorOrders);
vendorOrderRouter.get('/vendor/orders/stats', authenticate, authorize('vendor'), getVendorOrderStats);
vendorOrderRouter.get('/vendor/orders/:id', authenticate, authorize('vendor'), getVendorOrderById);
vendorOrderRouter.patch('/vendor/orders/:id/status', authenticate, authorize('vendor'), updateVendorOrderStatus);
vendorOrderRouter.patch('/vendor/orders/:id/payment-status', authenticate, authorize('vendor'), updateVendorPaymentStatus);
vendorOrderRouter.patch('/vendor/orders/:id/items', authenticate, authorize('vendor'), updateVendorOrderItems);

export default vendorOrderRouter;

