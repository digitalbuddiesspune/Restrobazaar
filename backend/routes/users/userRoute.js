import express from "express";
const userRouter = express.Router();
import {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  updateUserRole,
  getUserByEmail,
  updateUserCart,
} from "../../controller/users/userController.js";
import { authenticate, authorize } from "../../middleware/authMiddleware.js";

// Public routes - None (all user routes require authentication)

// User routes - Users can access their own profile
userRouter.get("/users/me", authenticate, getCurrentUser);
userRouter.get("/users/:id", authenticate, getUserById);
userRouter.put("/users/:id", authenticate, updateUser);
userRouter.patch("/users/:id/cart", authenticate, updateUserCart);

// Admin routes - Admin can manage all users
userRouter.get("/admin/users", authenticate, authorize("admin", "super_admin", "city_admin"), getAllUsers);
userRouter.post("/admin/users", authenticate, authorize("admin", "super_admin"), createUser);
userRouter.get("/admin/users/role/:role", authenticate, authorize("admin", "super_admin"), getUsersByRole);
userRouter.get("/admin/users/email/:email", authenticate, authorize("admin", "super_admin"), getUserByEmail);
userRouter.delete("/users/:id", authenticate, authorize("admin", "super_admin"), deleteUser);
userRouter.patch("/admin/users/:id/role", authenticate, authorize("admin", "super_admin"), updateUserRole);

export default userRouter;
