import express from "express";
import {
  createTestimonial,
  createBulkTestimonials,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  toggleTestimonialStatus,
  updateTestimonial,
} from "../../controller/admin/testimonialController.js";
import { optionalAuthenticate } from "../../middleware/authMiddleware.js";
const testimonialRouter = express.Router();

// Public routes
testimonialRouter.get(
  "/testimonials",
  optionalAuthenticate,
  getAllTestimonials
);
testimonialRouter.get("/testimonials/:id", getTestimonialById);

// Admin routes
testimonialRouter.post("/testimonials", createTestimonial);
testimonialRouter.post("/testimonials/bulk", createBulkTestimonials);
testimonialRouter.put(
  "/testimonials/:id",

  updateTestimonial
);
testimonialRouter.delete(
  "/testimonials/:id",

  deleteTestimonial
);
testimonialRouter.patch(
  "/testimonials/:id/toggle-status",

  toggleTestimonialStatus
);

export default testimonialRouter;
