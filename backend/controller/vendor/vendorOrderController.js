import Order from '../../models/users/order.js';
import VendorProduct from '../../models/vendor/vendorProductSchema.js';
import Vendor from '../../models/admin/vendor.js';
import Address from '../../models/users/address.js';
import Coupon from '../../models/vendor/coupon.js';

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

    // Get vendor's service cities for display purposes
    const vendor = await Vendor.findById(vendorId).select('serviceCities').populate('serviceCities', 'name displayName');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const vendorServiceCityIds = vendor.serviceCities.map(city => 
      city._id ? city._id.toString() : city.toString()
    );

    if (vendorServiceCityIds.length === 0) {
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

    // Create a map of service city IDs to city data for display
    const serviceCityMap = {};
    vendor.serviceCities.forEach((city) => {
      if (city && city._id) {
        const cityIdStr = city._id.toString();
        serviceCityMap[cityIdStr] = {
          cityId: cityIdStr,
          cityName: city.displayName || city.name || 'N/A',
          cityData: city
        };
      }
    });

    // Get vendor products for filtering order items
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

    // Build query using the new vendorId and vendorServiceCityId fields
    // This is much more efficient than the previous approach
    const query = {
      vendorId: vendorId,
      vendorServiceCityId: { $in: vendorServiceCityIds },
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
      .populate('userId', 'name email phone')
      .populate('vendorServiceCityId', 'name displayName');

    // Filter order items to show only vendor's products
    const filteredOrders = orders.map((order) => {
      const vendorOrderItems = order.items.filter((item) => {
        const productIdStr = item.productId.toString();
        return vendorProductIds.some(
          (vpId) => vpId.toString() === productIdStr
        );
      });

      // Calculate vendor's portion of the order
      const vendorOrderTotal = vendorOrderItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const orderObj = order.toObject();
      
      // Get city info from the populated vendorServiceCityId
      const orderCityInfo = order.vendorServiceCityId ? {
        cityId: order.vendorServiceCityId._id?.toString() || order.vendorServiceCityId.toString(),
        cityName: order.vendorServiceCityId.displayName || order.vendorServiceCityId.name || 'N/A',
        cityData: order.vendorServiceCityId
      } : { cityName: 'N/A' };
      
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
        // Show vendor's service city instead of customer's delivery address city
        City: orderCityInfo.cityName || 'N/A',
      };
    });

    // Get total count using the same query
    const total = await Order.countDocuments(query);

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

    // Find order with populated productId to get HSN codes
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'hsnCode productName');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order contains vendor's products
    // Handle both populated and non-populated productId
    const hasVendorProducts = order.items.some((item) => {
      const productId = item.productId?._id || item.productId;
      if (!productId) return false;
      return vendorProductIds.some(
        (vpId) => vpId.toString() === productId.toString()
      );
    });

    if (!hasVendorProducts) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - This order does not contain your products',
      });
    }

    // Filter items to show only vendor's products
    // Handle both populated and non-populated productId
    const vendorOrderItems = order.items.filter((item) => {
      const productId = item.productId?._id || item.productId;
      if (!productId) return false;
      return vendorProductIds.some(
        (vpId) => vpId.toString() === productId.toString()
      );
    });

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
    // Handle both populated and non-populated productId
    const hasVendorProducts = order.items.some((item) => {
      const productId = item.productId?._id || item.productId;
      if (!productId) return false;
      return vendorProductIds.some(
        (vpId) => vpId.toString() === productId.toString()
      );
    });

    if (!hasVendorProducts) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - This order does not contain your products',
      });
    }

    // Prevent status changes if order is already delivered or cancelled
    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a delivered order',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a cancelled order',
      });
    }

    // Store previous status for stock management
    const previousStatus = order.orderStatus;

    // Handle stock reduction/restoration based on status change
    if (orderStatus === 'confirmed' && previousStatus !== 'confirmed') {
      // Reduce stock when order is confirmed
      for (const item of order.items) {
        // Find the vendor product for this item
        // Match by productId (global Product ID), vendorId, and cityId (from order or vendorServiceCityId)
        const vendorProduct = await VendorProduct.findOne({
          productId: item.productId,
          vendorId: order.vendorId || vendorId,
          cityId: order.vendorServiceCityId || order.cityId,
        });

        if (vendorProduct) {
          // Check if sufficient stock is available
          if (vendorProduct.availableStock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${item.productName}. Available: ${vendorProduct.availableStock}, Required: ${item.quantity}`,
            });
          }

          // Reduce stock
          vendorProduct.availableStock -= item.quantity;
          await vendorProduct.save();
        }
      }
    } else if (orderStatus === 'cancelled' && previousStatus === 'confirmed') {
      // Restore stock when order is cancelled (only if it was previously confirmed)
      for (const item of order.items) {
        // Find the vendor product for this item
        const vendorProduct = await VendorProduct.findOne({
          productId: item.productId,
          vendorId: order.vendorId || vendorId,
          cityId: order.vendorServiceCityId || order.cityId,
        });

        if (vendorProduct) {
          // Restore stock
          vendorProduct.availableStock += item.quantity;
          await vendorProduct.save();
        }
      }
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
    // Handle both populated and non-populated productId
    const hasVendorProducts = order.items.some((item) => {
      const productId = item.productId?._id || item.productId;
      if (!productId) return false;
      return vendorProductIds.some(
        (vpId) => vpId.toString() === productId.toString()
      );
    });

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

    // Fetch VendorProduct records to get GST percentages
    const productIds = items.map(item => item.productId?.toString() || item.productId);
    const vendorProductsForGst = await VendorProduct.find({
      productId: { $in: productIds },
      vendorId: vendorId,
    }).select('productId gst');

    // Create a map of productId to GST percentage
    const productGstMap = {};
    vendorProductsForGst.forEach((vp) => {
      const pid = vp.productId?.toString() || vp.productId.toString();
      productGstMap[pid] = vp.gst || 0;
    });

    // Prepare updated items with GST calculation per product
    const updatedItems = items.map((item) => {
      const productId = item.productId?.toString() || item.productId;
      const price = item.price || vendorProductPrices[productId] || 0;
      const quantity = parseInt(item.quantity) || 1;
      const itemTotal = price * quantity;
      
      // Get GST percentage for this product (default to 0 if not found)
      const gstPercentage = productGstMap[productId] || 0;
      
      // Calculate GST amount for this item
      const gstAmount = (itemTotal * gstPercentage) / 100;
      
      return {
        productId: item.productId,
        productName: item.productName || 'Product',
        productImage: item.productImage || '',
        quantity: quantity,
        price: price,
        total: itemTotal,
        gstPercentage: gstPercentage,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
      };
    });

    // Update order items
    order.items = updatedItems;

    // Calculate total GST from all items
    const totalGstAmount = updatedItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);

    // Update billing details if provided, otherwise recalculate
    if (billingDetails) {
      // Recalculate GST from items even if billingDetails is provided
      const cartTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      order.billingDetails = {
        cartTotal: cartTotal,
        gstAmount: totalGstAmount, // Use calculated GST from items
        shippingCharges: billingDetails.shippingCharges || 0,
        totalAmount: cartTotal + totalGstAmount + (billingDetails.shippingCharges || 0),
      };
    } else {
      // Recalculate billing details
      const cartTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const shippingCharges = 0; // Free shipping
      order.billingDetails = {
        cartTotal: cartTotal,
        gstAmount: totalGstAmount, // GST calculated per product
        shippingCharges: shippingCharges,
        totalAmount: cartTotal + totalGstAmount + shippingCharges,
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

    // Get vendor's service cities
    const vendor = await Vendor.findById(vendorId).select('serviceCities');
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    const vendorServiceCityIds = vendor.serviceCities.map(city => 
      city._id ? city._id.toString() : city.toString()
    );

    if (vendorServiceCityIds.length === 0) {
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

    // Get vendor products for calculating revenue
    const vendorProducts = await VendorProduct.find({ vendorId }).select('productId');
    const vendorProductIds = vendorProducts.map((vp) => vp.productId);

    // Build base query using the new vendorId and vendorServiceCityId fields
    const baseQuery = {
      vendorId: vendorId,
      vendorServiceCityId: { $in: vendorServiceCityIds },
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
    }).select('items');

    let totalRevenue = 0;
    deliveredOrdersList.forEach((order) => {
      // Filter items to only include vendor's products
      // Handle both populated and non-populated productId
      const vendorItems = order.items.filter((item) => {
        const productId = item.productId?._id || item.productId;
        if (!productId) return false;
        return vendorProductIds.some(
          (vpId) => vpId.toString() === productId.toString()
        );
      });
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

// @desc    Create order for a user (vendor creating order on behalf of user)
// @route   POST /api/v1/vendor/orders/create-for-user
// @access  Vendor
export const createOrderForUser = async (req, res) => {
  try {
    const vendorId = req.user.userId; // Vendor creating the order
    const { 
      userId, // User for whom the order is being created
      addressId, 
      paymentMethod = 'cod', 
      cartItems, 
      totalAmount, 
      gstAmount, 
      shippingCharges, 
      cartTotal,
      couponCode 
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    if (!addressId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery address is required' 
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart items are required' 
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Total amount is required and must be greater than 0' 
      });
    }

    // Validate payment method
    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid payment method is required' 
      });
    }

    // Fetch the delivery address and verify it belongs to the user
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ 
        success: false, 
        message: 'Address not found or does not belong to the specified user' 
      });
    }

    // Fetch VendorProduct records to get GST percentages
    const productIds = cartItems.map(item => item.productId);
    const vendorProductsForGst = await VendorProduct.find({
      productId: { $in: productIds },
      vendorId: vendorId,
    }).select('productId gst');

    // Create a map of productId to GST percentage
    const productGstMap = {};
    vendorProductsForGst.forEach((vp) => {
      const pid = vp.productId?.toString() || vp.productId.toString();
      productGstMap[pid] = vp.gst || 0;
    });

    // Prepare order items with GST calculation per product
    // Note: item.productId should be the global Product ID (not VendorProduct ID)
    const orderItems = cartItems.map((item) => {
      const productId = item.productId;
      const productIdStr = productId.toString();
      const quantity = item.quantity;
      const price = item.price;
      const itemTotal = price * quantity;
      
      // Get GST percentage for this product (default to 0 if not found)
      const gstPercentage = productGstMap[productIdStr] || 0;
      
      // Calculate GST amount for this item
      const gstAmount = (itemTotal * gstPercentage) / 100;
      
      return {
        productId: productId, // Use productId (global Product ID) - required by Order model
        productName: item.name || item.productName || 'Product',
        productImage: item.image || item.productImage || '',
        quantity: quantity,
        price: price,
        total: itemTotal,
        gstPercentage: gstPercentage,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
      };
    });

    // Get vendor's service cities
    const vendor = await Vendor.findById(vendorId).populate('serviceCities', 'name displayName');
    if (!vendor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendor not found' 
      });
    }

    // Determine vendorServiceCityId from address city
    let vendorServiceCityId = null;
    const deliveryCityName = address.city.toLowerCase();
    
    // Find matching service city
    const matchingServiceCity = vendor.serviceCities.find(city => {
      const cityName = city.name?.toLowerCase() || '';
      const cityDisplayName = city.displayName?.toLowerCase() || '';
      return cityName === deliveryCityName || cityDisplayName === deliveryCityName;
    });

    if (matchingServiceCity) {
      vendorServiceCityId = matchingServiceCity._id || matchingServiceCity;
    } else if (vendor.serviceCities.length > 0) {
      // Use first service city as fallback
      vendorServiceCityId = vendor.serviceCities[0]._id || vendor.serviceCities[0];
    }

    // Handle coupon if provided
    let couponAmount = 0;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        vendorId: vendorId,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      });

      if (coupon) {
        appliedCouponId = coupon._id;
        appliedCouponCode = coupon.code;

        // Calculate coupon discount
        if (coupon.discountType === 'percentage') {
          couponAmount = (cartTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && couponAmount > coupon.maxDiscount) {
            couponAmount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'fixed') {
          couponAmount = coupon.discountValue;
          if (couponAmount > cartTotal) {
            couponAmount = cartTotal;
          }
        }
      }
    }

    // Prepare delivery address
    const deliveryAddress = {
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
    };

    // Calculate total GST from all order items
    const totalGstAmount = orderItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    
    // Recalculate totals based on per-product GST
    const calculatedCartTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const calculatedTotalAmount = calculatedCartTotal + totalGstAmount + (shippingCharges || 0);
    
    // Prepare billing details (amounts)
    const billingDetails = {
      cartTotal: calculatedCartTotal,
      gstAmount: totalGstAmount, // Use calculated GST from items
      shippingCharges: shippingCharges || 0,
      totalAmount: calculatedTotalAmount,
    };    // Payment status
    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';

    // Generate unique order number
    const generateOrderNumber = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return `ORD-${timestamp}-${random}`;
    };

    let orderNumber;
    let isUnique = false;
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existingOrder = await Order.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    // Create order
    const order = await Order.create({
      userId,
      orderNumber,
      items: orderItems,
      deliveryAddress,
      billingDetails,
      paymentMethod,
      paymentStatus,
      orderStatus: 'pending',
      vendorId: vendorId,
      vendorServiceCityId: vendorServiceCityId || undefined,
      couponAmount: couponAmount,
      couponCode: appliedCouponCode || undefined,
      couponId: appliedCouponId || undefined,
    });

    // Populate order with user details
    await order.populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order for user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};