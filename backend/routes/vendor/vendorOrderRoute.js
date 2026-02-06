import express from 'express';
const vendorOrderRouter = express.Router();
import {
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  updateVendorPaymentStatus,
  updateVendorOrderItems,
  getVendorOrderStats,
  createOrderForUser,
  generateInvoiceForVendorOrder,
} from '../../controller/vendor/vendorOrderController.js';
import { getVendorUsers, createVendorUser } from '../../controller/vendor/vendorUserController.js';
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from '../../controller/vendor/vendorAddressController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

// Vendor order routes - All require vendor authentication
vendorOrderRouter.get('/vendor/orders', authenticate, authorize('vendor'), getVendorOrders);
vendorOrderRouter.get('/vendor/orders/stats', authenticate, authorize('vendor'), getVendorOrderStats);
vendorOrderRouter.get('/vendor/orders/:id', authenticate, authorize('vendor'), getVendorOrderById);
vendorOrderRouter.patch('/vendor/orders/:id/status', authenticate, authorize('vendor'), updateVendorOrderStatus);
vendorOrderRouter.patch('/vendor/orders/:id/payment-status', authenticate, authorize('vendor'), updateVendorPaymentStatus);
vendorOrderRouter.patch('/vendor/orders/:id/items', authenticate, authorize('vendor'), updateVendorOrderItems);
vendorOrderRouter.post('/vendor/orders/:id/generate-invoice', authenticate, authorize('vendor'), generateInvoiceForVendorOrder);

// Vendor user routes - For creating orders on behalf of users
vendorOrderRouter.get('/vendor/users', authenticate, authorize('vendor'), getVendorUsers);
vendorOrderRouter.post('/vendor/new-user', authenticate, authorize('vendor'), createVendorUser);
vendorOrderRouter.post('/vendor/orders/create-for-user', authenticate, authorize('vendor'), createOrderForUser);

// Vendor address routes - For managing user addresses
vendorOrderRouter.get('/vendor/addresses/user/:userId', authenticate, authorize('vendor'), getUserAddresses);
vendorOrderRouter.post('/vendor/addresses', authenticate, authorize('vendor'), createUserAddress);
vendorOrderRouter.put('/vendor/addresses/:id', authenticate, authorize('vendor'), updateUserAddress);
vendorOrderRouter.delete('/vendor/addresses/:id', authenticate, authorize('vendor'), deleteUserAddress);

export default vendorOrderRouter;

