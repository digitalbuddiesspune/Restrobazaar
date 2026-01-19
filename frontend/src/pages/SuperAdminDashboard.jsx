import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/super_admin/Sidebar";
import Header from "../components/super_admin/Header";
import OrderRecords from "../components/OrderRecords";
import OverviewStats from "../components/super_admin/OverviewStats";
import ProductForm from "../components/super_admin/ProductForm";
import CityForm from "../components/super_admin/CityForm";
import CategoryForm from "../components/super_admin/CategoryForm";
import VendorForm from "../components/super_admin/VendorForm";
import ProductsTable from "../components/super_admin/ProductsTable";
import CitiesTable from "../components/super_admin/CitiesTable";
import CategoriesTable from "../components/super_admin/CategoriesTable";
import VendorsTable from "../components/super_admin/VendorsTable";
import UsersTable from "../components/super_admin/UsersTable";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Product filters
  const [productFilters, setProductFilters] = useState({
    search: "",
    category: "",
    subCategory: "",
    status: "",
  });

  // User filters
  const [userFilters, setUserFilters] = useState({
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Pagination state
  const [productsPage, setProductsPage] = useState(1);
  const itemsPerPage = 10;

  // Stats
  const [stats, setStats] = useState({
    products: 0,
    cities: 0,
    categories: 0,
    vendors: 0,
    users: 0,
  });

  // Today's order statistics
  const [todayOrdersStats, setTodayOrdersStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
  });

  // Filter state for today's orders
  const [orderFilters, setOrderFilters] = useState({
    cityId: '',
    vendorId: '',
  });

  // Data lists
  const [products, setProducts] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);

  // Graph state
  const [monthlyOrdersData, setMonthlyOrdersData] = useState([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedGraphCity, setSelectedGraphCity] = useState('');

  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingStartDate, setPendingStartDate] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');
  const [pendingCity, setPendingCity] = useState('');

  // Form states
  const [productForm, setProductForm] = useState({
    productName: "",
    searchTags: "",
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
    subcategories: [],
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

  const [testimonialForm, setTestimonialForm] = useState({
    review: "",
    name: "",
    businessType: "",
    location: "",
    status: true,
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

      const [productsRes, citiesRes, categoriesRes, vendorsRes, usersRes] =
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
          axios
            .get(`${baseUrl}/admin/users`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { limit: 1 }, // Just get count
            })
            .catch(() => ({ data: { pagination: { total: 0 } } })),
        ]);

      setStats({
        products:
          productsRes.data?.pagination?.total ||
          productsRes.data?.data?.length ||
          0,
        cities: citiesRes.data?.data?.length || citiesRes.data?.count || 0,
        categories:
          categoriesRes.data?.data?.length || categoriesRes.data?.count || 0,
        vendors: vendorsRes.data?.data?.length || vendorsRes.data?.count || 0,
        users: usersRes.data?.pagination?.total || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch today's order statistics
  const fetchTodayOrdersStats = async (filters = {}) => {
    try {
      const token = getToken();
      if (!token) {
        return;
      }

      // Get today's date range (start and end of today)
      // Use local timezone but convert to ISO string for API
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Convert to ISO string for API
      const todayStartISO = todayStart.toISOString();
      const todayEndISO = todayEnd.toISOString();

      // Build params object
      const params = {
        startDate: todayStartISO,
        endDate: todayEndISO,
        limit: 10000, // Large limit to get all today's orders
      };

      // Add filters if provided
      if (filters.cityId) {
        params.cityId = filters.cityId;
      }
      if (filters.vendorId) {
        params.vendorId = filters.vendorId;
      }

      // Fetch today's orders with optional filters
      const response = await axios.get(`${baseUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data?.success) {
        const orders = response.data.data || [];

        // Count orders by status - handle both Order_status and orderStatus field names
        const stats = {
          total: orders.length,
          pending: orders.filter(order => {
            const status = order.Order_status || order.orderStatus || '';
            return status.toLowerCase() === 'pending';
          }).length,
          delivered: orders.filter(order => {
            const status = order.Order_status || order.orderStatus || '';
            return status.toLowerCase() === 'delivered';
          }).length,
          cancelled: orders.filter(order => {
            const status = order.Order_status || order.orderStatus || '';
            return status.toLowerCase() === 'cancelled';
          }).length,
        };

        setTodayOrdersStats(stats);
      }
    } catch (err) {
      console.error("Error fetching today's order stats:", err);
      // Set default values on error
      setTodayOrdersStats({
        total: 0,
        pending: 0,
        delivered: 0,
        cancelled: 0,
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...orderFilters,
      [filterType]: value,
    };
    setOrderFilters(newFilters);
    // Refetch stats with new filters
    fetchTodayOrdersStats(newFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setOrderFilters({ cityId: '', vendorId: '' });
    fetchTodayOrdersStats({ cityId: '', vendorId: '' });
  };

  const handleClearPendingFilters = () => {
    setPendingCity('');
    setPendingStartDate('');
    setPendingEndDate('');
  };

  // Fetch monthly orders
  const fetchMonthlyOrders = async (year, cityId) => {
    try {
      const token = getToken();
      if (!token) return;

      const targetYear = year || selectedYear;
      const targetCity = cityId !== undefined ? cityId : selectedGraphCity;

      const startOfYear = new Date(targetYear, 0, 1).toISOString();
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).toISOString();

      const params = {
        startDate: startOfYear,
        endDate: endOfYear,
        limit: 20000,
      };

      if (targetCity) {
        params.cityId = targetCity;
      }

      const response = await axios.get(`${baseUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      if (response.data?.success) {
        const orders = response.data.data || [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // Initialize with 0
        const monthlyData = monthNames.map(name => ({ name, orders: 0 }));

        orders.forEach(order => {
          const orderDate = new Date(order.createdAt || order.orderDate);

          // Verify year and city (though API should filter city, nice to double check)
          const isCorrectYear = !isNaN(orderDate) && orderDate.getFullYear() === targetYear;
          // For city, we assume API filtered it correctly, or we can check if needed. 
          // The API param 'cityId' filters by order's city.

          if (isCorrectYear) {
            monthlyData[orderDate.getMonth()].orders += 1;
          }
        });

        setMonthlyOrdersData(monthlyData);
      }
    } catch (err) {
      console.error("Error fetching monthly orders:", err);
    }
  };

  // Fetch pending orders
  const fetchPendingOrders = async (cityId, startDate, endDate) => {
    try {
      const token = getToken();
      if (!token) return;

      const params = {
        orderStatus: 'pending',
        limit: 100, // Increased limit to see all pending orders
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (cityId) params.cityId = cityId;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString();

      const response = await axios.get(`${baseUrl}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      if (response.data?.success) {
        setPendingOrders(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching pending orders:", err);
    }
  };

  // Fetch all data
  const fetchProducts = async (filters = {}) => {
    try {
      const token = getToken();
      const params = { limit: 10000000 }; // Fetch all products
      
      // Add filter parameters
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.subCategory) {
        params.subCategory = filters.subCategory;
      }
      if (filters.status !== "" && filters.status !== undefined) {
        params.status = filters.status === "active" ? true : filters.status === "inactive" ? false : filters.status;
      }
      
      const res = await axios.get(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setProducts(res.data?.data || []);
      // Reset to first page when filters change
      setProductsPage(1);
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

  const fetchTestimonials = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${baseUrl}/testimonials`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 }, // Fetch all testimonials
      });
      setTestimonials(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch testimonials");
    }
  };

  const fetchUsers = async (filters = {}) => {
    try {
      setUsersLoading(true);
      const token = getToken();
      const params = { limit: 10000 }; // Fetch all users
      
      // Add filter parameters
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }
      if (filters.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }
      
      const res = await axios.get(`${baseUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setUsers(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Fetch today's order stats when overview tab is active
    if (activeTab === "overview") {
      // Fetch cities and vendors for filters
      fetchCities();
      fetchVendors();
      // Fetch today's orders with current filters
      fetchTodayOrdersStats(orderFilters);
      // Fetch monthly orders for graph
      fetchMonthlyOrders(selectedYear, selectedGraphCity);
      fetchPendingOrders(pendingCity, pendingStartDate, pendingEndDate);
    }
    if (activeTab === "products") {
      fetchProducts(productFilters);
      fetchCategories(); // Fetch categories for filter dropdown
      setProductsPage(1); // Reset pagination when switching to products tab
    }
    if (activeTab === "product-catalog") {
      fetchProducts(); // Fetch products for catalog view
      fetchCategories(); // Fetch categories for catalog
    }
    if (activeTab === "cities") fetchCities();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "vendors") fetchVendors();
    if (activeTab === "users") fetchUsers(userFilters);
    if (activeTab === "add-product") fetchCategories(); // Fetch categories for dropdown
    if (activeTab === "add-city") fetchCities(); // Fetch cities for reference
    if (activeTab === "add-category") fetchCategories(); // Fetch categories for reference
    if (activeTab === "add-vendor") fetchCities(); // Fetch cities for serviceCities dropdown
    if (activeTab === "testimonials") fetchTestimonials();
    if (activeTab === "add-testimonial") fetchTestimonials(); // Fetch testimonials for reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedYear, selectedGraphCity, pendingCity, pendingStartDate, pendingEndDate]);

  // Refetch products when filters change
  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts(productFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilters]);

  // Refetch users when filters change
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers(userFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFilters]);

  // Get unique subcategories based on selected category
  const availableSubCategories = useMemo(() => {
    if (!productFilters.category) return [];
    const categoryProducts = products.filter(p => {
      const categoryId = p.category?._id || p.category;
      return categoryId === productFilters.category;
    });
    const uniqueSubCategories = [...new Set(
      categoryProducts
        .map(p => p.subCategory)
        .filter(Boolean)
    )].sort();
    return uniqueSubCategories;
  }, [products, productFilters.category]);

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
        subcategories: category.subcategories || [],
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
        subcategories: (categoryForm.subcategories || []).filter(subcat => subcat.trim() !== ""),
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
        subcategories: [],
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
      if (type === "testimonials") fetchTestimonials();
      fetchStats();
    } catch (err) {
      setError(`Failed to delete ${type}`);
    }
  };

  // Testimonial handlers
  const handleTestimonialEdit = (testimonial) => {
    setEditingTestimonialId(testimonial._id);
    setTestimonialForm({
      review: testimonial.review || "",
      name: testimonial.name || "",
      businessType: testimonial.businessType || "",
      location: testimonial.location || "",
      status: testimonial.status !== undefined ? testimonial.status : true,
    });
    setActiveTab("add-testimonial");
  };

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();
      const formData = {
        review: testimonialForm.review,
        name: testimonialForm.name,
        businessType: testimonialForm.businessType,
        location: testimonialForm.location,
        status: testimonialForm.status,
      };

      if (editingTestimonialId) {
        await axios.put(
          `${baseUrl}/testimonials/${editingTestimonialId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuccess("Testimonial updated successfully!");
      } else {
        await axios.post(`${baseUrl}/testimonials`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Testimonial created successfully!");
      }

      setTestimonialForm({
        review: "",
        name: "",
        businessType: "",
        location: "",
        status: true,
      });
      setEditingTestimonialId(null);
      fetchTestimonials();
      setActiveTab("testimonials");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (editingTestimonialId
          ? "Failed to update testimonial"
          : "Failed to create testimonial")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestimonialStatus = async (id) => {
    try {
      const token = getToken();
      await axios.patch(
        `${baseUrl}/testimonials/${id}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Testimonial status updated successfully!");
      fetchTestimonials();
    } catch (err) {
      setError("Failed to update testimonial status");
    }
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/super_admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 scrollbar-hide">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setError("");
          setSuccess("");
          if (tab !== "add-product") {
            setEditingProductId(null);
          }
          if (tab !== "add-category") {
            setEditingCategoryId(null);
          }
        }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(query) => setSearchQuery(query)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isCollapsed={sidebarCollapsed}
        />

        <main className="p-4 scrollbar-hide">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
              </div>
              <OverviewStats
                stats={stats}
                todayOrdersStats={todayOrdersStats}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                cities={cities}
                vendors={vendors}
                monthlyOrdersData={monthlyOrdersData}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                selectedGraphCity={selectedGraphCity}
                onGraphCityChange={setSelectedGraphCity}
                pendingOrders={pendingOrders}
                pendingStartDate={pendingStartDate}
                setPendingStartDate={setPendingStartDate}
                pendingEndDate={pendingEndDate}
                setPendingEndDate={setPendingEndDate}
                pendingCity={pendingCity}
                setPendingCity={setPendingCity}
                onClearPendingFilters={handleClearPendingFilters}
              />
            </div>
          )}

          {/* Add Product Tab */}
          {activeTab === "add-product" && (
            <div className="space-y-4">
              <ProductForm
                productForm={productForm}
                setProductForm={setProductForm}
                categories={categories}
                editingProductId={editingProductId}
                handleProductSubmit={handleProductSubmit}
                loading={loading}
                setEditingProductId={setEditingProductId}
                setError={setError}
                setSuccess={setSuccess}
                addImage={addImage}
                removeImage={removeImage}
                updateImage={updateImage}
                getToken={getToken}
              />
            </div>
          )}

          {/* Add Product Tab - OLD */}
          {false && activeTab === "add-product-old" && (
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
                        onChange={(e) => {
                          const selectedCategoryId = e.target.value;
                          const selectedCategory = categories.find(
                            (cat) => cat._id === selectedCategoryId
                          );
                          setProductForm({
                            ...productForm,
                            category: selectedCategoryId,
                            subCategory: "", // Reset subcategory when category changes
                          });
                        }}
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
                      {productForm.category ? (
                        (() => {
                          const selectedCategory = categories.find(
                            (cat) => cat._id === productForm.category
                          );
                          const subcategories =
                            selectedCategory?.subcategories || [];
                          return subcategories.length > 0 ? (
                            <select
                              value={productForm.subCategory}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  subCategory: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="">Select a subcategory</option>
                              {subcategories.map((subcat, index) => (
                                <option key={index} value={subcat}>
                                  {subcat}
                                </option>
                              ))}
                            </select>
                          ) : (
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
                              placeholder="No subcategories available. Enter manually if needed."
                            />
                          );
                        })()
                      ) : (
                        <input
                          type="text"
                          value={productForm.subCategory}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              subCategory: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                          placeholder="Please select a category first"
                          disabled
                        />
                      )}
                      {productForm.category && (
                        <p className="mt-1 text-xs text-gray-500">
                          {(() => {
                            const selectedCategory = categories.find(
                              (cat) => cat._id === productForm.category
                            );
                            const subcategories =
                              selectedCategory?.subcategories || [];
                            return subcategories.length > 0
                              ? `Select from ${subcategories.length} available subcategories`
                              : "This category has no subcategories. You can enter one manually.";
                          })()}
                        </p>
                      )}
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
                        <option value="grams">Grams</option>
                        <option value="liter">Liter</option>
                        <option value="ml">ML</option>
                        <option value="box">Box</option>
                        <option value="meter">Meter</option>
                        <option value="tray">Tray</option>
                        <option value="bottel">Bottel</option>
                        <option value="jar">Jar</option>
                        <option value="pkt">Pkt</option>
                        <option value="roll">Roll</option>
                        <option value="sheet">Sheet</option>
                        <option value="pouch">Pouch</option>
                        <option value="bowl">Bowl </option>
                        <option value="cup">Cup</option>
                        <option value="plate">Plate</option>
                        <option value="spoon">Spoon</option>
                        <option value="fork">Fork</option>
                        <option value="knife">Knife</option>
                        <option value="chopstick">Chopstick</option>
                        <option value="other">Other</option>
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
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
            <div className="space-y-4">
              <CityForm
                cityForm={cityForm}
                setCityForm={setCityForm}
                handleCitySubmit={handleCitySubmit}
                loading={loading}
              />
            </div>
          )}

          {/* Add Category Tab */}
          {activeTab === "add-category" && (
            <div className="space-y-4">
              <CategoryForm
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
                editingCategoryId={editingCategoryId}
                handleCategorySubmit={handleCategorySubmit}
                loading={loading}
                setEditingCategoryId={setEditingCategoryId}
                setError={setError}
                setSuccess={setSuccess}
                generateSlug={generateSlug}
                getToken={getToken}
              />
            </div>
          )}

          {/* Add Category Tab - OLD */}
          {false && activeTab === "add-category-old" && (
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
                    Subcategories
                  </label>
                  <div className="space-y-2">
                    {categoryForm.subcategories.map((subcat, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={subcat}
                          onChange={(e) => {
                            const newSubcategories = [...categoryForm.subcategories];
                            newSubcategories[index] = e.target.value;
                            setCategoryForm({
                              ...categoryForm,
                              subcategories: newSubcategories,
                            });
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter subcategory name"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSubcategories = categoryForm.subcategories.filter(
                              (_, i) => i !== index
                            );
                            setCategoryForm({
                              ...categoryForm,
                              subcategories: newSubcategories,
                            });
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryForm({
                          ...categoryForm,
                          subcategories: [...categoryForm.subcategories, ""],
                        });
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      + Add Subcategory
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Add subcategories for this category (optional).
                  </p>
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
                          subcategories: [],
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
            <div className="space-y-4">
              <VendorForm
                vendorForm={vendorForm}
                setVendorForm={setVendorForm}
                cities={cities}
                handleVendorSubmit={handleVendorSubmit}
                loading={loading}
              />
            </div>
          )}

          {/* Add Vendor Tab - OLD */}
          {false && activeTab === "add-vendor-old" && (
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
              <div className="space-y-4">
                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Search Product
                      </label>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productFilters.search}
                        onChange={(e) => {
                          setProductFilters({
                            ...productFilters,
                            search: e.target.value,
                          });
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={productFilters.category}
                        onChange={(e) => {
                          setProductFilters({
                            ...productFilters,
                            category: e.target.value,
                            subCategory: "", // Reset subcategory when category changes
                          });
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={productFilters.subCategory}
                        onChange={(e) => {
                          setProductFilters({
                            ...productFilters,
                            subCategory: e.target.value,
                          });
                        }}
                        disabled={!productFilters.category}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">All Subcategories</option>
                        {availableSubCategories.map((subCategory, index) => (
                          <option key={index} value={subCategory}>
                            {subCategory}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={productFilters.status}
                        onChange={(e) => {
                          setProductFilters({
                            ...productFilters,
                            status: e.target.value,
                          });
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(productFilters.search || productFilters.category || productFilters.subCategory || productFilters.status) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setProductFilters({
                            search: "",
                            category: "",
                            subCategory: "",
                            status: "",
                          });
                        }}
                        className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                <ProductsTable
                  products={products}
                  productsPage={productsPage}
                  setProductsPage={setProductsPage}
                  itemsPerPage={itemsPerPage}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              </div>
          )}

          {/* Product Catalog Tab */}
          {activeTab === "product-catalog" && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No products found in catalog
                    </div>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product._id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="aspect-square bg-white flex items-center justify-center">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url || product.images[0]}
                              alt={product.productName}
                              className="w-full h-full object-contain p-4"
                            />
                          ) : (
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 truncate mb-1">{product.productName}</h3>
                          {product.category && (
                            <p className="text-xs text-gray-500 mb-2">
                              {product.category.name || (typeof product.category === 'string' ? product.category : 'N/A')}
                            </p>
                          )}
                          {product.shortDescription && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {product.shortDescription}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Products Tab - OLD */}
          {false && activeTab === "products-old" && (() => {
            const totalPages = getTotalPages(products, itemsPerPage);
            const paginatedProducts = getPaginatedData(products, productsPage, itemsPerPage);

            return (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold">All Products</h2>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
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
                      {paginatedProducts.map((product) => (
                        <tr key={product._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.img ? (
                              <img
                                src={product.img}
                                alt={product.productName || "Product"}
                                className="h-12 w-12 object-contain p-1 bg-white rounded"
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {product.category?.name || product.category || "N/A"}
                            </div>
                            {product.subCategory && (
                              <div className="text-xs text-gray-400">
                                {product.subCategory}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${product.status
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
                  {paginatedProducts.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No products found
                    </div>
                  )}
                </div>
                {/* Pagination Controls */}
                {products.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(productsPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(productsPage * itemsPerPage, products.length)} of{" "}
                      {products.length} products
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProductsPage((prev) => Math.max(1, prev - 1))}
                        disabled={productsPage === 1}
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
                              (page >= productsPage - 1 && page <= productsPage + 1)
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
                                  onClick={() => setProductsPage(page)}
                                  className={`px-3 py-2 text-sm border rounded-lg ${productsPage === page
                                    ? "bg-purple-600 text-white border-purple-600"
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
                        onClick={() => setProductsPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={productsPage === totalPages}
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

          {/* All Cities Tab */}
          {activeTab === "cities" && (
            <div className="space-y-4">
              <CitiesTable cities={cities} handleDelete={handleDelete} />
            </div>
          )}

          {/* All Cities Tab - OLD */}
          {false && activeTab === "cities-old" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">All Cities</h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
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
                            className={`px-2 py-1 text-xs rounded-full ${city.isActive
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
            <div className="space-y-4">
              <CategoriesTable
                categories={categories}
                handleEditCategory={handleEditCategory}
                handleDelete={handleDelete}
              />
            </div>
          )}

          {/* All Categories Tab - OLD */}
          {false && activeTab === "categories-old" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">All Categories</h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
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
                            className={`px-2 py-1 text-xs rounded-full ${category.isActive
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

          {/* Order Records Tab */}
          {activeTab === "order-records" && (
            <div className="space-y-4">
              <OrderRecords userRole="super_admin" />
            </div>
          )}

          {/* All Vendors Tab */}
          {activeTab === "vendors" && (
            <div className="space-y-4">
              <VendorsTable vendors={vendors} handleDelete={handleDelete} />
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Filters Section */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Search by Name, Mobile, or City
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, mobile number, or city..."
                      value={userFilters.search}
                      onChange={(e) => {
                        setUserFilters({
                          ...userFilters,
                          search: e.target.value,
                        });
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      value={`${userFilters.sortBy}-${userFilters.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setUserFilters({
                          ...userFilters,
                          sortBy,
                          sortOrder,
                        });
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="name-asc">Ascending Order by Name</option>
                      <option value="name-desc">Descending Order by Name</option>
                      <option value="createdAt-desc">Newly Added</option>
                      <option value="createdAt-asc">Old Added</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(userFilters.search || userFilters.sortBy !== "createdAt" || userFilters.sortOrder !== "desc") && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setUserFilters({
                          search: "",
                          sortBy: "createdAt",
                          sortOrder: "desc",
                        });
                      }}
                      className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <UsersTable users={users} loading={usersLoading} />
            </div>
          )}

          {/* Add Testimonial Tab */}
          {activeTab === "add-testimonial" && (
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleTestimonialSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review *
                  </label>
                  <textarea
                    value={testimonialForm.review}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        review: e.target.value,
                      })
                    }
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the review/testimonial text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.name}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.businessType}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        businessType: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter business type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={testimonialForm.location}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        location: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="testimonialStatus"
                    checked={testimonialForm.status}
                    onChange={(e) =>
                      setTestimonialForm({
                        ...testimonialForm,
                        status: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="testimonialStatus"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Active Status
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Saving..."
                      : editingTestimonialId
                        ? "Update Testimonial"
                        : "Create Testimonial"}
                  </button>
                  {editingTestimonialId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTestimonialId(null);
                        setTestimonialForm({
                          review: "",
                          name: "",
                          businessType: "",
                          location: "",
                          status: true,
                        });
                        setActiveTab("testimonials");
                      }}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* All Testimonials Tab */}
          {activeTab === "testimonials" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Review
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
                    {testimonials.map((testimonial) => (
                      <tr key={testimonial._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {testimonial.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testimonial.businessType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testimonial.location}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {testimonial.review}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${testimonial.status
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                              }`}
                          >
                            {testimonial.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTestimonialEdit(testimonial)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleToggleTestimonialStatus(testimonial._id)
                              }
                              className={`${testimonial.status
                                ? "text-orange-600 hover:text-orange-900"
                                : "text-green-600 hover:text-green-900"
                                }`}
                            >
                              {testimonial.status ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() =>
                                handleDelete("testimonials", testimonial._id)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {testimonials.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No testimonials found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All Vendors Tab - OLD */}
          {false && activeTab === "vendors-old" && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">All Vendors</h2>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
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
                            className={`px-2 py-1 text-xs rounded-full ${vendor.isActive
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
        </main>
      </div>

      {/* Global Scrollbar Hide Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
