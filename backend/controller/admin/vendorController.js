import Vendor from "../../models/admin/vendor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Admin
export const getAllVendors = async (req, res) => {
  try {
    const { 
      isActive, 
      isApproved, 
      kycStatus, 
      vendorType,
      city,
      search 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isApproved !== undefined) query.isApproved = isApproved === "true";
    if (kycStatus) query.kycStatus = kycStatus;
    if (vendorType) query.vendorType = vendorType;
    if (city) query.serviceCities = city;
    
    // Search functionality
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { legalName: { $regex: search, $options: "i" } },
      ];
    }
    
    const vendors = await Vendor.find(query)
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendors",
      error: error.message,
    });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Admin
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id)
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email");
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendor",
      error: error.message,
    });
  }
};

// @desc    Get vendor by email
// @route   GET /api/vendors/email/:email
// @access  Admin
export const getVendorByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const vendor = await Vendor.findOne({ 
      email: email.toLowerCase().trim() 
    })
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email");
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendor",
      error: error.message,
    });
  }
};

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Admin
export const createVendor = async (req, res) => {
  try {
    const { 
      businessName,
      legalName,
      vendorType,
      email,
      phone,
      password,
      contactPerson,
      address,
      gstNumber,
      panNumber,
      kycStatus,
      kycDocuments,
      serviceCities,
      commissionPercentage,
      bankDetails,
      isActive,
      isApproved
    } = req.body;
    
    // Validate required fields
    if (!businessName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Business name, email, phone, and password are required",
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    
    // Check if vendor with same email or phone already exists
    const existingVendor = await Vendor.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() }
      ]
    });
    
    if (existingVendor) {
      return res.status(409).json({
        success: false,
        message: "Vendor with this email or phone already exists",
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create vendor
    const vendor = await Vendor.create({
      businessName: businessName.trim(),
      legalName: legalName ? legalName.trim() : undefined,
      vendorType: vendorType || "shop",
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      contactPerson: contactPerson || {},
      address: address || {},
      gstNumber: gstNumber ? gstNumber.trim() : undefined,
      panNumber: panNumber ? panNumber.trim() : undefined,
      kycStatus: kycStatus || "pending",
      kycDocuments: kycDocuments || [],
      serviceCities: serviceCities || [],
      commissionPercentage: commissionPercentage || 0,
      bankDetails: bankDetails || {},
      isActive: isActive !== undefined ? isActive : true,
      isApproved: isApproved !== undefined ? isApproved : false,
    });
    
    // Remove password from response
    const vendorResponse = vendor.toObject();
    delete vendorResponse.password;
    
    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendorResponse,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Vendor with this email or phone already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating vendor",
      error: error.message,
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Admin
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      businessName,
      legalName,
      vendorType,
      email,
      phone,
      contactPerson,
      address,
      gstNumber,
      panNumber,
      kycStatus,
      kycDocuments,
      serviceCities,
      commissionPercentage,
      bankDetails,
      isActive,
      isApproved
    } = req.body;
    
    // Find vendor
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (legalName !== undefined) updateData.legalName = legalName.trim();
    if (vendorType !== undefined) updateData.vendorType = vendorType;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (address !== undefined) updateData.address = address;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber.trim();
    if (panNumber !== undefined) updateData.panNumber = panNumber.trim();
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus;
    if (kycDocuments !== undefined) updateData.kycDocuments = kycDocuments;
    if (serviceCities !== undefined) updateData.serviceCities = serviceCities;
    if (commissionPercentage !== undefined) updateData.commissionPercentage = commissionPercentage;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
      if (isApproved && !vendor.isApproved) {
        updateData.approvedAt = new Date();
        updateData.approvedBy = req.user?.id; // Assuming admin ID from auth middleware
      }
    }
    
    // Check if email or phone conflicts with another vendor
    if (updateData.email || updateData.phone) {
      const conflictQuery = { _id: { $ne: id } };
      
      if (updateData.email && updateData.phone) {
        conflictQuery.$or = [
          { email: updateData.email },
          { phone: updateData.phone }
        ];
      } else if (updateData.email) {
        conflictQuery.email = updateData.email;
      } else if (updateData.phone) {
        conflictQuery.phone = updateData.phone;
      }
      
      const existingVendor = await Vendor.findOne(conflictQuery);
      
      if (existingVendor) {
        return res.status(409).json({
          success: false,
          message: "Vendor with this email or phone already exists",
        });
      }
    }
    
    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email");
    
    res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      data: updatedVendor,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Vendor with this email or phone already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating vendor",
      error: error.message,
    });
  }
};

