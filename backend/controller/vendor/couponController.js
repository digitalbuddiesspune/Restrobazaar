import Coupon from "../../models/vendor/coupon.js";
import User from "../../models/users/user.js";
import Order from "../../models/users/order.js";

// @desc    Get all coupons for a vendor
// @route   GET /api/v1/vendor/coupons
// @access  Vendor
export const getVendorCoupons = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { isActive, page = 1, limit = 10 } = req.query;

    const query = { vendorId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const coupons = await Coupon.find(query)
      .populate("assignedCustomers", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      data: coupons,
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
      message: "Error fetching coupons",
      error: error.message,
    });
  }
};

// @desc    Get coupon by ID
// @route   GET /api/v1/vendor/coupons/:id
// @access  Vendor
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.userId;

    const coupon = await Coupon.findOne({ _id: id, vendorId }).populate(
      "assignedCustomers",
      "name email phone"
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching coupon",
      error: error.message,
    });
  }
};

// @desc    Create new coupon
// @route   POST /api/v1/vendor/coupons
// @access  Vendor
export const createCoupon = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      isActive,
      assignedCustomers,
    } = req.body;

    // Validate required fields
    if (!code || !discountType || !discountValue || !minimumOrderAmount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discountType, discountValue, minimumOrderAmount, startDate, and endDate are required",
      });
    }

    // Validate discountType
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be either 'percentage' or 'fixed'",
      });
    }

    // Validate discountValue
    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Validate assigned customers if provided (optional field)
    if (assignedCustomers && Array.isArray(assignedCustomers) && assignedCustomers.length > 0) {
      // Validate that all assigned customers exist
      const validCustomers = await User.find({
        _id: { $in: assignedCustomers },
      });
      if (validCustomers.length !== assignedCustomers.length) {
        return res.status(400).json({
          success: false,
          message: "Some assigned customers are invalid",
        });
      }
    }

    // Create coupon
    const coupon = await Coupon.create({
      vendorId,
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      maxDiscount: discountType === "percentage" ? maxDiscount : undefined,
      minimumOrderAmount,
      startDate: start,
      endDate: end,
      usageLimit: usageLimit || 0, // 0 = unlimited
      perUserLimit: perUserLimit || 1,
      isActive: isActive !== undefined ? isActive : true,
      assignedCustomers: assignedCustomers,
    });

    await coupon.populate("assignedCustomers", "name email phone");

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating coupon",
      error: error.message,
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/v1/vendor/coupons/:id
// @access  Vendor
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.userId;
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minimumOrderAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      isActive,
      assignedCustomers,
    } = req.body;

    // Find coupon
    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Validate discountType if provided
    if (discountType && !["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "discountType must be either 'percentage' or 'fixed'",
      });
    }

    // Validate discountValue if provided
    const finalDiscountType = discountType || coupon.discountType;
    if (discountValue !== undefined) {
      if (finalDiscountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount must be between 0 and 100",
        });
      }
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }
    }

    // Check if code already exists (if changed)
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Prepare update data
    const updateData = {};

    // Validate assigned customers if provided (optional field)
    if (assignedCustomers !== undefined) {
      if (Array.isArray(assignedCustomers) && assignedCustomers.length > 0) {
        // Validate that all assigned customers exist
        const validCustomers = await User.find({
          _id: { $in: assignedCustomers },
        });
        if (validCustomers.length !== assignedCustomers.length) {
          return res.status(400).json({
            success: false,
            message: "Some assigned customers are invalid",
          });
        }
        updateData.assignedCustomers = assignedCustomers;
      } else {
        // Empty array means available to all customers
        updateData.assignedCustomers = [];
      }
    }
    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = discountValue;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (minimumOrderAmount !== undefined) updateData.minimumOrderAmount = minimumOrderAmount;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (perUserLimit !== undefined) updateData.perUserLimit = perUserLimit;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("assignedCustomers", "name email phone");

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating coupon",
      error: error.message,
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/v1/vendor/coupons/:id
// @access  Vendor
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.userId;

    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await Coupon.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message,
    });
  }
};

// @desc    Toggle coupon active status
// @route   PATCH /api/v1/vendor/coupons/:id/status
// @access  Vendor
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.userId;

    const coupon = await Coupon.findOne({ _id: id, vendorId });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    await coupon.populate("assignedCustomers", "name email phone");

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling coupon status",
      error: error.message,
    });
  }
};

// @desc    Get customers list for vendor to select
// @route   GET /api/v1/vendor/customers
// @access  Vendor
export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const customers = await User.find(query)
      .select("name email phone")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: customers,
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
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

