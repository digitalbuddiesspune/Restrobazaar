import Order from '../../models/users/order.js';
import VendorProduct from '../../models/vendor/vendorProductSchema.js';

// @desc    Get orders for a vendor (orders containing vendor's products)
// @route   GET /api/v1/vendor/orders
// @access  Vendor
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const {
      status,
      orderStatus,
      paymentStatus,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    // Get all vendor products for this vendor to extract productIds
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    if (vendorProductIds.length === 0) {
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

    // Build query for orders that contain vendor's products
    const query = {
      'items.productId': { $in: vendorProductIds },
    };

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

    // Find orders
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email phone');

    // Get total count
    const total = await Order.countDocuments(query);

    // Filter order items to show only vendor's products
    const filteredOrders = orders.map((order) => {
      const vendorOrderItems = order.items.filter((item) =>
        vendorProductIds.some(
          (vpId) => vpId.toString() === item.productId.toString()
        )
      );

      // Calculate vendor's portion of the order
      const vendorOrderTotal = vendorOrderItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const orderObj = order.toObject();
      
      // Format order with all required fields for records view
      return {
        ...orderObj,
        items: vendorOrderItems,
        vendorOrderTotal,
        totalItems: vendorOrderItems.length,
        // Add formatted fields for records view
        order_id: orderObj._id.toString(),
        user_id: orderObj.userId?._id?.toString() || orderObj.userId?.toString() || '',
        Customer_Name: orderObj.deliveryAddress?.name || orderObj.userId?.name || 'N/A',
        Phone: orderObj.deliveryAddress?.phone || orderObj.userId?.phone || 'N/A',
        order_data_and_time: orderObj.createdAt || new Date(),
        sub_total: orderObj.billingDetails?.cartTotal || 0,
        Total_Tax: orderObj.billingDetails?.gstAmount || 0,
        Net_total: orderObj.billingDetails?.totalAmount || 0,
        Coupon_amount: orderObj.couponAmount || 0,
        Order_status: orderObj.orderStatus || 'pending',
        Payment_mode: orderObj.paymentMethod || 'N/A',
        Payment_status: orderObj.paymentStatus || 'pending',
        delivery_data: orderObj.deliveryDate || null,
        Email: orderObj.userId?.email || 'N/A',
        City: orderObj.deliveryAddress?.city || orderObj.userId?.city || 'N/A',
      };
    });

    res.status(200).json({
      success: true,
      data: filteredOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor orders',
      error: error.message,
    });
  }
};

// @desc    Get a single order by ID for vendor
// @route   GET /api/v1/vendor/orders/:id
// @access  Vendor
export const getVendorOrderById = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const orderId = req.params.id;

    // Get vendor's product IDs
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    // Find order
    const order = await Order.findById(orderId).populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order contains vendor's products
    const hasVendorProducts = order.items.some((item) =>
      vendorProductIds.some(
        (vpId) => vpId.toString() === item.productId.toString()
      )
    );

    if (!hasVendorProducts) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - This order does not contain your products',
      });
    }

    // Filter items to show only vendor's products
    const vendorOrderItems = order.items.filter((item) =>
      vendorProductIds.some(
        (vpId) => vpId.toString() === item.productId.toString()
      )
    );

    const vendorOrderTotal = vendorOrderItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        items: vendorOrderItems,
        vendorOrderTotal,
        totalItems: vendorOrderItems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor order',
      error: error.message,
    });
  }
};

// @desc    Update order status (for vendor)
// @route   PATCH /api/v1/vendor/orders/:id/status
// @access  Vendor
export const updateVendorOrderStatus = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const orderId = req.params.id;
    const { orderStatus } = req.body;

    // Validate orderStatus
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!orderStatus || !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid orderStatus is required',
      });
    }

    // Get vendor's product IDs
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order contains vendor's products
    const hasVendorProducts = order.items.some((item) =>
      vendorProductIds.some(
        (vpId) => vpId.toString() === item.productId.toString()
      )
    );

    if (!hasVendorProducts) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - This order does not contain your products',
      });
    }

    // Update order status
    order.orderStatus = orderStatus;
    await order.save();

    // Populate before sending response
    await order.populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message,
    });
  }
};

