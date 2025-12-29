import Cart from '../models/cart.js';
import Product from '../models/Product.js';
import User from '../models/user.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    // If cart doesn't exist, create one
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        totalPrice: 0,
      });
      
      // Update user's cart reference
      await User.findByIdAndUpdate(userId, { cart: cart._id });
    }

    // Calculate total price
    let totalPrice = 0;
    if (cart.items && cart.items.length > 0) {
      cart.items.forEach(item => {
        if (item.product && item.product.price) {
          totalPrice += item.product.price * item.quantity;
        }
      });
    }

    // Update cart total price
    cart.totalPrice = totalPrice;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message,
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity = 1 } = req.body;

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

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        totalPrice: 0,
      });
      
      // Update user's cart reference
      await User.findByIdAndUpdate(userId, { cart: cart._id });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
      });
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of cart.items) {
      const productData = await Product.findById(item.product);
      if (productData && productData.price) {
        totalPrice += productData.price * item.quantity;
      }
    }

    cart.totalPrice = totalPrice;
    await cart.save();

    // Populate product details
    await cart.populate({
      path: 'items.product',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message,
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and valid quantity are required',
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    cart.items[itemIndex].quantity = quantity;

    // Calculate total price
    let totalPrice = 0;
    for (const item of cart.items) {
      const productData = await Product.findById(item.product);
      if (productData && productData.price) {
        totalPrice += productData.price * item.quantity;
      }
    }

    cart.totalPrice = totalPrice;
    await cart.save();

    // Populate product details
    await cart.populate({
      path: 'items.product',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message,
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    // Calculate total price
    let totalPrice = 0;
    for (const item of cart.items) {
      const productData = await Product.findById(item.product);
      if (productData && productData.price) {
        totalPrice += productData.price * item.quantity;
      }
    }

    cart.totalPrice = totalPrice;
    await cart.save();

    // Populate product details
    await cart.populate({
      path: 'items.product',
      model: 'Product',
      populate: {
        path: 'category',
        model: 'Category',
        select: 'name slug'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message,
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ user: userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message,
    });
  }
};