// @desc    Validate and apply coupon
// @route   POST /api/v1/coupons/validate
// @access  Private (User)
export const validateCoupon = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { code, cartTotal, vendorId, cartItems } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and cart total are required",
      });
    }

    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // IMPORTANT: Check if all cart items belong to the coupon's vendor
    // Coupons are vendor-specific and only work for that vendor's products
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const couponVendorId = coupon.vendorId.toString();
      const allItemsFromVendor = cartItems.every(item => {
        const itemVendorId = item.vendorId?.toString() || item.vendorId;
        return itemVendorId === couponVendorId;
      });

      if (!allItemsFromVendor) {
        return res.status(400).json({
          success: false,
          message: "This coupon is only valid for products from the coupon vendor. Your cart contains products from other vendors.",
        });
      }
    } else if (vendorId) {
      // Fallback: check vendorId if cartItems not provided
      if (coupon.vendorId.toString() !== vendorId.toString()) {
        return res.status(400).json({
          success: false,
          message: "This coupon is only valid for products from the coupon vendor",
        });
      }
    }

    // Check if user can use this coupon
    const canUse = coupon.canBeUsedBy(userId);
    if (!canUse.canUse) {
      return res.status(400).json({
        success: false,
        message: canUse.reason,
      });
    }

    // Calculate discount
    const discountResult = coupon.calculateDiscount(cartTotal);
    if (discountResult.reason) {
      return res.status(400).json({
        success: false,
        message: discountResult.reason,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discount: discountResult.discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        finalAmount: cartTotal - discountResult.discount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validating coupon",
      error: error.message,
    });
  }
};

// @desc    Get available coupons for user
// @route   GET /api/v1/coupons/available
// @access  Private (User)
export const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vendorId, cartTotal, cartItems } = req.query;

    // Determine vendorId from cart items if not provided
    let couponVendorId = vendorId;
    if (!couponVendorId && cartItems) {
      try {
        const parsedCartItems = typeof cartItems === 'string' ? JSON.parse(cartItems) : cartItems;
        if (Array.isArray(parsedCartItems) && parsedCartItems.length > 0) {
          // Get vendorId from first cart item
          couponVendorId = parsedCartItems[0].vendorId;
          
          // Verify all items are from the same vendor
          const allSameVendor = parsedCartItems.every(item => {
            const itemVendorId = item.vendorId?.toString() || item.vendorId;
            return itemVendorId === couponVendorId?.toString() || itemVendorId === couponVendorId;
          });
          
          if (!allSameVendor) {
            return res.status(200).json({
              success: true,
              data: [],
              message: "Cart contains products from multiple vendors. Coupons are vendor-specific.",
            });
          }
        }
      } catch (parseError) {
        console.error('Error parsing cartItems:', parseError);
      }
    }

    // Coupons are vendor-specific - if no vendorId, return empty
    if (!couponVendorId) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No vendor specified. Coupons are vendor-specific.",
      });
    }

    const now = new Date();
    const query = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      vendorId: couponVendorId, // Filter by vendor - coupons are vendor-specific
    };

    // Get all active coupons for this vendor
    const coupons = await Coupon.find(query)
      .populate("vendorId", "businessName")
      .sort({ createdAt: -1 });

    // Filter coupons based on customer assignment and eligibility
    const availableCoupons = coupons
      .filter((coupon) => {
        // Check customer assignment (optional - if empty, available to all customers)
        if (coupon.assignedCustomers.length > 0) {
          const isAssigned = coupon.assignedCustomers.some(
            (customerId) => customerId.toString() === userId.toString()
          );
          if (!isAssigned) {
            return false;
          }
        }

        // Check usage limit
        if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
          return false;
        }

        // Check per user limit
        if (coupon.perUserLimit > 0) {
          const userUsageCount = coupon.usedBy.filter(
            (usage) => usage.userId.toString() === userId.toString()
          ).length;
          if (userUsageCount >= coupon.perUserLimit) {
            return false;
          }
        }

        // Check minimum order amount if cartTotal provided
        if (cartTotal && parseFloat(cartTotal) < coupon.minimumOrderAmount) {
          return false;
        }

        return true;
      })
      .map((coupon) => {
        const discountInfo = coupon.calculateDiscount(parseFloat(cartTotal) || 0);
        return {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount,
          minimumOrderAmount: coupon.minimumOrderAmount,
          startDate: coupon.startDate,
          endDate: coupon.endDate,
          estimatedDiscount: discountInfo.discount,
          vendor: coupon.vendorId,
        };
      });

    res.status(200).json({
      success: true,
      data: availableCoupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available coupons",
      error: error.message,
    });
  }
};
