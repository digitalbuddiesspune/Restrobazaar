import VendorProduct from "../../models/vendor/vendorProductSchema.js";

// @desc    Get all vendor products
// @route   GET /api/vendor-products
// @access  Public/Vendor
export const getAllVendorProducts = async (req, res) => {
  try {
    const {
      vendorId,
      cityId,
      productId,
      priceType,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (vendorId) query.vendorId = vendorId;
    if (cityId) query.cityId = cityId;
    if (productId) query.productId = productId;
    if (priceType) query.priceType = priceType;
    if (status !== undefined) query.status = status === "true";

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with population
    const vendorProducts = await VendorProduct.find(query)
      .populate("productId", "productName shortDescription images category")
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name state")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await VendorProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendorProducts,
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
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

// @desc    Get vendor product by ID
// @route   GET /api/vendor-products/:id
// @access  Public/Vendor
export const getVendorProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorProduct = await VendorProduct.findById(id)
      .populate("productId", "productName shortDescription images category")
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name state");

    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Vendor product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendorProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendor product",
      error: error.message,
    });
  }
};

// @desc    Create new vendor product
// @route   POST /api/vendor-products
// @access  Vendor
export const createVendorProduct = async (req, res) => {
  try {
    const {
      productId,
      vendorId: bodyVendorId,
      cityId,
      priceType,
      pricing,
      availableStock,
      minimumOrderQuantity,
      notifyQuantity,
      status,
    } = req.body;

    // Use vendor ID from token if user is a vendor, otherwise use body vendorId (for admin)
    const vendorId = req.user?.role === "vendor" ? req.user.userId : bodyVendorId;

    // Validate required fields
    if (!productId || !vendorId || !cityId || !priceType) {
      return res.status(400).json({
        success: false,
        message: "productId, vendorId, cityId, and priceType are required",
      });
    }

    // Validate priceType
    if (!["single", "bulk"].includes(priceType)) {
      return res.status(400).json({
        success: false,
        message: "priceType must be either 'single' or 'bulk'",
      });
    }

    // Validate pricing based on priceType
    if (priceType === "single") {
      if (!pricing?.single?.price) {
        return res.status(400).json({
          success: false,
          message: "Single price is required when priceType is 'single'",
        });
      }
    } else if (priceType === "bulk") {
      if (!pricing?.bulk || !Array.isArray(pricing.bulk) || pricing.bulk.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one bulk price slab is required when priceType is 'bulk'",
        });
      }

      // Validate bulk price slabs
      for (const slab of pricing.bulk) {
        if (!slab.minQty || !slab.maxQty || !slab.price) {
          return res.status(400).json({
            success: false,
            message: "Each bulk price slab must have minQty, maxQty, and price",
          });
        }
        if (slab.minQty >= slab.maxQty) {
          return res.status(400).json({
            success: false,
            message: "minQty must be less than maxQty in bulk price slabs",
          });
        }
      }
    }

    // Check if vendor product already exists for this combination
    const existingVendorProduct = await VendorProduct.findOne({
      productId,
      vendorId,
      cityId,
    });

    if (existingVendorProduct) {
      return res.status(409).json({
        success: false,
        message: "Vendor product already exists for this product, vendor, and city combination",
      });
    }

    // Prepare pricing object based on priceType
    let pricingData = {};
    if (priceType === "single") {
      pricingData = {
        single: {
          price: pricing?.single?.price || 0,
        },
        bulk: [],
      };
    } else if (priceType === "bulk") {
      pricingData = {
        bulk: pricing?.bulk || [],
        single: undefined,
      };
    }

    // Create vendor product
    const vendorProduct = await VendorProduct.create({
      productId,
      vendorId,
      cityId,
      priceType,
      pricing: pricingData,
      availableStock: availableStock !== undefined ? availableStock : 0,
      minimumOrderQuantity: minimumOrderQuantity !== undefined ? minimumOrderQuantity : 1,
      notifyQuantity,
      status: status !== undefined ? status : true,
    });

    // Populate before sending response
    await vendorProduct.populate([
      { path: "productId", select: "productName shortDescription images category" },
      { path: "vendorId", select: "businessName email phone" },
      { path: "cityId", select: "name state" },
    ]);

    res.status(201).json({
      success: true,
      message: "Vendor product created successfully",
      data: vendorProduct,
    });
  } catch (error) {
    console.error("Error creating vendor product:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }

    // Handle pre-save hook errors
    if (error.message && (
      error.message.includes("Single price is required") ||
      error.message.includes("bulk price slab is required")
    )) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    // Handle CastError (invalid ObjectId)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating vendor product",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Update vendor product
// @route   PUT /api/vendor-products/:id
// @access  Vendor
export const updateVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      priceType,
      pricing,
      availableStock,
      minimumOrderQuantity,
      notifyQuantity,
      status,
    } = req.body;

    // Find vendor product
    const vendorProduct = await VendorProduct.findById(id);

    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Vendor product not found",
      });
    }

    // If user is a vendor, ensure they can only update their own products
    if (req.user?.role === "vendor" && vendorProduct.vendorId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only update your own products",
      });
    }

    // Prepare update data
    const updateData = {};

    if (priceType !== undefined) {
      if (!["single", "bulk"].includes(priceType)) {
        return res.status(400).json({
          success: false,
          message: "priceType must be either 'single' or 'bulk'",
        });
      }
      updateData.priceType = priceType;
    }

    if (pricing !== undefined) {
      // Validate pricing based on current or new priceType
      const currentPriceType = updateData.priceType || vendorProduct.priceType;

      if (currentPriceType === "single") {
        if (!pricing?.single?.price) {
          return res.status(400).json({
            success: false,
            message: "Single price is required when priceType is 'single'",
          });
        }
      } else if (currentPriceType === "bulk") {
        if (!pricing?.bulk || !Array.isArray(pricing.bulk) || pricing.bulk.length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one bulk price slab is required when priceType is 'bulk'",
          });
        }

        // Validate bulk price slabs
        for (const slab of pricing.bulk) {
          if (!slab.minQty || !slab.maxQty || !slab.price) {
            return res.status(400).json({
              success: false,
              message: "Each bulk price slab must have minQty, maxQty, and price",
            });
          }
          if (slab.minQty >= slab.maxQty) {
            return res.status(400).json({
              success: false,
              message: "minQty must be less than maxQty in bulk price slabs",
            });
          }
        }
      }

      updateData.pricing = pricing;
    }

    if (availableStock !== undefined) updateData.availableStock = availableStock;
    if (minimumOrderQuantity !== undefined) updateData.minimumOrderQuantity = minimumOrderQuantity;
    if (notifyQuantity !== undefined) updateData.notifyQuantity = notifyQuantity;
    if (status !== undefined) updateData.status = status;

    // Update vendor product
    const updatedVendorProduct = await VendorProduct.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("productId", "productName shortDescription images category")
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name state");

    res.status(200).json({
      success: true,
      message: "Vendor product updated successfully",
      data: updatedVendorProduct,
    });
  } catch (error) {
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
      message: "Error updating vendor product",
      error: error.message,
    });
  }
};

