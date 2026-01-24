import express from "express";
const couponRouter = express.Router();
import {
  getVendorCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCustomers,
  validateCoupon,
  getAvailableCoupons,
} from "../../controller/vendor/couponController.js";
import { authenticate, authorize } from "../../middleware/authMiddleware.js";

// Vendor coupon management routes
couponRouter.get("/vendor/coupons", authenticate, authorize("vendor"), getVendorCoupons);
couponRouter.get("/vendor/coupons/:id", authenticate, authorize("vendor"), getCouponById);
couponRouter.post("/vendor/coupons", authenticate, authorize("vendor"), createCoupon);
couponRouter.put("/vendor/coupons/:id", authenticate, authorize("vendor"), updateCoupon);
couponRouter.delete("/vendor/coupons/:id", authenticate, authorize("vendor"), deleteCoupon);
couponRouter.patch("/vendor/coupons/:id/status", authenticate, authorize("vendor"), toggleCouponStatus);

// Get customers for vendor to select
couponRouter.get("/vendor/customers", authenticate, authorize("vendor"), getCustomers);

// User routes for coupons
couponRouter.post("/coupons/validate", authenticate, authorize("user"), validateCoupon);
couponRouter.get("/coupons/available", authenticate, authorize("user"), getAvailableCoupons);

export default couponRouter;