// @desc    Update payment status (for vendor)
// @route   PATCH /api/v1/vendor/orders/:id/payment-status
// @access  Vendor
export const updateVendorPaymentStatus = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const orderId = req.params.id;
    const { paymentStatus } = req.body;

    // Validate paymentStatus
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid paymentStatus is required',
      });
    }

    // Get vendor's product IDs
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order contains vendor's products
    const hasVendorProducts = order.items.some((item) =>
      vendorProductIds.some(
        (vpId) => vpId.toString() === item.productId.toString()
      )
    );

    if (!hasVendorProducts) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - This order does not contain your products',
      });
    }

    // Update payment status
    order.paymentStatus = paymentStatus;
    await order.save();

    // Populate before sending response
    await order.populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message,
    });
  }
};

// @desc    Update order items (for vendor)
// @route   PATCH /api/v1/vendor/orders/:id/items
// @access  Vendor
export const updateVendorOrderItems = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const orderId = req.params.id;
    const { items, billingDetails } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and cannot be empty',
      });
    }

    // Get vendor's product IDs
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId price');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId.toString());
    const vendorProductPrices = {};
    vendorProducts.forEach((vp) => {
      vendorProductPrices[vp.productId.toString()] = vp.price;
    });

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Prevent editing if order is delivered
    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit order that is already delivered',
      });
    }

    // Validate that all items belong to this vendor
    for (const item of items) {
      const productId = item.productId?.toString() || item.productId;
      if (!vendorProductIds.includes(productId)) {
        return res.status(403).json({
          success: false,
          message: `Product ${productId} does not belong to this vendor`,
        });
      }
    }

    // Prepare updated items
    const updatedItems = items.map((item) => {
      const productId = item.productId?.toString() || item.productId;
      const price = item.price || vendorProductPrices[productId] || 0;
      const quantity = parseInt(item.quantity) || 1;
      return {
        productId: item.productId,
        productName: item.productName || 'Product',
        productImage: item.productImage || '',
        quantity: quantity,
        price: price,
        total: price * quantity,
      };
    });

    // Update order items
    order.items = updatedItems;

    // Update billing details if provided, otherwise recalculate
    if (billingDetails) {
      order.billingDetails = {
        cartTotal: billingDetails.cartTotal || 0,
        gstAmount: billingDetails.gstAmount || 0,
        shippingCharges: 0, // Free shipping
        totalAmount: billingDetails.totalAmount || 0,
      };
    } else {
      // Recalculate billing details
      const cartTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const gstAmount = cartTotal * 0.18; // 18% GST
      const shippingCharges = 0; // Free shipping
      order.billingDetails = {
        cartTotal: cartTotal,
        gstAmount: gstAmount,
        shippingCharges: shippingCharges,
        totalAmount: cartTotal + gstAmount + shippingCharges,
      };
    }

    await order.save();

    // Populate before sending response
    await order.populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Order items updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error updating order items:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order items',
      error: error.message,
    });
  }
};

// @desc    Get order statistics for vendor
// @route   GET /api/v1/vendor/orders/stats
// @access  Vendor
export const getVendorOrderStats = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // Get vendor's product IDs
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    if (vendorProductIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalOrders: 0,
          pendingOrders: 0,
          confirmedOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0,
        },
      });
    }

    // Build base query
    const baseQuery = {
      'items.productId': { $in: vendorProductIds },
    };

    // Get counts for each status
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(baseQuery),
      Order.countDocuments({ ...baseQuery, orderStatus: 'pending' }),
      Order.countDocuments({ ...baseQuery, orderStatus: 'confirmed' }),
      Order.countDocuments({ ...baseQuery, orderStatus: 'processing' }),
      Order.countDocuments({ ...baseQuery, orderStatus: 'shipped' }),
      Order.countDocuments({ ...baseQuery, orderStatus: 'delivered' }),
      Order.countDocuments({ ...baseQuery, orderStatus: 'cancelled' }),
    ]);

    // Calculate total revenue from delivered orders
    const deliveredOrdersList = await Order.find({
      ...baseQuery,
      orderStatus: 'delivered',
    });

    let totalRevenue = 0;
    deliveredOrdersList.forEach((order) => {
      const vendorItems = order.items.filter((item) =>
        vendorProductIds.some(
          (vpId) => vpId.toString() === item.productId.toString()
        )
      );
      totalRevenue += vendorItems.reduce((sum, item) => sum + item.total, 0);
    });

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message,
    });
  }
};

