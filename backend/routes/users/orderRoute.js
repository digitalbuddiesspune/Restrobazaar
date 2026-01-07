import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from '../../controller/users/orderController.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const orderRouter = express.Router();

// All order routes require authentication
orderRouter.route('/orders')
  .post(authenticate, createOrder)
  .get(authenticate, getUserOrders);

orderRouter.route('/orders/:id')
  .get(authenticate, getOrderById);

orderRouter.route('/orders/:id/cancel')
  .put(authenticate, cancelOrder);

export default orderRouter;

