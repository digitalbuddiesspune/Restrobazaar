import User from "../../models/users/user.js";
import Cart from "../../models/users/cart.js";
import Wishlist from "../../models/users/wishlist.js";
import Address from "../../models/users/address.js";
import jwt from "jsonwebtoken";
import { sendAndSaveOTP, verifyOTPFromDB } from "../../services/otpService.js";

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Admin/Super Admin
export const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    // Search by name, phone, restaurantName, or city
    if (search) {
      // First, find addresses matching the city search
      const matchingAddresses = await Address.find({
        city: { $regex: search, $options: "i" }
      }).select('userId');
      
      const cityUserIds = matchingAddresses.map(addr => addr.userId);
      
      // Build search query: name, phone, restaurantName OR city (via userIds from addresses)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { restaurantName: { $regex: search, $options: "i" } },
      ];
      
      // If city matches found, add userIds to search
      if (cityUserIds.length > 0) {
        query.$or.push({ _id: { $in: cityUserIds } });
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const users = await User.find(query)
      .populate({
        path: "cart",
        select: "-__v",
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get addresses for all users
    const userIds = users.map(user => user._id);
    const addresses = await Address.find({ userId: { $in: userIds } })
      .sort({ isDefault: -1, createdAt: -1 }); // Default address first, then newest
    
    // Debug: Log addresses found
    console.log(`Found ${addresses.length} addresses for ${userIds.length} users`);

    // Create a map of userId to default address (or first address)
    const addressMap = {};
    addresses.forEach(address => {
      // Handle both ObjectId and string userId - address.userId is ObjectId from schema
      const userIdStr = address.userId ? address.userId.toString() : null;
      if (userIdStr) {
        // Prefer default address, otherwise use first one found
        if (!addressMap[userIdStr]) {
          addressMap[userIdStr] = address;
        } else if (address.isDefault && !addressMap[userIdStr].isDefault) {
          addressMap[userIdStr] = address;
        }
      }
    });

    // Add address and city to each user
    const usersWithAddress = users.map(user => {
      const userObj = user.toObject();
      const userIdStr = user._id.toString();
      const userAddress = addressMap[userIdStr];
      if (userAddress && userAddress.addressLine1) {
        const addressParts = [userAddress.addressLine1];
        if (userAddress.addressLine2 && userAddress.addressLine2.trim()) {
          addressParts.push(userAddress.addressLine2);
        }
        userObj.address = addressParts.join(', ');
        userObj.city = userAddress.city || null;
      } else {
        userObj.address = null;
        userObj.city = null;
      }
      return userObj;
    });

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: usersWithAddress,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private (User can get own profile, Admin can get any)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    // Users can only view their own profile unless they're admin
    if (userId !== id && !["admin", "super_admin", "city_admin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user",
      });
    }

    const user = await User.findById(id).populate({
      path: "cart",
      select: "-__v",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(userId).populate({
      path: "cart",
      select: "-__v", // Exclude version key
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/v1/admin/users
// @access  Admin/Super Admin
export const createUser = async (req, res) => {
  try {
    const { name, phone, restaurantName, gstNumber } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
      });
    }

    // Check if user with phone already exists
    const existingUser = await User.findOne({ phone: validPhone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      phone: validPhone,
      restaurantName: restaurantName?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
    });

    // Create cart for the user
    const cart = await Cart.create({
      user: user._id,
      items: [],
    });

    // Create wishlist for the user
    const wishlist = await Wishlist.create({
      user: user._id,
      products: [],
    });

    // Update user with cart and wishlist references
    user.cart = cart._id;
    user.wishlist = wishlist._id;
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (User can update own profile, Admin can update any)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;
    const { name, phone, restaurantName, gstNumber, cart } = req.body;

    // Users can only update their own profile unless they're admin
    if (userId !== id && !["admin", "super_admin", "city_admin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user",
      });
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (restaurantName !== undefined) updateData.restaurantName = restaurantName?.trim() || null;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber?.trim() || null;
    if (cart !== undefined) updateData.cart = cart;

    // Handle phone update with validation
    if (phone !== undefined) {
      const cleanedPhone = phone.replace(/\D/g, "");
      let validPhone = cleanedPhone;
      
      if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
        validPhone = cleanedPhone.substring(2);
      } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
        validPhone = cleanedPhone.substring(1);
      }

      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(validPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number",
        });
      }

      // Check if phone conflicts with another user
      const existingUser = await User.findOne({
        phone: validPhone,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this phone number already exists",
        });
      }

      updateData.phone = validPhone;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "cart",
      select: "-__v",
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Admin/Super Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;

    // Prevent users from deleting themselves
    if (userId === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get user by phone
// @route   GET /api/v1/admin/users/phone/:phone
// @access  Admin/Super Admin
export const getUserByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    // Clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const user = await User.findOne({ phone: validPhone }).populate({
      path: "cart",
      select: "-__v",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// @desc    Get user cart
// @route   GET /api/v1/users/:id/cart
// @access  Private (User can get own cart)
export const getUserCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;

    // Users can only view their own cart
    if (userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user's cart",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find cart for the user
    let cart = await Cart.findOne({ user: id })
      .populate({
        path: "items.product",
        select: "-__v",
        populate: {
          path: "productId",
          select: "productName images img unit",
        },
      })
      .select("-__v");

    // If cart doesn't exist, create an empty one
    if (!cart) {
      cart = new Cart({
        user: id,
        items: [],
      });
      await cart.save();
      
      // Update user's cart reference
      user.cart = cart._id;
      await user.save();

      // Populate the newly created cart
      cart = await Cart.findById(cart._id)
        .populate({
          path: "items.product",
          select: "-__v",
          populate: {
            path: "productId",
            select: "productName images img unit",
          },
        })
        .select("-__v");
    }

    res.status(200).json({
      success: true,
      data: {
        cart: cart,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// @desc    Update user cart
// @route   PATCH /api/v1/users/:id/cart
// @access  Private (User can update own cart)
export const updateUserCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, deliveryCity, deliveryPincode } = req.body; // Accept items array instead of cart object
    const userId = req.user?.userId || req.user?.id;

    // Users can only update their own cart
    if (userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this user's cart",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array",
      });
    }

    // Find or create cart for the user
    let cart = await Cart.findOne({ user: id });

    if (!cart) {
      // Create new cart if it doesn't exist
      cart = new Cart({
        user: id,
        items: [],
        deliveryCity: deliveryCity || null,
        deliveryPincode: deliveryPincode || null,
      });
    }

    // Map frontend cart items to Cart schema format
    const cartItems = items.map((item) => {
      // Validate required fields
      if (!item.vendorProductId || !item.quantity || item.price === undefined) {
        throw new Error(
          "Each cart item must have vendorProductId, quantity, and price"
        );
      }

      return {
        product: item.vendorProductId, // Reference to VendorProduct
        quantity: Number(item.quantity),
        price: Number(item.price),
        productName: item.productName || "Product",
        productImage: item.productImage || "",
      };
    });

    // Update cart items
    cart.items = cartItems;

    // Update delivery info if provided
    if (deliveryCity !== undefined) {
      cart.deliveryCity = deliveryCity;
    }
    if (deliveryPincode !== undefined) {
      cart.deliveryPincode = deliveryPincode;
    }

    // Save cart (totalAmount will be calculated by pre-save hook)
    await cart.save();

    // Update user's cart reference
    user.cart = cart._id;
    await user.save();

    // Populate cart with product details
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: "items.product",
        select: "-__v",
        populate: {
          path: "productId",
          select: "productName images img unit",
        },
      })
      .select("-__v");

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: {
        cart: populatedCart,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

// @desc    User signup/register - Deprecated, use OTP flow instead
// @route   POST /api/v1/users/signup
// @access  Public
export const userSignup = async (req, res) => {
  // Redirect to use OTP-based signup
  return res.status(400).json({
    success: false,
    message: "Please use OTP-based registration. Send OTP first using /send-otp-signup endpoint.",
  });
};

// @desc    User logout
// @route   POST /api/v1/users/logout
// @access  Private
export const userLogout = async (req, res) => {
  try {
    // Clear the token cookie with same settings as login
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 0, // Immediately expire the cookie
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging out",
      error: error.message,
    });
  }
};

