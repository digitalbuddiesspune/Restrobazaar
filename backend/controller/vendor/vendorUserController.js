import User from '../../models/users/user.js';
import Cart from '../../models/users/cart.js';
import Wishlist from '../../models/users/wishlist.js';

// @desc    Get all users (for vendors to create orders)
// @route   GET /api/v1/vendor/users
// @access  Vendor
export const getVendorUsers = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 1000,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Build query
    const query = {};

    // Search by name, phone, or restaurantName
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { restaurantName: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort - handle both name and _id
    const sort = {};
    if (sortBy === '_id') {
      sort._id = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === "asc" ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Execute query - don't populate cart for vendor view
    const users = await User.find(query)
      .select("-password -__v")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching users for vendor:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  let cleaned = phone.toString().replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
};

// @desc    Create a new user (for vendors)
// @route   POST /api/v1/vendor/users
// @access  Vendor
export const createVendorUser = async (req, res) => {
  try {
    const { name, phone, restaurantName, gstNumber } = req.body;

    console.log('Creating user with data:', { name, phone, restaurantName, gstNumber });

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    // Clean and validate phone number
    const cleanPhone = cleanPhoneNumber(phone);
    console.log('Cleaned phone:', cleanPhone);
    
    // Validate phone number format (10 digits, starting with 6-9 for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: `Please provide a valid 10-digit Indian phone number. Received: ${phone}, Cleaned: ${cleanPhone}`,
      });
    }

    // Check if user with this phone already exists
    const existingUser = await User.findOne({ phone: cleanPhone });
    console.log('Existing user check:', existingUser ? `Found user: ${existingUser._id}` : 'No existing user');
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with phone number ${cleanPhone} already exists (ID: ${existingUser._id})`,
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      restaurantName: restaurantName?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
    });

    console.log('User created:', user._id);

    // Create cart and wishlist for the user
    const cart = await Cart.create({ user: user._id, items: [] });
    const wishlist = await Wishlist.create({ user: user._id, products: [] });

    // Link cart and wishlist to user
    user.cart = cart._id;
    user.wishlist = wishlist._id;
    await user.save();

    console.log('User setup complete with cart and wishlist');

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        _id: user._id,
        id: user._id,
        name: user.name,
        phone: user.phone,
        restaurantName: user.restaurantName,
        gstNumber: user.gstNumber,
        cart: user.cart,
        wishlist: user.wishlist,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const keyValue = error.keyValue;
      return res.status(400).json({
        success: false,
        message: `Duplicate entry: ${JSON.stringify(keyValue)}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};
