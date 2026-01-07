import City from "../../models/admin/city.js";

// @desc    Get all cities
// @route   GET /api/cities
// @access  Public
export const getAllCities = async (req, res) => {
  try {
    const { isActive, isServiceable, state, country } = req.query;
    
    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isServiceable !== undefined) query.isServiceable = isServiceable === "true";
    if (state) query.state = state;
    if (country) query.country = country;
    
    const cities = await City.find(query)
      .sort({ priority: -1, name: 1 })
      .select("-__v");
    
    res.status(200).json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// @desc    Get city by ID
// @route   GET /api/cities/:id
// @access  Public
export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching city",
      error: error.message,
    });
  }
};

// @desc    Get city by name
// @route   GET /api/cities/name/:name
// @access  Public
export const getCityByName = async (req, res) => {
  try {
    const { name } = req.params;
    
    const city = await City.findOne({ 
      name: name.toLowerCase().trim(),
      isActive: true 
    });
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching city",
      error: error.message,
    });
  }
};

// @desc    Get serviceable cities
// @route   GET /api/cities/serviceable
// @access  Public
export const getServiceableCities = async (req, res) => {
  try {
    const cities = await City.find({ 
      isServiceable: true, 
      isActive: true 
    })
      .sort({ priority: -1, displayName: 1 })
      .select("name displayName state country pincodePrefixes");
    
    res.status(200).json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching serviceable cities",
      error: error.message,
    });
  }
};

// @desc    Get cities by state
// @route   GET /api/cities/state/:state
// @access  Public
export const getCitiesByState = async (req, res) => {
  try {
    const { state } = req.params;
    
    const cities = await City.find({ 
      state: state.trim(),
      isActive: true 
    })
      .sort({ priority: -1, displayName: 1 });
    
    res.status(200).json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cities by state",
      error: error.message,
    });
  }
};

// @desc    Create new city
// @route   POST /api/cities
// @access  Admin
export const createCity = async (req, res) => {
  try {
    const { 
      name, 
      displayName, 
      state, 
      country, 
      pincodePrefixes, 
      isServiceable, 
      isActive, 
      priority 
    } = req.body;
    
    // Validate required fields
    if (!name || !displayName || !state) {
      return res.status(400).json({
        success: false,
        message: "City name, display name, and state are required",
      });
    }
    
    // Normalize name to lowercase
    const normalizedName = name.toLowerCase().trim();
    
    // Check if city with same name already exists
    const existingCity = await City.findOne({ name: normalizedName });
    
    if (existingCity) {
      return res.status(409).json({
        success: false,
        message: "City with this name already exists",
      });
    }
    
    // Create city
    const city = await City.create({
      name: normalizedName,
      displayName: displayName.trim(),
      state: state.trim(),
      country: country || "India",
      pincodePrefixes: pincodePrefixes || [],
      isServiceable: isServiceable !== undefined ? isServiceable : true,
      isActive: isActive !== undefined ? isActive : true,
      priority: priority !== undefined ? priority : 0,
    });
    
    res.status(201).json({
      success: true,
      message: "City created successfully",
      data: city,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "City with this name already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating city",
      error: error.message,
    });
  }
};

// @desc    Update city
// @route   PUT /api/cities/:id
// @access  Admin
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      displayName, 
      state, 
      country, 
      pincodePrefixes, 
      isServiceable, 
      isActive, 
      priority 
    } = req.body;
    
    // Find city
    const city = await City.findById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.toLowerCase().trim();
    }
    
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (country !== undefined) updateData.country = country;
    if (pincodePrefixes !== undefined) updateData.pincodePrefixes = pincodePrefixes;
    if (isServiceable !== undefined) updateData.isServiceable = isServiceable;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (priority !== undefined) updateData.priority = priority;
    
    // Check if name conflicts with another city
    if (updateData.name) {
      const existingCity = await City.findOne({ 
        name: updateData.name,
        _id: { $ne: id }
      });
      
      if (existingCity) {
        return res.status(409).json({
          success: false,
          message: "City with this name already exists",
        });
      }
    }
    
    // Update city
    const updatedCity = await City.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: updatedCity,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "City with this name already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating city",
      error: error.message,
    });
  }
};

// @desc    Delete city
// @route   DELETE /api/cities/:id
// @access  Admin
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    await City.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "City deleted successfully",
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting city",
      error: error.message,
    });
  }
};

// @desc    Toggle city active status
// @route   PATCH /api/cities/:id/toggle-active
// @access  Admin
export const toggleCityActive = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    city.isActive = !city.isActive;
    await city.save();
    
    res.status(200).json({
      success: true,
      message: `City ${city.isActive ? "activated" : "deactivated"} successfully`,
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling city status",
      error: error.message,
    });
  }
};

// @desc    Toggle city serviceable status
// @route   PATCH /api/cities/:id/toggle-serviceable
// @access  Admin
export const toggleCityServiceable = async (req, res) => {
  try {
    const { id } = req.params;
    
    const city = await City.findById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }
    
    city.isServiceable = !city.isServiceable;
    await city.save();
    
    res.status(200).json({
      success: true,
      message: `City ${city.isServiceable ? "marked as serviceable" : "marked as not serviceable"} successfully`,
      data: city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling city serviceable status",
      error: error.message,
    });
  }
};

// @desc    Seed cities (from predefined data)
// @route   POST /api/cities/seed
// @access  Admin
export const seedCities = async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!cities || !Array.isArray(cities)) {
      return res.status(400).json({
        success: false,
        message: "Cities array is required",
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const cityData of cities) {
      try {
        if (!cityData.name || !cityData.displayName || !cityData.state) {
          errors.push({
            name: cityData.name || "Unknown",
            error: "Missing required fields: name, displayName, or state",
          });
          continue;
        }
        
        const normalizedName = cityData.name.toLowerCase().trim();
        
        const city = await City.findOneAndUpdate(
          { name: normalizedName },
          {
            name: normalizedName,
            displayName: cityData.displayName.trim(),
            state: cityData.state.trim(),
            country: cityData.country || "India",
            pincodePrefixes: cityData.pincodePrefixes || [],
            isServiceable: cityData.isServiceable !== undefined ? cityData.isServiceable : true,
            isActive: cityData.isActive !== undefined ? cityData.isActive : true,
            priority: cityData.priority !== undefined ? cityData.priority : 0,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        results.push(city);
      } catch (error) {
        errors.push({
          name: cityData.name || "Unknown",
          error: error.message,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.length} cities`,
      data: {
        created: results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error seeding cities",
      error: error.message,
    });
  }
};

