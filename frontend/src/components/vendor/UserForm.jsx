import { useState } from 'react';
import axios from 'axios';

/* =========================
   Axios Instance
========================= */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* =========================
   Helpers
========================= */

const cleanPhoneNumber = (phone = '') =>
  phone.replace(/\D/g, '').replace(/^91|^0/, '');

const isValidIndianMobile = (phone) => /^[6-9]\d{9}$/.test(phone);

/* =========================
   Icons
========================= */

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

/* =========================
   Reusable Components
========================= */

const InputField = ({ label, icon, required, error, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      {...props}
      className={`
        w-full px-4 py-2.5 text-sm border rounded-xl
        bg-gray-50/50 
        transition-all duration-200
        placeholder:text-gray-400
        focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white
        hover:border-gray-400
        ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'}
      `}
    />
  </div>
);

const Alert = ({ type, children, onClose }) => {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const icons = {
    success: <CheckIcon />,
    error: <XIcon />,
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${styles[type]} animate-fadeIn`}>
      <span className={`flex-shrink-0 p-1 rounded-full ${type === 'success' ? 'bg-emerald-200' : 'bg-red-200'}`}>
        {icons[type]}
      </span>
      <span className="flex-1 text-sm font-medium">{children}</span>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-70 transition-opacity">
          <XIcon />
        </button>
      )}
    </div>
  );
};

const Button = ({ variant = 'primary', size = 'md', loading, children, ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300',
    ghost: 'text-purple-600 hover:bg-purple-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
      `}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

/* =========================
   Main Component
========================= */

const UserForm = ({ onSuccess, onCancel }) => {
  /* ---------- User State ---------- */
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    restaurantName: '',
    gstNumber: '',
  });

  const [userId, setUserId] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState(null);

  /* ---------- Address State ---------- */
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressMessage, setAddressMessage] = useState(null);

  const [addressForm, setAddressForm] = useState({
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

  /* =========================
     Handlers
  ========================= */

  const handleUserChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
    setUserMessage(null);
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value,
    });
    setAddressMessage(null);
  };

  /* =========================
     API Calls
  ========================= */

  const fetchAddresses = async (id) => {
    try {
      setAddressesLoading(true);
      const { data } = await api.get(`/vendor/addresses/user/${id}`);
      if (data.success) setAddresses(data.data || []);
    } finally {
      setAddressesLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setUserMessage(null);

    const phone = cleanPhoneNumber(userForm.phone);

    if (!userForm.name.trim())
      return setUserMessage({ type: 'error', text: 'Name is required' });

    if (!isValidIndianMobile(phone))
      return setUserMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number' });

    setUserLoading(true);

    try {
      const { data } = await api.post('/vendor/new-user', {
        name: userForm.name.trim(),
        phone,
        restaurantName: userForm.restaurantName || undefined,
        gstNumber: userForm.gstNumber || undefined,
      });

      if (!data.success) throw new Error(data.message);

      const id = data.data._id || data.data.id;
      setUserId(id);
      setUserMessage({ type: 'success', text: 'User created successfully! Now add their delivery address.' });
      setShowAddressForm(true);

      setAddressForm((prev) => ({
        ...prev,
        name: userForm.name,
        phone,
      }));

      setUserForm({
        name: '',
        phone: '',
        restaurantName: '',
        gstNumber: '',
      });

      await fetchAddresses(id);
    } catch (err) {
      setUserMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create user',
      });
    } finally {
      setUserLoading(false);
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddressMessage(null);

    if (!userId)
      return setAddressMessage({ type: 'error', text: 'User not found' });

    if (!addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode)
      return setAddressMessage({ type: 'error', text: 'Please fill all required fields' });

    setAddressLoading(true);

    try {
      const payload = {
        ...addressForm,
        phone: cleanPhoneNumber(addressForm.phone),
        userId,
      };

      const req = editingAddress
        ? api.put(`/vendor/addresses/${editingAddress._id}`, payload)
        : api.post('/vendor/addresses', payload);

      const { data } = await req;
      if (!data.success) throw new Error(data.message);

      setAddressMessage({
        type: 'success',
        text: editingAddress ? 'Address updated successfully!' : 'Address added successfully!',
      });

      setEditingAddress(null);
      setShowAddressForm(false);
      setAddressForm({
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

      await fetchAddresses(userId);

      if (!editingAddress && onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setAddressMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save address',
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    await api.delete(`/vendor/addresses/${id}`);
    fetchAddresses(userId);
  };

  const startEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({ ...address });
    setShowAddressForm(true);
    setAddressMessage(null);
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressMessage(null);
    setAddressForm({
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
  };

  /* =========================
     JSX
  ========================= */

  return (
    <div className="max-w-2xl mx-auto">
      {/* User Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <UserIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create New Customer</h2>
              <p className="text-purple-200 text-sm">Add customer details to create their account</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {userMessage && (
            <div className="mb-6">
              <Alert type={userMessage.type} onClose={() => setUserMessage(null)}>
                {userMessage.text}
              </Alert>
            </div>
          )}

          <form onSubmit={createUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Full Name"
                icon={<UserIcon />}
                required
                name="name"
                placeholder="Enter customer name"
                value={userForm.name}
                onChange={handleUserChange}
              />
              <InputField
                label="Phone Number"
                icon={<PhoneIcon />}
                required
                name="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={userForm.phone}
                onChange={handleUserChange}
              />
              <InputField
                label="Restaurant Name"
                icon={<BuildingIcon />}
                name="restaurantName"
                placeholder="Restaurant or business name"
                value={userForm.restaurantName}
                onChange={handleUserChange}
              />
              <InputField
                label="GST Number"
                icon={<DocumentIcon />}
                name="gstNumber"
                placeholder="e.g., 22AAAAA0000A1Z5"
                value={userForm.gstNumber}
                onChange={handleUserChange}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              {onCancel && (
                <Button variant="secondary" type="button" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" loading={userLoading}>
                {userLoading ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Address Section */}
      {userId && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Address Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <LocationIcon />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delivery Addresses</h3>
                <p className="text-sm text-gray-500">Manage customer delivery locations</p>
              </div>
            </div>
            {!showAddressForm && (
              <Button variant="primary" size="sm" onClick={() => setShowAddressForm(true)}>
                <PlusIcon />
                Add Address
              </Button>
            )}
          </div>

          <div className="p-6">
            {addressMessage && (
              <div className="mb-4">
                <Alert type={addressMessage.type} onClose={() => setAddressMessage(null)}>
                  {addressMessage.text}
                </Alert>
              </div>
            )}

            {/* Address List */}
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Loading addresses...</span>
                </div>
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-3 mb-4">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="group relative p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              Default
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full capitalize">
                            {addr.addressType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        {addr.landmark && (
                          <p className="text-sm text-gray-500 mt-1">Landmark: {addr.landmark}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <PhoneIcon />
                          {addr.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditAddress(addr)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr._id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !showAddressForm ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <LocationIcon />
                </div>
                <p className="text-gray-500 mb-4">No addresses added yet</p>
                <Button variant="primary" size="sm" onClick={() => setShowAddressForm(true)}>
                  <PlusIcon />
                  Add First Address
                </Button>
              </div>
            ) : null}

            {/* Address Form */}
            {showAddressForm && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  {editingAddress ? <EditIcon /> : <PlusIcon />}
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h4>

                <form onSubmit={saveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Contact Name"
                      required
                      name="name"
                      placeholder="Recipient name"
                      value={addressForm.name}
                      onChange={handleAddressChange}
                    />
                    <InputField
                      label="Contact Phone"
                      required
                      name="phone"
                      type="tel"
                      placeholder="Mobile number"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                    />
                  </div>

                  <InputField
                    label="Address Line 1"
                    required
                    name="addressLine1"
                    placeholder="Street address, building name"
                    value={addressForm.addressLine1}
                    onChange={handleAddressChange}
                  />

                  <InputField
                    label="Address Line 2"
                    name="addressLine2"
                    placeholder="Apartment, suite, floor (optional)"
                    value={addressForm.addressLine2}
                    onChange={handleAddressChange}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField
                      label="City"
                      required
                      name="city"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                    />
                    <InputField
                      label="State"
                      required
                      name="state"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                    />
                    <InputField
                      label="Pincode"
                      required
                      name="pincode"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={handleAddressChange}
                    />
                    <InputField
                      label="Landmark"
                      name="landmark"
                      placeholder="Nearby"
                      value={addressForm.landmark}
                      onChange={handleAddressChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Address Type</label>
                      <select
                        name="addressType"
                        value={addressForm.addressType}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleAddressChange}
                          className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">Set as default address</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-200">
                    <Button variant="secondary" type="button" onClick={cancelAddressForm}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={addressLoading}>
                      {addressLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UserForm;
