import express from "express";
import {
  getCurrentUser,
  getUserById,
  updateUser,
  updateUserCart,
  userSignup,
  userSignin,
  userLogout,
} from "../../controller/users/userController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
const userRouter = express.Router();

// Public routes - Signup and Signin
userRouter.post("/users/signup", userSignup);
userRouter.post("/users/signin", userSignin);

// Protected routes - Logout
userRouter.post("/users/logout", authenticate, userLogout);

// User routes - Users can access their own profile
userRouter.get("/users/me", authenticate, getCurrentUser);
userRouter.get("/users/:id", authenticate, getUserById);
userRouter.put("/users/:id", authenticate, updateUser);
userRouter.patch("/users/:id/cart", authenticate, updateUserCart);



export default userRouter;
