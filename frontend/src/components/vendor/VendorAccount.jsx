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
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendor Account</h1>
            <p className="text-xs text-gray-500 mt-1">View and manage your account details</p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                vendor.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {vendor.isActive ? 'Active' : 'Inactive'}
            </span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                vendor.isApproved
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {vendor.isApproved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Business Name</label>
              <p className="text-sm text-gray-900 mt-1">{vendor.businessName || 'N/A'}</p>
            </div>
            {vendor.legalName && (
              <div>
                <label className="text-xs font-medium text-gray-500">Legal Name</label>
                <p className="text-sm text-gray-900 mt-1">{vendor.legalName}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500">Vendor Type</label>
              <p className="text-sm text-gray-900 mt-1 capitalize">{vendor.vendorType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <p className="text-sm text-gray-900 mt-1">{vendor.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <p className="text-sm text-gray-900 mt-1">{vendor.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Contact Person */}
        {vendor.contactPerson && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Person</h2>
            <div className="space-y-3">
              {vendor.contactPerson.name && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.contactPerson.name}</p>
                </div>
              )}
              {vendor.contactPerson.phone && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.contactPerson.phone}</p>
                </div>
              )}
              {vendor.contactPerson.email && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.contactPerson.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        {vendor.address && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
            <div className="space-y-2">
              {vendor.address.line1 && (
                <p className="text-sm text-gray-900">{vendor.address.line1}</p>
              )}
              {vendor.address.line2 && (
                <p className="text-sm text-gray-900">{vendor.address.line2}</p>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-900">
                {vendor.address.city && <span>{vendor.address.city}</span>}
                {vendor.address.state && <span>, {vendor.address.state}</span>}
                {vendor.address.pincode && <span>- {vendor.address.pincode}</span>}
              </div>
            </div>
          </div>
        )}

        {/* KYC & Tax Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">KYC & Tax Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500">KYC Status</label>
              <div className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-4 font-semibold rounded-full ${getKycStatusColor(
                    vendor.kycStatus
                  )}`}
                >
                  {vendor.kycStatus || 'pending'}
                </span>
              </div>
            </div>
            {vendor.gstNumber && (
              <div>
                <label className="text-xs font-medium text-gray-500">GST Number</label>
                <p className="text-sm text-gray-900 mt-1">{vendor.gstNumber}</p>
              </div>
            )}
            {vendor.panNumber && (
              <div>
                <label className="text-xs font-medium text-gray-500">PAN Number</label>
                <p className="text-sm text-gray-900 mt-1">{vendor.panNumber}</p>
              </div>
            )}
            {vendor.kycDocuments && vendor.kycDocuments.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">KYC Documents</label>
                <div className="mt-1 space-y-1">
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
                          View Document
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
        </div>

        {/* Service Cities */}
        {vendor.serviceCities && vendor.serviceCities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Cities</h2>
            <div className="flex flex-wrap gap-2">
              {vendor.serviceCities.map((city, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {city.name || city}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bank Details */}
        {vendor.bankDetails && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h2>
            <div className="space-y-3">
              {vendor.bankDetails.accountHolderName && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Account Holder Name</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.bankDetails.accountHolderName}</p>
                </div>
              )}
              {vendor.bankDetails.accountNumber && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Account Number</label>
                  <p className="text-sm text-gray-900 mt-1">
                    ****{vendor.bankDetails.accountNumber.slice(-4)}
                  </p>
                </div>
              )}
              {vendor.bankDetails.ifsc && (
                <div>
                  <label className="text-xs font-medium text-gray-500">IFSC Code</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.bankDetails.ifsc}</p>
                </div>
              )}
              {vendor.bankDetails.bankName && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Bank Name</label>
                  <p className="text-sm text-gray-900 mt-1">{vendor.bankDetails.bankName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commission & Account Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          <div className="space-y-3">
            {vendor.commissionPercentage !== undefined && (
              <div>
                <label className="text-xs font-medium text-gray-500">Commission Percentage</label>
                <p className="text-sm text-gray-900 mt-1">{vendor.commissionPercentage}%</p>
              </div>
            )}
            {vendor.approvedAt && (
              <div>
                <label className="text-xs font-medium text-gray-500">Approved On</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(vendor.approvedAt)}</p>
              </div>
            )}
            {vendor.approvedBy && (
              <div>
                <label className="text-xs font-medium text-gray-500">Approved By</label>
                <p className="text-sm text-gray-900 mt-1">
                  {vendor.approvedBy?.name || vendor.approvedBy?.email || 'Admin'}
                </p>
              </div>
            )}
            {vendor.lastLoginAt && (
              <div>
                <label className="text-xs font-medium text-gray-500">Last Login</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(vendor.lastLoginAt)}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500">Account Created</label>
              <p className="text-sm text-gray-900 mt-1">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAccount;