// @desc    User signin/login - Deprecated, use OTP flow instead
// @route   POST /api/v1/users/signin
// @access  Public
export const userSignin = async (req, res) => {
  // Redirect to use OTP-based login
  return res.status(400).json({
    success: false,
    message: "Please use OTP-based login. Send OTP first using /send-otp-login endpoint.",
  });
};

// @desc    Get user wishlist
// @route   GET /api/v1/users/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "products.vendorProduct",
      populate: [
        {
          path: "productId",
          select: "productName images shortDescription slug originalPrice",
        },
        {
          path: "vendorId",
          select: "businessName",
        },
      ],
    });

    if (!wishlist) {
      // Create empty wishlist if it doesn't exist
      wishlist = await Wishlist.create({ user: userId, products: [] });
      
      // Update user's wishlist reference
      await User.findByIdAndUpdate(userId, { wishlist: wishlist._id });
    }

    // Format response to match frontend expectations
    const formattedProducts = wishlist.products.map((item) => {
      const vendorProduct = item.vendorProduct;
      if (!vendorProduct) return null;
      
      const product = vendorProduct.productId;
      const price = vendorProduct.priceType === 'single' 
        ? vendorProduct.pricing?.single?.price 
        : vendorProduct.pricing?.bulk?.[0]?.price || 0;
      const originalPrice = product?.originalPrice || price;

      return {
        _id: vendorProduct._id,
        name: product?.productName || 'Product',
        slug: product?.slug || vendorProduct._id.toString(),
        price: price,
        originalPrice: originalPrice,
        images: product?.images?.map(img => img.url || img) || [],
        vendorName: vendorProduct.vendorId?.businessName || 'Vendor',
        addedAt: item.addedAt,
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      data: {
        products: formattedProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
      error: error.message,
    });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/v1/users/wishlist
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Create wishlist if it doesn't exist
      wishlist = await Wishlist.create({ user: userId, products: [] });
      
      // Update user's wishlist reference
      await User.findByIdAndUpdate(userId, { wishlist: wishlist._id });
    }

    // Check if product already exists in wishlist
    const existingProduct = wishlist.products.find(
      (item) => item.vendorProduct.toString() === productId
    );

    if (existingProduct) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
        data: wishlist,
      });
    }

    // Add product to wishlist
    wishlist.products.push({
      vendorProduct: productId,
      addedAt: new Date(),
    });

    await wishlist.save();

    // Populate and return updated wishlist
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "products.vendorProduct",
      populate: [
        {
          path: "productId",
          select: "productName images shortDescription slug originalPrice",
        },
        {
          path: "vendorId",
          select: "businessName",
        },
      ],
    });

    // Format response
    const formattedProducts = updatedWishlist.products.map((item) => {
      const vendorProduct = item.vendorProduct;
      if (!vendorProduct) return null;
      
      const product = vendorProduct.productId;
      const price = vendorProduct.priceType === 'single' 
        ? vendorProduct.pricing?.single?.price 
        : vendorProduct.pricing?.bulk?.[0]?.price || 0;
      const originalPrice = product?.originalPrice || price;

      return {
        _id: vendorProduct._id,
        name: product?.productName || 'Product',
        slug: product?.slug || vendorProduct._id.toString(),
        price: price,
        originalPrice: originalPrice,
        images: product?.images?.map(img => img.url || img) || [],
        vendorName: vendorProduct.vendorId?.businessName || 'Vendor',
        addedAt: item.addedAt,
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: {
        products: formattedProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding to wishlist",
      error: error.message,
    });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      (item) => item.vendorProduct.toString() !== productId
    );

    await wishlist.save();

    // Populate and return updated wishlist
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "products.vendorProduct",
      populate: [
        {
          path: "productId",
          select: "productName images shortDescription slug originalPrice",
        },
        {
          path: "vendorId",
          select: "businessName",
        },
      ],
    });

    // Format response
    const formattedProducts = updatedWishlist.products.map((item) => {
      const vendorProduct = item.vendorProduct;
      if (!vendorProduct) return null;
      
      const product = vendorProduct.productId;
      const price = vendorProduct.priceType === 'single' 
        ? vendorProduct.pricing?.single?.price 
        : vendorProduct.pricing?.bulk?.[0]?.price || 0;
      const originalPrice = product?.originalPrice || price;

      return {
        _id: vendorProduct._id,
        name: product?.productName || 'Product',
        slug: product?.slug || vendorProduct._id.toString(),
        price: price,
        originalPrice: originalPrice,
        images: product?.images?.map(img => img.url || img) || [],
        vendorName: vendorProduct.vendorId?.businessName || 'Vendor',
        addedAt: item.addedAt,
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      data: {
        products: formattedProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing from wishlist",
      error: error.message,
    });
  }
};