// @desc    Update vendor password
// @route   PUT /api/vendors/:id/password
// @access  Admin
export const updateVendorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }
    
    // Find vendor
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    vendor.password = hashedPassword;
    await vendor.save();
    
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

// @desc    Update vendor KYC status
// @route   PUT /api/vendors/:id/kyc-status
// @access  Admin
export const updateVendorKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { kycStatus, kycDocuments } = req.body;
    
    if (!kycStatus) {
      return res.status(400).json({
        success: false,
        message: "KYC status is required",
      });
    }
    
    if (!["pending", "verified", "rejected"].includes(kycStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC status. Must be: pending, verified, or rejected",
      });
    }
    
    // Find vendor
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    // Prepare update data
    const updateData = { kycStatus };
    if (kycDocuments !== undefined) updateData.kycDocuments = kycDocuments;
    
    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password -__v")
      .populate("serviceCities", "name");
    
    res.status(200).json({
      success: true,
      message: `Vendor KYC status updated to ${kycStatus}`,
      data: updatedVendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating KYC status",
      error: error.message,
    });
  }
};

// @desc    Approve/Reject vendor
// @route   PUT /api/vendors/:id/approval
// @access  Admin
export const updateVendorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    if (isApproved === undefined) {
      return res.status(400).json({
        success: false,
        message: "isApproved status is required",
      });
    }
    
    // Find vendor
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    // Prepare update data
    const updateData = { 
      isApproved: Boolean(isApproved)
    };
    
    if (isApproved && !vendor.isApproved) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = req.user?.id; // Assuming admin ID from auth middleware
    } else if (!isApproved) {
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }
    
    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email");
    
    res.status(200).json({
      success: true,
      message: `Vendor ${isApproved ? "approved" : "rejected"} successfully`,
      data: updatedVendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vendor approval",
      error: error.message,
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Admin
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    await Vendor.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
      data: {
        id: vendor._id,
        businessName: vendor.businessName,
        email: vendor.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting vendor",
      error: error.message,
    });
  }
};

// @desc    Toggle vendor active status
// @route   PATCH /api/vendors/:id/toggle-active
// @access  Admin
export const toggleVendorActive = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    vendor.isActive = !vendor.isActive;
    await vendor.save();
    
    const vendorResponse = vendor.toObject();
    delete vendorResponse.password;
    
    res.status(200).json({
      success: true,
      message: `Vendor ${vendor.isActive ? "activated" : "deactivated"} successfully`,
      data: vendorResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling vendor status",
      error: error.message,
    });
  }
};

// @desc    Update last login timestamp
// @route   PATCH /api/vendors/:id/update-last-login
// @access  Admin/Vendor
export const updateLastLogin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    ).select("-password -__v");
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Last login updated successfully",
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating last login",
      error: error.message,
    });
  }
};

// @desc    Get vendors by city
// @route   GET /api/vendors/city/:cityId
// @access  Public/Admin
export const getVendorsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { isActive, isApproved } = req.query;
    
    const query = { serviceCities: cityId };
    
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isApproved !== undefined) query.isApproved = isApproved === "true";
    
    const vendors = await Vendor.find(query)
      .select("-password -__v")
      .populate("serviceCities", "name")
      .sort({ businessName: 1 });
    
    res.status(200).json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendors by city",
      error: error.message,
    });
  }
};

// @desc    Get vendors by KYC status
// @route   GET /api/vendors/kyc/:status
// @access  Admin
export const getVendorsByKycStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC status. Must be: pending, verified, or rejected",
      });
    }
    
    const vendors = await Vendor.find({ kycStatus: status })
      .select("-password -__v")
      .populate("serviceCities", "name")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: vendors,
      count: vendors.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendors by KYC status",
      error: error.message,
    });
  }
};

// @desc    Vendor login
// @route   POST /api/vendors/login
// @access  Public
export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find vendor with password field included
    const vendor = await Vendor.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Check if vendor is active
    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: "Vendor account is inactive. Please contact admin.",
      });
    }

    // Check if vendor is approved
    if (!vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Vendor account is not approved yet. Please wait for admin approval.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Update last login timestamp
    vendor.lastLoginAt = new Date();
    await vendor.save();

    // Generate JWT token with vendor ID and role
    const token = jwt.sign(
      { id: vendor._id, role: "vendor" },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Vendor logged in successfully",
      token: token,
      data: {
        id: vendor._id,
        businessName: vendor.businessName,
        email: vendor.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

