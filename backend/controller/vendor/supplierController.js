import Supplier from '../../models/vendor/supplier.js';

// @desc    Get all suppliers for a vendor
// @route   GET /api/v1/vendor/suppliers
// @access  Vendor
export const getSuppliers = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const {
      search,
      isActive,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query
    const query = { vendorId };

    // Filter by active status
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const suppliers = await Supplier.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Supplier.countDocuments(query);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers',
      error: error.message,
    });
  }
};

// @desc    Get a single supplier
// @route   GET /api/v1/vendor/suppliers/:id
// @access  Vendor
export const getSupplierById = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, vendorId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier',
      error: error.message,
    });
  }
};

// @desc    Create a new supplier
// @route   POST /api/v1/vendor/suppliers
// @access  Vendor
export const createSupplier = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { name, phone, alternatePhone } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required',
      });
    }

    // Validate phone number
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number',
      });
    }

    // Validate alternate phone if provided
    let cleanedAltPhone = undefined;
    if (alternatePhone) {
      cleanedAltPhone = alternatePhone.replace(/\D/g, '');
      if (cleanedAltPhone && !/^[6-9]\d{9}$/.test(cleanedAltPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid alternate phone number',
        });
      }
    }

    // Create supplier
    const supplier = await Supplier.create({
      vendorId,
      name: name.trim(),
      phone: cleanedPhone,
      alternatePhone: cleanedAltPhone || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating supplier',
      error: error.message,
    });
  }
};

// @desc    Update a supplier
// @route   PUT /api/v1/vendor/suppliers/:id
// @access  Vendor
export const updateSupplier = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { id } = req.params;
    const { name, phone, alternatePhone, isActive } = req.body;

    // Find supplier
    const supplier = await Supplier.findOne({ _id: id, vendorId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Validate phone if provided
    if (phone) {
      const cleanedPhone = phone.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number',
        });
      }
      supplier.phone = cleanedPhone;
    }

    // Validate alternate phone if provided
    if (alternatePhone !== undefined) {
      if (alternatePhone) {
        const cleanedAltPhone = alternatePhone.replace(/\D/g, '');
        if (cleanedAltPhone && !/^[6-9]\d{9}$/.test(cleanedAltPhone)) {
          return res.status(400).json({
            success: false,
            message: 'Please enter a valid alternate phone number',
          });
        }
        supplier.alternatePhone = cleanedAltPhone;
      } else {
        supplier.alternatePhone = undefined;
      }
    }

    // Update fields
    if (name) supplier.name = name.trim();
    if (isActive !== undefined) supplier.isActive = isActive;

    await supplier.save();

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating supplier',
      error: error.message,
    });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/v1/vendor/suppliers/:id
// @access  Vendor
export const deleteSupplier = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { id } = req.params;

    const supplier = await Supplier.findOneAndDelete({ _id: id, vendorId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting supplier',
      error: error.message,
    });
  }
};

// @desc    Toggle supplier active status
// @route   PATCH /api/v1/vendor/suppliers/:id/toggle-status
// @access  Vendor
export const toggleSupplierStatus = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, vendorId });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      data: supplier,
    });
  } catch (error) {
    console.error('Error toggling supplier status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling supplier status',
      error: error.message,
    });
  }
};
