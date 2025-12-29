import express from "express";
const productRouterV2 = express.Router();
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controller/productControllerV2.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

productRouterV2.route("/create-product").post(createProduct);
productRouterV2.route("/get-products").get(getProducts);
productRouterV2.route("/get-product/:id").get(getProductById);
productRouterV2.route("/update-product/:id").put(updateProduct);
productRouterV2.route("/delete-product/:id").delete(deleteProduct);

export default productRouterV2;
