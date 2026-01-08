import User from "../../models/users/user.js";
import Cart from "../../models/users/cart.js";
import Wishlist from "../../models/users/wishlist.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
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
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required",
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
    });

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
        message: "User with this email already exists",
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
    const { name, email, phone, cart } = req.body;

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
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (cart !== undefined) updateData.cart = cart;

    // Check if email conflicts with another user
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
      }
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
        message: "User with this email already exists",
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

// @desc    Get user by email
// @route   GET /api/v1/admin/users/email/:email
// @access  Admin/Super Admin
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email: email.toLowerCase() }).populate({
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

// @desc    User signup/register
// @route   POST /api/v1/users/signup
// @access  Public
export const userSignup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate and clean phone number
    // Remove all non-digit characters (spaces, dashes, plus signs, etc.)
    const cleanedPhone = phone.replace(/\D/g, "");
    
    // Check if phone number is valid (Indian mobile number: 10 digits starting with 6, 7, 8, or 9)
    // Also allow numbers with country code +91 (13 digits total, remove country code)
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      // Remove country code +91
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      // Remove leading 0
      validPhone = cleanedPhone.substring(1);
    }
    
    // Validate Indian mobile number format (10 digits starting with 6, 7, 8, or 9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9",
      });
    }

    // Check if user with email already exists
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });

    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if user with phone number already exists
    const existingUserByPhone = await User.findOne({ phone: validPhone });

    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: "User with this phone number already exists",
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: validPhone, // Use cleaned and validated phone number
      password,
    });

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
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection - use 'lax' in dev for cross-origin
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: "/", // Available for all routes
    };

    res.cookie("token", token, cookieOptions);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role || "user",
      },
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
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
      message: "Error registering user",
      error: error.message,
    });
  }
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

// @desc    User signin/login
// @route   POST /api/v1/users/signin
// @access  Public
export const userSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user with password field included
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
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
      httpOnly: true, // Prevents JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection - use 'lax' in dev for cross-origin
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: "/", // Available for all routes
    };

    res.cookie("token", token, cookieOptions);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role || "user",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error signing in",
      error: error.message,
    });
  }
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