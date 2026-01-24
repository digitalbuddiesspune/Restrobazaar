import { useState } from 'react';

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
        <p className="text-xs text-gray-500">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr 
                key={order._id} 
                className="hover:bg-gray-50 transition cursor-pointer even:bg-gray-50"
                onClick={() => onOrderClick && onOrderClick(order._id)}
              >
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900 leading-tight">
                    {(() => {
                      const orderId = order._id || order.orderNumber || 'N/A';
                      if (!orderId || orderId === 'N/A') return 'N/A';
                      const idString = String(orderId);
                      const lastSix = idString.length > 6 ? idString.slice(-6) : idString;
                      return `#${lastSix}`;
                    })()}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs text-gray-900 leading-tight">
                    {order.deliveryAddress?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                    {order.deliveryAddress?.phone || ''}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs text-gray-900 font-medium leading-tight">
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-semibold text-gray-900 leading-tight">
                    ₹{order.billingDetails?.totalAmount?.toLocaleString() || 0}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="relative">
                    {(() => {
                      const isDelivered = order.orderStatus === 'delivered';
                      const isCancelled = order.orderStatus === 'cancelled';
                      const canChangeStatus = !isDelivered && !isCancelled;
                      
                      return (
                        <>
                          <button
                            onClick={() => canChangeStatus && setShowStatusDropdown(showStatusDropdown === order._id ? null : order._id)}
                            disabled={!canChangeStatus}
                            className={`px-2 py-0.5 inline-flex items-center space-x-1 text-xs leading-4 font-semibold rounded-full transition ${getStatusColor(
                              order.orderStatus
                            )} ${
                              canChangeStatus 
                                ? 'cursor-pointer hover:opacity-80' 
                                : 'cursor-not-allowed opacity-75'
                            }`}
                            title={!canChangeStatus ? 'Cannot change status for delivered or cancelled orders' : 'Change order status'}
                          >
                            <span>{order.orderStatus || 'pending'}</span>
                           
                          </button>
                            {showStatusDropdown === order._id && canChangeStatus && (
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
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getPaymentDisplayColor(
                          order
                        )}`}
                      >
                        {getPaymentDisplayText(order)}
                      </span>
                     
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 leading-tight">
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

