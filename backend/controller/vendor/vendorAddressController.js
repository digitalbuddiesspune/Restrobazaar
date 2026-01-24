import Address from "../../models/users/address.js";

// @desc    Get all addresses for a specific user (vendor can view)
// @route   GET /api/v1/vendor/addresses/user/:userId
// @access  Vendor
export const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching addresses",
      error: error.message,
    });
  }
};

// @desc    Create address for a user (vendor can create)
// @route   POST /api/v1/vendor/addresses
// @access  Vendor
export const createUserAddress = async (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (name, phone, addressLine1, city, state, pincode)",
      });
    }

    // If this is set as default, unset other default addresses for this user
    if (isDefault) {
      await Address.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      userId,
      name,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      landmark: landmark || "",
      addressType: addressType || "home",
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating address",
      error: error.message,
    });
  }
};

// @desc    Update address for a user (vendor can update)
// @route   PUT /api/v1/vendor/addresses/:id
// @access  Vendor
export const updateUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If this is set as default, unset other default addresses for this user
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { userId: address.userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    // Update address fields
    if (name) address.name = name;
    if (phone) address.phone = phone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (landmark !== undefined) address.landmark = landmark;
    if (addressType) address.addressType = addressType;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating address",
      error: error.message,
    });
  }
};

// @desc    Delete address for a user (vendor can delete)
// @route   DELETE /api/v1/vendor/addresses/:id
// @access  Vendor
export const deleteUserAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting address",
      error: error.message,
    });
  }
};
