import User from '../models/user.js';

// Get all users (regular users only, not admins)
export const getAllUsers = async (req, res) => {
  try {
    // Get only regular users (role: 'user')
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch users",
      error: error.message 
    });
  }
};

