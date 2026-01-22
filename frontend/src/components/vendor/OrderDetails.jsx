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
    const shippingCharges = 0; // Free shipping
    const totalAmount = cartTotal + gstAmount + shippingCharges;

    return {
      cartTotal,
      gstAmount,
      gstBreakdown,
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  // Convert number to words for invoice amount
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
      }
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
    };
    
    const convert = (n) => {
      if (n === 0) return '';
      
      if (n < 1000) return convertHundreds(n);
      if (n < 100000) {
        const thousand = Math.floor(n / 1000);
        const remainder = n % 1000;
        return convertHundreds(thousand) + ' Thousand' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
      }
      if (n < 10000000) {
        const lakh = Math.floor(n / 100000);
        const remainder = n % 100000;
        return convertHundreds(lakh) + ' Lakh' + (remainder > 0 ? ' ' + convert(remainder) : '');
      }
      const crore = Math.floor(n / 10000000);
      const remainder = n % 10000000;
      return convertHundreds(crore) + ' Crore' + (remainder > 0 ? ' ' + convert(remainder) : '');
    };
    
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convertHundreds(paise) + ' Paisa';
    }
    return result + ' only';
  };

  // Get state code from state name
  const getStateCode = (stateName) => {
    const stateCodes = {
      'Maharashtra': '27',
      'Gujarat': '24',
      'Karnataka': '29',
      'Tamil Nadu': '33',
      'Delhi': '07',
      'West Bengal': '19',
      'Rajasthan': '08',
      'Uttar Pradesh': '09',
      'Punjab': '03',
      'Haryana': '06',
    };
    return stateCodes[stateName] || '';
  };

  const handleDownloadInvoice = (order) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;
      const leftMargin = 15;
      const rightMargin = pageWidth - 15;
      const contentWidth = pageWidth - 30;

      // Get vendor information - Use provided business details or fallback to order data
      const vendor = order.vendorId || {};
      const vendorName = vendor.businessName || vendor.legalName || 'AK ENTERPRISES';
      const vendorLegalName = vendor.legalName || 'ANUPAMA MANOHAR KADAM';
      const vendorTradeName = vendor.tradeName || vendor.businessName || 'AK ENTERPRISES';
      const vendorAddress = vendor.address || {};
      const vendorBuilding = vendorAddress.line1 || vendorAddress.buildingNo || 'SURVEY NO. 75/1/1';
      const vendorStreet = vendorAddress.line2 || vendorAddress.road || 'OPPOSITE IIMS COLLEGE';
      const vendorLandmark = vendorAddress.landmark || 'OPPOSITE IIMS COLLEGE';
      const vendorCity = vendorAddress.city || 'Nere';
      const vendorDistrict = vendorAddress.district || 'Pune';
      const vendorState = vendorAddress.state || 'Maharashtra';
      const vendorPincode = vendorAddress.pincode || '410506';
      const vendorPhone = vendor.phone || '9545235223';
      const vendorEmail = vendor.email || 'ak.enterprises.info1@gmail.com';
      const vendorGSTIN = vendor.gstNumber || '27DJSPK2679K1ZB';
      const vendorStateCode = getStateCode(vendorState) || '27';

      // Get customer information
      const customer = order.customerId || {};
      const customerName = order.deliveryAddress?.name || customer.name || 'Customer Name';
      const customerAddress = order.deliveryAddress || {};
      const customerAddressLine = customerAddress.addressLine1 || '';
      const customerAddressLine2 = customerAddress.addressLine2 || '';
      const customerCity = customerAddress.city || '';
      const customerState = customerAddress.state || '';
      const customerPincode = customerAddress.pincode || '';
      const customerPhone = customerAddress.phone || customer.phone || '';
      const customerGSTIN = order.customerGSTIN || customer.gstNumber || '';

      // Calculate totals
      const billing = order.billingDetails || {};
      const cartTotal = billing.cartTotal || 0;
      const totalGstAmount = billing.gstAmount || 0;
      const shippingCharges = billing.shippingCharges || 0;
      const totalAmount = billing.totalAmount || (cartTotal + totalGstAmount + shippingCharges);
      
      // Calculate SGST and CGST (assuming 5% GST = 2.5% SGST + 2.5% CGST for intra-state)
      // For Vyapar style, we need to calculate based on actual GST rates from items
      const sgstRate = 2.5;
      const cgstRate = 2.5;
      const sgstAmount = totalGstAmount / 2;
      const cgstAmount = totalGstAmount / 2;

      // ========== VYAPAR STYLE INVOICE LAYOUT ==========
      
      // 1. BOLD BUSINESS HEADER SECTION
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(vendorTradeName, leftMargin, yPos);
      yPos += 6;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(vendorBuilding, leftMargin, yPos);
      yPos += 5;
      if (vendorStreet) {
        doc.text(vendorStreet, leftMargin, yPos);
        yPos += 5;
      }
      if (vendorLandmark && vendorLandmark !== vendorStreet) {
        doc.text(vendorLandmark, leftMargin, yPos);
        yPos += 5;
      }
      doc.text(`${vendorCity}, ${vendorDistrict}, ${vendorState} - ${vendorPincode}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`Phone: ${vendorPhone}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`Email: ${vendorEmail}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`GSTIN: ${vendorGSTIN}`, leftMargin, yPos);
      yPos += 5;
      doc.text(`State: ${vendorStateCode}-${vendorState}`, leftMargin, yPos);
      yPos += 8;

      // 2. CENTERED TAX INVOICE TITLE WITH DIVIDER
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 5;
      
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += 8;

      // 3. HEADER SECTION - Two Column Layout
      const headerStartY = yPos;
      const col1X = leftMargin;
      const col2X = pageWidth / 2 + 5;
      const colWidth = (pageWidth - 30) / 2;

      // Left Column: Business Details (already shown above, so skip)
      // Right Column: Invoice Details
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Invoice No.:', col2X, headerStartY);
      doc.setFont(undefined, 'normal');
      doc.text(`${order.orderNumber || order._id}`, rightMargin, headerStartY, { align: 'right' });
      
      let invoiceY = headerStartY + 6;
      doc.setFont(undefined, 'bold');
      doc.text('Date:', col2X, invoiceY);
      doc.setFont(undefined, 'normal');
      doc.text(formatDateForInvoice(order.createdAt), rightMargin, invoiceY, { align: 'right' });
      
      invoiceY += 6;
      doc.setFont(undefined, 'bold');
      doc.text('Place of Supply:', col2X, invoiceY);
      doc.setFont(undefined, 'normal');
      doc.text(`${vendorStateCode}-${vendorState}`, rightMargin, invoiceY, { align: 'right' });
      
      yPos = Math.max(headerStartY + 25, invoiceY + 8);

      // 4. BILL TO / SHIP TO SECTION - Two Column Layout
      const billToStartY = yPos;
      const billToCol1X = leftMargin;
      const billToCol2X = pageWidth / 2 + 5;

      // Left Column: Bill To
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Bill To:', billToCol1X, billToStartY);
      let billToY = billToStartY + 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(customerName, billToCol1X, billToY);
      billToY += 5;
      if (customerAddressLine) {
        doc.text(customerAddressLine, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerAddressLine2) {
        doc.text(customerAddressLine2, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerCity || customerState || customerPincode) {
        const cityLine = `${customerCity || ''}${customerCity && customerState ? ', ' : ''}${customerState || ''}${(customerCity || customerState) && customerPincode ? ' - ' : ''}${customerPincode || ''}`;
        doc.text(cityLine, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerPhone) {
        doc.text(`Contact No.: ${customerPhone}`, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerGSTIN) {
        doc.text(`GSTIN: ${customerGSTIN}`, billToCol1X, billToY);
        billToY += 4;
      }
      if (customerState) {
        const customerStateCode = getStateCode(customerState);
        if (customerStateCode) {
          doc.text(`State: ${customerStateCode}-${customerState}`, billToCol1X, billToY);
          billToY += 4;
        }
      }

      // Right Column: Ship To
      const shipToStartY = billToStartY;
      let shipToY = shipToStartY + 6;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Ship To:', billToCol2X, shipToStartY);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const shipToAddress = order.deliveryAddress || {};
      if (shipToAddress.addressLine1) {
        doc.text(shipToAddress.addressLine1, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.addressLine2) {
        doc.text(shipToAddress.addressLine2, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.landmark) {
        doc.text(shipToAddress.landmark, billToCol2X, shipToY);
        shipToY += 4;
      }
      if (shipToAddress.city || shipToAddress.state || shipToAddress.pincode) {
        const shipToLine = `${shipToAddress.city || ''}${shipToAddress.city && shipToAddress.state ? ', ' : ''}${shipToAddress.state || ''}${(shipToAddress.city || shipToAddress.state) && shipToAddress.pincode ? ' - ' : ''}${shipToAddress.pincode || ''}`;
        doc.text(shipToLine, billToCol2X, shipToY);
        shipToY += 4;
      }

      yPos = Math.max(billToY, shipToY) + 8;

      // 5. ITEM TABLE - VYAPAR STYLE
      // Table Header with light background
      doc.setFillColor(245, 245, 245);
      doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      const tableHeaderY = yPos;
      doc.text('Sr No', leftMargin + 3, tableHeaderY);
      doc.text('Item Name', leftMargin + 18, tableHeaderY);
      doc.text('HSN / SAC', leftMargin + 65, tableHeaderY);
      doc.text('Quantity', leftMargin + 95, tableHeaderY, { align: 'right' });
      doc.text('Unit', leftMargin + 115, tableHeaderY);
      doc.text('Rate', leftMargin + 130, tableHeaderY, { align: 'right' });
      doc.text('Tax %', leftMargin + 150, tableHeaderY, { align: 'right' });
      doc.text('Amount', rightMargin - 2, tableHeaderY, { align: 'right' });
      yPos += 8;

      // Draw border lines
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(leftMargin, yPos - 8, leftMargin, yPos);
      doc.line(leftMargin + 15, yPos - 8, leftMargin + 15, yPos);
      doc.line(leftMargin + 62, yPos - 8, leftMargin + 62, yPos);
      doc.line(leftMargin + 92, yPos - 8, leftMargin + 92, yPos);
      doc.line(leftMargin + 112, yPos - 8, leftMargin + 112, yPos);
      doc.line(leftMargin + 127, yPos - 8, leftMargin + 127, yPos);
      doc.line(leftMargin + 147, yPos - 8, leftMargin + 147, yPos);
      doc.line(rightMargin, yPos - 8, rightMargin, yPos);
      doc.line(leftMargin, yPos - 8, rightMargin, yPos - 8);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      yPos += 2;

      // Table Rows
      order.items?.forEach((item, index) => {
        if (yPos > pageHeight - 120) {
          doc.addPage();
          yPos = 20;
          // Redraw header on new page
          doc.setFillColor(245, 245, 245);
          doc.rect(leftMargin, yPos - 4, contentWidth, 8, 'F');
          doc.setFont(undefined, 'bold');
          doc.text('Sr No', leftMargin + 3, yPos);
          doc.text('Item Name', leftMargin + 18, yPos);
          doc.text('HSN / SAC', leftMargin + 65, yPos);
          doc.text('Quantity', leftMargin + 95, yPos, { align: 'right' });
          doc.text('Unit', leftMargin + 115, yPos);
          doc.text('Rate', leftMargin + 130, yPos, { align: 'right' });
          doc.text('Tax %', leftMargin + 150, yPos, { align: 'right' });
          doc.text('Amount', rightMargin - 2, yPos, { align: 'right' });
          yPos += 8;
          doc.setDrawColor(200, 200, 200);
          doc.line(leftMargin, yPos - 8, leftMargin, yPos);
          doc.line(leftMargin + 15, yPos - 8, leftMargin + 15, yPos);
          doc.line(leftMargin + 62, yPos - 8, leftMargin + 62, yPos);
          doc.line(leftMargin + 92, yPos - 8, leftMargin + 92, yPos);
          doc.line(leftMargin + 112, yPos - 8, leftMargin + 112, yPos);
          doc.line(leftMargin + 127, yPos - 8, leftMargin + 127, yPos);
          doc.line(leftMargin + 147, yPos - 8, leftMargin + 147, yPos);
          doc.line(rightMargin, yPos - 8, rightMargin, yPos);
          doc.line(leftMargin, yPos - 8, rightMargin, yPos - 8);
          doc.line(leftMargin, yPos, rightMargin, yPos);
          doc.setFont(undefined, 'normal');
          yPos += 2;
        }

        const productName = item.productName || 'Product';
        const hsnSac = item.hsnCode || item.sacCode || item.hsnSac || '';
        const quantity = item.quantity || 0;
        const unit = item.unit || 'Pcs';
        const rate = Number(item.price || 0);
        const gstPercentage = item.gstPercentage || 0;
        const itemSubtotal = item.total || (rate * quantity);
        const itemGstAmount = item.gstAmount || (itemSubtotal * gstPercentage / 100);
        const itemTotal = itemSubtotal + itemGstAmount;

        const rowY = yPos;
        doc.text((index + 1).toString(), leftMargin + 3, rowY);
        
        // Wrap product name if too long
        const maxNameWidth = 42;
        const productNameLines = doc.splitTextToSize(productName, maxNameWidth);
        doc.text(productNameLines[0], leftMargin + 18, rowY);
        
        doc.text(hsnSac || '-', leftMargin + 65, rowY);
        doc.text(quantity.toString(), leftMargin + 95, rowY, { align: 'right' });
        doc.text(unit, leftMargin + 115, rowY);
        doc.text(`₹${rate.toFixed(2)}`, leftMargin + 130, rowY, { align: 'right' });
        doc.text(gstPercentage > 0 ? `${gstPercentage}%` : '-', leftMargin + 150, rowY, { align: 'right' });
        doc.text(`₹${itemTotal.toFixed(2)}`, rightMargin - 2, rowY, { align: 'right' });
        
        // Handle multi-line product names
        if (productNameLines.length > 1) {
          yPos += 4;
          doc.text(productNameLines[1], leftMargin + 18, yPos);
        }
        
        yPos += 6;
        
        // Draw row border
        doc.setDrawColor(220, 220, 220);
        doc.line(leftMargin, yPos, rightMargin, yPos);
        yPos += 2;
      });

      // Draw closing border for table
      doc.setDrawColor(200, 200, 200);
      doc.line(leftMargin, yPos - 2, rightMargin, yPos - 2);
      yPos += 5;

      // 6. TOTALS SECTION - Right Aligned (Vyapar Style)
      const totalsStartX = leftMargin + 100;
      
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Subtotal', totalsStartX, yPos);
      doc.text(`₹${cartTotal.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 6;
      
      if (cgstAmount > 0) {
        doc.text(`CGST @ ${cgstRate}%`, totalsStartX, yPos);
        doc.text(`₹${cgstAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (sgstAmount > 0) {
        doc.text(`SGST @ ${sgstRate}%`, totalsStartX, yPos);
        doc.text(`₹${sgstAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      if (shippingCharges > 0) {
        doc.text('Shipping Charges', totalsStartX, yPos);
        doc.text(`₹${shippingCharges.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Grand Total - Highlighted
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(totalsStartX, yPos - 2, rightMargin, yPos - 2);
      yPos += 4;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Grand Total', totalsStartX, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`₹${totalAmount.toFixed(2)}`, rightMargin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 8;

      // 7. AMOUNT IN WORDS
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Amount in Words:', leftMargin, yPos);
      yPos += 5;
      doc.setFont(undefined, 'normal');
      const amountInWords = numberToWords(totalAmount);
      const wordsLines = doc.splitTextToSize(amountInWords, contentWidth - 20);
      wordsLines.forEach(line => {
        doc.text(line, leftMargin + 5, yPos);
        yPos += 4;
      });
      yPos += 8;

      // 8. FOOTER SECTION - Two Column Layout
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }
      
      const footerStartY = Math.max(yPos, pageHeight - 55);
      const footerCol1X = leftMargin;
      const footerCol2X = pageWidth / 2 + 5;

      // Left Column: Bank Details
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Payment Information (Pay To):', footerCol1X, footerStartY);
      let bankY = footerStartY + 5;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      // Bank details (these should come from vendor profile)
      const bankName = vendor.bankName || 'KOTAK MAHINDRA BANK LIMITED, PUNE BANER ROAD BRANCH';
      const bankAccountNo = vendor.bankAccountNo || vendor.accountNumber || vendorPhone || 'Account Number';
      const bankIFSC = vendor.bankIFSC || vendor.ifscCode || 'KKBK0001767';
      const accountHolderName = vendor.accountHolderName || vendorTradeName;
      
      doc.text(`Bank Name: ${bankName}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Bank Account No.: ${bankAccountNo}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Bank IFSC code: ${bankIFSC}`, footerCol1X, bankY);
      bankY += 4;
      doc.text(`Account holder's name: ${accountHolderName}`, footerCol1X, bankY);
      bankY += 6;
      
      // UPI QR Code placeholder
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('UPI SCAN TO PAY', footerCol1X, bankY);
      // Note: Actual QR code would need to be generated and added as image
      bankY += 10;

      // Right Column: Authorized Signatory
      const signY = footerStartY;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`For : ${vendorTradeName}`, footerCol2X, signY);
      const signatureY = signY + 20;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(footerCol2X, signatureY, footerCol2X + 50, signatureY);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Authorized Signatory', footerCol2X, signatureY + 5);

      // Save the PDF
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
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
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
              <p className="text-sm font-semibold text-gray-900">#{(() => {
                const orderId = order.orderNumber || order._id || 'N/A';
                if (!orderId || orderId === 'N/A') return 'N/A';
                const idString = String(orderId);
                // Extract only digits and get last 6 digits
                const digitsOnly = idString.replace(/\D/g, '');
                return digitsOnly.length > 6 ? digitsOnly.slice(-6) : digitsOnly || 'N/A';
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
                    className={`px-2.5 py-1 inline-flex items-center space-x-1.5 text-xs font-medium rounded-md ${getStatusColor(order.orderStatus)} ${
                      !canChangeStatus ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:shadow-sm transition-shadow'
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
                              className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center space-x-2 ${
                                !canChangeStatus || order.orderStatus === status.value
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
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border-0 ${
                    paymentStatusValue === 'paid' 
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                      step.isCompleted 
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
                    const orderId = order.orderNumber || order._id || 'N/A';
                    if (!orderId || orderId === 'N/A') return 'N/A';
                    const idString = String(orderId);
                    // Extract only digits and get last 6 digits
                    const digitsOnly = idString.replace(/\D/g, '');
                    return digitsOnly.length > 6 ? digitsOnly.slice(-6) : digitsOnly || 'N/A';
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
                  <span className={`px-1.5 py-0.5 inline-flex text-[10px] font-medium rounded ${
                    paymentStatusValue === 'paid' 
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
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
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
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
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
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Billing Summary</h3>
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
              {/* GST Breakdown */}
              {(() => {
                const gstBreakdown = isEditMode 
                  ? calculateBillingDetails().gstBreakdown 
                  : order.items?.filter(item => item.gstPercentage > 0).map(item => ({
                      productName: item.productName,
                      gstPercentage: item.gstPercentage || 0,
                      gstAmount: item.gstAmount || 0,
                    }));
                
                if (gstBreakdown && gstBreakdown.length > 0) {
                  return (
                    <div className="pl-2 border-l-2 border-gray-200 space-y-0.5 mt-0.5">
                      {gstBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between text-[10px] text-gray-600">
                          <span>{item.productName} ({item.gstPercentage}%):</span>
                          <span>₹{item.gstAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Charges:</span>
                <span className="font-medium text-gray-900">Free</span>
              </div>
              <div className="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between">
                <span className="text-xs font-semibold text-gray-900">Total Amount:</span>
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
              <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Payment Information</h3>
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
              onClick={() => handleDownloadInvoice(order)}
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

