import { useState, useEffect } from 'react';

const OrderRecords = ({ userRole = 'vendor' }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [filters, setFilters] = useState({
    orderStatus: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    vendorId: '',
    cityId: '',
  });
  const itemsPerPage = 10;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchOrders();
  }, [page, filters, userRole]);

  // Fetch vendors and cities for super_admin filters
  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchVendorsAndCities();
    }
  }, [userRole]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.orderStatus) params.append('orderStatus', filters.orderStatus);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.vendorId) params.append('vendorId', filters.vendorId);
      if (filters.cityId) params.append('cityId', filters.cityId);

      const endpoint = userRole === 'super_admin'
        ? `${baseUrl}/admin/orders`
        : `${baseUrl}/vendor/orders`;

      // Prepare headers - use Authorization header for super_admin, cookies for vendor
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header for super_admin (token from localStorage)
      if (userRole === 'super_admin') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Use fetch with credentials for cookie-only authentication (vendor)
      // or Authorization header (super_admin)
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        credentials: userRole === 'super_admin' ? 'same-origin' : 'include', // Cookie for vendor, same-origin for super_admin
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please login again.');
          return;
        }
        throw new Error(data.message || 'Failed to fetch orders');
      }

      if (data.success) {
        // Format orders to match the required fields
        const formattedOrders = data.data.map((order) => ({
          order_id: order.order_id || order._id || order.orderNumber || 'N/A',
          user_id: order.user_id || order.userId?._id || order.userId || 'N/A',
          Customer_Name: order.Customer_Name || order.deliveryAddress?.name || order.userId?.name || 'N/A',
          Phone: order.Phone || order.deliveryAddress?.phone || order.userId?.phone || 'N/A',
          order_date_and_time: order.order_date_and_time || order.order_data_and_time || order.createdAt || 'N/A',
          sub_total: order.sub_total || order.billingDetails?.cartTotal || 0,
          Total_Tax: order.Total_Tax || order.billingDetails?.gstAmount || 0,
          Net_total: order.Net_total || order.billingDetails?.totalAmount || 0,
          Coupon_amount: order.Coupon_amount || order.couponAmount || 0,
          Order_status: order.Order_status || order.orderStatus || 'pending',
          Payment_mode: order.Payment_mode || order.paymentMethod || 'N/A',
          Payment_status: order.Payment_status || order.paymentStatus || 'pending',
          delivery_date: order.delivery_date || order.delivery_data || order.deliveryDate || null,
          Email: order.Email || order.userId?.email || 'N/A',
          City: order.City || order.deliveryAddress?.city || order.userId?.city || 'N/A',
        }));

        setOrders(formattedOrders);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorsAndCities = async () => {
    try {
      setLoadingFilters(true);
      const token = localStorage.getItem('token');

      // Fetch vendors
      const vendorsResponse = await fetch(`${baseUrl}/vendors?isActive=true&isApproved=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'same-origin',
      });
      const vendorsData = await vendorsResponse.json();
      if (vendorsData.success) {
        setVendors(vendorsData.data || []);
      }

      // Fetch cities
      const citiesResponse = await fetch(`${baseUrl}/cities?isActive=true&isServiceable=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const citiesData = await citiesResponse.json();
      if (citiesData.success) {
        setCities(citiesData.data || []);
      }
    } catch (err) {
      console.error('Error fetching vendors and cities:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getLast6Digits = (id) => {
    if (!id || id === 'N/A') return 'N/A';
    const idString = typeof id === 'object' ? id.toString() : String(id);
    return idString.length > 6 ? idString.slice(-6) : idString;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setFilters({
      orderStatus: '',
      paymentStatus: '',
      startDate: '',
      endDate: '',
      vendorId: '',
      cityId: '',
    });
    setPage(1);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Order Records</h1>
        <div className="text-sm text-gray-600">
          Total: {orders.length} orders
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className={`grid grid-cols-2 ${userRole === 'super_admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Order Status
            </label>
            <select
              value={filters.orderStatus}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {userRole === 'super_admin' && (
            <>
              {/* Removed Filter by Vendor */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filter by Service City
                </label>
                <select
                  value={filters.cityId}
                  onChange={(e) => handleFilterChange('cityId', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loadingFilters}
                >
                  <option value="">All Cities</option>
                  {cities.map((city) => (
                    <option key={city._id} value={city._id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        {(filters.orderStatus || filters.paymentStatus || filters.startDate || filters.endDate || filters.vendorId || filters.cityId) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Order ID
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  User ID
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Customer Name
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Phone
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Order Date & Time
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Sub Total
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Tax
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Net Total
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Coupon
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Order Status
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Payment Mode
                </th>
                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  Payment Status
                </th>


                <th className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider`}>
                  City
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="13" className={`px-4 py-8 text-center text-xs text-gray-500`}>
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-900 leading-tight`}>
                      {getLast6Digits(order.order_id)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {getLast6Digits(order.user_id)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-900 leading-tight`}>
                      {order.Customer_Name}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {order.Phone}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {formatDate(order.order_date_and_time)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-900 font-medium leading-tight`}>
                      {formatCurrency(order.sub_total)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-900 leading-tight`}>
                      {formatCurrency(order.Total_Tax)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-900 font-semibold leading-tight`}>
                      {formatCurrency(order.Net_total)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {formatCurrency(order.Coupon_amount)}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap`}>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(order.Order_status)}`}>
                        {order.Order_status}
                      </span>
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {order.Payment_mode === 'cod' ? 'COD' : order.Payment_mode === 'online' ? 'Online' : order.Payment_mode}
                    </td>
                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap`}>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getPaymentStatusColor(order.Payment_status)}`}>
                        {order.Payment_status}
                      </span>
                    </td>


                    <td className={`${userRole === 'super_admin' ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap text-sm text-gray-600 leading-tight`}>
                      {order.City}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderRecords;

