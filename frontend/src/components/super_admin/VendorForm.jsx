const VendorForm = ({
  vendorForm,
  setVendorForm,
  cities,
  handleVendorSubmit,
  loading,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Add New Vendor</h2>
      <form onSubmit={handleVendorSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={vendorForm.businessName}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    businessName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Name
              </label>
              <input
                type="text"
                value={vendorForm.legalName}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    legalName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Type
              </label>
              <select
                value={vendorForm.vendorType}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    vendorType: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="individual">Individual</option>
                <option value="shop">Shop</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="manufacturer">Manufacturer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Percentage
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vendorForm.commissionPercentage}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    commissionPercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Authentication</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={vendorForm.email}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={vendorForm.phone}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={vendorForm.password}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    password: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Contact Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={vendorForm.contactPerson.name}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    contactPerson: {
                      ...vendorForm.contactPerson,
                      name: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={vendorForm.contactPerson.phone}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    contactPerson: {
                      ...vendorForm.contactPerson,
                      phone: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={vendorForm.contactPerson.email}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    contactPerson: {
                      ...vendorForm.contactPerson,
                      email: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={vendorForm.address.line1}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: {
                      ...vendorForm.address,
                      line1: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={vendorForm.address.line2}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: {
                      ...vendorForm.address,
                      line2: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={vendorForm.address.city}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: {
                      ...vendorForm.address,
                      city: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={vendorForm.address.state}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: {
                      ...vendorForm.address,
                      state: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={vendorForm.address.pincode}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    address: {
                      ...vendorForm.address,
                      pincode: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tax & KYC */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Tax & KYC</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={vendorForm.gstNumber}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    gstNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={vendorForm.panNumber}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    panNumber: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KYC Status
              </label>
              <select
                value={vendorForm.kycStatus}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    kycStatus: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Service Cities */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Service Cities</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Service Cities
            </label>
            <select
              multiple
              value={vendorForm.serviceCities}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                setVendorForm({ ...vendorForm, serviceCities: selected });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
              size="5"
            >
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.displayName || city.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple cities
            </p>
          </div>
        </div>

        {/* Bank Details */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={vendorForm.bankDetails.accountHolderName}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    bankDetails: {
                      ...vendorForm.bankDetails,
                      accountHolderName: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={vendorForm.bankDetails.accountNumber}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    bankDetails: {
                      ...vendorForm.bankDetails,
                      accountNumber: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={vendorForm.bankDetails.ifsc}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    bankDetails: {
                      ...vendorForm.bankDetails,
                      ifsc: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={vendorForm.bankDetails.bankName}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    bankDetails: {
                      ...vendorForm.bankDetails,
                      bankName: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Status Flags */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Status Flags</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={vendorForm.isActive}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    isActive: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={vendorForm.isApproved}
                onChange={(e) =>
                  setVendorForm({
                    ...vendorForm,
                    isApproved: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Approved</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Vendor"}
        </button>
      </form>
    </div>
  );
};

export default VendorForm;


