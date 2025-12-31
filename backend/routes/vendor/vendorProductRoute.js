import express from "express";
const vendorProductRouter = express.Router();
import {
  getAllVendorProducts,
  getVendorProductById,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorProductsByVendor,
  getVendorProductsByCity,
  updateVendorProductStock,
  toggleVendorProductStatus,
  getMyVendorProducts,
} from "../../controller/vendor/vendorProductController.js";
import { authenticate, authorize, optionalAuthenticate } from "../../middleware/authMiddleware.js";

// Public routes
vendorProductRouter.get("/vendor-products", optionalAuthenticate, getAllVendorProducts);
// Specific routes must come before parameterized routes
vendorProductRouter.get("/vendor-products/my-products", authenticate, authorize("vendor"), getMyVendorProducts);
vendorProductRouter.get("/vendor-products/vendor/:vendorId", optionalAuthenticate, getVendorProductsByVendor);
vendorProductRouter.get("/vendor-products/city/:cityId", optionalAuthenticate, getVendorProductsByCity);
// Parameterized route must come last
vendorProductRouter.get("/vendor-products/:id", optionalAuthenticate, getVendorProductById);

// Vendor routes - Vendors can manage their own products
vendorProductRouter.post("/vendor-products", authenticate, authorize("vendor", "admin", "super_admin"), createVendorProduct);
vendorProductRouter.put("/vendor-products/:id", authenticate, authorize("vendor", "admin", "super_admin"), updateVendorProduct);
vendorProductRouter.delete("/vendor-products/:id", authenticate, authorize("vendor", "admin", "super_admin"), deleteVendorProduct);
vendorProductRouter.patch("/vendor-products/:id/stock", authenticate, authorize("vendor", "admin", "super_admin"), updateVendorProductStock);
vendorProductRouter.patch("/vendor-products/:id/status", authenticate, authorize("vendor", "admin", "super_admin"), toggleVendorProductStatus);

export default vendorProductRouter;

