import { useState } from 'react';

const CouponsTable = ({ coupons, isLoading, onEdit, onDelete, onToggleStatus }) => {
  const [expandedCoupon, setExpandedCoupon] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const isExpired = (endDate) => {
    return new Date(endDate) < new Date();
  };

  const isActive = (coupon) => {
    const now = new Date();
    return (
      coupon.isActive &&
      now >= new Date(coupon.startDate) &&
      now <= new Date(coupon.endDate) &&
      (coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit)
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading coupons...</p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No coupons found. Create your first coupon!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Min. Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Validity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon._id} className="hover:bg-gray-50 even:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-xs text-gray-500">{coupon.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {coupon.discountType === 'percentage' ? (
                      <>
                        {coupon.discountValue}% OFF
                        {coupon.maxDiscount && (
                          <div className="text-xs text-gray-500">Max ₹{coupon.maxDiscount}</div>
                        )}
                      </>
                    ) : (
                      <>₹{coupon.discountValue} OFF</>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{coupon.minimumOrderAmount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                  </div>
                  {isExpired(coupon.endDate) && (
                    <div className="text-xs text-red-600 font-medium">Expired</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {coupon.usageCount} / {coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}
                  </div>
                  <div className="text-xs text-gray-500">
                    {coupon.perUserLimit === 0 ? 'Unlimited' : `${coupon.perUserLimit} per user`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isActive(coupon)
                        ? 'bg-green-100 text-green-800'
                        : !coupon.isActive
                        ? 'bg-gray-100 text-gray-800'
                        : isExpired(coupon.endDate)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {isActive(coupon)
                      ? 'Active'
                      : !coupon.isActive
                      ? 'Inactive'
                      : isExpired(coupon.endDate)
                      ? 'Expired'
                      : 'Not Started'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (expandedCoupon === coupon._id) {
                          setExpandedCoupon(null);
                        } else {
                          setExpandedCoupon(coupon._id);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={expandedCoupon === coupon._id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEdit(coupon)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onToggleStatus(coupon._id)}
                      className={`${
                        coupon.isActive
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={coupon.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this coupon?')) {
                          onDelete(coupon._id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Details */}
      {expandedCoupon && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {coupons
            .filter((c) => c._id === expandedCoupon)
            .map((coupon) => (
              <div key={coupon._id} className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Customer Assignment:</span>
                    <span className="ml-2 text-gray-900">
                      {coupon.assignedCustomers?.length > 0
                        ? `${coupon.assignedCustomers.length} selected customers`
                        : 'All customers'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(coupon.createdAt)}</span>
                  </div>
                </div>
                {coupon.assignedCustomers?.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Assigned Customers:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {coupon.assignedCustomers.map((customer) => (
                        <span
                          key={customer._id || customer}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {customer.name || customer.email || customer._id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CouponsTable;
