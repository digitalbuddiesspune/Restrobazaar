import Product from "../../models/admin/globalProduct.js";
import Category from "../../models/admin/Category.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Public/Admin
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (category) {
      query.category = category;
    }

    if (subCategory) {
      query.subCategory = subCategory;
    }

    if (status !== undefined) {
      query.status = status === "true" || status === true;
    }

    // Search by product name or search tags
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: "i" } },
        { searchTags: { $in: [new RegExp(search, "i")] } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    // Add img field at the start of each product (first image from images array)
    const productsWithImg = products.map(product => {
      const productObj = product.toObject();
      const img = productObj.images && productObj.images.length > 0 
        ? productObj.images[0].url 
        : null;
      
      // Create new object with img at the start
      return {
        img,
        ...productObj
      };
    });

    res.status(200).json({
      success: true,
      data: productsWithImg,
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
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate(
      "category",
      "name slug"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Admin
export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      searchTags,
      productPurchasedFrom,
      purchasedMode,
      purchasedAmount,
      shortDescription,
      category,
      subCategory,
      otherCategory,
      unit,
      weight,
      capacity,
      size,
      hsnCode,
      gst,
      cgst,
      sgst,
      igst,
      isReturnable,
      showOnSpecialPage,
      status,
      images,
    } = req.body;

    // Validate required fields
    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Create product
    const product = await Product.create({
      productName: productName.trim(),
      searchTags: searchTags || [],
      productPurchasedFrom,
      purchasedMode,
      purchasedAmount,
      shortDescription,
      category,
      subCategory,
      otherCategory,
      unit: unit || "piece",
      weight,
      capacity,
      size: size || {},
      hsnCode,
      gst: gst || 0,
      cgst: cgst || 0,
      sgst: sgst || 0,
      igst: igst || 0,
      isReturnable: isReturnable || false,
      showOnSpecialPage: showOnSpecialPage || false,
      status: status !== undefined ? status : true,
      images: images || [],
    });

    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name slug"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // If category is being updated, verify it exists
    if (updateData.category) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
    }

    // Trim product name if provided
    if (updateData.productName) {
      updateData.productName = updateData.productName.trim();
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "name slug");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// @desc    Search products by tags or name
// @route   GET /api/products/search/:query
// @access  Public
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(query, "i");

    const products = await Product.find({
      $or: [
        { productName: searchRegex },
        { searchTags: { $in: [searchRegex] } },
        { shortDescription: searchRegex },
      ],
      status: true,
    })
      .populate("category", "name slug")
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
      query,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subCategory, status, page = 1, limit = 10 } = req.query;

    const query = { category: categoryId };

    if (subCategory) {
      query.subCategory = subCategory;
    }

    if (status !== undefined) {
      query.status = status === "true" || status === true;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

// @desc    Toggle product status
// @route   PATCH /api/products/:id/toggle-status
// @access  Admin
export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.status = !product.status;
    await product.save();

    const populatedProduct = await Product.findById(id).populate(
      "category",
      "name slug"
    );

    res.status(200).json({
      success: true,
      message: `Product ${product.status ? "activated" : "deactivated"} successfully`,
      data: populatedProduct,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error toggling product status",
      error: error.message,
    });
  }
};