// ==================== OTP ENDPOINTS ====================

// @desc    Send OTP for signup
// @route   POST /api/v1/users/send-otp-signup
// @access  Public
export const sendOTPForSignup = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
      });
    }

    // Check if user with phone number already exists
    const existingUserByPhone = await User.findOne({ phone: validPhone });
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists. Please login instead.",
      });
    }

    // Send OTP
    const result = await sendAndSaveOTP(validPhone, null, "signup");

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message || "OTP sent successfully to your phone number",
        phone: validPhone,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || "Failed to send OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error sending OTP for signup:", error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// @desc    Verify OTP for signup and create user
// @route   POST /api/v1/users/verify-otp-signup
// @access  Public
export const verifyOTPAndSignup = async (req, res) => {
  try {
    const { name, phone, otp, restaurantName, gstNumber } = req.body;

    // Validate required fields
    if (!name || !phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and OTP are required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // Verify OTP
    const isOTPValid = await verifyOTPFromDB(validPhone, otp, "signup");

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new OTP.",
      });
    }

    // Check if user with phone number already exists
    const existingUserByPhone = await User.findOne({ phone: validPhone });
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists. Please login instead.",
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      phone: validPhone,
      restaurantName: restaurantName?.trim() || null,
      gstNumber: gstNumber?.trim() || null,
    });

    // Create cart for the user
    const cart = await Cart.create({
      user: user._id,
      items: [],
    });

    // Create wishlist for the user
    const wishlist = await Wishlist.create({
      user: user._id,
      products: [],
    });

    // Update user with cart and wishlist references
    user.cart = cart._id;
    user.wishlist = wishlist._id;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Set JWT in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        restaurantName: user.restaurantName,
        role: "user",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    console.error("Error in verifyOTPAndSignup:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// @desc    Send OTP for login
// @route   POST /api/v1/users/send-otp-login
// @access  Public
export const sendOTPForLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
      });
    }

    // Check if user exists
    const user = await User.findOne({ phone: validPhone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number. Please sign up first.",
      });
    }

    // Send OTP
    const result = await sendAndSaveOTP(validPhone, null, "login");

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message || "OTP sent successfully to your phone number",
        phone: validPhone,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || "Failed to send OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error sending OTP for login:", error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/v1/users/verify-otp-login
// @access  Public
export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number",
      });
    }

    // Verify OTP
    const isOTPValid = await verifyOTPFromDB(validPhone, otp, "login");

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new OTP.",
      });
    }

    // Find user
    const user = await User.findOne({ phone: validPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Set JWT in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        restaurantName: user.restaurantName,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Error in verifyOTPAndLogin:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};
