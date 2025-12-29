import User from '../models/user.js';
import bcrypt from "bcryptjs";

// Create city admin (Super admin only)
export const createCityAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, city } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !city) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required: name, email, phone, password, and city" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create city admin user
    const cityAdmin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'city_admin',
      city: city,
    });

    res.status(201).json({
      success: true,
      message: "City admin created successfully",
      data: {
        id: cityAdmin._id,
        name: cityAdmin.name,
        email: cityAdmin.email,
        phone: cityAdmin.phone,
        city: cityAdmin.city,
        role: cityAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error creating city admin:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create city admin",
      error: error.message 
    });
  }
};

// Get all city admins (Super admin only)
export const getCityAdmins = async (req, res) => {
  try {
    const cityAdmins = await User.find({ role: 'city_admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: cityAdmins,
    });
  } catch (error) {
    console.error('Error fetching city admins:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch city admins",
      error: error.message 
    });
  }
};

// Delete city admin (Super admin only)
export const deleteCityAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if city admin exists
    const cityAdmin = await User.findById(id);
    
    if (!cityAdmin) {
      return res.status(404).json({ 
        success: false,
        message: "City admin not found" 
      });
    }

    // Verify it's actually a city admin
    if (cityAdmin.role !== 'city_admin') {
      return res.status(400).json({ 
        success: false,
        message: "User is not a city admin" 
      });
    }

    // Delete the city admin
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "City admin deleted successfully",
    });
  } catch (error) {
    console.error('Error deleting city admin:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete city admin",
      error: error.message 
    });
  }
};

