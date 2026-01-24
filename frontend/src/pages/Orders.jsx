import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import Modal from '../components/Modal';
import { useOrders, useCancelOrder } from '../hooks/useApiQueries';
import Button from '../components/Button';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

const Orders = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  // React Query hooks for orders with caching
  const { data: ordersResponse, isLoading: loading, error: ordersError } = useOrders({}, {
    enabled: isAuthenticated(),
    retry: false,
  });

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
      const vendor = order.vendorId || {};
      generateInvoicePDF(order, vendor);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Your Orders</h1>
          <p className="text-sm text-gray-600 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
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
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Order Placed</span>
                        <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
                      <div>
                        <span className="text-sm text-gray-600">Total</span>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{order.billingDetails?.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
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
                <div className="p-4">
                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {getStatusText(order.orderStatus)}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-contain p-1 bg-white rounded border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/96?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded border border-gray-200 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
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
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.productName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{item.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                    {order.orderStatus === 'delivered' && (
                      <Button variant="secondary" size="md">
                        Buy Again
                      </Button>
                    )}
                    {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <>
                        <Button variant="secondary" size="md">
                          Track Package
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingOrder === order._id}
                          loading={cancellingOrder === order._id}
                        >
                          Cancel Order
                        </Button>
                      </>
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
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)}>
        {selectedOrder && (
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Order #{selectedOrder.orderNumber}
            </h2>

            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Status</h3>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                      selectedOrder.orderStatus
                    )}`}
                  >
                    {getStatusText(selectedOrder.orderStatus)}
                  </span>
                  <span className="text-sm text-gray-600">
                    Payment: {selectedOrder.paymentStatus.charAt(0).toUpperCase() +
                      selectedOrder.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-contain p-1 bg-white rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Address</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900">{selectedOrder.deliveryAddress.name}</p>
                  <p className="text-gray-600">{selectedOrder.deliveryAddress.addressLine1}</p>
                  {selectedOrder.deliveryAddress.addressLine2 && (
                    <p className="text-gray-600">{selectedOrder.deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-600">
                    {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} -{' '}
                    {selectedOrder.deliveryAddress.pincode}
                  </p>
                  <p className="text-gray-600">Phone: {selectedOrder.deliveryAddress.phone}</p>
                </div>
              </div>

              {/* Billing Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Details</h3>
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cart Total:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.cartTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.gstAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {/* GST Breakdown */}
                  {selectedOrder.items?.filter(item => item.gstPercentage > 0).length > 0 && (
                    <div className="pl-2 border-l-2 border-gray-200 space-y-1 mt-1">
                      {selectedOrder.items
                        .filter(item => item.gstPercentage > 0)
                        .map((item, index) => {
                          const itemGstAmount = item.gstAmount || ((item.total || 0) * (item.gstPercentage || 0) / 100);
                          return (
                            <div key={index} className="flex justify-between text-xs text-gray-600">
                              <span>{item.productName} ({item.gstPercentage}%):</span>
                              <span>₹{itemGstAmount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">₹{selectedOrder.billingDetails?.shippingCharges?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total Amount:</span>
                    <span className="text-red-600">₹{selectedOrder.billingDetails?.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
                <p className="text-gray-600">
                  {selectedOrder.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'UPI Online Payment'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleDownloadInvoice(selectedOrder)}
                className="flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Invoice
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowOrderModal(false)}
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
