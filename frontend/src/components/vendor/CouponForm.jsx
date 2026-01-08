import { useState, useEffect } from 'react';
import { couponAPI } from '../../utils/api';

const CouponForm = ({ coupon, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || '',
    maxDiscount: coupon?.maxDiscount || '',
    minimumOrderAmount: coupon?.minimumOrderAmount || '',
    startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
    endDate: coupon?.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
    usageLimit: coupon?.usageLimit || 0,
    perUserLimit: coupon?.perUserLimit || 1,
    isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
    assignedCustomers: coupon?.assignedCustomers?.map(c => c._id || c) || [],
  });

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);

  useEffect(() => {
    if (showCustomerSelector) {
      fetchCustomers();
    }
  }, [showCustomerSelector]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await couponAPI.getCustomers({ search: searchQuery, limit: 50 });
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const debounce = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      maxDiscount: formData.discountType === 'percentage' && formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      usageLimit: parseInt(formData.usageLimit) || 0,
      perUserLimit: parseInt(formData.perUserLimit) || 1,
      isActive: formData.isActive,
      assignedCustomers: formData.assignedCustomers || [],
    };

    onSubmit(submitData);
  };

  const toggleCustomerSelection = (customerId) => {
    const isSelected = formData.assignedCustomers.includes(customerId);
    if (isSelected) {
      setFormData({
        ...formData,
        assignedCustomers: formData.assignedCustomers.filter(id => id !== customerId),
      });
    } else {
      setFormData({
        ...formData,
        assignedCustomers: [...formData.assignedCustomers, customerId],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Coupon Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="SAVE50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter coupon description"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Discount Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type *
            </label>
            <select
              required
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value *
            </label>
            <input
              type="number"
              required
              min="0"
              max={formData.discountType === 'percentage' ? 100 : undefined}
              step={formData.discountType === 'percentage' ? '0.01' : '1'}
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={formData.discountType === 'percentage' ? '10' : '100'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.discountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in ₹'}
            </p>
          </div>

          {formData.discountType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500"
              />
              <p className="text-xs text-gray-500 mt-1">Optional: Maximum discount cap</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Order Amount (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.minimumOrderAmount}
              onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Validity Period</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              required
              min={formData.startDate}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Usage Limits</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Usage Limit
            </label>
            <input
              type="number"
              min="0"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0 = Unlimited"
            />
            <p className="text-xs text-gray-500 mt-1">0 means unlimited usage</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per User Limit *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.perUserLimit}
              onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">How many times a user can use this coupon</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Assignment</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              This coupon is vendor-specific and will only be valid for your products. Leave empty to make it available to all customers, or select specific customers.
            </p>
            
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Customers (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomerSelector(!showCustomerSelector)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCustomerSelector ? 'Hide' : 'Show'} Customer List
                </button>
              </div>

              {showCustomerSelector && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search customers by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  {loadingCustomers ? (
                    <div className="text-center py-4 text-gray-500">Loading customers...</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {customers.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No customers found</div>
                      ) : (
                        customers.map((customer) => (
                          <label
                            key={customer._id}
                            className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assignedCustomers.includes(customer._id)}
                              onChange={() => toggleCustomerSelection(customer._id)}
                              className="mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.email} • {customer.phone}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  {formData.assignedCustomers.length > 0 ? (
                    <div className="text-sm text-green-600 font-medium">
                      {formData.assignedCustomers.length} customer(s) selected
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No customers selected - coupon will be available to all customers
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active (Coupon will be available for use)
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
};

export default CouponForm;
