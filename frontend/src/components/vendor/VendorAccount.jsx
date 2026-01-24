import { useVendorProfile } from '../../hooks/useVendorQueries';

const VendorAccount = () => {
  const { data: profileData, isLoading, error } = useVendorProfile();
  const vendor = profileData?.data;

  const getKycStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <p className="text-sm text-red-600">
            {error?.response?.data?.message || 'Failed to load vendor profile'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Note: Vendor profile endpoint may need to be created in the backend
          </p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No vendor profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Single Card Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Vendor Account</h1>
            <p className="text-xs text-gray-500 mt-0.5">View and manage your account details</p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                vendor.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {vendor.isActive ? 'Active' : 'Inactive'}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                vendor.isApproved
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {vendor.isApproved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        </div>

        {/* Row Layout - All Information */}
        <div className="space-y-3">
          {/* Business Information Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">Business Name</label>
              <p className="text-xs text-gray-900">{vendor.businessName || 'N/A'}</p>
            </div>
            {vendor.legalName && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Legal Name</label>
                <p className="text-xs text-gray-900">{vendor.legalName}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">Vendor Type</label>
              <p className="text-xs text-gray-900 capitalize">{vendor.vendorType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">Email</label>
              <p className="text-xs text-gray-900">{vendor.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">Phone</label>
              <p className="text-xs text-gray-900">{vendor.phone || 'N/A'}</p>
            </div>
          </div>

          {/* Contact Person Row */}
          {vendor.contactPerson && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Contact Person</label>
                <p className="text-xs text-gray-900">{vendor.contactPerson.name || 'N/A'}</p>
              </div>
              {vendor.contactPerson.phone && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Contact Phone</label>
                  <p className="text-xs text-gray-900">{vendor.contactPerson.phone}</p>
                </div>
              )}
              {vendor.contactPerson.email && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Contact Email</label>
                  <p className="text-xs text-gray-900">{vendor.contactPerson.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Address Row */}
          {vendor.address && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-gray-100">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Address Line 1</label>
                <p className="text-xs text-gray-900">{vendor.address.line1 || 'N/A'}</p>
              </div>
              {vendor.address.line2 && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Address Line 2</label>
                  <p className="text-xs text-gray-900">{vendor.address.line2}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">City</label>
                <p className="text-xs text-gray-900">{vendor.address.city || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">State</label>
                <p className="text-xs text-gray-900">{vendor.address.state || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Pincode</label>
                <p className="text-xs text-gray-900">{vendor.address.pincode || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* KYC & Tax Information Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">KYC Status</label>
              <span
                className={`px-1.5 py-0.5 inline-flex text-xs leading-3 font-semibold rounded-full ${getKycStatusColor(
                  vendor.kycStatus
                )}`}
              >
                {vendor.kycStatus || 'pending'}
              </span>
            </div>
            {vendor.gstNumber && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">GST Number</label>
                <p className="text-xs text-gray-900">{vendor.gstNumber}</p>
              </div>
            )}
            {vendor.panNumber && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">PAN Number</label>
                <p className="text-xs text-gray-900">{vendor.panNumber}</p>
              </div>
            )}
            {vendor.kycDocuments && vendor.kycDocuments.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-0.5">KYC Documents</label>
                <div className="space-y-0.5">
                  {vendor.kycDocuments.map((doc, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-gray-600 capitalize">{doc.type}: </span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Service Cities Row */}
          {vendor.serviceCities && vendor.serviceCities.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 block mb-1">Service Cities</label>
              <div className="flex flex-wrap gap-1.5">
                {vendor.serviceCities.map((city, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {city.name || city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bank Details Row */}
          {vendor.bankDetails && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-gray-100">
              {vendor.bankDetails.accountHolderName && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Account Holder</label>
                  <p className="text-xs text-gray-900">{vendor.bankDetails.accountHolderName}</p>
                </div>
              )}
              {vendor.bankDetails.accountNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Account Number</label>
                  <p className="text-xs text-gray-900">
                    ****{vendor.bankDetails.accountNumber.slice(-4)}
                  </p>
                </div>
              )}
              {vendor.bankDetails.ifsc && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">IFSC Code</label>
                  <p className="text-xs text-gray-900">{vendor.bankDetails.ifsc}</p>
                </div>
              )}
              {vendor.bankDetails.bankName && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-0.5">Bank Name</label>
                  <p className="text-xs text-gray-900">{vendor.bankDetails.bankName}</p>
                </div>
              )}
            </div>
          )}

          {/* Account Details Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-2 border-t border-gray-100">
            {vendor.commissionPercentage !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Commission %</label>
                <p className="text-xs text-gray-900">{vendor.commissionPercentage}%</p>
              </div>
            )}
            {vendor.approvedAt && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Approved On</label>
                <p className="text-xs text-gray-900">{formatDate(vendor.approvedAt)}</p>
              </div>
            )}
            {vendor.approvedBy && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Approved By</label>
                <p className="text-xs text-gray-900">
                  {vendor.approvedBy?.name || vendor.approvedBy?.email || 'Admin'}
                </p>
              </div>
            )}
            {vendor.lastLoginAt && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-0.5">Last Login</label>
                <p className="text-xs text-gray-900">{formatDate(vendor.lastLoginAt)}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-0.5">Account Created</label>
              <p className="text-xs text-gray-900">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAccount;

