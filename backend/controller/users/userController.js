import User from "../../models/users/user.js";

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Admin/Super Admin/City Admin
export const getAllUsers = async (req, res) => {
  try {
    const {
      role,
      city,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (role) query.role = role;
    if (city) query.city = city;

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

    // Execute query (exclude password)
    const users = await User.find(query)
      .select("-password")
      .populate("cart")
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
    const userId = req.user?.id; // From authentication middleware
    const userRole = req.user?.role; // From authentication middleware

    // Users can only view their own profile unless they're admin
    if (userId !== id && !["admin", "super_admin", "city_admin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this user",
      });
    }

    const user = await User.findById(id).select("-password").populate("cart");

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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(userId).select("-password").populate("cart");

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
    const { name, email, phone, role, city, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    // Validate role
    if (role && !["user", "admin", "super_admin", "city_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, admin, super_admin, city_admin",
      });
    }

    // Validate city for city_admin role
    if (role === "city_admin" && !city) {
      return res.status(400).json({
        success: false,
        message: "City is required for city_admin role",
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
      role: role || "user",
      city: role === "city_admin" ? city : undefined,
      password, // Password should be hashed in a pre-save hook or here
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
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
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { name, email, phone, role, city, cart } = req.body;

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

    // Regular users cannot change their role
    if (role && userId === id && !["admin", "super_admin", "city_admin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // Validate role if provided
    if (role && !["user", "admin", "super_admin", "city_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, admin, super_admin, city_admin",
      });
    }

    // Validate city for city_admin role
    if (role === "city_admin" && !city) {
      return res.status(400).json({
        success: false,
        message: "City is required for city_admin role",
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined && ["admin", "super_admin", "city_admin"].includes(userRole)) {
      updateData.role = role;
    }
    if (city !== undefined) {
      if (role === "city_admin" || user.role === "city_admin") {
        updateData.city = city;
      }
    }
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
    })
      .select("-password")
      .populate("cart");

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
    const userId = req.user?.id;

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

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// @desc    Get users by role
// @route   GET /api/v1/admin/users/role/:role
// @access  Admin/Super Admin
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { city, page = 1, limit = 10 } = req.query;

    // Validate role
    if (!["user", "admin", "super_admin", "city_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, admin, super_admin, city_admin",
      });
    }

    const query = { role };
    if (city) query.city = city;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select("-password")
      .populate("cart")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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
      message: "Error fetching users by role",
      error: error.message,
    });
  }
};

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Admin/Super Admin
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, city } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    // Validate role
    if (!["user", "admin", "super_admin", "city_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: user, admin, super_admin, city_admin",
      });
    }

    // Validate city for city_admin role
    if (role === "city_admin" && !city) {
      return res.status(400).json({
        success: false,
        message: "City is required for city_admin role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = { role };
    if (role === "city_admin" && city) {
      updateData.city = city;
    } else if (role !== "city_admin") {
      updateData.city = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate("cart");

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user role",
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

    const user = await User.findOne({ email: email.toLowerCase() })
      .select("-password")
      .populate("cart");

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

// @desc    Update user cart
// @route   PATCH /api/v1/users/:id/cart
// @access  Private (User can update own cart)
export const updateUserCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { cart } = req.body;
    const userId = req.user?.id;

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

    user.cart = cart;
    await user.save();

    const updatedUser = await User.findById(id)
      .select("-password")
      .populate("cart");

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

