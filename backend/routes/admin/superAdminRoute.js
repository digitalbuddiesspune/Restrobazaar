import express from "express";

import {
  getAllSuperAdmins,
  getSuperAdminById,
  getSuperAdminByEmail,
  createSuperAdmin,
  updateSuperAdmin,
  updateSuperAdminPassword,
  updateSuperAdminPermissions,
  deleteSuperAdmin,
  toggleSuperAdminActive,
  updateLastLogin,
  superAdminLogin,
} from "../../controller/admin/superAdminController.js";
import { getAllOrders } from "../../controller/admin/adminOrderController.js";
import { authenticate, authorize } from "../../middleware/authMiddleware.js";

// Super Admin routes - All routes require super_admin authentication
// Alias route for backward compatibility
const superAdminRouter = express.Router();
superAdminRouter.route("/admin/super-admin").post(createSuperAdmin);

superAdminRouter.get(
  "/admin/super_admin",
  authorize("admin", "super_admin"),
  authenticate,
  getAllSuperAdmins
);

superAdminRouter.get(
  "/admin/super-admins/:id",
  authenticate,
  authorize("super_admin"),
  getSuperAdminById
);
superAdminRouter.get(
  "/admin/super-admins/email/:email",
  authenticate,
  authorize("super_admin"),
  getSuperAdminByEmail
);

superAdminRouter.post(
  "/admin/super-admins",
  authenticate,
  authorize("admin", "super_admin"),
  createSuperAdmin
);
superAdminRouter.put(
  "/admin/super-admins/:id",
  authenticate,
  authorize("super_admin"),
  updateSuperAdmin
);
superAdminRouter.put(
  "/admin/super-admins/:id/password",
  authenticate,
  authorize("super_admin"),
  updateSuperAdminPassword
);
superAdminRouter.put(
  "/admin/super-admins/:id/permissions",
  authenticate,
  authorize("super_admin"),
  updateSuperAdminPermissions
);
superAdminRouter.delete(
  "/admin/super-admins/:id",
  authenticate,
  authorize("super_admin"),
  deleteSuperAdmin
);
superAdminRouter.patch(
  "/admin/super-admins/:id/toggle-active",
  authenticate,
  authorize("super_admin"),
  toggleSuperAdminActive
);
superAdminRouter.patch(
  "/admin/super-admins/:id/update-last-login",
  authenticate,
  authorize("super_admin"),
  updateLastLogin
);

superAdminRouter.post("/admin/super-admin/login", superAdminLogin);

// Order routes for super admin
superAdminRouter.get(
  "/admin/orders",
  authenticate,
  authorize("super_admin"),
  getAllOrders
);

export default superAdminRouter;
