const UnpaidCustomersTable = ({ 
  orders, 
  isLoading,
  onOrderClick,
  onUpdatePaymentStatus,
}) => {
  // Helper function to get last 6 digits of an ID
  const getLastSixDigits = (id) => {
    if (!id) return 'N/A';
    const idString = String(id);
    return idString.length > 6 ? idString.slice(-6) : idString.padStart(6, '0');
  };

  // Format date like "October 31, 2025, 12:47 am"
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options).toLowerCase();
  };

  // Get order status text (delivered, pending, etc.)
  const getOrderStatusText = (order) => {
    const status = order.orderStatus || 'pending';
    const statusMap = {
      pending: 'Pending',
      confirmed: 'Pending',
      processing: 'Pending',
      shipped: 'Pending',
      delivered: 'delivered',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || 'Pending';
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
    const customerPhone = order.deliveryAddress?.phone || 
                          order.userId?.phone || 
                          order.Phone || 
                          'N/A';

    if (!customersMap.has(userId)) {
      customersMap.set(userId, {
        userId,
        customerName,
        customerPhone,
        orders: [],
        totalUnpaidAmount: 0,
      });
    }

    const customer = customersMap.get(userId);
    customer.orders.push(order);
    const orderAmount = order.billingDetails?.totalAmount || 
                        order.Net_total || 
                        order.totalAmount || 
                        0;
    customer.totalUnpaidAmount += orderAmount;
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer border-r border-b border-gray-300">
                Id
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-b border-gray-300">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer border-r border-b border-gray-300">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer border-r border-b border-gray-300">
                Order Information
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer border-b border-gray-300">
                Unpaid Amt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {customers.map((customer) => {
              const userIdLastSix = getLastSixDigits(customer.userId);
              
              return (
                <tr 
                  key={customer.userId}
                  className="hover:bg-gray-50 transition even:bg-gray-50 border-b border-gray-200"
                >
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className="text-xs font-medium text-gray-900">
                      {userIdLastSix}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className="text-xs text-gray-900">
                      {customer.customerName}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                    <div className="text-xs text-gray-900">
                      {customer.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-gray-200">
                    <div className="text-xs text-gray-900 space-y-1">
                      {customer.orders.map((order, index) => {
                        const orderId = order._id || order.order_id || order.id || order.orderNumber;
                        const orderIdLastSix = getLastSixDigits(orderId);
                        const orderAmount = order.billingDetails?.totalAmount || 
                                          order.Net_total || 
                                          order.totalAmount || 
                                          0;
                        const orderDate = formatDate(order.createdAt || order.order_date_and_time);
                        const orderStatus = getOrderStatusText(order);
                        const formattedAmount = orderAmount.toLocaleString('en-IN', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        });
                        
                        return (
                          <div 
                            key={orderId || index}
                            className="cursor-pointer hover:text-blue-600"
                            onClick={() => onOrderClick && onOrderClick(orderId)}
                          >
                            Order id - #{orderIdLastSix} / Amt - {formattedAmount} ₹ / Date - {orderDate} ({orderStatus})
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-red-600">
                      {customer.totalUnpaidAmount?.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }) || '0.00'} ₹
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnpaidCustomersTable;
