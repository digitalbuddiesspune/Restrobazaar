import express from "express";
const vendorRouter = express.Router();
import {
  getAllVendors,
  getVendorById,
  getVendorByEmail,
  createVendor,
  updateVendor,
  updateVendorPassword,
  updateVendorKycStatus,
  updateVendorApproval,
  deleteVendor,
  toggleVendorActive,
  updateLastLogin,
  getVendorsByCity,
  getVendorsByKycStatus,
  vendorLogin,
  vendorLogout,
  getVendorProfile,
  getVendorBankDetails,
} from "../../controller/admin/vendorController.js";
import { authenticate, authorize } from "../../middleware/authMiddleware.js";

// Admin routes - All vendor routes require admin authentication
vendorRouter.get("/vendors", authenticate, authorize("admin", "super_admin"), getAllVendors);
vendorRouter.get("/vendors/:id", authenticate, authorize("admin", "super_admin"), getVendorById);
vendorRouter.get("/vendors/email/:email", authenticate, authorize("admin", "super_admin"), getVendorByEmail);
vendorRouter.get("/vendors/city/:cityId", authenticate, authorize("admin", "super_admin"), getVendorsByCity);
vendorRouter.get("/vendors/kyc/:status", authenticate, authorize("admin", "super_admin"), getVendorsByKycStatus);

vendorRouter.post("/vendors", authenticate, authorize("admin", "super_admin"), createVendor);
vendorRouter.put("/vendors/:id", authenticate, authorize("admin", "super_admin"), updateVendor);
vendorRouter.put("/vendors/:id/password", authenticate, authorize("admin", "super_admin"), updateVendorPassword);
vendorRouter.put("/vendors/:id/kyc-status", authenticate, authorize("admin", "super_admin"), updateVendorKycStatus);
vendorRouter.put("/vendors/:id/approval", authenticate, authorize("admin", "super_admin"), updateVendorApproval);
vendorRouter.delete("/vendors/:id", authenticate, authorize("admin", "super_admin"), deleteVendor);
vendorRouter.patch("/vendors/:id/toggle-active", authenticate, authorize("admin", "super_admin"), toggleVendorActive);
vendorRouter.patch("/vendors/:id/update-last-login", authenticate, authorize("admin", "super_admin", "vendor"), updateLastLogin);

// Vendor routes - Vendors can access their own profile
vendorRouter.get("/vendor/me", authenticate, authorize("vendor"), getVendorProfile);
vendorRouter.post("/vendor/logout", authenticate, authorize("vendor"), vendorLogout);

// Public routes - No authentication required
vendorRouter.post("/vendors/login", vendorLogin);
vendorRouter.get("/vendors/:id/bank-details", getVendorBankDetails);

export default vendorRouter;