// @desc    Delete vendor product
// @route   DELETE /api/vendor-products/:id
// @access  Vendor/Admin
export const deleteVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorProduct = await VendorProduct.findById(id);

    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Vendor product not found",
      });
    }

    // If user is a vendor, ensure they can only delete their own products
    if (req.user?.role === "vendor" && vendorProduct.vendorId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only delete your own products",
      });
    }

    await VendorProduct.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Vendor product deleted successfully",
      data: vendorProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting vendor product",
      error: error.message,
    });
  }
};

// @desc    Get vendor products by vendor ID
// @route   GET /api/vendor-products/vendor/:vendorId
// @access  Public/Vendor
export const getVendorProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { cityId, status, page = 1, limit = 10 } = req.query;

    const query = { vendorId };
    if (cityId) query.cityId = cityId;
    if (status !== undefined) query.status = status === "true";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await VendorProduct.find(query)
      .populate("productId", "productName shortDescription images category")
      .populate("cityId", "name state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await VendorProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendorProducts,
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
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

// @desc    Get vendor products by city ID
// @route   GET /api/vendor-products/city/:cityId
// @access  Public
export const getVendorProductsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { vendorId, productId, status, page = 1, limit = 10 } = req.query;

    const query = { cityId };
    if (vendorId) query.vendorId = vendorId;
    if (productId) query.productId = productId;
    if (status !== undefined) query.status = status === "true";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await VendorProduct.find(query)
      .populate("productId", "productName shortDescription images category")
      .populate("vendorId", "businessName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await VendorProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendorProducts,
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
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

// @desc    Update stock for vendor product
// @route   PATCH /api/vendor-products/:id/stock
// @access  Vendor
export const updateVendorProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { availableStock, notifyQuantity } = req.body;

    if (availableStock === undefined && notifyQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "availableStock or notifyQuantity is required",
      });
    }

    const vendorProduct = await VendorProduct.findById(id);

    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Vendor product not found",
      });
    }

    // If user is a vendor, ensure they can only update their own products
    if (req.user?.role === "vendor" && vendorProduct.vendorId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only update your own products",
      });
    }

    const updateData = {};
    if (availableStock !== undefined) updateData.availableStock = availableStock;
    if (notifyQuantity !== undefined) updateData.notifyQuantity = notifyQuantity;

    const updatedVendorProduct = await VendorProduct.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("productId", "productName shortDescription images category")
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name state");

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: updatedVendorProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating stock",
      error: error.message,
    });
  }
};

// @desc    Toggle vendor product status
// @route   PATCH /api/vendor-products/:id/status
// @access  Vendor
export const toggleVendorProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorProduct = await VendorProduct.findById(id);

    if (!vendorProduct) {
      return res.status(404).json({
        success: false,
        message: "Vendor product not found",
      });
    }

    // If user is a vendor, ensure they can only update their own products
    if (req.user?.role === "vendor" && vendorProduct.vendorId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - You can only update your own products",
      });
    }

    vendorProduct.status = !vendorProduct.status;
    await vendorProduct.save();

    await vendorProduct.populate([
      { path: "productId", select: "productName shortDescription images category" },
      { path: "vendorId", select: "businessName email phone" },
      { path: "cityId", select: "name state" },
    ]);

    res.status(200).json({
      success: true,
      message: `Vendor product ${vendorProduct.status ? "activated" : "deactivated"} successfully`,
      data: vendorProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling vendor product status",
      error: error.message,
    });
  }
};

// @desc    Get authenticated vendor's own products
// @route   GET /api/vendor-products/my-products
// @access  Vendor
export const getMyVendorProducts = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { cityId, status, page = 1, limit = 10 } = req.query;

    const query = { vendorId };
    if (cityId) query.cityId = cityId;
    if (status !== undefined) query.status = status === "true";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await VendorProduct.find(query)
      .populate("productId", "productName shortDescription images category")
      .populate("cityId", "name state")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await VendorProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendorProducts,
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
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

