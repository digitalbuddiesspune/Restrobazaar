import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VendorAdminDashboard = () => {
  const baseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    approvedVendors: 0,
    pendingKyc: 0,
  });

  // Data lists
  const [vendors, setVendors] = useState([]);
  const [cities, setCities] = useState([]);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    businessName: "",
    legalName: "",
    email: "",
    phone: "",
    password: "",
    vendorType: "shop",
    contactPerson: {
      name: "",
      phone: "",
      email: "",
    },
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
    gstNumber: "",
    panNumber: "",
    kycStatus: "pending",
    kycDocuments: [],
    serviceCities: [],
    commissionPercentage: 0,
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
    },
    isActive: true,
    isApproved: false,
  });

  // Get auth token
  const getToken = () => localStorage.getItem("token");

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate("/vendor/login");
        return;
      }

      const vendorsRes = await axios.get(`${baseUrl}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const vendorsData = vendorsRes.data?.data || [];
      const totalVendors = vendorsData.length;
      const activeVendors = vendorsData.filter((v) => v.isActive).length;
      const approvedVendors = vendorsData.filter((v) => v.isApproved).length;
      const pendingKyc = vendorsData.filter(
        (v) => v.kycStatus === "pending"
      ).length;

      setStats({
        totalVendors,
        activeVendors,
        approvedVendors,
        pendingKyc,
      });
    } catch (err) {
      setError("Failed to fetch statistics");
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const token = getToken();
      const params = {};
      if (searchQuery) {
        params.search = searchQuery;
      }
      const res = await axios.get(`${baseUrl}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setVendors(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch vendors");
    }
  };

  // Fetch cities
  const fetchCities = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCities(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch cities");
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === "vendors") fetchVendors();
    if (activeTab === "add-vendor") fetchCities();
  }, [activeTab]);

  // Handle edit vendor
  const handleEdit = async (vendorId) => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const vendor = res.data?.data;
      if (vendor) {
        setVendorForm({
          businessName: vendor.businessName || "",
          legalName: vendor.legalName || "",
          email: vendor.email || "",
          phone: vendor.phone || "",
          password: "", // Don't populate password
          vendorType: vendor.vendorType || "shop",
          contactPerson: vendor.contactPerson || {
            name: "",
            phone: "",
            email: "",
          },
          address: vendor.address || {
            line1: "",
            line2: "",
            city: "",
            state: "",
            pincode: "",
          },
          gstNumber: vendor.gstNumber || "",
          panNumber: vendor.panNumber || "",
          kycStatus: vendor.kycStatus || "pending",
          kycDocuments: vendor.kycDocuments || [],
          serviceCities:
            vendor.serviceCities?.map((city) =>
              typeof city === "object" ? city._id : city
            ) || [],
          commissionPercentage: vendor.commissionPercentage || 0,
          bankDetails: vendor.bankDetails || {
            accountHolderName: "",
            accountNumber: "",
            ifsc: "",
            bankName: "",
          },
          isActive: vendor.isActive !== undefined ? vendor.isActive : true,
          isApproved: vendor.isApproved !== undefined ? vendor.isApproved : false,
        });
        setEditingVendorId(vendorId);
        setActiveTab("add-vendor");
        setError("");
        setSuccess("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vendor for editing");
    }
  };

  // Handle form submission
  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token || token.trim() === "") {
        setError("Authentication required. Please login again.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
        setLoading(false);
        return;
      }

      const formData = { ...vendorForm };
      
      // Remove password if editing and password is empty
      if (editingVendorId && !formData.password) {
        delete formData.password;
      }

      let res;
      if (editingVendorId) {
        // Update vendor
        res = await axios.put(
          `${baseUrl}/vendors/${editingVendorId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess("Vendor updated successfully!");
      } else {
        // Create vendor
        if (!formData.password) {
          setError("Password is required for new vendors");
          setLoading(false);
          return;
        }
        res = await axios.post(`${baseUrl}/vendors`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Vendor created successfully!");
      }

      // Reset form
      setVendorForm({
        businessName: "",
        legalName: "",
        email: "",
        phone: "",
        password: "",
        vendorType: "shop",
        contactPerson: {
          name: "",
          phone: "",
          email: "",
        },
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          pincode: "",
        },
        gstNumber: "",
        panNumber: "",
        kycStatus: "pending",
        kycDocuments: [],
        serviceCities: [],
        commissionPercentage: 0,
        bankDetails: {
          accountHolderName: "",
          accountNumber: "",
          ifsc: "",
          bankName: "",
        },
        isActive: true,
        isApproved: false,
      });
      setEditingVendorId(null);
      setActiveTab("vendors");
      fetchVendors();
      fetchStats();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save vendor. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete vendor
  const handleDelete = async (vendorId) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${baseUrl}/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Vendor deleted successfully!");
      fetchVendors();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete vendor");
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (vendorId) => {
    try {
      const token = getToken();
      await axios.patch(
        `${baseUrl}/vendors/${vendorId}/toggle-active`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Vendor status updated successfully!");
      fetchVendors();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update vendor status");
    }
  };

  // Handle approval
  const handleApproval = async (vendorId, isApproved) => {
    try {
      const token = getToken();
      await axios.put(
        `${baseUrl}/vendors/${vendorId}/approval`,
        { isApproved },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(`Vendor ${isApproved ? "approved" : "rejected"} successfully!`);
      fetchVendors();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update approval status");
    }
  };

  // Handle KYC status update
  const handleKycStatus = async (vendorId, kycStatus) => {
    try {
      const token = getToken();
      await axios.put(
        `${baseUrl}/vendors/${vendorId}/kyc-status`,
        { kycStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess(`Vendor KYC status updated to ${kycStatus}!`);
      fetchVendors();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update KYC status");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/vendor/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Vendor Admin Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: "overview", label: "Overview" },
                { id: "vendors", label: "All Vendors" },
                { id: "add-vendor", label: editingVendorId ? "Edit Vendor" : "Add Vendor" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setSuccess("");
                    if (tab.id !== "add-vendor") {
                      setEditingVendorId(null);
                    }
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalVendors}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeVendors}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Approved Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.approvedVendors}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg
                    className="w-8 h-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending KYC</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingKyc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Vendors Tab */}
        {activeTab === "vendors" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">All Vendors</h2>
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      fetchVendors();
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KYC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No vendors found
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.businessName}
                          </div>
                          {vendor.legalName && (
                            <div className="text-sm text-gray-500">
                              {vendor.legalName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vendor.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vendor.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {vendor.vendorType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vendor.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vendor.isActive ? "Active" : "Inactive"}
                          </span>
                          <br />
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1 ${
                              vendor.isApproved
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {vendor.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vendor.kycStatus === "verified"
                                ? "bg-green-100 text-green-800"
                                : vendor.kycStatus === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {vendor.kycStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(vendor._id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(vendor._id)}
                              className={`${
                                vendor.isActive
                                  ? "text-orange-600 hover:text-orange-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                            >
                              {vendor.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() =>
                                handleApproval(vendor._id, !vendor.isApproved)
                              }
                              className={`${
                                vendor.isApproved
                                  ? "text-red-600 hover:text-red-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                            >
                              {vendor.isApproved ? "Reject" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleDelete(vendor._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <select
                              value={vendor.kycStatus}
                              onChange={(e) =>
                                handleKycStatus(vendor._id, e.target.value)
                              }
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Vendor Tab */}
        {activeTab === "add-vendor" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">
              {editingVendorId ? "Edit Vendor" : "Add New Vendor"}
            </h2>
            <form onSubmit={handleVendorSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-200 pb-6">
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
                        setVendorForm({ ...vendorForm, businessName: e.target.value })
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
                        setVendorForm({ ...vendorForm, legalName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
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
                  {!editingVendorId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required={!editingVendorId}
                        value={vendorForm.password}
                        onChange={(e) =>
                          setVendorForm({ ...vendorForm, password: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Type
                    </label>
                    <select
                      value={vendorForm.vendorType}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, vendorType: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="individual">Individual</option>
                      <option value="shop">Shop</option>
                      <option value="wholesaler">Wholesaler</option>
                      <option value="manufacturer">Manufacturer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="border-b border-gray-200 pb-6">
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
              <div className="border-b border-gray-200 pb-6">
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
                          address: { ...vendorForm.address, line1: e.target.value },
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
                          address: { ...vendorForm.address, line2: e.target.value },
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
                          address: { ...vendorForm.address, city: e.target.value },
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
                          address: { ...vendorForm.address, state: e.target.value },
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
                          address: { ...vendorForm.address, pincode: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & KYC */}
              <div className="border-b border-gray-200 pb-6">
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
                        setVendorForm({ ...vendorForm, gstNumber: e.target.value })
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
                        setVendorForm({ ...vendorForm, panNumber: e.target.value })
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
                        setVendorForm({ ...vendorForm, kycStatus: e.target.value })
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
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Service Cities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cities.map((city) => (
                    <label key={city._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={vendorForm.serviceCities.includes(city._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVendorForm({
                              ...vendorForm,
                              serviceCities: [...vendorForm.serviceCities, city._id],
                            });
                          } else {
                            setVendorForm({
                              ...vendorForm,
                              serviceCities: vendorForm.serviceCities.filter(
                                (id) => id !== city._id
                              ),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{city.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Commission */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Commission</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vendorForm.commissionPercentage}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        commissionPercentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-b border-gray-200 pb-6">
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

              {/* Status */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold mb-4">Status</h3>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={vendorForm.isActive}
                      onChange={(e) =>
                        setVendorForm({ ...vendorForm, isActive: e.target.checked })
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

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("vendors");
                    setEditingVendorId(null);
                    setVendorForm({
                      businessName: "",
                      legalName: "",
                      email: "",
                      phone: "",
                      password: "",
                      vendorType: "shop",
                      contactPerson: {
                        name: "",
                        phone: "",
                        email: "",
                      },
                      address: {
                        line1: "",
                        line2: "",
                        city: "",
                        state: "",
                        pincode: "",
                      },
                      gstNumber: "",
                      panNumber: "",
                      kycStatus: "pending",
                      kycDocuments: [],
                      serviceCities: [],
                      commissionPercentage: 0,
                      bankDetails: {
                        accountHolderName: "",
                        accountNumber: "",
                        ifsc: "",
                        bankName: "",
                      },
                      isActive: true,
                      isApproved: false,
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Saving..."
                    : editingVendorId
                    ? "Update Vendor"
                    : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorAdminDashboard;

