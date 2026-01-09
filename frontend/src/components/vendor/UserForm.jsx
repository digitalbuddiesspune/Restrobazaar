import { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const UserForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Address related state
  const [createdUserId, setCreatedUserId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    addressType: 'home',
    isDefault: false,
  });
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData({
      ...addressFormData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setAddressError('');
    setAddressSuccess('');
  };

  // Fetch addresses for a user
  const fetchUserAddresses = async (userId) => {
    if (!userId) return;
    
    try {
      setAddressesLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseUrl}/vendor/addresses/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setAddresses(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Handle address form submission
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    // Validate required fields
    if (!addressFormData.name || !addressFormData.phone || !addressFormData.addressLine1 || 
        !addressFormData.city || !addressFormData.state || !addressFormData.pincode) {
      setAddressError('Please fill all required fields');
      return;
    }

    setAddressLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingAddress 
        ? `${baseUrl}/vendor/addresses/${editingAddress._id}`
        : `${baseUrl}/vendor/addresses`;
      
      const method = editingAddress ? 'PUT' : 'POST';
      const addressData = {
        ...addressFormData,
        userId: createdUserId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (data.success) {
        setAddressSuccess(editingAddress ? 'Address updated successfully!' : 'Address created successfully!');
        // Reset address form
        setAddressFormData({
          name: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          addressType: 'home',
          isDefault: false,
        });
        setEditingAddress(null);
        // Refresh addresses
        fetchUserAddresses(createdUserId);
        
        // Call onSuccess after address is created/updated
        if (onSuccess && !editingAddress) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setAddressError(data.message || 'Failed to save address');
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };

  // Handle edit address
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressFormData({
      name: address.name || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      addressType: address.addressType || 'home',
      isDefault: address.isDefault || false,
    });
    setShowAddressForm(true);
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/vendor/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setAddressSuccess('Address deleted successfully!');
        fetchUserAddresses(createdUserId);
      } else {
        setAddressError(data.message || 'Failed to delete address');
      }
    } catch (err) {
      setAddressError('Failed to delete address. Please try again.');
    }
  };

  // Reset address form
  const handleCancelAddress = () => {
    setAddressFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      addressType: 'home',
      isDefault: false,
    });
    setEditingAddress(null);
    setAddressError('');
    setAddressSuccess('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email || !formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signUpData } = formData;
      const response = await authAPI.signUp(signUpData);
      
      if (response.success) {
        setSuccess('User created successfully!');
        // Store created user ID
        const userId = response.data?._id || response.data?.user?._id;
        if (userId) {
          setCreatedUserId(userId);
          // Fetch addresses for the created user
          fetchUserAddresses(userId);
          // Show address form
          setShowAddressForm(true);
        }
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
        });
        // Don't call onSuccess immediately - wait for address creation
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to create user. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
        <p className="text-sm text-gray-600 mt-1">
          Create a new customer account for your platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Form Fields Grid - Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Phone Input - Full width on second row */}
          <div className="md:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>

      {/* Address Section - Show after user creation */}
      {createdUserId && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Addresses</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add or manage addresses for this user
              </p>
            </div>
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(true);
                  handleCancelAddress();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                + Add Address
              </button>
            )}
          </div>

          {/* Address List */}
          {addressesLoading ? (
            <div className="text-gray-500 text-center py-4">Loading addresses...</div>
          ) : addresses.length > 0 ? (
            <div className="space-y-3 mb-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{address.name}</span>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                            Default
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded capitalize">
                          {address.addressType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{address.addressLine1}</p>
                      {address.addressLine2 && (
                        <p className="text-sm text-gray-700">{address.addressLine2}</p>
                      )}
                      <p className="text-sm text-gray-700">
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                      {address.landmark && (
                        <p className="text-sm text-gray-600">Landmark: {address.landmark}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">Phone: {address.phone}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address)}
                        className="px-3 py-1.5 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(address._id)}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No addresses found. Add an address below.
            </div>
          )}

          {/* Address Form */}
          {showAddressForm && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h4>

              {addressError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4">
                  <p className="text-sm">{addressError}</p>
                </div>
              )}

              {addressSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4">
                  <p className="text-sm">{addressSuccess}</p>
                </div>
              )}

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={addressFormData.name}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Full Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={addressFormData.phone}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    required
                    value={addressFormData.addressLine1}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Street address, house number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={addressFormData.addressLine2}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={addressFormData.city}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={addressFormData.state}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={addressFormData.pincode}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={addressFormData.landmark}
                    onChange={handleAddressChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nearby landmark (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Type
                    </label>
                    <select
                      name="addressType"
                      value={addressFormData.addressType}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={addressFormData.isDefault}
                        onChange={handleAddressChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Set as default address</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      handleCancelAddress();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addressLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserForm;
