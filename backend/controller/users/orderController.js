import Order from '../../models/users/order.js';
import Address from '../../models/users/address.js';

// @desc    Create a new order
// @route   POST /api/v1/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId, paymentMethod, cartItems, totalAmount, gstAmount, shippingCharges, cartTotal, paymentId, transactionId } = req.body;

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

    // Prepare order items
    const orderItems = cartItems.map((item) => ({
      productId: item._id || item.productId,
      productName: item.name || item.productName || 'Product',
      productImage: item.image || item.productImage || '',
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }));

    // Prepare billing details
    const billingDetails = {
      cartTotal: cartTotal || 0,
      gstAmount: gstAmount || 0,
      shippingCharges: shippingCharges || 0,
      totalAmount: totalAmount,
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
    });

    // Populate order with user details
    await order.populate('userId', 'name email phone');

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
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) {
      query.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email phone');

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

    order.orderStatus = 'cancelled';
    if (order.paymentStatus === 'completed') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

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

