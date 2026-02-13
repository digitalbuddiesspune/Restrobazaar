import Order from '../../models/users/order.js';
import Address from '../../models/users/address.js';
import VendorProduct from '../../models/vendor/vendorProductSchema.js';
import Vendor from '../../models/admin/vendor.js';
import City from '../../models/admin/city.js';
import Coupon from '../../models/vendor/coupon.js';
import {
  sendNotificationToUser,
  sendNotificationToVendor,
} from '../../services/notificationService.js';

// @desc    Create a new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId, paymentMethod, cartItems, totalAmount, gstAmount, shippingCharges, cartTotal, paymentId, transactionId, couponCode } = req.body;

    // Validate required fields
    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    if (!paymentMethod || !['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method is required' });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount is required and must be greater than 0' });
    }

    // Fetch the delivery address
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Determine vendorId and vendorServiceCityId from cart items first
    // Get productIds from cart items
    const productIds = cartItems.map(item => item._id || item.productId);

    // Look up vendor products for these productIds
    // Also check if cart items have vendorProductId or vendorId/cityId
    let vendorId = null;
    let vendorServiceCityId = null;

    // First, try to get vendor info from cart items if available
    if (cartItems.length > 0 && (cartItems[0].vendorId || cartItems[0].vendorProductId)) {
      // If cart items have vendorId, use it
      if (cartItems[0].vendorId) {
        vendorId = cartItems[0].vendorId;
      }

      // If cart items have cityId, use it
      if (cartItems[0].cityId) {
        vendorServiceCityId = cartItems[0].cityId;
      }
    }

    // If not found in cart items, look up VendorProduct
    if (!vendorId || !vendorServiceCityId) {
      // Find vendor products for the first product (assuming all items are from same vendor/city)
      const vendorProduct = await VendorProduct.findOne({
        productId: productIds[0]
      }).populate('vendorId', 'serviceCities').populate('cityId');

      if (vendorProduct) {
        vendorId = vendorProduct.vendorId?._id || vendorProduct.vendorId;

        // Get vendor to check service cities
        const vendor = await Vendor.findById(vendorId).populate('serviceCities', 'name displayName');

        if (vendor && vendor.serviceCities && vendor.serviceCities.length > 0) {
          // Match delivery address city with vendor's service cities
          const deliveryCityName = address.city.toLowerCase();

          // Find matching service city
          const matchingServiceCity = vendor.serviceCities.find(city => {
            const cityName = city.name?.toLowerCase() || '';
            const cityDisplayName = city.displayName?.toLowerCase() || '';
            return cityName === deliveryCityName || cityDisplayName === deliveryCityName;
          });

          if (matchingServiceCity) {
            vendorServiceCityId = matchingServiceCity._id || matchingServiceCity;
          } else {
            // If no match, use the vendor product's cityId
            vendorServiceCityId = vendorProduct.cityId?._id || vendorProduct.cityId;
          }
        } else {
          // Fallback to vendor product's cityId
          vendorServiceCityId = vendorProduct.cityId?._id || vendorProduct.cityId;
        }
      }
    }

    // Fetch VendorProduct records for all items to get GST percentages
    const vendorProducts = await VendorProduct.find({
      productId: { $in: productIds },
      vendorId: vendorId,
    }).select('productId gst');

    // Create a map of productId to GST percentage
    const productGstMap = {};
    vendorProducts.forEach((vp) => {
      const pid = vp.productId?.toString() || vp.productId.toString();
      productGstMap[pid] = vp.gst || 0;
    });

    // Prepare order items with GST calculation per product
    const orderItems = cartItems.map((item) => {
      const productId = item._id || item.productId;
      const productIdStr = productId.toString();
      const quantity = item.quantity;
      const price = item.price;
      const itemTotal = price * quantity;

      // Get GST percentage for this product (default to 0 if not found)
      const gstPercentage = productGstMap[productIdStr] || 0;

      // Calculate GST amount for this item
      const gstAmount = (itemTotal * gstPercentage) / 100;

      return {
        productId: productId,
        productName: item.name || item.productName || 'Product',
        productImage: item.image || item.productImage || '',
        quantity: quantity,
        price: price,
        total: itemTotal,
        gstPercentage: gstPercentage,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
      };
    });

    // Handle coupon if provided
    let couponAmount = 0;
    let appliedCouponId = null;
    let appliedCouponCode = null;

    if (couponCode) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });

        if (coupon) {
          // Check if coupon belongs to the vendor
          if (vendorId && coupon.vendorId.toString() !== vendorId.toString()) {
            return res.status(400).json({
              success: false,
              message: 'This coupon is not valid for this vendor',
            });
          }

          // Check if user can use this coupon
          const canUse = coupon.canBeUsedBy(userId);
          if (!canUse.canUse) {
            return res.status(400).json({
              success: false,
              message: canUse.reason,
            });
          }

          // Calculate discount on cart total (before GST and shipping)
          const discountResult = coupon.calculateDiscount(cartTotal || 0);
          if (discountResult.reason) {
            return res.status(400).json({
              success: false,
              message: discountResult.reason,
            });
          }

          couponAmount = discountResult.discount;
          appliedCouponId = coupon._id;
          appliedCouponCode = coupon.code;

          // Update coupon usage
          coupon.usageCount += 1;
          coupon.usedBy.push({
            userId,
            usedAt: new Date(),
          });
          await coupon.save();
        }
      } catch (couponError) {
        console.error('Error applying coupon:', couponError);
        // Don't fail the order if coupon validation fails, just skip it
      }
    }

    // Calculate total GST from all order items
    const totalGstAmount = orderItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);

    // Calculate final amounts with coupon discount
    // GST calculated per product, shipping calculated on original cart total, then discount applied
    const finalGstAmount = totalGstAmount; // GST calculated per product (before coupon)
    const finalShippingCharges = shippingCharges || 0;
    const totalBeforeCoupon = (cartTotal || 0) + finalGstAmount + finalShippingCharges;
    const finalTotalAmount = Math.max(0, totalBeforeCoupon - couponAmount);

    // Prepare billing details
    const billingDetails = {
      cartTotal: cartTotal || 0,
      gstAmount: finalGstAmount,
      shippingCharges: finalShippingCharges,
      totalAmount: finalTotalAmount,
      couponDiscount: couponAmount, // Store coupon discount separately for reference
    };

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
      gstNumber: req.body.gstNumber || undefined, // Include GST number if provided
    };

    // Determine payment status
    let paymentStatus = 'pending';
    if (paymentMethod === 'cod') {
      paymentStatus = 'pending'; // COD is pending until delivery
    } else if (paymentMethod === 'online' && paymentId) {
      paymentStatus = 'completed'; // Online payment with payment ID is completed
    }

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
      paymentId: paymentId || undefined,
      transactionId: transactionId || undefined,
      orderStatus: 'pending',
      vendorId: vendorId || undefined,
      vendorServiceCityId: vendorServiceCityId || undefined,
      couponAmount: couponAmount,
      couponCode: appliedCouponCode || undefined,
      couponId: appliedCouponId || undefined,
    });

    // Populate order with user details
    await order.populate('userId', 'name email phone');

    sendNotificationToUser({
      userId,
      title: 'Order placed',
      body: `Order #${order.orderNumber} has been placed successfully.`,
      data: {
        type: 'order_placed',
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
      },
    }).catch((error) =>
      console.error('FCM user notification error (order placed):', error)
    );

    if (order.vendorId) {
      sendNotificationToVendor({
        vendorId: order.vendorId,
        title: 'New order received',
        body: `Order #${order.orderNumber} has been placed.`,
        data: {
          type: 'order_received',
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
        },
      }).catch((error) =>
        console.error('FCM vendor notification error (order placed):', error)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

// @desc    Get all orders for the authenticated user
// @route   GET /api/v1/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, cityId, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.orderStatus = status;
    }
    
    // Filter by city if specified
    if (cityId) {
      query.vendorServiceCityId = cityId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone')
      .populate('items.productId', 'hsnCode productName')
      .populate('vendorServiceCityId', 'name displayName')
      .populate('vendorId', 'businessName email gstNumber address bankDetails');

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
};

// @desc    Get a single order by ID for the authenticated user
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const order = await Order.findOne({ _id: req.params.id, userId }).populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message,
    });
  }
};

