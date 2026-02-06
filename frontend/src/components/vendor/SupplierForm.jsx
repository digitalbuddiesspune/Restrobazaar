import { useState, useEffect } from 'react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const SupplierForm = ({ supplier, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        alternatePhone: supplier.alternatePhone || '',
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone fields, only allow digits and limit to 10
    if (name === 'phone' || name === 'alternatePhone') {
      const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: cleanedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Supplier name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      errors.phone = 'Phone number is required';
    } else if (cleanedPhone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits';
    } else if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      errors.phone = 'Enter a valid Indian mobile number (starting with 6, 7, 8, or 9)';
    }

    // Alternate phone validation (optional)
    if (formData.alternatePhone) {
      const cleanedAltPhone = formData.alternatePhone.replace(/\D/g, '');
      if (cleanedAltPhone.length > 0 && cleanedAltPhone.length !== 10) {
        errors.alternatePhone = 'Alternate phone must be 10 digits';
      } else if (cleanedAltPhone.length === 10 && !/^[6-9]\d{9}$/.test(cleanedAltPhone)) {
        errors.alternatePhone = 'Enter a valid Indian mobile number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
      const token = localStorage.getItem('token');
      
      // Prepare data for API
      const supplierData = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
      };
      
      // Add alternatePhone only if provided
      if (formData.alternatePhone && formData.alternatePhone.trim()) {
        supplierData.alternatePhone = formData.alternatePhone.replace(/\D/g, '');
      }

      const url = supplier 
        ? `${baseUrl}/vendor/suppliers/${supplier._id}`
        : `${baseUrl}/vendor/suppliers`;
      
      const method = supplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to save supplier');
        return;
      }
      
      if (data.success) {
        setSuccess(supplier ? 'Supplier updated successfully!' : 'Supplier created successfully!');
        
        // Reset form if creating new
        if (!supplier) {
          setFormData({
            name: '',
            phone: '',
            alternatePhone: '',
          });
          setFormErrors({});
        }
        
        // Call onSuccess callback after delay
        setTimeout(() => {
          if (onSuccess) onSuccess(data.data);
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Failed to save supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-900">
          {supplier ? 'Edit Supplier' : 'Add New Supplier'}
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {supplier ? 'Update supplier information' : 'Add a new supplier to your list'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Input */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter supplier name"
            />
            {formErrors.name && (
              <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter 10-digit phone number"
              maxLength={10}
            />
            {formErrors.phone && (
              <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
            )}
          </div>

          {/* Alternate Phone Input */}
          <div>
            <label htmlFor="alternatePhone" className="block text-xs font-medium text-gray-700 mb-1">
              Alternate Phone <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="alternatePhone"
              name="alternatePhone"
              type="tel"
              value={formData.alternatePhone}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                formErrors.alternatePhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter alternate phone (optional)"
              maxLength={10}
            />
            {formErrors.alternatePhone && (
              <p className="text-xs text-red-600 mt-1">{formErrors.alternatePhone}</p>
            )}
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
            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
