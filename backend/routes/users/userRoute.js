import express from "express";
import {
  getCurrentUser,
  getUserById,
  updateUser,
  getUserCart,
  updateUserCart,
  userSignup,
  userSignin,
  userLogout,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  sendOTPForSignup,
  verifyOTPAndSignup,
  sendOTPForLogin,
  verifyOTPAndLogin,
} from "../../controller/users/userController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
const userRouter = express.Router();

// Public routes - Signup and Signin (must be defined before parameterized routes)
// Note: Router is mounted at /api/v1, so these routes become /api/v1/users/signup, etc.

// OTP routes (must be before signup/signin routes)
userRouter.post("/users/send-otp-signup", sendOTPForSignup);
userRouter.post("/users/verify-otp-signup", verifyOTPAndSignup);
userRouter.post("/users/send-otp-login", sendOTPForLogin);
userRouter.post("/users/verify-otp-login", verifyOTPAndLogin);

// Traditional signup and signin routes (still available for backward compatibility)
userRouter.post("/users/signup", userSignup);
userRouter.post("/signup", userSignup); // Alternative path
userRouter.post("/users/signin", userSignin);
userRouter.post("/login", userSignin); // Alias for /users/signin
userRouter.post("/users/login", userSignin); // Another alias for convenience

// Protected routes - Logout
userRouter.post("/users/logout", authenticate, userLogout);

// User routes - Users can access their own profile
userRouter.get("/users/me", authenticate, getCurrentUser);

// Wishlist routes (MUST be before /users/:id to avoid route conflict)
userRouter.get("/users/wishlist", authenticate, getWishlist);
userRouter.post("/users/wishlist", authenticate, addToWishlist);
userRouter.delete("/users/wishlist/:productId", authenticate, removeFromWishlist);

// Parameterized routes (must come after specific routes)
userRouter.get("/users/:id", authenticate, getUserById);
userRouter.put("/users/:id", authenticate, updateUser);
userRouter.get("/users/:id/cart", authenticate, getUserCart);
userRouter.patch("/users/:id/cart", authenticate, updateUserCart);

export default userRouter;
