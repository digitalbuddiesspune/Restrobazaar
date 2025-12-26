import express from "express";
const categoryRouter = express.Router();
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
} from "../controller/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Public routes
categoryRouter.get("/categories", getAllCategories);
categoryRouter.get("/categories/slug/:slug", getCategoryBySlug);
categoryRouter.post("/categories/seed", authenticate, authorize("admin"), seedCategories); // Seed endpoint

// Admin routes
categoryRouter.post("/categories", authenticate, authorize("admin"), createCategory);
categoryRouter.put("/categories/:id", authenticate, authorize("admin"), updateCategory);
categoryRouter.delete("/categories/:id", authenticate, authorize("admin"), deleteCategory);

export default categoryRouter;

