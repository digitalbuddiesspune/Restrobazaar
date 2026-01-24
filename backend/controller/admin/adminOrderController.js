import Order from '../../models/users/order.js';
import VendorProduct from '../../models/vendor/vendorProductSchema.js';

// @desc    Get all orders (for super admin - shows all vendors' data)
// @route   GET /api/v1/admin/orders
// @access  Super Admin
export const getAllOrders = async (req, res) => {
  try {
    const {
      vendorId,
      cityId,
      status,
      orderStatus,
      paymentStatus,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};

    // Filter by vendor if specified
    if (vendorId) {
      const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
      const vendorProductIds = vendorProducts.map((vp) => vp.productId);
      if (vendorProductIds.length > 0) {
        query['items.productId'] = { $in: vendorProductIds };
      } else {
        // If vendor has no products, return empty result
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        });
      }
    }

    // Filter by service city if specified
    if (cityId) {
      query.vendorServiceCityId = cityId;
    }

    // Add filters
    if (status) {
      query.orderStatus = status;
    }
    if (orderStatus) {
      query.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find orders with populated user data and vendor service city
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email phone city')
      .populate('vendorServiceCityId', 'name displayName');

    // Get total count
    const total = await Order.countDocuments(query);

    // Format orders with all required fields
    const formattedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      
      // Get vendor information for each order item
      const orderWithVendors = {
        ...orderObj,
        order_id: orderObj._id.toString(),
        user_id: orderObj.userId?._id?.toString() || orderObj.userId?.toString() || '',
        Customer_Name: orderObj.deliveryAddress?.name || orderObj.userId?.name || 'N/A',
        Phone: orderObj.deliveryAddress?.phone || orderObj.userId?.phone || 'N/A',
        order_date_and_time: orderObj.createdAt || new Date(),
        sub_total: orderObj.billingDetails?.cartTotal || 0,
        Total_Tax: orderObj.billingDetails?.gstAmount || 0,
        Net_total: orderObj.billingDetails?.totalAmount || 0,
        Coupon_amount: orderObj.couponAmount || 0,
        Order_status: orderObj.orderStatus || 'pending',
        Payment_mode: orderObj.paymentMethod || 'N/A',
        Payment_status: orderObj.paymentStatus || 'pending',
        delivery_date: orderObj.deliveryDate || null,
        Email: orderObj.userId?.email || 'N/A',
        // Use vendor service city instead of user delivery city
        City: orderObj.vendorServiceCityId?.displayName || orderObj.vendorServiceCityId?.name || orderObj.deliveryAddress?.city || 'N/A',
        vendorServiceCityId: orderObj.vendorServiceCityId?._id || orderObj.vendorServiceCityId || null,
      };

      return orderWithVendors;
    });

    res.status(200).json({
      success: true,
      data: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

