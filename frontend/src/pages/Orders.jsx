import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Modal from '../components/Modal';
import { useOrders, useCancelOrder } from '../hooks/useApiQueries';
import Button from '../components/Button';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { formatOrderId } from '../utils/orderIdFormatter';

const CITY_ID_KEY = 'selectedCityId';

const Orders = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Get selected city ID from localStorage
  useEffect(() => {
    const updateSelectedCity = () => {
      const cityId = localStorage.getItem(CITY_ID_KEY);
      setSelectedCityId(cityId);
    };
    
    // Initial load
    updateSelectedCity();
    
    // Listen for city changes
    window.addEventListener('cityChange', updateSelectedCity);
    
    return () => {
      window.removeEventListener('cityChange', updateSelectedCity);
    };
  }, []);

  // React Query hooks for orders with caching - filter by selected city
  const { data: ordersResponse, isLoading: loading, error: ordersError } = useOrders(
    selectedCityId ? { cityId: selectedCityId } : {},
    {
      enabled: isAuthenticated(),
      retry: false,
    }
  );

  const cancelOrderMutation = useCancelOrder();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
  }, [navigate]);

  const orders = ordersResponse?.success && ordersResponse?.data ? ordersResponse.data : [];
  const error = ordersError ? (ordersError.response?.data?.message || 'Failed to load orders') : '';

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrder(orderId);
      await cancelOrderMutation.mutateAsync(orderId);
      // Query will automatically refetch due to invalidation in the mutation
      alert('Order cancelled successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
      processing: 'bg-purple-50 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-50 text-green-800 border-green-200',
      cancelled: 'bg-red-50 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDownloadInvoice = (order) => {
    try {
      // Use vendor from order if populated, otherwise fetch it
      let vendor = order.vendorId || {};
      
      // If vendorId exists but vendor object is incomplete, fetch vendor details
      if (order.vendorId && (!order.vendorId.bankDetails || !order.vendorId.businessName)) {
        try {
          const { vendorAPI } = await import('../utils/api');
          const vendorId = order.vendorId._id || order.vendorId;
          const vendorResponse = await vendorAPI.getVendorBankDetails(vendorId);
          if (vendorResponse.success && vendorResponse.data) {
            vendor = {
              ...vendor,
              ...vendorResponse.data,
              bankDetails: {
                ...vendor.bankDetails,
                ...vendorResponse.data.bankDetails,
              },
            };
          }
        } catch (err) {
          console.warn('Could not fetch vendor details for invoice:', err);
        }
      }
      
      await generateInvoicePDF(order, vendor);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  // Get selected city name for display
  const selectedCityName = localStorage.getItem('selectedCity') || 'All Cities';

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Your Orders</h1>
              <p className="text-sm text-gray-600 mt-1">
                {orders.length} order{orders.length !== 1 ? 's' : ''} placed
                {selectedCityId && (
                  <span className="ml-2 text-gray-500">
                    in <span className="font-medium text-gray-700">{selectedCityName}</span>
                  </span>
                )}
              </p>
            </div>
            {selectedCityId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Filtered by: {selectedCityName}</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-3 sm:px-4 py-3 bg-gray-50 border-b border-gray-200">
                  {/* Mobile: Two fields per row */}
                  <div className="sm:hidden space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">Order Placed</span>
                        <p className="text-xs font-medium text-gray-900 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Ship to</span>
                        <p className="text-xs font-medium text-gray-900 truncate mt-0.5">
                          {order.deliveryAddress?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-600">Total</span>
                        <p className="text-xs font-medium text-gray-900 mt-0.5">
                          ₹{order.billingDetails?.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Order #</span>
                        <p className="text-xs font-medium text-gray-900 truncate mt-0.5">
                          {formatOrderId(order.orderNumber || order._id)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop: Original layout */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between gap-2">
                    <div className="flex sm:items-center gap-2 sm:gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Order Placed</span>
                        <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-gray-300">|</div>
                      <div>
                        <span className="text-sm text-gray-600">Total</span>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{order.billingDetails?.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-gray-300">|</div>
                      <div>
                        <span className="text-sm text-gray-600">Ship to</span>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                          {order.deliveryAddress?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Order #{order.orderNumber}</span>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        Order Details
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-3 sm:p-4">
                  {/* Status Badge */}
                  <div className="mb-3 sm:mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium border ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {getStatusText(order.orderStatus)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-2 sm:gap-4">
                        {/* Product Image */}
                        <div className="shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 sm:w-24 sm:h-24 object-contain p-1 bg-white rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/96?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded border border-gray-200 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-base font-medium text-gray-900 mb-0.5 sm:mb-1 line-clamp-2">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-gray-600 mb-0.5 sm:mb-1">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                    {/* Mobile: Two buttons per row */}
                    <div className="sm:hidden grid grid-cols-2 gap-2">
                      {order.orderStatus === 'delivered' && (
                        <Button variant="secondary" size="sm" className="text-xs">
                          Buy Again
                        </Button>
                      )}
                      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrder === order._id}
                          loading={cancellingOrder === order._id}
                          className="text-xs"
                        >
                          Cancel Order
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="text-xs"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownloadInvoice(order)}
                        className="flex items-center justify-center gap-1.5 text-xs col-span-2"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Invoice
                      </Button>
                    </div>
                    
                    {/* Desktop: Original layout */}
                    <div className="hidden sm:flex sm:flex-wrap gap-2">
                      {order.orderStatus === 'delivered' && (
                        <Button variant="secondary" size="md">
                          Buy Again
                        </Button>
                      )}
                      {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrder === order._id}
                          loading={cancellingOrder === order._id}
                        >
                          Cancel Order
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => handleViewOrder(order)}
                      >
                        View Order Details
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleDownloadInvoice(order)}
                        className="flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}>
        {selectedOrder && (
          <div className="w-full">
            {/* Header */}
            <div className="mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Order {formatOrderId(selectedOrder.orderNumber || selectedOrder._id)}
              </h2>
            </div>

            <div className="space-y-4">
              {/* Order Status */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Order Status</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {getStatusText(selectedOrder.orderStatus)}
                  </span>
                  <span className="text-xs text-gray-600">
                    Payment: {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain p-1 bg-white rounded shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/56?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded flex items-center justify-center shrink-0">
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 mb-0.5">{item.productName}</h4>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 shrink-0">₹{item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Delivery Address</h3>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">{selectedOrder.deliveryAddress.name}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {selectedOrder.deliveryAddress.addressLine1}
                    {selectedOrder.deliveryAddress.addressLine2 && `, ${selectedOrder.deliveryAddress.addressLine2}`}
                    <br />
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}
                    <br />
                    Phone: {selectedOrder.deliveryAddress.phone}
                  </p>
                </div>
              </div>

              {/* Billing Summary */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Billing Summary</h3>
                <div className="space-y-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.cartTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedOrder.billingDetails?.gstAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">GST:</span>
                      <span className="font-medium">₹{selectedOrder.billingDetails?.gstAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {selectedOrder.billingDetails?.shippingCharges > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">₹{selectedOrder.billingDetails?.shippingCharges?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm font-bold pt-1.5 border-t border-gray-200 mt-1.5">
                    <span>Total:</span>
                    <span className="text-red-600">₹{selectedOrder.billingDetails?.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Payment Method</h3>
                <p className="text-xs text-gray-600">
                  {selectedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'UPI Online Payment'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="flex items-center justify-center gap-1.5 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Invoice
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowOrderModal(false)}
                className="text-xs sm:text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
