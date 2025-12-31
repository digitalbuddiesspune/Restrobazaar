import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SuperAdminDashboard = () => {
  const baseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    products: 0,
    cities: 0,
    categories: 0,
    vendors: 0,
  });

  // Data lists
  const [products, setProducts] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Form states
  const [productForm, setProductForm] = useState({
    productName: "",
    searchTags: "",
    productPurchasedFrom: "",
    purchasedMode: "",
    purchasedAmount: "",
    shortDescription: "",
    category: "",
    subCategory: "",
    otherCategory: "",
    unit: "piece",
    weight: "",
    capacity: "",
    size: {
      height: "",
      width: "",
      base: "",
    },
    hsnCode: "",
    gst: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    isReturnable: false,
    showOnSpecialPage: false,
    status: true,
    images: [],
  });

  const [cityForm, setCityForm] = useState({
    name: "",
    displayName: "",
    state: "",
    country: "India",
    isServiceable: true,
    isActive: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    image: "",
    description: "",
    isActive: true,
    priority: 0,
  });

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
        navigate("/super_admin/login");
        return;
      }

      const [productsRes, citiesRes, categoriesRes, vendorsRes] =
        await Promise.all([
          axios
            .get(`${baseUrl}/products`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(`${baseUrl}/cities`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(`${baseUrl}/categories`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(`${baseUrl}/vendors`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => ({ data: { data: [] } })),
        ]);

      setStats({
        products:
          productsRes.data?.data?.length ||
          productsRes.data?.pagination?.total ||
          0,
        cities: citiesRes.data?.data?.length || citiesRes.data?.count || 0,
        categories:
          categoriesRes.data?.data?.length || categoriesRes.data?.count || 0,
        vendors: vendorsRes.data?.data?.length || vendorsRes.data?.count || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch all data
  const fetchProducts = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch products");
    }
  };

  const fetchCities = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCities(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch cities");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch categories");
    }
  };

  const fetchVendors = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch vendors");
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === "products") fetchProducts();
    if (activeTab === "cities") fetchCities();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "vendors") fetchVendors();
    if (activeTab === "add-product") fetchCategories(); // Fetch categories for dropdown
    if (activeTab === "add-vendor") fetchCities(); // Fetch cities for serviceCities dropdown
  }, [activeTab]);

  // Image management handlers
  const addImage = () => {
    setProductForm({
      ...productForm,
      images: [...productForm.images, { url: "", alt: "" }],
    });
  };

  const removeImage = (index) => {
    setProductForm({
      ...productForm,
      images: productForm.images.filter((_, i) => i !== index),
    });
  };

  const updateImage = (index, field, value) => {
    const updatedImages = [...productForm.images];
    updatedImages[index] = {
      ...updatedImages[index],
      [field]: value,
    };
    setProductForm({
      ...productForm,
      images: updatedImages,
    });
  };

  // Handle edit category
  const handleEditCategory = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    if (category) {
      setCategoryForm({
        name: category.name || "",
        slug: category.slug || "",
        image: category.image || "",
        description: category.description || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
        priority: category.priority || 0,
      });
      setEditingCategoryId(categoryId);
      setActiveTab("add-category");
      setError("");
      setSuccess("");
    }
  };

  // Handle edit product
  const handleEdit = async (productId) => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const product = res.data?.data;
      if (product) {
        // Populate form with product data
        setProductForm({
          productName: product.productName || "",
          searchTags: Array.isArray(product.searchTags)
            ? product.searchTags.join(", ")
            : product.searchTags || "",
          productPurchasedFrom: product.productPurchasedFrom || "",
          purchasedMode: product.purchasedMode || "",
          purchasedAmount: product.purchasedAmount || "",
          shortDescription: product.shortDescription || "",
          category: product.category?._id || product.category || "",
          subCategory: product.subCategory || "",
          otherCategory: product.otherCategory || "",
          unit: product.unit || "piece",
          weight: product.weight || "",
          capacity: product.capacity || "",
          size: product.size || {
            height: "",
            width: "",
            base: "",
          },
          hsnCode: product.hsnCode || "",
          gst: product.gst || 0,
          cgst: product.cgst || 0,
          sgst: product.sgst || 0,
          igst: product.igst || 0,
          isReturnable: product.isReturnable || false,
          showOnSpecialPage: product.showOnSpecialPage || false,
          status: product.status !== undefined ? product.status : true,
          images:
            product.images && product.images.length > 0
              ? product.images.map((img) => ({
                  url: img.url || "",
                  alt: img.alt || "",
                }))
              : [],
        });
        setEditingProductId(productId);
        setActiveTab("add-product");
        setError("");
        setSuccess("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load product for editing"
      );
    }
  };

  // Handle form submissions
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      // Validate token exists and is not empty
      if (!token || token.trim() === "") {
        setError("Authentication required. Please login again.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
        setLoading(false);
        return;
      }

      // Prepare form data
      const formData = {
        ...productForm,
        // Convert searchTags string to array
        searchTags: productForm.searchTags
          ? productForm.searchTags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
        // Convert numeric fields
        gst: parseFloat(productForm.gst) || 0,
        cgst: parseFloat(productForm.cgst) || 0,
        sgst: parseFloat(productForm.sgst) || 0,
        igst: parseFloat(productForm.igst) || 0,
        // Handle size object - only include if at least one field is filled
        size:
          productForm.size.height ||
          productForm.size.width ||
          productForm.size.base
            ? {
                ...(productForm.size.height && {
                  height: productForm.size.height,
                }),
                ...(productForm.size.width && {
                  width: productForm.size.width,
                }),
                ...(productForm.size.base && { base: productForm.size.base }),
              }
            : undefined,
        // Remove empty string fields
        ...(productForm.productPurchasedFrom && {
          productPurchasedFrom: productForm.productPurchasedFrom,
        }),
        ...(productForm.purchasedMode && {
          purchasedMode: productForm.purchasedMode,
        }),
        ...(productForm.purchasedAmount && {
          purchasedAmount: productForm.purchasedAmount,
        }),
        ...(productForm.subCategory && {
          subCategory: productForm.subCategory,
        }),
        ...(productForm.otherCategory && {
          otherCategory: productForm.otherCategory,
        }),
        ...(productForm.weight && { weight: productForm.weight }),
        ...(productForm.capacity && { capacity: productForm.capacity }),
        ...(productForm.hsnCode && { hsnCode: productForm.hsnCode }),
        // Format images - only include images with URLs
        images: productForm.images
          .filter((img) => img.url && img.url.trim())
          .map((img) => ({
            url: img.url.trim(),
            ...(img.alt && img.alt.trim() && { alt: img.alt.trim() }),
          })),
      };

      if (editingProductId) {
        // Update existing product
        await axios.put(`${baseUrl}/products/${editingProductId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Product updated successfully!");
        setEditingProductId(null);
      } else {
        // Create new product
        await axios.post(`${baseUrl}/products`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Product created successfully!");
      }

      // Reset form
      setProductForm({
        productName: "",
        searchTags: "",
        productPurchasedFrom: "",
        purchasedMode: "",
        purchasedAmount: "",
        shortDescription: "",
        category: "",
        subCategory: "",
        otherCategory: "",
        unit: "piece",
        weight: "",
        capacity: "",
        size: {
          height: "",
          width: "",
          base: "",
        },
        hsnCode: "",
        gst: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        isReturnable: false,
        showOnSpecialPage: false,
        status: true,
        images: [],
      });
      fetchStats();
      fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingProductId
            ? "Failed to update product"
            : "Failed to create product")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      // Validate token exists and is not empty
      if (!token || token.trim() === "") {
        setError("Authentication required. Please login again.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
        setLoading(false);
        return;
      }

      await axios.post(`${baseUrl}/cities`, cityForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("City created successfully!");
      setCityForm({
        name: "",
        displayName: "",
        state: "",
        country: "India",
        isServiceable: true,
        isActive: true,
      });
      fetchStats();
      fetchCities();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create city");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle category name change and auto-generate slug
  const handleCategoryNameChange = (name) => {
    const newSlug = generateSlug(name);
    setCategoryForm({ ...categoryForm, name, slug: newSlug });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      // Validate token exists and is not empty
      if (!token || token.trim() === "") {
        setError("Authentication required. Please login again.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
        setLoading(false);
        return;
      }

      // Prepare form data - send slug only if manually edited, otherwise let backend generate
      const formData = {
        name: categoryForm.name.trim(),
        ...(categoryForm.slug && { slug: categoryForm.slug.trim() }),
        ...(categoryForm.image && { image: categoryForm.image.trim() }),
        ...(categoryForm.description && {
          description: categoryForm.description.trim(),
        }),
        isActive: categoryForm.isActive,
        priority: categoryForm.priority || 0,
      };

      if (editingCategoryId) {
        // Update existing category
        await axios.put(`${baseUrl}/categories/${editingCategoryId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Category updated successfully!");
        setEditingCategoryId(null);
      } else {
        // Create new category
        await axios.post(`${baseUrl}/categories`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Category created successfully!");
      }

      setCategoryForm({
        name: "",
        slug: "",
        image: "",
        description: "",
        isActive: true,
        priority: 0,
      });
      fetchStats();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      // Validate token exists and is not empty
      if (!token || token.trim() === "") {
        setError("Authentication required. Please login again.");
        setTimeout(() => {
          handleLogout();
        }, 2000);
        setLoading(false);
        return;
      }

      // Prepare form data - only include fields with values
      const formData = {
        businessName: vendorForm.businessName.trim(),
        email: vendorForm.email.trim().toLowerCase(),
        phone: vendorForm.phone.trim(),
        password: vendorForm.password,
        vendorType: vendorForm.vendorType,
        commissionPercentage: vendorForm.commissionPercentage || 0,
        isActive: vendorForm.isActive,
        isApproved: vendorForm.isApproved,
        kycStatus: vendorForm.kycStatus,
        ...(vendorForm.legalName && { legalName: vendorForm.legalName.trim() }),
        // Contact Person - only include if at least one field is filled
        ...((vendorForm.contactPerson.name ||
          vendorForm.contactPerson.phone ||
          vendorForm.contactPerson.email) && {
          contactPerson: {
            ...(vendorForm.contactPerson.name && {
              name: vendorForm.contactPerson.name.trim(),
            }),
            ...(vendorForm.contactPerson.phone && {
              phone: vendorForm.contactPerson.phone.trim(),
            }),
            ...(vendorForm.contactPerson.email && {
              email: vendorForm.contactPerson.email.trim().toLowerCase(),
            }),
          },
        }),
        // Address - only include if at least one field is filled
        ...((vendorForm.address.line1 ||
          vendorForm.address.line2 ||
          vendorForm.address.city ||
          vendorForm.address.state ||
          vendorForm.address.pincode) && {
          address: {
            ...(vendorForm.address.line1 && {
              line1: vendorForm.address.line1.trim(),
            }),
            ...(vendorForm.address.line2 && {
              line2: vendorForm.address.line2.trim(),
            }),
            ...(vendorForm.address.city && {
              city: vendorForm.address.city.trim(),
            }),
            ...(vendorForm.address.state && {
              state: vendorForm.address.state.trim(),
            }),
            ...(vendorForm.address.pincode && {
              pincode: vendorForm.address.pincode.trim(),
            }),
          },
        }),
        ...(vendorForm.gstNumber && { gstNumber: vendorForm.gstNumber.trim() }),
        ...(vendorForm.panNumber && { panNumber: vendorForm.panNumber.trim() }),
        // Service Cities - only include if array has items
        ...(vendorForm.serviceCities.length > 0 && {
          serviceCities: vendorForm.serviceCities,
        }),
        // Bank Details - only include if at least one field is filled
        ...((vendorForm.bankDetails.accountHolderName ||
          vendorForm.bankDetails.accountNumber ||
          vendorForm.bankDetails.ifsc ||
          vendorForm.bankDetails.bankName) && {
          bankDetails: {
            ...(vendorForm.bankDetails.accountHolderName && {
              accountHolderName:
                vendorForm.bankDetails.accountHolderName.trim(),
            }),
            ...(vendorForm.bankDetails.accountNumber && {
              accountNumber: vendorForm.bankDetails.accountNumber.trim(),
            }),
            ...(vendorForm.bankDetails.ifsc && {
              ifsc: vendorForm.bankDetails.ifsc.trim(),
            }),
            ...(vendorForm.bankDetails.bankName && {
              bankName: vendorForm.bankDetails.bankName.trim(),
            }),
          },
        }),
      };

      await axios.post(`${baseUrl}/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Vendor created successfully!");
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
      fetchStats();
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create vendor");
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;

    try {
      const token = getToken();
      await axios.delete(`${baseUrl}/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`
      );
      if (type === "products") fetchProducts();
      if (type === "cities") fetchCities();
      if (type === "categories") fetchCategories();
      if (type === "vendors") fetchVendors();
      fetchStats();
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/super_admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Super Admin Dashboard
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
                { id: "add-product", label: "Add Product" },
                { id: "add-city", label: "Add City" },
                { id: "add-category", label: "Add Category" },
                { id: "add-vendor", label: "Add Vendor" },
                { id: "products", label: "All Products" },
                { id: "cities", label: "All Cities" },
                { id: "categories", label: "All Categories" },
                { id: "vendors", label: "All Vendors" },
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
                    if (tab.id !== "add-category") {
                      setEditingCategoryId(null);
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
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.products}
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Cities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.cities}
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.categories}
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.vendors}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Tab */}
        {activeTab === "add-product" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">
              {editingProductId ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.productName}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Tags
                    </label>
                    <input
                      type="text"
                      value={productForm.searchTags}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          searchTags: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas (e.g., tag1, tag2, tag3)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separate multiple tags with commas
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Description
                    </label>
                    <textarea
                      value={productForm.shortDescription}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          shortDescription: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Category Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  Category Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Category
                    </label>
                    <input
                      type="text"
                      value={productForm.subCategory}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter sub category"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Category
                    </label>
                    <input
                      type="text"
                      value={productForm.otherCategory}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          otherCategory: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter other category if applicable"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  Purchase Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>

              {/* Unit & Weight */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Unit & Weight</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={productForm.unit}
                      onChange={(e) =>
                        setProductForm({ ...productForm, unit: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kg</option>
                      <option value="gram">Gram</option>
                      <option value="liter">Liter</option>
                      <option value="ml">ML</option>
                      <option value="meter">Meter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      value={productForm.weight}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          weight: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter weight"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="text"
                      value={productForm.capacity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          capacity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter capacity"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Size</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      value={productForm.size.height}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          size: { ...productForm.size, height: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter height"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="text"
                      value={productForm.size.width}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          size: { ...productForm.size, width: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter width"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base
                    </label>
                    <input
                      type="text"
                      value={productForm.size.base}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          size: { ...productForm.size, base: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter base"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={productForm.hsnCode}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          hsnCode: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter HSN code"
                    />
                  </div>
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Product Images</h3>
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Image
                  </button>
                </div>
                <div className="space-y-4">
                  {productForm.images.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No images added. Click "Add Image" to add image URLs.
                    </p>
                  ) : (
                    productForm.images.map((image, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Image {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Image URL *
                            </label>
                            <input
                              type="url"
                              required
                              value={image.url}
                              onChange={(e) =>
                                updateImage(index, "url", e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alt Text (Optional)
                            </label>
                            <input
                              type="text"
                              value={image.alt}
                              onChange={(e) =>
                                updateImage(index, "alt", e.target.value)
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Image description"
                            />
                          </div>
                        </div>
                        {image.url && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preview
                            </label>
                            <div className="border border-gray-200 rounded-lg p-2 bg-white">
                              <img
                                src={image.url}
                                alt={image.alt || "Product image"}
                                className="max-w-full h-32 object-contain mx-auto"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EFailed to load%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Flags & Status */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Flags & Status</h3>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.isReturnable}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          isReturnable: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Is Returnable</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.showOnSpecialPage}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          showOnSpecialPage: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Show on Special Page
                    </span>
                  </label>
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
                    <span className="text-sm text-gray-700">Active Status</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? editingProductId
                      ? "Updating..."
                      : "Creating..."
                    : editingProductId
                    ? "Update Product"
                    : "Create Product"}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm({
                        productName: "",
                        searchTags: "",
                        productPurchasedFrom: "",
                        purchasedMode: "",
                        purchasedAmount: "",
                        shortDescription: "",
                        category: "",
                        subCategory: "",
                        otherCategory: "",
                        unit: "piece",
                        weight: "",
                        capacity: "",
                        size: {
                          height: "",
                          width: "",
                          base: "",
                        },
                        hsnCode: "",
                        gst: 0,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                        isReturnable: false,
                        showOnSpecialPage: false,
                        status: true,
                        images: [],
                      });
                      setError("");
                      setSuccess("");
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Add City Tab */}
        {activeTab === "add-city" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Add New City</h2>
            <form onSubmit={handleCitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name (lowercase) *
                </label>
                <input
                  type="text"
                  required
                  value={cityForm.name}
                  onChange={(e) =>
                    setCityForm({
                      ...cityForm,
                      name: e.target.value.toLowerCase(),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., pune"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={cityForm.displayName}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, displayName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Pune"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={cityForm.state}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={cityForm.country}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={cityForm.isServiceable}
                    onChange={(e) =>
                      setCityForm({
                        ...cityForm,
                        isServiceable: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Serviceable</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={cityForm.isActive}
                    onChange={(e) =>
                      setCityForm({ ...cityForm, isActive: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create City"}
              </button>
            </form>
          </div>
        )}

        {/* Add Category Tab */}
        {activeTab === "add-category" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">
              {editingCategoryId ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Electronics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Auto-generated from name (e.g., electronics)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Slug is auto-generated from name. You can edit it manually if
                  needed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={categoryForm.image}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, image: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter category description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={categoryForm.priority}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Higher numbers appear first. Default is 0.
                </p>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={categoryForm.isActive}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? editingCategoryId
                      ? "Updating..."
                      : "Creating..."
                    : editingCategoryId
                    ? "Update Category"
                    : "Create Category"}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryForm({
                        name: "",
                        slug: "",
                        image: "",
                        description: "",
                        isActive: true,
                        priority: 0,
                      });
                      setError("");
                      setSuccess("");
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Add Vendor Tab */}
        {activeTab === "add-vendor" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Add New Vendor</h2>
            <form onSubmit={handleVendorSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
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
        )}

        {/* All Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.img ? (
                          <img
                            src={product.img}
                            alt={product.productName || "Product"}
                            className="h-12 w-12 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category?.name || product.category || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            product.status
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(product._id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete("products", product._id)
                            }
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No products found
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Cities Tab */}
        {activeTab === "cities" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Cities</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cities.map((city) => (
                    <tr key={city._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {city.displayName || city.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {city.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            city.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {city.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete("cities", city._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cities.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No cities found
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Categories Tab */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Categories</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            category.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditCategory(category._id)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete("categories", category._id)
                            }
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {categories.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No categories found
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Vendors Tab */}
        {activeTab === "vendors" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Vendors</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Business Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vendor.businessName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vendor.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            vendor.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {vendor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete("vendors", vendor._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {vendors.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No vendors found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
