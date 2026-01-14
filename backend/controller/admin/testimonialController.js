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
    const { review, name, businessType, location, status } = req.body;

    // Validate required fields
    if (!review || !name || !businessType || !location) {
      return res.status(400).json({
        success: false,
        message: "Review, name, business type, and location are required",
      });
    }

    // Create testimonial
    const testimonial = await Testimonial.create({
      review: review.trim(),
      name: name.trim(),
      businessType: businessType.trim(),
      location: location.trim(),
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
