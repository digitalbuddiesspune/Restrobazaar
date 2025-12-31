import SuperAdmin from "../../models/admin/superAdmin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// @desc    Get all super admins
// @route   GET /api/super-admins
// @access  Super Admin
export const getAllSuperAdmins = async (req, res) => {
  try {
    const { isActive } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";

    const superAdmins = await SuperAdmin.find(query)
      .select("-password -__v")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: superAdmins,
      count: superAdmins.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching super admins",
      error: error.message,
    });
  }
};

// @desc    Get super admin by ID
// @route   GET /api/super-admins/:id
// @access  Super Admin
export const getSuperAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await SuperAdmin.findById(id).select("-password -__v");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: superAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching super admin",
      error: error.message,
    });
  }
};

// @desc    Get super admin by email
// @route   GET /api/super-admins/email/:email
// @access  Super Admin
export const getSuperAdminByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const superAdmin = await SuperAdmin.findOne({
      email: email.toLowerCase().trim(),
    }).select("-password -__v");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: superAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching super admin",
      error: error.message,
    });
  }
};

// @desc    Create new super admin
// @route   POST /api/super-admins
// @access  Super Admin
export const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, permissions, isActive } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if super admin with same email already exists
    const existingSuperAdmin = await SuperAdmin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingSuperAdmin) {
      return res.status(409).json({
        success: false,
        message: "Super admin with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      password: hashedPassword,
      permissions: permissions || {
        fullAccess: true,
        canCreateAdmin: true,
        canDeleteAdmin: true,
        canManageSystemSettings: true,
      },
      isActive: isActive !== undefined ? isActive : true,
      lastPasswordChangeAt: new Date(),
    });

    // Remove password from response
    const superAdminResponse = superAdmin.toObject();
    delete superAdminResponse.password;

    res.status(201).json({
      success: true,
      message: "Super admin created successfully",
      data: superAdminResponse,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Super admin with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating super admin",
      error: error.message,
    });
  }
};

// @desc    Update super admin
// @route   PUT /api/super-admins/:id
// @access  Super Admin
export const updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, permissions, isActive } = req.body;

    // Find super admin
    const superAdmin = await SuperAdmin.findById(id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    if (permissions !== undefined) {
      updateData.permissions = {
        fullAccess:
          permissions.fullAccess !== undefined
            ? permissions.fullAccess
            : superAdmin.permissions.fullAccess,
        canCreateAdmin:
          permissions.canCreateAdmin !== undefined
            ? permissions.canCreateAdmin
            : superAdmin.permissions.canCreateAdmin,
        canDeleteAdmin:
          permissions.canDeleteAdmin !== undefined
            ? permissions.canDeleteAdmin
            : superAdmin.permissions.canDeleteAdmin,
        canManageSystemSettings:
          permissions.canManageSystemSettings !== undefined
            ? permissions.canManageSystemSettings
            : superAdmin.permissions.canManageSystemSettings,
      };
    }

    // Check if email conflicts with another super admin
    if (updateData.email) {
      const existingSuperAdmin = await SuperAdmin.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingSuperAdmin) {
        return res.status(409).json({
          success: false,
          message: "Super admin with this email already exists",
        });
      }
    }

    // Update super admin
    const updatedSuperAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -__v");

    res.status(200).json({
      success: true,
      message: "Super admin updated successfully",
      data: updatedSuperAdmin,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Super admin with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating super admin",
      error: error.message,
    });
  }
};

// @desc    Update super admin password
// @route   PUT /api/super-admins/:id/password
// @access  Super Admin
export const updateSuperAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Find super admin with password
    const superAdmin = await SuperAdmin.findById(id).select("+password");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    // Verify current password
    const isPasswordValid = await superAdmin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    superAdmin.password = hashedPassword;
    superAdmin.lastPasswordChangeAt = new Date();
    await superAdmin.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating password",
      error: error.message,
    });
  }
};

// @desc    Update super admin permissions
// @route   PUT /api/super-admins/:id/permissions
// @access  Super Admin
export const updateSuperAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: "Permissions object is required",
      });
    }

    // Find super admin
    const superAdmin = await SuperAdmin.findById(id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    // Update permissions
    superAdmin.permissions = {
      fullAccess:
        permissions.fullAccess !== undefined
          ? permissions.fullAccess
          : superAdmin.permissions.fullAccess,
      canCreateAdmin:
        permissions.canCreateAdmin !== undefined
          ? permissions.canCreateAdmin
          : superAdmin.permissions.canCreateAdmin,
      canDeleteAdmin:
        permissions.canDeleteAdmin !== undefined
          ? permissions.canDeleteAdmin
          : superAdmin.permissions.canDeleteAdmin,
      canManageSystemSettings:
        permissions.canManageSystemSettings !== undefined
          ? permissions.canManageSystemSettings
          : superAdmin.permissions.canManageSystemSettings,
    };

    await superAdmin.save();

    const updatedSuperAdmin = superAdmin.toObject();
    delete updatedSuperAdmin.password;

    res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: updatedSuperAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating permissions",
      error: error.message,
    });
  }
};

// @desc    Delete super admin
// @route   DELETE /api/super-admins/:id
// @access  Super Admin
export const deleteSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await SuperAdmin.findById(id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    await SuperAdmin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Super admin deleted successfully",
      data: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting super admin",
      error: error.message,
    });
  }
};

// @desc    Toggle super admin active status
// @route   PATCH /api/super-admins/:id/toggle-active
// @access  Super Admin
export const toggleSuperAdminActive = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await SuperAdmin.findById(id);

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    superAdmin.isActive = !superAdmin.isActive;
    await superAdmin.save();

    const updatedSuperAdmin = superAdmin.toObject();
    delete updatedSuperAdmin.password;

    res.status(200).json({
      success: true,
      message: `Super admin ${
        superAdmin.isActive ? "activated" : "deactivated"
      } successfully`,
      data: updatedSuperAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling super admin status",
      error: error.message,
    });
  }
};

// @desc    Update last login timestamp
// @route   PATCH /api/super-admins/:id/update-last-login
// @access  Super Admin
export const updateLastLogin = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await SuperAdmin.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    ).select("-password -__v");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Last login updated successfully",
      data: superAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating last login",
      error: error.message,
    });
  }
};

export const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find super admin with password field included
    const superAdmin = await SuperAdmin.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: "Super admin not found",
      });
    }

    // Check if super admin is active
    if (!superAdmin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Super admin account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Update last login timestamp
    superAdmin.lastLoginAt = new Date();
    await superAdmin.save();

    const token = jwt.sign({ id: superAdmin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      message: "Super admin logged in successfully",
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};
