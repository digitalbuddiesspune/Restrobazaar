import express from "express";
const testimonialRouter = express.Router();
import {
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
} from "../../controller/admin/testimonialController.js";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from "../../middleware/authMiddleware.js";

// Public routes
testimonialRouter.get("/testimonials", optionalAuthenticate, getAllTestimonials);
testimonialRouter.get("/testimonials/:id", getTestimonialById);

// Admin routes
testimonialRouter.post(
  "/testimonials",
  authenticate,
  authorize("admin", "super_admin"),
  createTestimonial
);
testimonialRouter.put(
  "/testimonials/:id",
  authenticate,
  authorize("admin", "super_admin"),
  updateTestimonial
);
testimonialRouter.delete(
  "/testimonials/:id",
  authenticate,
  authorize("admin", "super_admin"),
  deleteTestimonial
);
testimonialRouter.patch(
  "/testimonials/:id/toggle-status",
  authenticate,
  authorize("admin", "super_admin"),
  toggleTestimonialStatus
);

export default testimonialRouter;
