import { useState } from 'react';

const UnpaidCustomersTable = ({ 
  orders, 
  isLoading,
  onOrderClick,
  onUpdatePaymentStatus,
}) => {
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(null);

  const paymentStatuses = [
    { value: 'pending', label: 'Pending', colorClass: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', colorClass: 'bg-green-500' },
    { value: 'failed', label: 'Failed', colorClass: 'bg-red-500' },
    { value: 'refunded', label: 'Refunded', colorClass: 'bg-orange-500' },
  ];

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  // Group orders by customer (userId) to show unique customers
  const customersMap = new Map();
  
  orders?.forEach((order) => {
    // Handle both populated and non-populated userId
    const userId = order.userId?._id?.toString() || 
                   order.userId?.toString() || 
                   order.user_id || 
                   'unknown';
    const customerName = order.deliveryAddress?.name || 
                         order.userId?.name || 
                         order.Customer_Name || 
                         'Unknown Customer';
    const customerEmail = order.userId?.email || 
                          order.Email || 
                          'N/A';
    const customerPhone = order.deliveryAddress?.phone || 
                          order.userId?.phone || 
                          order.Phone || 
                          'N/A';

    if (!customersMap.has(userId)) {
      customersMap.set(userId, {
        userId,
        customerName,
        customerEmail,
        customerPhone,
        orders: [],
        totalUnpaidAmount: 0,
        orderCount: 0,
        latestOrderDate: null,
      });
    }

    const customer = customersMap.get(userId);
    customer.orders.push(order);
    const orderAmount = order.billingDetails?.totalAmount || 
                        order.Net_total || 
                        order.totalAmount || 
                        0;
    customer.totalUnpaidAmount += orderAmount;
    customer.orderCount += 1;
    
    // Track latest order date
    const orderDate = new Date(order.createdAt || order.order_date_and_time || 0);
    if (!customer.latestOrderDate || orderDate > customer.latestOrderDate) {
      customer.latestOrderDate = orderDate;
    }
  });

  // Sort customers by total unpaid amount (highest first)
  const customers = Array.from(customersMap.values()).sort((a, b) => 
    b.totalUnpaidAmount - a.totalUnpaidAmount
  );

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

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No unpaid customers found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Unpaid Orders
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Total Unpaid Amount
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Latest Order Date
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <>
                <tr 
                  key={customer.userId}
                  className="hover:bg-gray-50 transition cursor-pointer even:bg-gray-50"
                  onClick={() => setExpandedCustomer(expandedCustomer === customer.userId ? null : customer.userId)}
                >
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 leading-tight">
                      {customer.customerName}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500 leading-tight">
                      {customer.customerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500 leading-tight">
                      {customer.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium leading-tight">
                      {customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-semibold text-red-600 leading-tight">
                      ₹{customer.totalUnpaidAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-500 leading-tight">
                      {customer.latestOrderDate ? formatDate(customer.latestOrderDate) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setExpandedCustomer(expandedCustomer === customer.userId ? null : customer.userId);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {expandedCustomer === customer.userId ? 'Hide' : 'View'} Orders
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Row - Show All Orders for This Customer */}
                {expandedCustomer === customer.userId && (
                  <tr>
                    <td colSpan="7" className="px-4 py-4 bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Unpaid Orders for {customer.customerName}
                        </h4>
                        <div className="space-y-1">
                          {customer.orders.map((order, index) => {
                            const orderId = order._id || order.order_id || order.id;
                            const orderAmount = order.billingDetails?.totalAmount || order.Net_total || order.totalAmount || 0;
                            return (
                              <div
                                key={orderId || index}
                                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition cursor-pointer"
                                onClick={() => onOrderClick && onOrderClick(orderId)}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-gray-900">
                                      Order #{order.orderNumber || orderId?.substring(0, 8) || `Order ${index + 1}`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(order.createdAt || order.order_date_and_time)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(order.paymentStatus || 'pending')}`}>
                                      {order.paymentStatus === 'pending' ? 'Unpaid' : order.paymentStatus || 'Pending'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} • 
                                    Payment: {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod || 'N/A'}
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-red-600 ml-4">
                                  ₹{orderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Details Modal/Expandable Section could be added here */}
      {customers.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Showing <span className="font-semibold">{customers.length}</span> customer{customers.length !== 1 ? 's' : ''} with unpaid orders
          </div>
        </div>
      )}
    </div>
  );
};

export default UnpaidCustomersTable;
