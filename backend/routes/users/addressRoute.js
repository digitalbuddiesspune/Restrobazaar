import express from "express";
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../controller/users/addressController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const addressRouter = express.Router();

// All routes require authentication
addressRouter.get("/addresses", authenticate, getUserAddresses);
addressRouter.get("/addresses/:id", authenticate, getAddressById);
addressRouter.post("/addresses", authenticate, createAddress);
addressRouter.put("/addresses/:id", authenticate, updateAddress);
addressRouter.delete("/addresses/:id", authenticate, deleteAddress);

export default addressRouter;

