import { useState } from 'react';
import { formatOrderId } from '../../utils/orderIdFormatter';
import { getDaysPending, isAgedPendingOrder, AGED_PENDING_DAYS } from '../../utils/orderPending';

const OrdersTable = ({
  orders,
  isLoading,
  onUpdateStatus,
  onDeleteOrder,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onOrderClick,
  allOrders = [],
  highlightAgedPending = false,
  searchValue = '',
  onSearchChange,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const getUserOrderCount = (userId) => {
    if (!userId) return 0;
    const userIdStr = userId._id?.toString() || userId.toString();
    return allOrders.filter((order) => {
      const orderUserId = order.userId?._id?.toString() || order.userId?.toString();
      return orderUserId === userIdStr;
    }).length;
  };

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

    if (paymentMethod === 'online' && paymentStatus === 'completed') {
      return 'Paid Online';
    }
    if (paymentMethod === 'cod' && paymentStatus === 'completed') {
      return 'Paid COD';
    }
    if (paymentStatus === 'completed') {
      return paymentMethod === 'cod' ? 'Paid COD' : 'Paid';
    }
    return paymentStatus === 'pending' ? 'Unpaid' : paymentStatus || 'Unpaid';
  };

  const getPaymentDisplayColor = (order) => {
    const paymentStatus = order.paymentStatus?.toLowerCase();
    if (paymentStatus === 'completed') {
      return 'bg-green-100 text-green-800';
    }
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

  const handleDelete = async (e, order) => {
    e.stopPropagation();
    if (!onDeleteOrder) return;
    const label = formatOrderId(order.orderNumber || order._id);
    if (!window.confirm(`Delete order ${label}? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(order._id);
      await onDeleteOrder(order._id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {typeof onSearchChange === 'function' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              Search order
            </label>
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Order ID (#937961) or customer phone"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
            {searchValue ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-xs text-gray-500">
            {searchValue ? 'No orders match your search.' : 'No orders found.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Order#
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Order Count
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
                    Days Pending
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const daysPending = getDaysPending(order.createdAt);
                  const status = (order.orderStatus || 'pending').toLowerCase();
                  const isPending = status === 'pending';
                  const isAged =
                    highlightAgedPending && isAgedPendingOrder(order, AGED_PENDING_DAYS);

                  return (
                    <tr
                      key={order._id}
                      className={`hover:bg-gray-50 transition cursor-pointer even:bg-gray-50 ${
                        isAged ? 'bg-purple-50 even:bg-purple-50' : ''
                      }`}
                      onClick={() => onOrderClick && onOrderClick(order._id)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 leading-tight">
                          {formatOrderId(order.orderNumber || order._id)}
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
                          {getUserOrderCount(order.userId)}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 font-medium leading-tight">
                          {order.items?.length || 0} item
                          {order.items?.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-semibold text-gray-900 leading-tight">
                          ₹{Number(order.billingDetails?.totalAmount || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (canChangeStatus) {
                                      setShowStatusDropdown(
                                        showStatusDropdown === order._id ? null : order._id
                                      );
                                    }
                                  }}
                                  disabled={!canChangeStatus}
                                  className={`px-2 py-0.5 inline-flex items-center space-x-1 text-xs leading-4 font-semibold rounded-full transition ${getStatusColor(
                                    order.orderStatus
                                  )} ${
                                    canChangeStatus
                                      ? 'cursor-pointer hover:opacity-80'
                                      : 'cursor-not-allowed opacity-75'
                                  }`}
                                  title={
                                    !canChangeStatus
                                      ? 'Cannot change status for delivered or cancelled orders'
                                      : 'Change order status'
                                  }
                                >
                                  <span>{order.orderStatus || 'pending'}</span>
                                </button>
                                {showStatusDropdown === order._id && canChangeStatus && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStatusDropdown(null);
                                      }}
                                    />
                                    <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                      <div className="py-1">
                                        {orderStatuses.map((statusOption) => (
                                          <button
                                            key={statusOption.value}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (order.orderStatus !== statusOption.value) {
                                                onUpdateStatus(order._id, statusOption.value);
                                              }
                                              setShowStatusDropdown(null);
                                            }}
                                            disabled={order.orderStatus === statusOption.value}
                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 transition flex items-center space-x-2 ${
                                              order.orderStatus === statusOption.value
                                                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                : 'text-gray-700'
                                            }`}
                                          >
                                            <span
                                              className={`w-2 h-2 rounded-full ${statusOption.colorClass}`}
                                            />
                                            <span>{statusOption.label}</span>
                                            {order.orderStatus === statusOption.value && (
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
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${getPaymentDisplayColor(
                            order
                          )}`}
                        >
                          {getPaymentDisplayText(order)}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {isPending ? (
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                              daysPending >= 2
                                ? 'bg-purple-100 text-purple-800'
                                : daysPending >= 1
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {daysPending === 0
                              ? 'Today'
                              : `${daysPending} day${daysPending === 1 ? '' : 's'}`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 leading-tight">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button
                          type="button"
                          title="Delete order"
                          disabled={deletingId === order._id}
                          onClick={(e) => handleDelete(e, order)}
                          className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
      )}
    </div>
  );
};

export default OrdersTable;
