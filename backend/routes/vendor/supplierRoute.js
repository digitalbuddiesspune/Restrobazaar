import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
} from '../../controller/vendor/supplierController.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';

const supplierRouter = express.Router();

// All routes require vendor authentication
supplierRouter.use(authenticate, authorize('vendor'));

// CRUD routes
supplierRouter.get('/vendor/suppliers', getSuppliers);
supplierRouter.get('/vendor/suppliers/:id', getSupplierById);
supplierRouter.post('/vendor/suppliers', createSupplier);
supplierRouter.put('/vendor/suppliers/:id', updateSupplier);
supplierRouter.delete('/vendor/suppliers/:id', deleteSupplier);

// Toggle status
supplierRouter.patch('/vendor/suppliers/:id/toggle-status', toggleSupplierStatus);

export default supplierRouter;
