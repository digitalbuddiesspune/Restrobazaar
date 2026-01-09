import User from '../../models/users/user.js';

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
