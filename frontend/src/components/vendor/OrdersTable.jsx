import { useState } from 'react';
import jsPDF from 'jspdf';

const OrdersTable = ({ 
  orders, 
  isLoading, 
  onUpdateStatus,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onOrderClick,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);

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

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
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

    // Otherwise, show the payment status
    return paymentStatus === 'pending' ? 'Unpaid' : paymentStatus || 'Unpaid';
  };

  const getPaymentDisplayColor = (order) => {
    const paymentStatus = order.paymentStatus?.toLowerCase();

    // If payment is completed, show green (paid)
    if (paymentStatus === 'completed') {
      return 'bg-green-100 text-green-800';
    }

    // Otherwise, use the standard payment status color (pending/unpaid)
    return getPaymentStatusColor(paymentStatus);
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
      doc.setTextColor(220, 38, 38); // Red color
      doc.setFont(undefined, 'bold');
      doc.text('RestroBazaar', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Company Details
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text('Your Trusted Restaurant Supply Partner', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('Email: support@restrobazaar.com | Phone: +91-XXXXXXXXXX', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Invoice Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 12;

      // Two Column Layout: Invoice Details and Delivery Address
      const col1X = leftMargin;
      const col2X = pageWidth / 2 + 10;

      // Left Column - Invoice Details
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

      // Right Column - Delivery Address
      let addressY = yPos - 42; // Align with invoice details
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

      // Order Items Table
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Order Items:', leftMargin, yPos);
      yPos += 8;

      // Table Header with background
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

      // Table Rows
      doc.setFont(undefined, 'normal');
      doc.setDrawColor(220, 220, 220);
      let itemSubtotal = 0;

      order.items?.forEach((item, index) => {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
          // Redraw table header on new page
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

        // Row content
        doc.text((index + 1).toString(), leftMargin + 2, yPos);
        
        // Handle long product names
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
        
        itemSubtotal += item.total || 0;
        yPos += 7;
      });

      yPos += 5;

      // Billing Summary Section
      if (yPos > pageHeight - 70) {
        doc.addPage();
        yPos = 20;
      }

      const summaryX = leftMargin + 100;
      const summaryWidth = rightMargin - summaryX;

      // Subtotal
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Subtotal (Excl. of all taxes):', summaryX, yPos);
      const billing = order.billingDetails;
      const cartTotal = String(Number(billing?.cartTotal || 0).toFixed(2));
      doc.text(`Rs. ${cartTotal}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 7;

      // GST
      doc.text('GST:', summaryX, yPos);
      const totalGstAmount = String(Number(billing?.gstAmount || 0).toFixed(2));
      doc.text(`Rs. ${totalGstAmount}`, rightMargin - 2, yPos, { align: 'right' });
      yPos += 7;
      
      // GST Breakdown
      const gstBreakdown = order.items?.filter(item => item.gstPercentage > 0);
      if (gstBreakdown && gstBreakdown.length > 0) {
        doc.setFontSize(8);
        gstBreakdown.forEach(item => {
          const itemGstAmount = item.gstAmount || ((item.total || 0) * (item.gstPercentage || 0) / 100);
          const itemName = item.productName?.length > 25 
            ? item.productName.substring(0, 22) + '...' 
            : item.productName || 'Product';
          doc.text(`  ${itemName} (${item.gstPercentage}%): Rs. ${itemGstAmount.toFixed(2)}`, summaryX, yPos);
          yPos += 5;
        });
        doc.setFontSize(10);
      }

      // Shipping Charges
      doc.text('Shipping Charges:', summaryX, yPos);
      if (billing?.shippingCharges === 0) {
        doc.setTextColor(0, 128, 0); // Green for free
        doc.text('Free', rightMargin - 2, yPos, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      } else {
        const shippingCharges = String(Number(billing?.shippingCharges || 0).toFixed(2));
        doc.text(`Rs. ${shippingCharges}`, rightMargin - 2, yPos, { align: 'right' });
      }
      yPos += 10;

      // Total Amount
      yPos += 5;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Total Amount:', summaryX, yPos);
      doc.setTextColor(220, 38, 38); // Red color
      const totalAmount = String(Number(billing?.totalAmount || 0).toFixed(2));
      doc.text(`Rs. ${totalAmount}`, rightMargin - 2, yPos, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 15;

      // Payment Information
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

      // Footer
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

      // Save the PDF
      doc.save(`Invoice-${order.orderNumber || order._id}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr 
                key={order._id} 
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => onOrderClick && onOrderClick(order._id)}
              >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">
                      {order.orderNumber || order._id.substring(0, 8)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      {order.deliveryAddress?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.deliveryAddress?.phone || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900 font-medium">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      ₹{order.billingDetails?.totalAmount?.toLocaleString() || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusDropdown(showStatusDropdown === order._id ? null : order._id)}
                        className={`px-2 py-1 inline-flex items-center space-x-1 text-xs leading-4 font-semibold rounded-full cursor-pointer hover:opacity-80 transition ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        <span>{order.orderStatus || 'pending'}</span>
                        <svg
                          className={`w-3 h-3 transition-transform ${showStatusDropdown === order._id ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showStatusDropdown === order._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowStatusDropdown(null)}
                          ></div>
                          <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <div className="py-1">
                              {orderStatuses.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (order.orderStatus !== status.value) {
                                      onUpdateStatus(order._id, status.value);
                                    }
                                    setShowStatusDropdown(null);
                                  }}
                                  disabled={order.orderStatus === status.value}
                                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition flex items-center space-x-2 ${
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
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <span
                        className={`px-2 inline-flex text-xs leading-4 font-semibold rounded-full ${getPaymentDisplayColor(
                          order
                        )}`}
                      >
                        {getPaymentDisplayText(order)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {order.paymentMethod || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;

