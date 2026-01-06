import { useVendorOrder, useUpdatePaymentStatus, useUpdateOrderItems, useMyVendorProducts } from '../../hooks/useVendorQueries';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

const OrderDetails = ({ orderId, onBack, onUpdateStatus }) => {
  const { data: orderData, isLoading, isError, error, refetch } = useVendorOrder(orderId);
  const { data: vendorProductsData } = useMyVendorProducts({ limit: 1000 }, { enabled: true });
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
    const gstAmount = cartTotal * 0.18;
    const shippingCharges = 0; // Free shipping
    const totalAmount = cartTotal + gstAmount + shippingCharges;

    return {
      cartTotal,
      gstAmount,
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

  const formatDateForInvoice = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const handleDownloadInvoice = (order) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;
      const leftMargin = 20;
      const rightMargin = pageWidth - 20;
      const contentWidth = pageWidth - 40;

      // Company Header Section
      doc.setFontSize(24);
      doc.setTextColor(220, 38, 38);
      doc.setFont(undefined, 'bold');
      doc.text('RestroBazaar', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text('Your Trusted Restaurant Supply Partner', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('Email: support@restrobazaar.com | Phone: +91-XXXXXXXXXX', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;

      const col1X = leftMargin;
      const col2X = pageWidth / 2 + 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Invoice Details:', col1X, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`Invoice Number: ${order.orderNumber}`, col1X, yPos);
      yPos += 6;
      doc.text(`Invoice Date: ${formatDateForInvoice(order.createdAt)}`, col1X, yPos);
      yPos += 6;
      doc.text(`Order Number: ${order.orderNumber}`, col1X, yPos);
      yPos += 6;
      doc.text(`Order Date: ${formatDateForInvoice(order.createdAt)}`, col1X, yPos);
      yPos += 6;
      doc.setFont(undefined, 'bold');
      doc.text(`Order Status: ${getStatusText(order.orderStatus)}`, col1X, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      const paymentText = getPaymentDisplayText(order);
      doc.text(`Payment Status: ${paymentText}`, col1X, yPos);
      yPos += 6;
      doc.text(`Payment Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Online Payment'}`, col1X, yPos);

      let addressY = yPos - 42;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To / Ship To:', col2X, addressY);
      addressY += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`${order.deliveryAddress?.name || 'N/A'}`, col2X, addressY);
      addressY += 6;
      doc.text(`${order.deliveryAddress?.addressLine1 || 'N/A'}`, col2X, addressY);
      addressY += 6;
      if (order.deliveryAddress?.addressLine2) {
        doc.text(`${order.deliveryAddress.addressLine2}`, col2X, addressY);
        addressY += 6;
      }
      doc.text(`${order.deliveryAddress?.city || 'N/A'}, ${order.deliveryAddress?.state || 'N/A'}`, col2X, addressY);
      addressY += 6;
      doc.text(`Pincode: ${order.deliveryAddress?.pincode || 'N/A'}`, col2X, addressY);
      addressY += 6;
      if (order.deliveryAddress?.landmark) {
        doc.text(`Landmark: ${order.deliveryAddress.landmark}`, col2X, addressY);
        addressY += 6;
      }
      doc.text(`Phone: ${order.deliveryAddress?.phone || 'N/A'}`, col2X, addressY);

      yPos += 15;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Order Items:', leftMargin, yPos);
      yPos += 8;

      doc.setFillColor(240, 240, 240);
      doc.rect(leftMargin, yPos - 6, contentWidth, 8, 'F');
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('S.No.', leftMargin + 2, yPos);
      doc.text('Item', leftMargin + 20, yPos);
      doc.text('Qty', leftMargin + 110, yPos, { align: 'center' });
      doc.text('Unit Price', leftMargin + 135, yPos, { align: 'right' });
      doc.text('Total', rightMargin - 2, yPos, { align: 'right' });
      yPos += 8;

      doc.setFont(undefined, 'normal');
      doc.setDrawColor(220, 220, 220);

      order.items?.forEach((item, index) => {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
          doc.setFillColor(240, 240, 240);
          doc.rect(leftMargin, yPos - 6, contentWidth, 8, 'F');
          doc.setFont(undefined, 'bold');
          doc.text('S.No.', leftMargin + 2, yPos);
          doc.text('Item', leftMargin + 20, yPos);
          doc.text('Qty', leftMargin + 110, yPos, { align: 'center' });
          doc.text('Unit Price', leftMargin + 135, yPos, { align: 'right' });
          doc.text('Total', rightMargin - 2, yPos, { align: 'right' });
          yPos += 8;
          doc.setFont(undefined, 'normal');
        }

        doc.text((index + 1).toString(), leftMargin + 2, yPos);
        const productName = item.productName?.length > 35 
          ? item.productName.substring(0, 32) + '...' 
          : item.productName || 'Product';
        doc.text(productName, leftMargin + 20, yPos);
        const quantity = String(item.quantity || 0);
        const price = String(Number(item.price || 0).toFixed(2));
        const total = String(Number(item.total || 0).toFixed(2));
        doc.text(quantity, leftMargin + 110, yPos, { align: 'center' });
        doc.text(`Rs. ${price}`, leftMargin + 135, yPos, { align: 'right' });
        doc.text(`Rs. ${total}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 7;
      });

      yPos += 5;

      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = 20;
      }

      const summaryX = leftMargin + 100;
      const billing = order.billingDetails;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Subtotal (Excl. of all taxes):', summaryX, yPos);
      const cartTotal = String(Number(billing?.cartTotal || 0).toFixed(2));
      doc.text(`Rs. ${cartTotal}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 7;

      doc.text('GST (18%):', summaryX, yPos);
      const gstAmount = String(Number(billing?.gstAmount || 0).toFixed(2));
      doc.text(`Rs. ${gstAmount}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 7;

      doc.text('Shipping Charges:', summaryX, yPos);
      doc.setTextColor(0, 128, 0);
      doc.text('Free', rightMargin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      yPos += 5;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Total Amount:', summaryX, yPos);
      doc.setTextColor(220, 38, 38);
      const totalAmount = String(Number(billing?.totalAmount || 0).toFixed(2));
      doc.text(`Rs. ${totalAmount}`, rightMargin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;

      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Information:', leftMargin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`Payment Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Online Payment'}`, leftMargin, yPos);
      yPos += 6;
      doc.text(`Payment Status: ${paymentText}`, leftMargin, yPos);
      if (order.paymentId) {
        yPos += 6;
        doc.text(`Payment ID: ${order.paymentId}`, leftMargin, yPos);
      }
      if (order.transactionId) {
        yPos += 6;
        doc.text(`Transaction ID: ${order.transactionId}`, leftMargin, yPos);
      }
      yPos += 10;

      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = pageHeight - 30;
      } else {
        yPos = pageHeight - 30;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'italic');
      doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.setFontSize(8);
      doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('For any queries, please contact us at support@restrobazaar.com', pageWidth / 2, yPos, { align: 'center' });

      doc.save(`Invoice-${order.orderNumber || order._id}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
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
            <p className="text-sm font-medium">Error loading order details:</p>
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
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Orders</span>
          </button>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber || order._id}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Order Status</p>
                <div className="relative mt-1">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`px-3 py-1.5 inline-flex items-center space-x-2 text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}
                  >
                    <span>{order.orderStatus || 'pending'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusDropdown(false)}
                      ></div>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <div className="py-1">
                          {orderStatuses.map((status) => (
                            <button
                              key={status.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (order.orderStatus !== status.value && onUpdateStatus) {
                                  onUpdateStatus(orderId, status.value);
                                }
                                setShowStatusDropdown(false);
                              }}
                              disabled={order.orderStatus === status.value}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition flex items-center space-x-2 ${
                                order.orderStatus === status.value
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${status.colorClass}`}></span>
                              <span>{status.label}</span>
                              {order.orderStatus === status.value && (
                                <span className="ml-auto text-xs">(Current)</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number:</span>
                  <span className="font-medium text-gray-900">{order.orderNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <select
                    value={paymentStatusValue}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-0 ${
                      paymentStatusValue === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    } focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                    disabled={updatePaymentStatusMutation.isPending || isLoading}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Address</h3>
              <div className="text-sm text-gray-700">
                <p className="font-medium">{order.deliveryAddress?.name || 'N/A'}</p>
                <p className="mt-1">{order.deliveryAddress?.addressLine1 || ''}</p>
                {order.deliveryAddress?.addressLine2 && (
                  <p>{order.deliveryAddress.addressLine2}</p>
                )}
                <p>
                  {order.deliveryAddress?.city || ''}, {order.deliveryAddress?.state || ''} - {order.deliveryAddress?.pincode || ''}
                </p>
                {order.deliveryAddress?.landmark && (
                  <p className="text-gray-600">Landmark: {order.deliveryAddress.landmark}</p>
                )}
                <p className="mt-2">Phone: {order.deliveryAddress?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Order Details Section - Full Width */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Order Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                {/* User ID */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">User ID:</p>
                  <p className="font-medium text-gray-900">
                    {order.userId?._id ? order.userId._id.toString().slice(-6) : order.userId || 'N/A'}
                  </p>
                </div>

                {/* Display Order ID */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Display Order ID:</p>
                  <p className="font-medium text-gray-900">{order.orderNumber || order._id || 'N/A'}</p>
                </div>

                {/* Customer Name */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Customer Name:</p>
                  <p className="font-medium text-purple-600">{order.deliveryAddress?.name || order.userId?.name || 'N/A'}</p>
                </div>

                {/* Mobile Number */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Mobile Number:</p>
                  <p className="font-medium text-gray-900">
                    {order.deliveryAddress?.phone ? `+91 ${order.deliveryAddress.phone}` : order.userId?.phone || 'N/A'}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Email:</p>
                  <p className="font-medium text-gray-900">{order.userId?.email || 'N/A'}</p>
                </div>

                {/* Payment Status */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Payment Status:</p>
                  <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                    paymentStatusValue === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getPaymentDisplayText(order)}
                  </span>
                </div>

                {/* Order Status */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Order Status:</p>
                  <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </div>

                {/* Code Applied */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Code Applied?:</p>
                  <p className="font-medium text-gray-900">{order.promoCode || order.discountCode ? 'Yes' : 'No'}</p>
                </div>

                {/* Payment Mode */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Payment Mode:</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash' : order.paymentMethod === 'online' ? 'Online' : order.paymentMethod || 'N/A'}
                  </p>
                </div>

                {/* Delivery Code */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Delivery Code:</p>
                  <p className="font-medium text-gray-900">{order.deliveryCode || order.trackingCode || 'N/A'}</p>
                </div>

                {/* GST Number */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">GST Number:</p>
                  <p className="font-medium text-gray-900">{order.gstNumber || 'N/A'}</p>
                </div>

                {/* Order Date & Time */}
                <div>
                  <p className="text-gray-600 text-xs mb-1">Order Date & Time:</p>
                  <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>

                {/* Order Cancel Date Time (if cancelled) */}
                {order.orderStatus === 'cancelled' && order.updatedAt && (
                  <div>
                    <p className="text-gray-600 text-xs mb-1">Order Cancel Date Time:</p>
                    <p className="font-medium text-gray-900">{formatDate(order.updatedAt)}</p>
                  </div>
                )}

                {/* Cancel Reason (if cancelled) */}
                {order.orderStatus === 'cancelled' && (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4">
                    <p className="text-gray-600 text-xs mb-1">Cancel Reason:</p>
                    <p className="font-medium text-gray-900">{order.cancelReason || order.cancellationReason || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Order Items</h3>
              {!isEditMode && (
                <button
                  onClick={handleEditOrder}
                  disabled={isDelivered}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 ${
                    isDelivered
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
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      {isEditMode && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(isEditMode ? editedItems : order.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            {item.productImage && (
                              <img src={item.productImage} alt={item.productName} className="h-12 w-12 object-cover rounded" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
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
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
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
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₹{item.total?.toLocaleString() || 0}</td>
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
                        <td colSpan={5} className="px-4 py-3 bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <select
                              value={newItemProductId}
                              onChange={(e) => setNewItemProductId(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                newItemProductId
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={updateOrderItemsMutation.isPending || editedItems.length === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    updateOrderItemsMutation.isPending || editedItems.length === 0
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Billing Summary</h3>
            <div className="space-y-2 text-sm">
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
                <span className="text-gray-600">GST (18%):</span>
                <span className="font-medium text-gray-900">
                  ₹{(
                    isEditMode 
                      ? calculateBillingDetails().gstAmount 
                      : order.billingDetails?.gstAmount || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Charges:</span>
                <span className="font-medium text-gray-900">Free</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                <span className="text-base font-bold text-red-600">
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="space-y-2 text-sm">
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
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleDownloadInvoice(order)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

