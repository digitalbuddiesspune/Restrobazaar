import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { formatOrderId } from '../../utils/orderIdFormatter';

const OrderRecords = ({ initialOrderStatus = null, onFilterSet = () => {} }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cities, setCities] = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState({
    orderStatus: initialOrderStatus || '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    cityId: '',
  });
  const itemsPerPage = 10;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  // Fetch cities for super_admin filters
  useEffect(() => {
    fetchCities();
  }, []);

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
      if (filters.cityId) params.append('cityId', filters.cityId);

      const endpoint = `${baseUrl}/admin/orders`;

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
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

  const fetchCities = async () => {
    try {
      setLoadingFilters(true);
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
      console.error('Error fetching cities:', err);
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

  // Helper function to get last 6 digits of user ID (without # prefix)
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
    // Notify parent that filter has been set (clear initial filter)
    if (key === 'orderStatus' && initialOrderStatus) {
      onFilterSet();
    }
  };

  // Set initial filter when component mounts or initialOrderStatus changes
  useEffect(() => {
    if (initialOrderStatus) {
      setFilters((prev) => ({ ...prev, orderStatus: initialOrderStatus }));
    }
  }, [initialOrderStatus]);

  const clearFilters = () => {
    setFilters({
      orderStatus: '',
      paymentStatus: '',
      startDate: '',
      endDate: '',
      cityId: '',
    });
    setPage(1);
  };

  // Fetch all orders for export (without pagination)
  const fetchAllOrdersForExport = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.orderStatus) params.append('orderStatus', filters.orderStatus);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cityId) params.append('cityId', filters.cityId);

      // Set a very high limit to get all orders
      params.append('limit', '10000');
      params.append('page', '1');

      const endpoint = `${baseUrl}/admin/orders`;

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders for export');
      }

      if (data.success) {
        return data.data.map((order) => ({
          order_id: order.order_id || order._id || order.orderNumber || 'N/A',
          user_id: order.user_id || order.userId?._id || order.userId || 'N/A',
          Customer_Name: order.Customer_Name || order.deliveryAddress?.name || order.userId?.name || 'N/A',
          Phone: order.Phone || order.deliveryAddress?.phone || order.userId?.phone || 'N/A',
          Email: order.Email || order.userId?.email || 'N/A',
          order_date_and_time: order.order_date_and_time || order.order_data_and_time || order.createdAt || 'N/A',
          sub_total: parseFloat(order.sub_total || order.billingDetails?.cartTotal || 0),
          Total_Tax: parseFloat(order.Total_Tax || order.billingDetails?.gstAmount || 0),
          Net_total: parseFloat(order.Net_total || order.billingDetails?.totalAmount || 0),
          Coupon_amount: parseFloat(order.Coupon_amount || order.couponAmount || 0),
          Order_status: order.Order_status || order.orderStatus || 'pending',
          Payment_mode: order.Payment_mode === 'cod' ? 'COD' : order.Payment_mode === 'online' ? 'Online' : order.Payment_mode || 'N/A',
          Payment_status: order.Payment_status || order.paymentStatus || 'pending',
          delivery_date: order.delivery_date || order.delivery_data || order.deliveryDate || null,
          City: order.City || order.deliveryAddress?.city || order.userId?.city || 'N/A',
        }));
      }
      return [];
    } catch (err) {
      console.error('Error fetching orders for export:', err);
      throw err;
    }
  };

  // Export orders to Excel
  const exportToExcel = async () => {
    try {
      setDownloading(true);
      setError('');

      // Fetch all orders based on current filters
      const allOrders = await fetchAllOrdersForExport();

      if (allOrders.length === 0) {
        setError('No orders found to export');
        setDownloading(false);
        return;
      }

      // Format data for Excel
      const excelData = allOrders.map((order) => {
        // Format Order ID: last 6 digits with # prefix
        const formattedOrderId = formatOrderId(order.order_id);

        // Format User ID: last 6 digits
        const userIdStr = order.user_id && order.user_id !== 'N/A'
          ? String(order.user_id)
          : 'N/A';
        const formattedUserId = userIdStr !== 'N/A' && userIdStr.length > 6
          ? userIdStr.slice(-6)
          : userIdStr;

        return {
          'Order ID': formattedOrderId,
          'User ID': formattedUserId,
          'Customer Name': order.Customer_Name,
          'Phone': order.Phone,
          'Email': order.Email,
          'Order Date & Time': formatDate(order.order_date_and_time),
          'Sub Total (₹)': order.sub_total,
          'Tax (₹)': order.Total_Tax,
          'Net Total (₹)': order.Net_total,
          'Coupon Amount (₹)': order.Coupon_amount,
          'Order Status': order.Order_status,
          'Payment Mode': order.Payment_mode,
          'Payment Status': order.Payment_status,
          'Delivery Date': order.delivery_date ? formatDate(order.delivery_date) : 'N/A',
          'City': order.City,
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Order ID
        { wch: 15 }, // User ID
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 25 }, // Order Date & Time
        { wch: 15 }, // Sub Total
        { wch: 12 }, // Tax
        { wch: 15 }, // Net Total
        { wch: 15 }, // Coupon Amount
        { wch: 15 }, // Order Status
        { wch: 15 }, // Payment Mode
        { wch: 15 }, // Payment Status
        { wch: 20 }, // Delivery Date
        { wch: 15 }, // City
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Order Records');

      // Generate filename with current date and filters
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `Order_Records_${dateStr}`;
      
      if (filters.orderStatus) {
        filename += `_${filters.orderStatus}`;
      }
      if (filters.paymentStatus) {
        filename += `_${filters.paymentStatus}`;
      }
      if (filters.startDate) {
        filename += `_from_${filters.startDate}`;
      }
      if (filters.endDate) {
        filename += `_to_${filters.endDate}`;
      }
      if (filters.cityId) {
        const city = cities.find(c => c._id === filters.cityId);
        if (city) {
          filename += `_${city.name}`;
        }
      }

      filename += '.xlsx';

      // Write file
      XLSX.writeFile(wb, filename);
      
      setDownloading(false);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(err.message || 'Failed to export orders to Excel');
      setDownloading(false);
    }
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
        <div className="flex items-center gap-4">
         
          <button
            onClick={exportToExcel}
            disabled={downloading || loading}
            className="px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        </div>
        {(filters.orderStatus || filters.paymentStatus || filters.startDate || filters.endDate || filters.cityId) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
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
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Order Date & Time
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Sub Total
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Net Total
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  City
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-8 text-center text-xs text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50 even:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 leading-tight">
                      {formatOrderId(order.order_id)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
                      {getLast6Digits(order.user_id)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 leading-tight">
                      {order.Customer_Name}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
                      {order.Phone}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
                      {formatDate(order.order_date_and_time)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 font-medium leading-tight">
                      {formatCurrency(order.sub_total)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 leading-tight">
                      {formatCurrency(order.Total_Tax)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 font-semibold leading-tight">
                      {formatCurrency(order.Net_total)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
                      {formatCurrency(order.Coupon_amount)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.Order_status)}`}>
                        {order.Order_status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
                      {order.Payment_mode === 'cod' ? 'COD' : order.Payment_mode === 'online' ? 'Online' : order.Payment_mode}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(order.Payment_status)}`}>
                        {order.Payment_status}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600 leading-tight">
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
            <div className="text-xs text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
