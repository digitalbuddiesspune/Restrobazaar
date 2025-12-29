import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import User from '../models/user.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    // If wishlist doesn't exist, create one
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [],
      });
    }

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message,
    });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if product is active
    if (product.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available',
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [],
      });
    }

    // Check if product already exists in wishlist
    if (wishlist.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    // Add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();

    // Populate product details
    await wishlist.populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message,
    });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    // Check if product exists in wishlist
    if (!wishlist.products.includes(productId)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
      });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      (product) => product.toString() !== productId
    );
    await wishlist.save();

    // Populate product details
    await wishlist.populate({
      path: 'products',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist,
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message,
    });
  }
};

// Check if product is in wishlist
export const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        isInWishlist: false,
      });
    }

    const isInWishlist = wishlist.products.some(
      (product) => product.toString() === productId
    );

    res.status(200).json({
      success: true,
      isInWishlist,
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message,
    });
  }
};


