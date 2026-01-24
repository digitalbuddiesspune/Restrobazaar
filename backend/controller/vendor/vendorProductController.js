import VendorProduct from "../../models/vendor/vendorProductSchema.js";
import Product from "../../models/admin/globalProduct.js";

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
    // Default to showing only active products if status is not explicitly set
    if (status !== undefined) {
      query.status = status === "true";
    } else {
      query.status = true; // Default to active products only
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with population
    const vendorProducts = await VendorProduct.find(query)
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
      defaultPrice,
      productPurchasedFrom,
      purchasedMode,
      purchasedAmount,
      gst,
      cgst,
      sgst,
      igst,
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
      defaultPrice: defaultPrice !== undefined ? defaultPrice : 0,
      productPurchasedFrom,
      purchasedMode,
      purchasedAmount,
      gst: gst !== undefined ? gst : 0,
      cgst: cgst !== undefined ? cgst : 0,
      sgst: sgst !== undefined ? sgst : 0,
      igst: igst !== undefined ? igst : 0,
      pricing: pricingData,
      availableStock: availableStock !== undefined ? availableStock : 0,
      minimumOrderQuantity: minimumOrderQuantity !== undefined ? minimumOrderQuantity : 1,
      notifyQuantity,
      status: status !== undefined ? status : true,
    });

    // Populate before sending response
    await vendorProduct.populate([
      { 
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      },
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
      defaultPrice,
      productPurchasedFrom,
      purchasedMode,
      purchasedAmount,
      gst,
      cgst,
      sgst,
      igst,
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

    if (defaultPrice !== undefined) updateData.defaultPrice = defaultPrice;
    if (productPurchasedFrom !== undefined) updateData.productPurchasedFrom = productPurchasedFrom;
    if (purchasedMode !== undefined) updateData.purchasedMode = purchasedMode;
    if (purchasedAmount !== undefined) updateData.purchasedAmount = purchasedAmount;
    if (gst !== undefined) updateData.gst = gst;
    if (cgst !== undefined) updateData.cgst = cgst;
    if (sgst !== undefined) updateData.sgst = sgst;
    if (igst !== undefined) updateData.igst = igst;
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
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
    // Default to showing only active products if status is not explicitly set
    if (status !== undefined) {
      query.status = status === "true";
    } else {
      query.status = true; // Default to active products only
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await VendorProduct.find(query)
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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
      { 
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      },
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
// @desc    Search vendor products by query string
// @route   GET /api/vendor-products/search
// @access  Public
export const searchVendorProducts = async (req, res) => {
  try {
    const {
      q, // search query
      cityId,
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchQuery = q.trim().toLowerCase();

    // Get cityId from query or use selected city
    let selectedCityId = cityId;

    // Build base query - filter by city and status
    const query = {};
    
    if (selectedCityId) {
      query.cityId = selectedCityId;
    }
    
    // Default to showing only active products if status is not explicitly set
    if (status !== undefined) {
      query.status = status === "true";
    } else {
      query.status = true; // Default to active products only
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // First, find products that match the search query
    // Search in productName, shortDescription, and searchTags
    const productSearchQuery = {
      $or: [
        { productName: { $regex: searchQuery, $options: "i" } },
        { shortDescription: { $regex: searchQuery, $options: "i" } },
        { searchTags: { $in: [new RegExp(searchQuery, "i")] } },
      ],
      status: true, // Only active products
    };

    const matchingProducts = await Product.find(productSearchQuery).select("_id");

    const productIds = matchingProducts.map((p) => p._id);

    // If no products found, return empty result
    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        query: searchQuery,
      });
    }

    // Add productId filter to query
    query.productId = { $in: productIds };

    // Execute query with population
    let vendorProducts = await VendorProduct.find(query)
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name displayName state")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await VendorProduct.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: vendorProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
      },
      query: searchQuery,
    });
  } catch (error) {
    console.error("Error searching vendor products:", error);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

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
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
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

// @desc    Get vendor products by city and category
// @route   GET /api/vendor-products/city/:cityId/category/:categoryId
// @access  Public
export const getVendorProductsByCityAndCategory = async (req, res) => {
  try {
    const { cityId, categoryId } = req.params;
    const {
      vendorId,
      priceType,
      status,
      subCategory,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate required parameters
    if (!cityId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "cityId and categoryId are required",
      });
    }

    // Build base query - filter by city and status
    const query = { cityId };
    
    // Default to showing only active products if status is not explicitly set
    if (status !== undefined) {
      query.status = status === "true";
    } else {
      query.status = true; // Default to active products only
    }

    // Additional filters
    if (vendorId) query.vendorId = vendorId;
    if (priceType) query.priceType = priceType;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // First, find products with the matching category and optionally subcategory
    // This approach is more efficient than using populate with match
    const productQuery = {
      category: categoryId,
      status: true,
    };
    
    // Add subcategory filter if provided
    if (subCategory) {
      productQuery.subCategory = subCategory;
    }
    
    const productsWithCategory = await Product.find(productQuery).select("_id subCategory");

    const productIds = productsWithCategory.map((p) => p._id);

    // If no products found in this category, return empty result
    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0,
        },
        filters: {
          cityId,
          categoryId,
          subCategory: subCategory || null,
          vendorId: vendorId || null,
          priceType: priceType || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
        },
      });
    }

    // Add productId filter to query
    query.productId = { $in: productIds };

    // Execute query with population
    let vendorProducts = await VendorProduct.find(query)
      .populate({
        path: "productId",
        populate: {
          path: "category",
          select: "name slug"
        }
      })
      .populate("vendorId", "businessName email phone")
      .populate("cityId", "name displayName state")
      .sort(sort);

    // Apply price filtering if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;

      vendorProducts = vendorProducts.filter((vp) => {
        let price = 0;
        if (vp.priceType === "single" && vp.pricing?.single?.price) {
          price = vp.pricing.single.price;
        } else if (vp.priceType === "bulk" && vp.pricing?.bulk?.length > 0) {
          // Use the first bulk price slab's price for filtering
          price = vp.pricing.bulk[0].price;
        }

        return price >= min && price <= max;
      });
    }

    // Get total count before pagination
    const total = vendorProducts.length;

    // Apply pagination
    vendorProducts = vendorProducts.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      data: vendorProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      filters: {
        cityId,
        categoryId,
        subCategory: subCategory || null,
        vendorId: vendorId || null,
        priceType: priceType || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor products by city and category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

