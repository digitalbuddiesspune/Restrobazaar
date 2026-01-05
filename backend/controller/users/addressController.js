import Address from "../../models/users/address.js";

// @desc    Get all addresses for current user
// @route   GET /api/v1/addresses
// @access  Private
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
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

// @desc    Get address by ID
// @route   GET /api/v1/addresses/:id
// @access  Private
export const getAddressById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching address",
      error: error.message,
    });
  }
};

// @desc    Create new address
// @route   POST /api/v1/addresses
// @access  Private
export const createAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

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

    // Validate required fields
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields (name, phone, addressLine1, city, state, pincode)",
      });
    }

    // If this is set as default, unset other default addresses
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

// @desc    Update address
// @route   PUT /api/v1/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

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

    // If this is set as default, unset other default addresses
    if (isDefault && !address.isDefault) {
      await Address.updateMany(
        { userId, isDefault: true, _id: { $ne: addressId } },
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

// @desc    Delete address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.findByIdAndDelete(addressId);

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

