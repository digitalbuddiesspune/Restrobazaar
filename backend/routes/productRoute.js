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
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Public routes
productRouter.get("/products", getAllProducts);
productRouter.get("/products/category/:categorySlug", getProductsByCategory);
productRouter.get("/products/slug/:slug", getProductBySlug);
productRouter.get("/products/:id", getProductById);

// Admin routes
productRouter.post("/products", authenticate, authorize("admin"), createProduct);
productRouter.put("/products/:id", authenticate, authorize("admin"), updateProduct);
productRouter.delete("/products/:id", authenticate, authorize("admin"), deleteProduct);

export default productRouter;

