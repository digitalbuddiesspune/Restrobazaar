import express from "express";
const productRouter = express.Router();
import {
  getAllProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
} from "../controller/productController.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/authMiddleware.js";

// Public routes (with optional authentication for city admin filtering)
productRouter.get("/products", optionalAuthenticate, getAllProducts);
productRouter.get("/products/category/:categorySlug", optionalAuthenticate, getProductsByCategory);
productRouter.get("/products/slug/:slug", optionalAuthenticate, getProductBySlug);
productRouter.get("/products/:id", optionalAuthenticate, getProductById);

// Admin routes (allow admin, super_admin, and city_admin)
productRouter.post("/products", authenticate, authorize("admin", "super_admin", "city_admin"), createProduct);
productRouter.put("/products/:id", authenticate, authorize("admin", "super_admin", "city_admin"), updateProduct);
productRouter.delete("/products/:id", authenticate, authorize("admin", "super_admin", "city_admin"), deleteProduct);

export default productRouter;

