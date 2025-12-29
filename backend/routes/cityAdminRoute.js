import express from "express";
const cityAdminRouter = express.Router();
import { createCityAdmin, getCityAdmins, deleteCityAdmin } from "../controller/cityAdminController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Create city admin (Super admin only)
cityAdminRouter.route("/admin/city-admin").post(
  authenticate,
  authorize('super_admin'),
  createCityAdmin
);

// Get all city admins (Super admin only)
cityAdminRouter.route("/admin/city-admins").get(
  authenticate,
  authorize('super_admin'),
  getCityAdmins
);

// Delete city admin (Super admin only)
cityAdminRouter.delete("/admin/city-admin/:id",
  authenticate,
  authorize('super_admin'),
  deleteCityAdmin
);

export default cityAdminRouter;

