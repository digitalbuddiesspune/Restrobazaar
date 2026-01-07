import Category from "../../models/admin/Category.js";

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug, isActive: true });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin
export const createCategory = async (req, res) => {
  try {
    const { name, slug, image, description, subcategories, isActive, priority } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }
    
    // Generate slug if not provided
    const categorySlug = slug || generateSlug(name);
    
    // Check if category with same name or slug already exists
    const existingCategory = await Category.findOne({
      $or: [{ name: name.trim() }, { slug: categorySlug }],
    });
    
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }
    
    // Create category
    const category = await Category.create({
      name: name.trim(),
      slug: categorySlug,
      image,
      description,
      subcategories: subcategories || [],
      isActive: isActive !== undefined ? isActive : true,
      priority: priority !== undefined ? priority : 0,
    });
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, image, description, subcategories, isActive, priority } = req.body;
    
    // Find category
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
      // Generate slug if name changed and slug not provided
      if (!slug) {
        updateData.slug = generateSlug(name);
      }
    }
    
    if (slug !== undefined) {
      updateData.slug = slug;
    }
    
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (subcategories !== undefined) updateData.subcategories = subcategories;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priority !== undefined) updateData.priority = priority;
    
    // Check if name or slug conflicts with another category
    if (updateData.name || updateData.slug) {
      const conflictQuery = { _id: { $ne: id } };
      
      if (updateData.name) {
        conflictQuery.$or = [{ name: updateData.name }];
        if (updateData.slug) {
          conflictQuery.$or.push({ slug: updateData.slug });
        }
      } else if (updateData.slug) {
        conflictQuery.slug = updateData.slug;
      }
      
      const existingCategory = await Category.findOne(conflictQuery);
      
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "Category with this name or slug already exists",
        });
      }
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    
    await Category.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// @desc    Seed categories (from predefined data)
// @route   POST /api/categories/seed
// @access  Admin
export const seedCategories = async (req, res) => {
  try {
    // This endpoint can be used to seed categories from the request body
    // or from a predefined array. For now, we'll accept an array in the request body.
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: "Categories array is required",
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const catData of categories) {
      try {
        // Generate slug if not provided
        const slug = catData.slug || generateSlug(catData.name);
        
        const category = await Category.findOneAndUpdate(
          { slug },
          {
            name: catData.name,
            slug,
            image: catData.image,
            description: catData.description,
            subcategories: catData.subcategories || [],
            isActive: catData.isActive !== undefined ? catData.isActive : true,
            priority: catData.priority !== undefined ? catData.priority : 0,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        results.push(category);
      } catch (error) {
        errors.push({
          name: catData.name,
          error: error.message,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} categories`,
      data: {
        created: results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error seeding categories",
      error: error.message,
    });
  }
};

