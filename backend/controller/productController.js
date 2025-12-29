import Product from "../models/Product.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

// Get all products with optional filters
const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      categorySlug,
      subcategory,
      search,
      minPrice,
      maxPrice,
      city,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // For admin, allow viewing all products (including inactive)
    const query = {};
    if (req.query.all !== 'true') {
      query.isActive = true;
    }

    // Filter by category ID
    if (category) {
      query.category = category;
    }

    // Filter by category slug
    if (categorySlug) {
      const categoryDoc = await Category.findOne({ slug: categorySlug, isActive: true });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Filter by subcategory if provided
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Search by name or description
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      );
    }

    // City filter - if city is "Other" or not provided, show all products
    // If specific city is selected, show only products for that city (not "Other")
    // For city_admin, automatically filter by their city
    if (req.user && req.user.role === 'city_admin' && req.user.city) {
      query.city = req.user.city;
    } else if (city && city !== 'Other' && city !== '') {
      query.city = city;
    }

    // Apply search conditions if they exist
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = {};
    
    // Check if this is for "All Products" page (no category filter)
    const isAllProductsPage = !category && !categorySlug;
    
    // Default sort by allProductsOrder for All Products page, sequenceListing for category pages
    if (sortBy === "createdAt" && !req.query.sortBy) {
      if (isAllProductsPage) {
        // For All Products page, use allProductsOrder
        sortOptions.allProductsOrder = 1; // Ascending - lower numbers first
        sortOptions.createdAt = -1; // Then by createdAt descending
      } else {
        // For category pages, use sequenceListing
        sortOptions.sequenceListing = 1; // Ascending - lower numbers first
        sortOptions.createdAt = -1; // Then by createdAt descending
      }
    } else {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
      // If sorting by something other than sequenceListing/allProductsOrder, add as secondary sort
      if (sortBy !== "sequenceListing" && sortBy !== "allProductsOrder") {
        if (isAllProductsPage) {
          sortOptions.allProductsOrder = 1; // Secondary sort by allProductsOrder
        } else {
          sortOptions.sequenceListing = 1; // Secondary sort by sequenceListing
        }
      }
    }

    const products = await Product.find(query)
      .populate("category", "name slug image")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product by slug
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug image")
      .lean(); // Use lean() to get plain JavaScript object

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Ensure specifications object exists
    if (!product.specifications) {
      product.specifications = {};
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category", "name slug image");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    console.log('Received product data:', JSON.stringify(productData, null, 2));

    // Check if category exists and is valid
    if (!productData.category || productData.category.trim() === '') {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productData.category)) {
      return res.status(400).json({ success: false, message: "Invalid category ID format" });
    }

    const category = await Category.findById(productData.category);
    if (!category) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    // For city_admin, automatically set the city
    if (req.user && req.user.role === 'city_admin' && req.user.city) {
      productData.city = req.user.city;
    }

    // Generate slug if not provided
    if (!productData.slug && productData.name) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Clean up specifications - remove empty strings and ensure proper structure
    if (productData.specifications && typeof productData.specifications === 'object') {
      const specs = {};
      
      // Process each field in specifications
      Object.keys(productData.specifications).forEach(key => {
        const value = productData.specifications[key];
        
        // Skip empty values
        if (value === '' || value === null || value === undefined) {
          return;
        }
        
        // Handle size object separately
        if (key === 'size' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const sizeObj = {};
          Object.keys(value).forEach(sizeKey => {
            if (value[sizeKey] !== '' && value[sizeKey] !== null && value[sizeKey] !== undefined) {
              sizeObj[sizeKey] = value[sizeKey];
            }
          });
          if (Object.keys(sizeObj).length > 0) {
            specs.size = sizeObj;
          }
        } else if (key !== 'size') {
          // Add non-empty, non-size fields
          specs[key] = value;
        }
      });
      
      // Only include specifications if it has at least one field
      if (Object.keys(specs).length > 0) {
        productData.specifications = specs;
      } else {
        delete productData.specifications;
      }
    } else if (productData.specifications) {
      // If specifications is not an object, remove it
      delete productData.specifications;
    }

    // Remove any undefined values
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    console.log('Cleaned product data:', JSON.stringify(productData, null, 2));

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name slug image"
    );

    res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Product slug already exists" });
    }
    console.error('Error creating product:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // For city_admin, ensure they can't change the city and can only update their city's products
    if (req.user && req.user.role === 'city_admin') {
      // Check if product belongs to their city
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      if (existingProduct.city !== req.user.city) {
        return res.status(403).json({ success: false, message: "You can only update products from your city" });
      }
      // Prevent city_admin from changing the city
      delete updateData.city;
    }

    // Check if category exists if being updated
    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        return res.status(400).json({ success: false, message: "Category not found" });
      }
    }

    // Clean up specifications - remove empty strings and ensure proper structure
    if (updateData.specifications && typeof updateData.specifications === 'object') {
      const specs = {};
      
      // Process each field in specifications
      Object.keys(updateData.specifications).forEach(key => {
        const value = updateData.specifications[key];
        
        // Skip empty values
        if (value === '' || value === null || value === undefined) {
          return;
        }
        
        // Handle size object separately
        if (key === 'size' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const sizeObj = {};
          Object.keys(value).forEach(sizeKey => {
            if (value[sizeKey] !== '' && value[sizeKey] !== null && value[sizeKey] !== undefined) {
              sizeObj[sizeKey] = value[sizeKey];
            }
          });
          if (Object.keys(sizeObj).length > 0) {
            specs.size = sizeObj;
          }
        } else if (key !== 'size') {
          // Add non-empty, non-size fields
          specs[key] = value;
        }
      });
      
      // Only include specifications if it has at least one field
      if (Object.keys(specs).length > 0) {
        updateData.specifications = specs;
      } else {
        delete updateData.specifications;
      }
    } else if (updateData.specifications) {
      // If specifications is not an object, remove it
      delete updateData.specifications;
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug image");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Product slug already exists" });
    }
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // For city_admin, ensure they can only delete products from their city
    if (req.user && req.user.role === 'city_admin') {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      if (product.city !== req.user.city) {
        return res.status(403).json({ success: false, message: "You can only delete products from your city" });
      }
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get products by category slug
const getProductsByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, subcategory } = req.query;

    const category = await Category.findOne({ slug: categorySlug, isActive: true });

    // If category doesn't exist, return empty products array instead of 404
    if (!category) {
      return res.status(200).json({
        success: true,
        data: {
          category: null,
          products: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    const query = { category: category._id, isActive: true };

    // Filter by subcategory if provided
    if (subcategory) {
      // Use the subcategory field directly from the product model
      query.subcategory = subcategory;
    }

    // Filter by city - if city is "Other" or not provided, show all products
    // If specific city is selected, show only products for that city (not "Other")
    // For city_admin, automatically filter by their city
    if (req.user && req.user.role === 'city_admin' && req.user.city) {
      query.city = req.user.city;
    } else {
      const { city } = req.query;
      if (city && city !== 'Other' && city !== '') {
        query.city = city;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate("category", "name slug image")
      .sort({ sequenceListing: 1, createdAt: -1 }) // Sort by sequenceListing first (ascending), then by createdAt
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        category,
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getAllProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
};

