import express from "express";
const globalProductRouter = express.Router();
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  toggleProductStatus,
} from "../../controller/admin/globalProductController.js";
import { authenticate, authorize, optionalAuthenticate } from "../../middleware/authMiddleware.js";

// Public routes
globalProductRouter.get("/products", optionalAuthenticate, getAllProducts);
globalProductRouter.get("/products/:id", getProductById);
globalProductRouter.get("/products/search/:query", searchProducts);
globalProductRouter.get("/products/category/:categoryId", getProductsByCategory);

// Admin routes
globalProductRouter.post("/products", authenticate, authorize("admin", "super_admin"), createProduct);
globalProductRouter.put("/products/:id", authenticate, authorize("admin", "super_admin"), updateProduct);
globalProductRouter.delete("/products/:id", authenticate, authorize("admin", "super_admin"), deleteProduct);
globalProductRouter.patch("/products/:id/toggle-status", authenticate, authorize("admin", "super_admin"), toggleProductStatus);

export default globalProductRouter;