// @desc    Cancel an order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const order = await Order.findOne({ _id: req.params.id, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    // Store previous status for stock management
    const previousStatus = order.orderStatus;

    // Restore stock if order was previously confirmed
    if (previousStatus === 'confirmed') {
      for (const item of order.items) {
        // Find the vendor product for this item
        const vendorProduct = await VendorProduct.findOne({
          productId: item.productId,
          vendorId: order.vendorId,
          cityId: order.vendorServiceCityId,
        });

        if (vendorProduct) {
          // Restore stock
          vendorProduct.availableStock += item.quantity;
          await vendorProduct.save();
        }
      }
    }

    order.orderStatus = 'cancelled';
    if (order.paymentStatus === 'completed') {
      order.paymentStatus = 'refunded';
    }

    await order.save();
    sendNotificationToUser({
      userId,
      title: 'Order cancelled',
      body: `Order #${order.orderNumber} has been cancelled.`,
      data: {
        type: 'order_cancelled',
        orderId: order._id?.toString(),
        orderNumber: order.orderNumber,
      },
    }).catch((error) =>
      console.error('FCM user notification error (order cancelled):', error)
    );

    if (order.vendorId) {
      sendNotificationToVendor({
        vendorId: order.vendorId,
        title: 'Order cancelled',
        body: `Order #${order.orderNumber} has been cancelled by the customer.`,
        data: {
          type: 'order_cancelled',
          orderId: order._id?.toString(),
          orderNumber: order.orderNumber,
        },
      }).catch((error) =>
        console.error('FCM vendor notification error (order cancelled):', error)
      );
    }
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message,
    });
  }
};
