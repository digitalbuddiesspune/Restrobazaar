import express from "express";
const userRouter = express.Router();
import { getAllUsers } from "../controller/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

// Get all users (Admin only)
userRouter.route("/admin/users").get(
  authenticate,
  authorize('admin', 'super_admin', 'city_admin'),
  getAllUsers
);

export default userRouter;

