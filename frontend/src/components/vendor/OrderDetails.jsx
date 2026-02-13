import { useVendorOrder, useUpdatePaymentStatus, useUpdateOrderItems, useMyVendorProducts, useVendorProfile } from '../../hooks/useVendorQueries';
import { useState, useEffect } from 'react';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';

const OrderDetails = ({ orderId, onBack, onUpdateStatus }) => {
  const { data: orderData, isLoading, isError, error, refetch } = useVendorOrder(orderId);
  const { data: vendorProductsData } = useMyVendorProducts({ limit: 1000 }, { enabled: true });
  const { data: vendorProfileData } = useVendorProfile();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [paymentStatusValue, setPaymentStatusValue] = useState('unpaid');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState([]);
  const [newItemProductId, setNewItemProductId] = useState('');
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const updateOrderItemsMutation = useUpdateOrderItems();

  const order = orderData?.data || {};
  const vendorProducts = vendorProductsData?.data || [];

  // Helper function: Find vendor product for an item
  const findVendorProductForItem = (item) => {
    const productId = item.productId?._id || item.productId;
    return vendorProducts.find((vp) => {
      const vpProductId = vp.productId?._id || vp.productId;
      return vpProductId?.toString() === productId?.toString();
    });
  };

  // Helper function: Get price based on quantity and price slabs
  const getPriceForQuantity = (vendorProduct, quantity) => {
    if (!vendorProduct) return 0;

    // Single price type
    if (vendorProduct.priceType === 'single' && vendorProduct.pricing?.single?.price) {
      return vendorProduct.pricing.single.price;
    }

    // Bulk price type - find matching slab
    if (vendorProduct.priceType === 'bulk' && vendorProduct.pricing?.bulk?.length > 0) {
      // Sort slabs by minQty (ascending) to find the right one
      const sortedSlabs = [...vendorProduct.pricing.bulk].sort((a, b) => a.minQty - b.minQty);

      // Find the slab that matches the quantity
      for (let i = sortedSlabs.length - 1; i >= 0; i--) {
        const slab = sortedSlabs[i];
        if (quantity >= slab.minQty && quantity <= slab.maxQty) {
          return slab.price;
        }
      }

      // If quantity exceeds all slabs, use the highest slab price
      const highestSlab = sortedSlabs[sortedSlabs.length - 1];
      if (quantity > highestSlab.maxQty) {
        return highestSlab.price;
      }

      // If quantity is below all slabs, use the lowest slab price
      const lowestSlab = sortedSlabs[0];
      if (quantity < lowestSlab.minQty) {
        return lowestSlab.price;
      }
    }

    // Fallback: try to get price from existing item or vendor product
    return vendorProduct.price || vendorProduct.pricing?.single?.price || 0;
  };

  // Update local state when order data changes
  useEffect(() => {
    if (order.paymentStatus === 'completed') {
      setPaymentStatusValue('paid');
    } else {
      setPaymentStatusValue('unpaid');
    }
    // Initialize edited items when order data loads and vendor products are available
    if (order.items && order.items.length > 0 && editedItems.length === 0 && vendorProducts.length > 0) {
      const itemsWithVendorProducts = order.items.map((item) => {
        const vendorProduct = findVendorProductForItem(item);
        return {
          ...item,
          vendorProduct: vendorProduct,
        };
      });
      setEditedItems(itemsWithVendorProducts);
    }
  }, [order.paymentStatus, order.items, vendorProducts]);

  // Reset edit mode when order changes
  useEffect(() => {
    setIsEditMode(false);
    setEditedItems([]);
  }, [orderId]);

  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';
  const canChangeStatus = !isDelivered && !isCancelled;

  const orderStatuses = [
    { value: 'pending', label: 'Pending', colorClass: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', colorClass: 'bg-blue-500' },
    { value: 'processing', label: 'Processing', colorClass: 'bg-purple-500' },
    { value: 'shipped', label: 'Shipped', colorClass: 'bg-indigo-500' },
    { value: 'delivered', label: 'Delivered', colorClass: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', colorClass: 'bg-red-500' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentDisplayText = (order) => {
    const paymentMethod = order.paymentMethod?.toLowerCase();
    const paymentStatus = order.paymentStatus?.toLowerCase();

    // If online payment and completed, show "Paid Online"
    if (paymentMethod === 'online' && paymentStatus === 'completed') {
      return 'Paid Online';
    }

    // If COD and payment status is completed, show "Paid COD"
    if (paymentMethod === 'cod' && paymentStatus === 'completed') {
      return 'Paid COD';
    }

    // Map payment status to display text
    if (paymentStatus === 'completed') {
      return paymentMethod === 'cod' ? 'Paid COD' : 'Paid';
    }

    // Otherwise, show unpaid
    return 'Unpaid';
  };

  const getPaymentDisplayColor = (order) => {
    const paymentStatus = order.paymentStatus?.toLowerCase();

    // If payment is completed, show green (paid)
    if (paymentStatus === 'completed') {
      return 'bg-green-100 text-green-800';
    }

    // Otherwise, show yellow for unpaid/pending
    return 'bg-yellow-100 text-yellow-800';
  };

  const handlePaymentStatusChange = async (selectedValue) => {
    const newStatus = selectedValue === 'paid' ? 'completed' : 'pending';
    const statusLabel = selectedValue === 'paid' ? 'Paid' : 'Unpaid';

    if (window.confirm(`Are you sure you want to change payment status to "${statusLabel}"?`)) {
      try {
        await updatePaymentStatusMutation.mutateAsync({
          id: orderId,
          paymentStatus: newStatus
        });
        // Update local state on success
        setPaymentStatusValue(selectedValue);
        // Refetch order data to ensure UI is updated
        refetch();
      } catch (error) {
        console.error('Error updating payment status:', error);
        alert(error?.response?.data?.message || 'Failed to update payment status');
        // Revert to original value on error
        setPaymentStatusValue(order.paymentStatus === 'completed' ? 'paid' : 'unpaid');
      }
    } else {
      // Revert to original value if user cancels
      setPaymentStatusValue(order.paymentStatus === 'completed' ? 'paid' : 'unpaid');
    }
  };

  const handleEditOrder = () => {
    // Attach vendor product references to items when entering edit mode
    const itemsWithVendorProducts = order.items.map((item) => {
      const vendorProduct = findVendorProductForItem(item);
      return {
        ...item,
        vendorProduct: vendorProduct,
      };
    });
    setEditedItems(itemsWithVendorProducts);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset to original order items with vendor product references
    const itemsWithVendorProducts = order.items.map((item) => {
      const vendorProduct = findVendorProductForItem(item);
      return {
        ...item,
        vendorProduct: vendorProduct,
      };
    });
    setEditedItems(itemsWithVendorProducts);
    setIsEditMode(false);
    setNewItemProductId('');
  };


  const handleQuantityChange = (index, newQuantity) => {
    const qty = parseInt(newQuantity) || 1;
    if (qty < 1) return;

    const updatedItems = [...editedItems];
    const item = updatedItems[index];
    const vendorProduct = findVendorProductForItem(item);

    // Get price based on quantity and price slabs
    const price = getPriceForQuantity(vendorProduct, qty);

    updatedItems[index] = {
      ...updatedItems[index],
      quantity: qty,
      price: price,
      total: price * qty,
      vendorProduct: vendorProduct, // Store reference for future recalculation
    };
    setEditedItems(updatedItems);
  };

  const handleQuantityIncrease = (index) => {
    const currentItem = editedItems[index];
    const vendorProduct = currentItem.vendorProduct || findVendorProductForItem(currentItem);
    const minOrderQty = vendorProduct?.minimumOrderQuantity || 1;
    const currentQty = currentItem.quantity || 1;
    const newQty = currentQty + minOrderQty;
    handleQuantityChange(index, newQty);
  };

  const handleQuantityDecrease = (index) => {
    const currentItem = editedItems[index];
    const vendorProduct = currentItem.vendorProduct || findVendorProductForItem(currentItem);
    const minOrderQty = vendorProduct?.minimumOrderQuantity || 1;
    const currentQty = currentItem.quantity || 1;
    const newQty = Math.max(minOrderQty, currentQty - minOrderQty);
    handleQuantityChange(index, newQty);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(updatedItems);
  };

  const handleAddNewItem = () => {
    if (!newItemProductId) return;

    const vendorProduct = vendorProducts.find(
      (vp) => vp._id === newItemProductId || vp._id?.toString() === newItemProductId
    );

    if (!vendorProduct) return;

    const productId = vendorProduct.productId?._id || vendorProduct.productId;
    const productName = vendorProduct.productId?.productName || vendorProduct.productName || 'Product';
    const productImage = vendorProduct.productId?.images?.[0]?.url || vendorProduct.productId?.images?.[0] || vendorProduct.productId?.productImage || vendorProduct.productImage || '';

    // Get initial price based on minimum order quantity or 1
    const initialQuantity = vendorProduct.minimumOrderQuantity || 1;
    const price = getPriceForQuantity(vendorProduct, initialQuantity);

    const newItem = {
      productId: productId,
      productName: productName,
      productImage: productImage,
      quantity: initialQuantity,
      price: price,
      total: price * initialQuantity,
      vendorProduct: vendorProduct, // Store reference for price recalculation
    };

    setEditedItems([...editedItems, newItem]);
    setNewItemProductId('');
  };

  const calculateBillingDetails = () => {
    const cartTotal = editedItems.reduce((sum, item) => sum + (item.total || 0), 0);

    // Calculate GST per product based on each product's GST percentage
    const gstBreakdown = editedItems.map(item => {
      const itemTotal = item.total || 0;
      // Get GST from item if it exists (from order), otherwise from vendorProduct
      const gstPercentage = item.gstPercentage !== undefined
        ? item.gstPercentage
        : (item.vendorProduct?.gst || 0);
      const gstAmount = item.gstAmount !== undefined
        ? item.gstAmount
        : (itemTotal * gstPercentage) / 100;

      return {
        productName: item.productName,
        gstPercentage,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
      };
    });

    const gstAmount = gstBreakdown.reduce((sum, item) => sum + item.gstAmount, 0);
    
    // Group items by GST percentage and calculate SGST/CGST
    const gstGroups = {};
    gstBreakdown.forEach(item => {
      if (item.gstPercentage > 0 && item.gstAmount > 0) {
        const gstKey = item.gstPercentage.toFixed(2);
        if (!gstGroups[gstKey]) {
          gstGroups[gstKey] = {
            percentage: item.gstPercentage,
            totalGst: 0
          };
        }
        gstGroups[gstKey].totalGst += item.gstAmount;
      }
    });
    
    // Convert groups to array and calculate SGST/CGST for each
    const sgstCgstBreakdown = Object.keys(gstGroups)
      .sort((a, b) => parseFloat(b) - parseFloat(a))
      .map(gstKey => {
        const group = gstGroups[gstKey];
        const totalGst = parseFloat(group.totalGst.toFixed(2));
        const sgstAmount = parseFloat((totalGst / 2).toFixed(2));
        const cgstAmount = parseFloat((totalGst / 2).toFixed(2));
        const sgstRate = parseFloat((group.percentage / 2).toFixed(2));
        const cgstRate = sgstRate;
        
        return {
          gstPercentage: group.percentage,
          sgstRate,
          cgstRate,
          sgstAmount,
          cgstAmount,
          totalGst
        };
      });
    
    const shippingCharges = 0; // Free shipping
    const totalAmount = cartTotal + gstAmount + shippingCharges;

    return {
      cartTotal,
      gstAmount,
      gstBreakdown,
      sgstCgstBreakdown,
      shippingCharges,
      totalAmount,
    };
  };

  const handleSaveOrder = async () => {
    if (editedItems.length === 0) {
      alert('Order must have at least one item');
      return;
    }

    if (window.confirm('Are you sure you want to update this order?')) {
      try {
        const billingDetails = calculateBillingDetails();
        await updateOrderItemsMutation.mutateAsync({
          id: orderId,
          items: editedItems,
          billingDetails,
        });
        setIsEditMode(false);
        refetch();
      } catch (error) {
        console.error('Error updating order:', error);
        alert(error?.response?.data?.message || 'Failed to update order');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  // Helper function to get order tracking status
  const getOrderTrackingStatus = () => {
    const status = order.orderStatus || 'pending';

    // Determine which steps are completed based on order status
    const isOrdered = true; // Always true if order exists
    const isPacked = ['confirmed', 'processing', 'shipped', 'delivered'].includes(status);
    const isShipped = ['shipped', 'delivered'].includes(status);
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';

    return [
      {
        key: 'ordered',
        label: 'Ordered',
        isCompleted: isOrdered,
        date: order.createdAt,
      },
      {
        key: 'packed',
        label: 'Packed',
        isCompleted: isPacked,
        date: isPacked ? (order.updatedAt || order.createdAt) : null,
      },
      {
        key: 'shipped',
        label: 'Shipped',
        isCompleted: isShipped,
        date: isShipped ? (order.updatedAt || order.createdAt) : null,
      },
      {
        key: 'delivered',
        label: 'Delivered',
        isCompleted: isDelivered,
        date: isDelivered ? (order.updatedAt || order.createdAt) : null,
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        isCompleted: isCancelled,
        date: isCancelled ? (order.updatedAt || order.createdAt) : null,
      },
    ];
  };

  const formatTrackingDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p className="text-xs font-medium">Error loading order details:</p>
            <p className="text-xs mt-1">{error?.response?.data?.message || error?.message || 'Unknown error'}</p>
            <button
              onClick={onBack}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </button>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Top Section: Flex with justify-between */}
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            {/* Left: Order ID */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Order ID</p>
              <p className="text-xs font-medium text-gray-900">{(() => {
                const orderId = order._id || order.orderNumber || 'N/A';
                if (!orderId || orderId === 'N/A') return 'N/A';
                const idString = String(orderId);
                const lastSix = idString.length > 6 ? idString.slice(-6) : idString;
                return `#${lastSix}`;
              })()}</p>
            </div>

            {/* Right: Order Status and Payment Status */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Order Status</p>
                <div className="relative">
                  <button
                    onClick={() => canChangeStatus && setShowStatusDropdown(!showStatusDropdown)}
                    disabled={!canChangeStatus}
                    className={`px-2.5 py-1 inline-flex items-center space-x-1.5 text-xs font-medium rounded-md ${getStatusColor(order.orderStatus)} ${!canChangeStatus ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm transition-shadow'
                      }`}
                    title={!canChangeStatus ? 'Cannot change status for delivered or cancelled orders' : 'Change order status'}
                  >
                    <span className="capitalize">{order.orderStatus || 'pending'}</span>
                    {canChangeStatus && (
                      <svg
                        className={`w-3 h-3 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusDropdown(false)}
                      ></div>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        <div className="py-1">
                          {orderStatuses.map((status) => (
                            <button
                              key={status.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canChangeStatus && order.orderStatus !== status.value && onUpdateStatus) {
                                  onUpdateStatus(orderId, status.value);
                                }
                                setShowStatusDropdown(false);
                              }}
                              disabled={!canChangeStatus || order.orderStatus === status.value}
                              className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center space-x-2 ${!canChangeStatus || order.orderStatus === status.value
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${status.colorClass}`}></span>
                              <span>{status.label}</span>
                              {order.orderStatus === status.value && (
                                <span className="ml-auto text-[10px]">(Current)</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Payment Status</p>
                <select
                  value={paymentStatusValue}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border-0 ${paymentStatusValue === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                    } focus:ring-1 focus:ring-blue-500 cursor-pointer hover:shadow-sm transition-shadow`}
                  disabled={updatePaymentStatusMutation.isPending || isLoading}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Order Details Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {/* Row 1: Date | Payment */}
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-1 font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment:</span>
                  <span className="ml-1 font-medium text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
                {/* Row 2: Customer | Phone */}
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-1 font-medium text-gray-900">{order.deliveryAddress?.name || order.userId?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-1 font-medium text-gray-900">{order.deliveryAddress?.phone || order.userId?.phone || 'N/A'}</span>
                </div>
                {/* Row 3: Email | (empty) */}
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-1 font-medium text-gray-900">{order.userId?.email || 'N/A'}</span>
                </div>
                <div></div>
                {/* Row 4: Address (full row) */}
                <div className="col-span-2">
                  <span className="text-gray-600">Address:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {order.deliveryAddress?.addressLine1 || ''}
                    {order.deliveryAddress?.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
                    {order.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ''}
                    {order.deliveryAddress?.state ? `, ${order.deliveryAddress.state}` : ''}
                    {order.deliveryAddress?.pincode ? ` - ${order.deliveryAddress.pincode}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Tracking Window - Small Fonts */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs">
              {getOrderTrackingStatus().map((step, index) => (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${step.isCompleted
                        ? step.key === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                        : 'bg-gray-300'
                      }`}>
                      {step.isCompleted ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      )}
                    </div>
                    <span className={`text-xs font-medium ${step.isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                    {step.date && (
                      <span className="text-xs text-gray-500 mt-0.5 text-center">
                        {formatTrackingDate(step.date)}
                      </span>
                    )}
                  </div>
                  {index < getOrderTrackingStatus().length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${step.isCompleted && getOrderTrackingStatus()[index + 1]?.isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Order Details Section - Minimal */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="grid grid-cols-4 gap-x-4 gap-y-2.5">
                {/* User ID */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">User ID</p>
                  <p className="text-xs font-medium text-gray-900">
                    {order.userId?._id ? order.userId._id.toString().slice(-6) : order.userId || 'N/A'}
                  </p>
                </div>

                {/* Display Order ID */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Display Order ID</p>
                  <p className="text-xs font-medium text-gray-900">{(() => {
                    const orderId = order._id || order.orderNumber || 'N/A';
                    if (!orderId || orderId === 'N/A') return 'N/A';
                    const idString = String(orderId);
                    const lastSix = idString.length > 6 ? idString.slice(-6) : idString;
                    return `#${lastSix}`;
                  })()}</p>
                </div>

                {/* Customer Name */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Customer Name</p>
                  <p className="text-xs font-medium text-purple-600">{order.deliveryAddress?.name || order.userId?.name || 'N/A'}</p>
                </div>

                {/* Mobile Number */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Mobile Number</p>
                  <p className="text-xs font-medium text-gray-900">
                    {order.deliveryAddress?.phone ? `+91 ${order.deliveryAddress.phone}` : order.userId?.phone || 'N/A'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-xs font-medium text-gray-900">{order.userId?.email || 'N/A'}</p>
                </div>

                {/* Payment Status */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Payment Status</p>
                  <span className={`px-1.5 py-0.5 inline-flex text-[10px] font-medium rounded ${paymentStatusValue === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {getPaymentDisplayText(order)}
                  </span>
                </div>

                {/* Order Status */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Order Status</p>
                  <span className={`px-1.5 py-0.5 inline-flex text-[10px] font-medium rounded ${getStatusColor(order.orderStatus)}`}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </div>

                {/* Code Applied */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Code Applied</p>
                  <p className="text-xs font-medium text-gray-900">{order.promoCode || order.discountCode ? 'Yes' : 'No'}</p>
                </div>

                {/* Payment Mode */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Payment Mode</p>
                  <p className="text-xs font-medium text-gray-900 capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash' : order.paymentMethod === 'online' ? 'Online' : order.paymentMethod || 'N/A'}
                  </p>
                </div>

                {/* Delivery Code */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Delivery Code</p>
                  <p className="text-xs font-medium text-gray-900">{order.deliveryCode || order.trackingCode || 'N/A'}</p>
                </div>

                {/* GST Number */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">GST Number</p>
                  <p className="text-xs font-medium text-gray-900">{order.gstNumber || 'N/A'}</p>
                </div>

                {/* Order Date & Time */}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Order Date & Time</p>
                  <p className="text-xs font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>

                {/* Order Cancel Date Time (if cancelled) */}
                {order.orderStatus === 'cancelled' && order.updatedAt && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Cancel Date Time</p>
                    <p className="text-xs font-medium text-gray-900">{formatDate(order.updatedAt)}</p>
                  </div>
                )}

                {/* Cancel Reason (if cancelled) */}
                {order.orderStatus === 'cancelled' && (
                  <div className="col-span-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Cancel Reason</p>
                    <p className="text-xs font-medium text-gray-900">{order.cancelReason || order.cancellationReason || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-900">Order Items</h3>
              {!isEditMode && (
                <button
                  onClick={handleEditOrder}
                  disabled={isDelivered}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-2 ${isDelivered
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  title={isDelivered ? 'Cannot edit delivered orders' : 'Edit Order'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Order</span>
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">GST</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Total</th>
                      {isEditMode && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(isEditMode ? editedItems : order.items || []).map((item, idx) => (
                      <tr key={idx} className="even:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            {item.productImage && (
                              <img src={item.productImage} alt={item.productName} className="h-12 w-12 object-contain p-1 bg-white rounded" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-gray-900">{item.productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-900">
                          {isEditMode ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleQuantityDecrease(idx)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={(() => {
                                  const vendorProduct = item.vendorProduct || findVendorProductForItem(item);
                                  const minOrderQty = vendorProduct?.minimumOrderQuantity || 1;
                                  return item.quantity <= minOrderQty;
                                })()}
                                title="Decrease quantity"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                min={(() => {
                                  const vendorProduct = item.vendorProduct || findVendorProductForItem(item);
                                  return vendorProduct?.minimumOrderQuantity || 1;
                                })()}
                                step={(() => {
                                  const vendorProduct = item.vendorProduct || findVendorProductForItem(item);
                                  return vendorProduct?.minimumOrderQuantity || 1;
                                })()}
                                value={item.quantity || 1}
                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => handleQuantityIncrease(idx)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700"
                                title="Increase quantity"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            item.quantity || 0
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-900">
                          {isEditMode ? (
                            <div className="flex flex-col items-end">
                              <span className="font-medium">₹{item.price?.toLocaleString() || 0}</span>
                              {(() => {
                                const vendorProduct = item.vendorProduct || findVendorProductForItem(item);
                                if (vendorProduct?.priceType === 'bulk' && vendorProduct?.pricing?.bulk?.length > 0) {
                                  const currentSlab = vendorProduct.pricing.bulk.find(
                                    (slab) => item.quantity >= slab.minQty && item.quantity <= slab.maxQty
                                  );
                                  if (currentSlab) {
                                    return (
                                      <span className="text-xs text-gray-500">
                                        Slab: {currentSlab.minQty}-{currentSlab.maxQty}
                                      </span>
                                    );
                                  }
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            `₹${item.price?.toLocaleString() || 0}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-900">
                          {(() => {
                            const itemTotal = item.total || (item.price * item.quantity);
                            const gstPercentage = item.gstPercentage !== undefined
                              ? item.gstPercentage
                              : (item.vendorProduct?.gst || (isEditMode ? (item.vendorProduct?.gst || findVendorProductForItem(item)?.gst || 0) : 0));
                            const gstAmount = item.gstAmount !== undefined
                              ? item.gstAmount
                              : (itemTotal * gstPercentage) / 100;

                            if (gstPercentage > 0) {
                              return (
                                <div className="flex flex-col items-end">
                                  <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                                  <span className="text-xs text-gray-500">({gstPercentage}%)</span>
                                </div>
                              );
                            }
                            return <span className="text-gray-400">-</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-medium text-gray-900">₹{item.total?.toLocaleString() || 0}</td>
                        {isEditMode && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {isEditMode && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <select
                              value={newItemProductId}
                              onChange={(e) => setNewItemProductId(e.target.value)}
                              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a product to add...</option>
                              {vendorProducts
                                .filter((vp) => {
                                  const productId = vp.productId?._id || vp.productId;
                                  return !editedItems.some(
                                    (item) => (item.productId?._id || item.productId)?.toString() === productId?.toString()
                                  );
                                })
                                .map((vp) => {
                                  const productId = vp.productId?._id || vp.productId;
                                  const productName = vp.productId?.productName || 'Product';
                                  return (
                                    <option key={vp._id} value={vp._id}>
                                      {productName} - ₹{vp.price}
                                    </option>
                                  );
                                })}
                            </select>
                            <button
                              onClick={handleAddNewItem}
                              disabled={!newItemProductId}
                              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${newItemProductId
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                              Add Item
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {isEditMode && (
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={updateOrderItemsMutation.isPending || editedItems.length === 0}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${updateOrderItemsMutation.isPending || editedItems.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {updateOrderItemsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Billing Summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <h3 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">Billing Summary</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  ₹{(
                    isEditMode
                      ? calculateBillingDetails().cartTotal
                      : order.billingDetails?.cartTotal || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium text-gray-900">
                  ₹{(
                    isEditMode
                      ? calculateBillingDetails().gstAmount
                      : order.billingDetails?.gstAmount || 0
                  ).toLocaleString()}
                </span>
              </div>
              {/* SGST/CGST Breakdown */}
              {(() => {
                // Calculate SGST/CGST breakdown for both edit mode and view mode
                let sgstCgstBreakdown = [];
                
                if (isEditMode) {
                  sgstCgstBreakdown = calculateBillingDetails().sgstCgstBreakdown || [];
                } else {
                  // Group order items by GST percentage
                  const gstGroups = {};
                  if (order.items && order.items.length > 0) {
                    order.items.forEach(item => {
                      const gstPercentage = item.gstPercentage || 0;
                      const gstAmount = item.gstAmount || 0;
                      
                      if (gstPercentage > 0 && gstAmount > 0) {
                        const gstKey = gstPercentage.toFixed(2);
                        if (!gstGroups[gstKey]) {
                          gstGroups[gstKey] = {
                            percentage: gstPercentage,
                            totalGst: 0
                          };
                        }
                        gstGroups[gstKey].totalGst += gstAmount;
                      }
                    });
                  }
                  
                  // Convert groups to array and calculate SGST/CGST for each
                  sgstCgstBreakdown = Object.keys(gstGroups)
                    .sort((a, b) => parseFloat(b) - parseFloat(a))
                    .map(gstKey => {
                      const group = gstGroups[gstKey];
                      const totalGst = parseFloat(group.totalGst.toFixed(2));
                      const sgstAmount = parseFloat((totalGst / 2).toFixed(2));
                      const cgstAmount = parseFloat((totalGst / 2).toFixed(2));
                      const sgstRate = parseFloat((group.percentage / 2).toFixed(2));
                      const cgstRate = sgstRate;
                      
                      return {
                        gstPercentage: group.percentage,
                        sgstRate,
                        cgstRate,
                        sgstAmount,
                        cgstAmount,
                        totalGst
                      };
                    });
                }

                if (sgstCgstBreakdown && sgstCgstBreakdown.length > 0) {
                  return (
                    <div className="pl-2 border-l-2 border-gray-200 space-y-0.5 mt-0.5">
                      {sgstCgstBreakdown.map((group, index) => (
                        <div key={`gst-group-${index}`} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>SGST ({group.sgstRate}%):</span>
                            <span>₹{group.sgstAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>CGST ({group.cgstRate}%):</span>
                            <span>₹{group.cgstAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Charges:</span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const shippingCharges = isEditMode
                      ? calculateBillingDetails().shippingCharges
                      : order.billingDetails?.shippingCharges || 0;
                    return shippingCharges > 0 ? `₹${shippingCharges.toLocaleString()}` : 'Free';
                  })()}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between">
                <span className="text-xs font-medium text-gray-900">Total Amount:</span>
                <span className="text-xs font-bold text-red-600">
                  ₹{(
                    isEditMode
                      ? calculateBillingDetails().totalAmount
                      : order.billingDetails?.totalAmount || 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {order.paymentId || order.transactionId ? (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <h3 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">Payment Information</h3>
              <div className="space-y-1.5 text-xs">
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium text-gray-900">{order.paymentId}</span>
                  </div>
                )}
                {order.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium text-gray-900">{order.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => {
                try {
                  generateInvoicePDF(order, vendor);
                } catch (error) {
                  console.error('Error generating invoice:', error);
                  alert('Failed to generate invoice. Please try again.');
                }
              }}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1.5 text-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

