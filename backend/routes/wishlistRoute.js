import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
} from '../controller/wishlistController.js';

const router = express.Router();

// All wishlist routes require authentication
router.use(authenticate);

// Get user's wishlist
router.get('/', getWishlist);

// Add product to wishlist
router.post('/add', addToWishlist);

// Remove product from wishlist
router.delete('/remove', removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', checkWishlist);

export default router;


