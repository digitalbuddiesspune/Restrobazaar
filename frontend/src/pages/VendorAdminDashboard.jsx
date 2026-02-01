import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useMyVendorProducts, useGlobalProducts, useCities } from "../hooks/useApiQueries";

const VendorAdminDashboard = () => {
  const baseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const [myProductsPage, setMyProductsPage] = useState(1);
  const itemsPerPage = 10; // Show 10 products per page

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStock: 0,
    totalStock: 0,
  });

  // Data lists
  const [vendorInfo, setVendorInfo] = useState(null);

  // React Query hooks - fetch data on component render
  const { 
    data: vendorProductsData, 
    isLoading: vendorProductsLoading, 
    error: vendorProductsError,
    refetch: refetchVendorProducts 
  } = useMyVendorProducts(
    { limit: 1000 },
    { enabled: true } // Always fetch on mount
  );
  const vendorProducts = vendorProductsData?.data || [];

  const { 
    data: globalProductsData, 
    isLoading: globalProductsLoading, 
    error: globalProductsError,
    refetch: refetchGlobalProducts 
  } = useGlobalProducts(
    { status: "true", limit: 1000 },
    { enabled: true } // Always fetch on mount
  );
  const globalProducts = globalProductsData?.data || [];

  const { 
    data: citiesData, 
    isLoading: citiesLoading,
    error: citiesError 
  } = useCities({}, { enabled: true });
  const cities = citiesData?.data || [];

  // Handle React Query errors
  useEffect(() => {
    if (vendorProductsError) {
      const errorMessage = vendorProductsError?.response?.data?.message || "Failed to fetch vendor products";
      if (errorMessage.includes("Authentication") || vendorProductsError?.response?.status === 401) {
        navigate("/vendor/login");
      } else {
        setError(errorMessage);
      }
    }
  }, [vendorProductsError, navigate]);

  useEffect(() => {
    if (globalProductsError) {
      setError(globalProductsError?.response?.data?.message || "Failed to fetch product catalog");
    }
  }, [globalProductsError]);

  // Form states
  const [productForm, setProductForm] = useState({
    productId: "",
    cityId: "",
    priceType: "single",
    defaultPrice: 0,
    sequenceNumber: 0,
    productPurchasedFrom: "",
    purchasedMode: "",
    purchasedAmount: "",
    gst: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    pricing: {
      single: {
        price: "",
      },
      bulk: [],
    },
    availableStock: 0,
    minimumOrderQuantity: 1,
    notifyQuantity: "",
    status: true,
  });

  // Get auth token
  const getToken = () => localStorage.getItem("token");

  // Get vendor ID from token (we'll decode it or get from API)
  const getVendorId = async () => {
    try {
      const token = getToken();
      if (!token) return null;
      // We'll get vendor info from an endpoint or decode token
      // For now, we'll use the my-products endpoint which uses req.user
      return null; // Will be handled by backend
    } catch (err) {
      return null;
    }
  };

  // Fetch vendor info and get vendor's primary city
  const fetchVendorInfo = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      // Try to get vendor info from vendor products (use the city from first product)
      // Or we can create a vendor profile endpoint later
      if (vendorProducts.length > 0) {
        const firstProduct = vendorProducts[0];
        const vendorCityId = firstProduct.cityId?._id || firstProduct.cityId;
        if (vendorCityId) {
          setVendorInfo({ cityId: vendorCityId });
          // Auto-set city in form if not already set
          if (!productForm.cityId && activeTab === "add-product") {
            setProductForm(prev => ({
              ...prev,
              cityId: vendorCityId,
            }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch vendor info");
    }
  };

  // Stats are now calculated from vendorProducts data in useEffect above

  // Note: Data fetching is now handled by React Query hooks above
  // These functions are kept for refetching after mutations
  const fetchVendorProducts = () => {
    refetchVendorProducts();
  };

  const fetchGlobalProducts = () => {
    refetchGlobalProducts();
  };

  // Fetch stats when vendor products data changes
  useEffect(() => {
    if (vendorProducts.length > 0 || !vendorProductsLoading) {
      const products = vendorProducts;
      const totalProducts = products.length;
      const activeProducts = products.filter((p) => p.status).length;
      const lowStock = products.filter(
        (p) => p.notifyQuantity && p.availableStock <= p.notifyQuantity
      ).length;
      const totalStock = products.reduce(
        (sum, p) => sum + (p.availableStock || 0),
        0
      );

      setStats({
        totalProducts,
        activeProducts,
        lowStock,
        totalStock,
      });
    }
  }, [vendorProducts, vendorProductsLoading]);

  // Update vendor info when vendor products are loaded
  useEffect(() => {
    if (vendorProducts.length > 0 && !vendorInfo) {
      const firstProduct = vendorProducts[0];
      const vendorCityId = firstProduct.cityId?._id || firstProduct.cityId;
      if (vendorCityId) {
        setVendorInfo({ cityId: vendorCityId });
      }
    }
  }, [vendorProducts, vendorInfo]);

  // Auto-set city when switching to add-product tab or when vendorInfo becomes available
  useEffect(() => {
    if (activeTab === "add-product" && vendorInfo?.cityId && !productForm.cityId) {
      setProductForm(prev => ({
        ...prev,
        cityId: vendorInfo.cityId,
      }));
    }
  }, [activeTab, vendorInfo, productForm.cityId]);

  // Handle edit product
  const handleEdit = (product) => {
    // Use vendor's city if available, otherwise fall back to product's city
    const cityId = vendorInfo?.cityId || product.cityId._id || product.cityId;
    setProductForm({
      productId: product.productId._id || product.productId,
      cityId: cityId,
      priceType: product.priceType,
      defaultPrice: product.defaultPrice || 0,
      sequenceNumber: product.sequenceNumber || 0,
      productPurchasedFrom: product.productPurchasedFrom || "",
      purchasedMode: product.purchasedMode || "",
      purchasedAmount: product.purchasedAmount || "",
      gst: product.gst || 0,
      cgst: product.cgst || 0,
      sgst: product.sgst || 0,
      igst: product.igst || 0,
      pricing: product.pricing || {
        single: { price: "" },
        bulk: [],
      },
      availableStock: product.availableStock || 0,
      minimumOrderQuantity: product.minimumOrderQuantity || 1,
      notifyQuantity: product.notifyQuantity || "",
      status: product.status !== undefined ? product.status : true,
    });
    setEditingProductId(product._id);
    setActiveTab("add-product");
    setError("");
    setSuccess("");
  };

  // Handle form submission
  const handleProductSubmit = async (e) => {
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

      // Prepare pricing data
      let pricingData = {};
      if (productForm.priceType === "single") {
        pricingData = {
          single: {
            price: parseFloat(productForm.pricing.single.price) || 0,
          },
        };
      } else {
        // Validate and convert bulk price slabs
        const validSlabs = productForm.pricing.bulk.filter(
          (slab) => slab.minQty && slab.price
        );

        if (validSlabs.length === 0) {
          setError("At least one bulk price slab is required");
          setLoading(false);
          return;
        }

        const bulkSlabs = validSlabs.map((slab) => {
          const minQty = parseFloat(slab.minQty);
          const price = parseFloat(slab.price);

          // Validate values are valid numbers
          if (isNaN(minQty) || isNaN(price)) {
            return null;
          }

          // Validate minQty is positive
          if (minQty <= 0 || price < 0) {
            return null;
          }

          return {
            minQty: minQty,
            price: price,
          };
        }).filter((slab) => slab !== null);

        if (bulkSlabs.length === 0) {
          setError(
            "Invalid bulk price slabs: Please provide valid quantity and price"
          );
          setLoading(false);
          return;
        }

        // Sort slabs by minQty in ascending order
        bulkSlabs.sort((a, b) => a.minQty - b.minQty);

        pricingData = {
          bulk: bulkSlabs,
        };
      }

      const formData = {
        productId: productForm.productId,
        cityId: vendorInfo?.cityId || productForm.cityId,
        priceType: productForm.priceType,
        defaultPrice: parseFloat(productForm.defaultPrice) || 0,
        sequenceNumber: parseFloat(productForm.sequenceNumber) || 0,
        productPurchasedFrom: productForm.productPurchasedFrom || undefined,
        purchasedMode: productForm.purchasedMode || undefined,
        purchasedAmount: productForm.purchasedAmount || undefined,
        gst: parseFloat(productForm.gst) || 0,
        cgst: parseFloat(productForm.cgst) || 0,
        sgst: parseFloat(productForm.sgst) || 0,
        igst: parseFloat(productForm.igst) || 0,
        pricing: pricingData,
        availableStock: parseFloat(productForm.availableStock) || 0,
        minimumOrderQuantity:
          parseFloat(productForm.minimumOrderQuantity) || 1,
        notifyQuantity: productForm.notifyQuantity
          ? parseFloat(productForm.notifyQuantity)
          : undefined,
        status: productForm.status,
      };

      let res;
      if (editingProductId) {
        // Update product
        res = await axios.put(
          `${baseUrl}/vendor-products/${editingProductId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess("Product updated successfully!");
      } else {
        // Create product (vendorId will be set automatically by backend)
        res = await axios.post(`${baseUrl}/vendor-products`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Product added successfully!");
      }

      // Reset form
      setProductForm({
        productId: "",
        cityId: vendorInfo?.cityId || "",
        priceType: "single",
        defaultPrice: 0,
        sequenceNumber: 0,
        productPurchasedFrom: "",
        purchasedMode: "",
        purchasedAmount: "",
        gst: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        pricing: {
          single: {
            price: "",
          },
          bulk: [],
        },
        availableStock: 0,
        minimumOrderQuantity: 1,
        notifyQuantity: "",
        status: true,
      });
      setEditingProductId(null);
      setActiveTab("my-products");
      fetchVendorProducts(); // This will refetch and update stats automatically
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${baseUrl}/vendor-products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Product deleted successfully!");
      fetchVendorProducts(); // This will refetch and update stats automatically
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (productId) => {
    try {
      const token = getToken();
      await axios.patch(
        `${baseUrl}/vendor-products/${productId}/status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Product status updated successfully!");
      fetchVendorProducts(); // This will refetch and update stats automatically
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product status");
    }
  };

  // Add bulk price slab
  const addBulkPriceSlab = () => {
    setProductForm({
      ...productForm,
      pricing: {
        ...productForm.pricing,
        bulk: [
          ...productForm.pricing.bulk,
          { minQty: "", price: "" },
        ],
      },
    });
  };

  // Remove bulk price slab
  const removeBulkPriceSlab = (index) => {
    const newBulk = productForm.pricing.bulk.filter((_, i) => i !== index);
    setProductForm({
      ...productForm,
      pricing: {
        ...productForm.pricing,
        bulk: newBulk,
      },
    });
  };

  // Update bulk price slab
  const updateBulkPriceSlab = (index, field, value) => {
    const newBulk = [...productForm.pricing.bulk];
    newBulk[index] = {
      ...newBulk[index],
      [field]: value,
    };
    setProductForm({
      ...productForm,
      pricing: {
        ...productForm.pricing,
        bulk: newBulk,
      },
    });
  };

  // Pagination helper functions
  const getPaginatedData = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data, itemsPerPage) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  // Check if a product is already in vendor's product list
  const isProductInVendorList = (productId) => {
    return vendorProducts.some((vendorProduct) => {
      const vendorProductId = vendorProduct.productId?._id || vendorProduct.productId;
      return vendorProductId === productId;
    });
  };

  // Reset pagination when search query changes
  useEffect(() => {
    setCatalogPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setMyProductsPage(1);
  }, [searchQuery]);

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
              Vendor Dashboard
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
                { id: "product-catalog", label: "Product Catalog" },
                { id: "my-products", label: "My Products" },
                {
                  id: "add-product",
                  label: editingProductId ? "Edit Product" : "Add Product",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setSuccess("");
                    if (tab.id !== "add-product") {
                      setEditingProductId(null);
                    }
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-orange-600 text-orange-600"
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalProducts}
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
                  <p className="text-sm text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.activeProducts}
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.lowStock}
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalStock}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Catalog Tab */}
        {activeTab === "product-catalog" && (() => {
          const filteredProducts = globalProducts.filter((product) => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return (
              product.productName
                ?.toLowerCase()
                .includes(searchLower) ||
              product.shortDescription
                ?.toLowerCase()
                .includes(searchLower) ||
              product.searchTags?.some((tag) =>
                tag.toLowerCase().includes(searchLower)
              )
            );
          });
          const totalPages = getTotalPages(filteredProducts, itemsPerPage);
          const paginatedProducts = getPaginatedData(filteredProducts, catalogPage, itemsPerPage);
          
          return (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Product Catalog
                </h2>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                      <tr key={product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.img || (product.images && product.images[0]?.url) ? (
                            <img
                              src={product.img || product.images[0].url}
                              alt={product.images?.[0]?.alt || product.productName}
                              className="h-12 w-12 object-contain p-1 bg-white rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                              <svg
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.productName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {product.category?.name || "N/A"}
                          </div>
                          {product.subCategory && (
                            <div className="text-xs text-gray-400">
                              {product.subCategory}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.unit || "piece"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isProductInVendorList(product._id) ? (
                            <span className="text-gray-400 font-medium cursor-not-allowed">
                              Already Added
                            </span>
                          ) : (
                            <button
                            onClick={() => {
                              const defaultCityId = vendorInfo?.cityId || "";
                              setProductForm({
                                productId: product._id,
                                cityId: defaultCityId,
                                priceType: "single",
                                sequenceNumber: 0,
                                pricing: {
                                  single: {
                                    price: "",
                                  },
                                  bulk: [],
                                },
                                availableStock: 0,
                                minimumOrderQuantity: 1,
                                notifyQuantity: "",
                                status: true,
                              });
                              setEditingProductId(null);
                              setActiveTab("add-product");
                            }}
                              className="text-orange-600 hover:text-orange-900 font-medium"
                            >
                              Add to My Catalog
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {globalProductsLoading ? "Loading products..." : "No products found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(catalogPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(catalogPage * itemsPerPage, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCatalogPage((prev) => Math.max(1, prev - 1))}
                    disabled={catalogPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= catalogPage - 1 && page <= catalogPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setCatalogPage(page)}
                              className={`px-3 py-2 text-sm border rounded-lg ${
                                catalogPage === page
                                  ? "bg-orange-600 text-white border-orange-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCatalogPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={catalogPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* My Products Tab - Vendor's own products */}
        {activeTab === "my-products" && (() => {
          const filteredProducts = vendorProducts.filter((product) => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return (
              product.productId?.productName
                ?.toLowerCase()
                .includes(searchLower) ||
              product.cityId?.name?.toLowerCase().includes(searchLower) ||
              product.productId?.shortDescription
                ?.toLowerCase()
                .includes(searchLower)
            );
          });
          const totalPages = getTotalPages(filteredProducts, itemsPerPage);
          const paginatedProducts = getPaginatedData(filteredProducts, myProductsPage, itemsPerPage);
          
          return (
          <div className="space-y-6">
            {/* Stats Cards */}
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalProducts}
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
                    <p className="text-sm text-gray-600">Active Products</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeProducts}
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.lowStock}
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalStock.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  My Products
                </h2>
                <input
                  type="text"
                  placeholder="Search my products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Order Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sequence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                      <tr key={product._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.productId?.images?.[0]?.url || product.productId?.img ? (
                              <img
                                src={product.productId.images?.[0]?.url || product.productId.img}
                                alt={product.productId?.productName || "Product"}
                                className="h-10 w-10 object-contain p-0.5 bg-white rounded mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                                <svg
                                  className="h-5 w-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.productId?.productName || "N/A"}
                              </div>
                              {product.productId?.shortDescription && (
                                <div className="text-xs text-gray-500 max-w-xs truncate">
                                  {product.productId.shortDescription.substring(0, 40)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.cityId?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {product.priceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.priceType === "single" ? (
                            <span>₹{product.pricing?.single?.price || 0}</span>
                          ) : (
                            <div>
                              <span className="block">
                                {product.pricing?.bulk?.length || 0} price slabs
                              </span>
                              {product.pricing?.bulk?.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  ₹{product.pricing.bulk[0].price} - ₹
                                  {product.pricing.bulk[product.pricing.bulk.length - 1].price}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <span>{product.availableStock || 0}</span>
                            {product.notifyQuantity &&
                              product.availableStock <= product.notifyQuantity && (
                                <span className="ml-2 text-xs text-orange-600 font-semibold">
                                  (Low Stock)
                                </span>
                              )}
                          </div>
                          {product.notifyQuantity && (
                            <div className="text-xs text-gray-400">
                              Alert at: {product.notifyQuantity}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.minimumOrderQuantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sequenceNumber || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 text-left"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(product._id)}
                              className={`text-left ${
                                product.status
                                  ? "text-orange-600 hover:text-orange-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                            >
                              {product.status ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-600 hover:text-red-900 text-left"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        {vendorProductsLoading ? "Loading products..." : "No products found. Add products from the Product Catalog!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(myProductsPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(myProductsPage * itemsPerPage, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMyProductsPage((prev) => Math.max(1, prev - 1))}
                    disabled={myProductsPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= myProductsPage - 1 && page <= myProductsPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsisBefore && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setMyProductsPage(page)}
                              className={`px-3 py-2 text-sm border rounded-lg ${
                                myProductsPage === page
                                  ? "bg-orange-600 text-white border-orange-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setMyProductsPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={myProductsPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
          );
        })()}

        {/* Add/Edit Product Tab */}
        {activeTab === "add-product" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">
              {editingProductId ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              {/* Product Selection */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Product *
                    </label>
                    <select
                      required
                      value={productForm.productId}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productId: e.target.value,
                        })
                      }
                      disabled={!!editingProductId}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select a product</option>
                      {globalProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    {vendorInfo?.cityId ? (
                      <div>
                        <input
                          type="text"
                          value={
                            cities.find((c) => c._id === vendorInfo.cityId)?.displayName ||
                            cities.find((c) => c._id === vendorInfo.cityId)?.name ||
                            "Your City"
                          }
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          City is automatically set based on your vendor profile
                        </p>
                      </div>
                    ) : (
                      <select
                        required
                        value={productForm.cityId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            cityId: e.target.value,
                          })
                        }
                        disabled={!!editingProductId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select a city</option>
                        {cities.map((city) => (
                          <option key={city._id} value={city._id}>
                            {city.displayName || city.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type *
                  </label>
                  <select
                    required
                    value={productForm.priceType}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        priceType: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="single">Single Price</option>
                    <option value="bulk">Bulk Pricing</option>
                  </select>
                </div>

                {productForm.priceType === "single" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.pricing.single.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          pricing: {
                            ...productForm.pricing,
                            single: {
                              price: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter price"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bulk Price Slabs *
                      </label>
                      <button
                        type="button"
                        onClick={addBulkPriceSlab}
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Add Slab
                      </button>
                    </div>
                    {productForm.pricing.bulk.map((slab, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-2 mb-2 items-end"
                      >
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Min Quantity (or more) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            value={slab.minQty}
                            onChange={(e) =>
                              updateBulkPriceSlab(
                                index,
                                "minQty",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="e.g., 50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Price per piece *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={slab.price}
                            onChange={(e) =>
                              updateBulkPriceSlab(
                                index,
                                "price",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="e.g., 0.99"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBulkPriceSlab(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {productForm.pricing.bulk.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Add at least one bulk price slab
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.defaultPrice}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          defaultPrice: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sequence Number *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={productForm.sequenceNumber}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          sequenceNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchased From
                    </label>
                    <input
                      type="text"
                      value={productForm.productPurchasedFrom}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productPurchasedFrom: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Where was it purchased"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Mode
                    </label>
                    <input
                      type="text"
                      value={productForm.purchasedMode}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          purchasedMode: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., Cash, Online"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Amount
                    </label>
                    <input
                      type="text"
                      value={productForm.purchasedAmount}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          purchasedAmount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.gst}
                      onChange={(e) =>
                        setProductForm({ ...productForm, gst: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.cgst}
                      onChange={(e) =>
                        setProductForm({ ...productForm, cgst: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.sgst}
                      onChange={(e) =>
                        setProductForm({ ...productForm, sgst: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.igst}
                      onChange={(e) =>
                        setProductForm({ ...productForm, igst: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Management */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Stock Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Available Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.availableStock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          availableStock: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={productForm.minimumOrderQuantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          minimumOrderQuantity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notify When Stock Reaches
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.notifyQuantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          notifyQuantity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="pb-6">
                <h3 className="text-lg font-semibold mb-4">Status</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={productForm.status}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        status: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("product-catalog");
                    setEditingProductId(null);
                    setProductForm({
                      productId: "",
                      cityId: vendorInfo?.cityId || "",
                      priceType: "single",
                      defaultPrice: 0,
                      sequenceNumber: 0,
                      productPurchasedFrom: "",
                      purchasedMode: "",
                      purchasedAmount: "",
                      gst: 0,
                      cgst: 0,
                      sgst: 0,
                      igst: 0,
                      pricing: {
                        single: {
                          price: "",
                        },
                        bulk: [],
                      },
                      availableStock: 0,
                      minimumOrderQuantity: 1,
                      notifyQuantity: "",
                      status: true,
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Saving..."
                    : editingProductId
                    ? "Update Product"
                    : "Add Product"}
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
