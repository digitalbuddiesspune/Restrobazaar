import Testimonial from "../../models/admin/Testomonials.js";

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Public/Admin
export const getAllTestimonials = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (status !== undefined) {
      query.status = status === "true" || status === true;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { review: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { businessType: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
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
    const testimonials = await Testimonial.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Testimonial.countDocuments(query);

    res.status(200).json({
      success: true,
      data: testimonials,
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
      message: "Error fetching testimonials",
      error: error.message,
    });
  }
};

// @desc    Get testimonial by ID
// @route   GET /api/testimonials/:id
// @access  Public
export const getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching testimonial",
      error: error.message,
    });
  }
};

// @desc    Create new testimonial
// @route   POST /api/testimonials
// @access  Admin
export const createTestimonial = async (req, res) => {
  try {
    // Handle both object and array requests
    let bodyData = req.body;
    if (Array.isArray(req.body)) {
      if (req.body.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Request body cannot be an empty array. Send a JSON object instead.",
        });
      }
      bodyData = req.body[0]; // Use first element if array is sent
    }

    const { review, name, businessType, location, status } = bodyData;

    // Validate required fields
    if (!review || !name || !businessType || !location) {
      return res.status(400).json({
        success: false,
        message: "Review, name, business type, and location are required",
        hint: "Make sure you're sending a JSON object, not an array. Use { ... } instead of [ { ... } ]",
      });
    }

    // Create testimonial
    const testimonial = await Testimonial.create({
      review: String(review).trim(),
      name: String(name).trim(),
      businessType: String(businessType).trim(),
      location: String(location).trim(),
      status: status !== undefined ? status : true,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: testimonial,
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
      message: "Error creating testimonial",
      error: error.message,
    });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Admin
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find testimonial
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // Trim string fields if provided
    if (updateData.review) updateData.review = updateData.review.trim();
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.businessType) updateData.businessType = updateData.businessType.trim();
    if (updateData.location) updateData.location = updateData.location.trim();

    // Update testimonial
    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: updatedTestimonial,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial ID",
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
      message: "Error updating testimonial",
      error: error.message,
    });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Admin
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    await Testimonial.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
      data: testimonial,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting testimonial",
      error: error.message,
    });
  }
};

// @desc    Create multiple testimonials (bulk create)
// @route   POST /api/testimonials/bulk
// @access  Admin
export const createBulkTestimonials = async (req, res) => {
  try {
    // Expect an array of testimonials
    const testimonialsArray = req.body;

    // Validate that request body is an array
    if (!Array.isArray(testimonialsArray)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be an array of testimonials",
      });
    }

    // Validate array is not empty
    if (testimonialsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array cannot be empty. Please provide at least one testimonial.",
      });
    }

    // Validate each testimonial in the array
    const validationErrors = [];
    const validTestimonials = [];

    testimonialsArray.forEach((testimonial, index) => {
      const { review, name, businessType, location, status } = testimonial;

      // Check required fields
      if (!review || !name || !businessType || !location) {
        validationErrors.push({
          index,
          error: "Review, name, business type, and location are required",
        });
        return;
      }

      // Prepare valid testimonial data
      validTestimonials.push({
        review: String(review).trim(),
        name: String(name).trim(),
        businessType: String(businessType).trim(),
        location: String(location).trim(),
        status: status !== undefined ? status : true,
      });
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors found in some testimonials",
        errors: validationErrors,
        validCount: validTestimonials.length,
        invalidCount: validationErrors.length,
      });
    }

    // Create all testimonials using insertMany for better performance
    const createdTestimonials = await Testimonial.insertMany(validTestimonials);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdTestimonials.length} testimonial(s)`,
      data: createdTestimonials,
      count: createdTestimonials.length,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: Object.values(error.errors).map((e) => e.message),
      });
    }

    // Handle bulk write errors
    if (error.name === "BulkWriteError") {
      return res.status(400).json({
        success: false,
        message: "Error creating some testimonials",
        error: error.message,
        insertedCount: error.result?.insertedCount || 0,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating testimonials",
      error: error.message,
    });
  }
};

// @desc    Toggle testimonial status
// @route   PATCH /api/testimonials/:id/toggle-status
// @access  Admin
export const toggleTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    testimonial.status = !testimonial.status;
    await testimonial.save();

    res.status(200).json({
      success: true,
      message: `Testimonial ${testimonial.status ? "activated" : "deactivated"} successfully`,
      data: testimonial,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid testimonial ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error toggling testimonial status",
      error: error.message,
    });
  }
};
