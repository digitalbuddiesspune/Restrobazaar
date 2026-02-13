import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const VENDOR_BASE = '/vendor/dashboard';

// Parse pathname to get activeTab and optional IDs (orderId, productId for edit)
function useVendorRoute() {
  const location = useLocation();
  const params = useParams();
  const path = (location.pathname || '').replace(/^\/vendor\/dashboard\/?/, '') || 'overview';
  const segments = path.split('/').filter(Boolean);

  const activeTab = useMemo(() => {
    if (!segments[0]) return 'overview';
    if (segments[0] === 'overview') return 'overview';
    if (segments[0] === 'products') {
      if (segments[1] === 'add') return 'add-product';
      return 'products';
    }
    if (segments[0] === 'catalog') return 'catalog';
    if (segments[0] === 'orders') return 'orders';
    if (segments[0] === 'unpaid-customers') return 'unpaid-customers';
    if (segments[0] === 'order-records') return 'order-records';
    if (segments[0] === 'create-order') return 'create-order';
    if (segments[0] === 'create-user') return 'create-user';
    if (segments[0] === 'coupons') {
      if (segments[1] === 'add') return 'add-coupon';
      return 'coupons';
    }
    if (segments[0] === 'account') return 'account';
    return 'overview';
  }, [path, segments]);

  const selectedOrderId = useMemo(() => {
    if (activeTab === 'orders' && segments[0] === 'orders' && segments[1]) return segments[1];
    return null;
  }, [activeTab, segments]);

  const editingProductId = useMemo(() => {
    if (activeTab === 'add-product' && segments[0] === 'products' && segments[1] === 'add' && segments[2]) return segments[2];
    return null;
  }, [activeTab, segments]);

  return { activeTab, selectedOrderId, editingProductId, segments };
}
import Sidebar from '../components/vendor/Sidebar';
import Header from '../components/vendor/Header';
import StatsCard from '../components/vendor/StatsCard';
import ProductTable from '../components/vendor/ProductTable';
import CatalogTable from '../components/vendor/CatalogTable';
import ProductForm from '../components/vendor/ProductForm';
import OrdersTable from '../components/vendor/OrdersTable';
import OrderDetails from '../components/vendor/OrderDetails';
import VendorAccount from '../components/vendor/VendorAccount';
import OrderRecords from '../components/vendor/OrderRecords';
import CouponForm from '../components/vendor/CouponForm';
import CouponsTable from '../components/vendor/CouponsTable';
import UserForm from '../components/vendor/UserForm';
import CreateOrder from '../components/vendor/CreateOrder';
import UnpaidCustomersTable from '../components/vendor/UnpaidCustomersTable';
import OrdersGraph from '../components/super_admin/OrdersGraph';
import { formatOrderId } from '../utils/orderIdFormatter';
import {
  useMyVendorProducts,
  useGlobalProducts,
  useCities,
  useCreateVendorProduct,
  useUpdateVendorProduct,
  useDeleteVendorProduct,
  useToggleStatus,
  useVendorOrders,
  useOrderStats,
  useUpdateOrderStatus,
} from '../hooks/useVendorQueries';
import { useCategories } from '../hooks/useApiQueries';
import { couponAPI } from '../utils/api';
import { orderService } from '../services/vendorService';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const { activeTab, selectedOrderId: selectedOrderIdFromRoute, editingProductId } = useVendorRoute();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const [myProductsPage, setMyProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const selectedOrderId = selectedOrderIdFromRoute;

  const navigateToTab = (tab, options = {}) => {
    if (tab === 'overview') navigate(VENDOR_BASE);
    else if (tab === 'products') navigate(`${VENDOR_BASE}/products`);
    else if (tab === 'catalog') navigate(`${VENDOR_BASE}/catalog`);
    else if (tab === 'add-product') {
      if (options.productId) navigate(`${VENDOR_BASE}/products/add/${options.productId}`);
      else navigate(`${VENDOR_BASE}/products/add`);
    }
    else if (tab === 'orders') {
      if (options.orderId) navigate(`${VENDOR_BASE}/orders/${options.orderId}`);
      else navigate(`${VENDOR_BASE}/orders`);
    }
    else if (tab === 'unpaid-customers') navigate(`${VENDOR_BASE}/unpaid-customers`);
    else if (tab === 'order-records') navigate(`${VENDOR_BASE}/order-records`);
    else if (tab === 'create-order') navigate(`${VENDOR_BASE}/create-order`);
    else if (tab === 'create-user') navigate(`${VENDOR_BASE}/create-user`);
    else if (tab === 'coupons') navigate(`${VENDOR_BASE}/coupons`);
    else if (tab === 'add-coupon') navigate(`${VENDOR_BASE}/coupons/add`);
    else if (tab === 'account') navigate(`${VENDOR_BASE}/account`);
    else navigate(VENDOR_BASE);
  };
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const itemsPerPage = 10;

  // Graph state for monthly orders
  const [monthlyOrdersData, setMonthlyOrdersData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Unpaid orders (all in DB with paymentStatus unpaid) for overview
  const [pendingOrders, setPendingOrders] = useState([]);

  // Filter and Sort states for My Products
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [stockFilter, setStockFilter] = useState('all'); // all, inStock, outOfStock, zeroQuantity
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, stockAsc, stockDesc, nameAsc, nameDesc

  // Filter states for Product Catalog
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');
  const [catalogSubCategoryFilter, setCatalogSubCategoryFilter] = useState('all');
  const [catalogSortBy, setCatalogSortBy] = useState('newest'); // newest, oldest, nameAsc, nameDesc
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('all'); // all, added, notAdded

  // React Query hooks
  const {
    data: vendorProductsData,
    isLoading: vendorProductsLoading,
    error: vendorProductsError,
  } = useMyVendorProducts({ limit: 1000 }, { enabled: activeTab !== 'catalog' });

  const {
    data: globalProductsData,
    isLoading: globalProductsLoading,
  } = useGlobalProducts(
    { status: 'true', limit: 1000 },
    { enabled: activeTab === 'catalog' || activeTab === 'add-product' }
  );

  const { data: citiesData } = useCities();
  const { data: categoriesData } = useCategories();

  // Orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
  } = useVendorOrders(
    { page: ordersPage, limit: itemsPerPage },
    { enabled: activeTab === 'orders' }
  );

  // Fetch all orders for overview tab to calculate today's orders
  const {
    data: allOrdersData,
  } = useVendorOrders(
    { limit: 1000 },
    { enabled: activeTab === 'overview' }
  );

  // Fetch unpaid orders for unpaid customers section
  const {
    data: unpaidOrdersData,
    isLoading: unpaidOrdersLoading,
  } = useVendorOrders(
    { paymentStatus: 'pending', limit: 1000 },
    { enabled: activeTab === 'unpaid-customers' }
  );

  const { data: orderStatsData } = useOrderStats({
    enabled: activeTab === 'overview' || activeTab === 'orders',
  });

  // Mutations
  const createMutation = useCreateVendorProduct();
  const updateMutation = useUpdateVendorProduct();
  const deleteMutation = useDeleteVendorProduct();
  const toggleMutation = useToggleStatus();
  const updateOrderStatusMutation = useUpdateOrderStatus();

  const vendorProducts = vendorProductsData?.data || [];
  const globalProducts = globalProductsData?.data || [];
  const cities = citiesData?.data || [];
  const categories = categoriesData?.data || [];
  const orders = ordersData?.data || [];
  const allOrders = allOrdersData?.data || [];
  const unpaidOrders = unpaidOrdersData?.data || [];
  const orderStats = orderStatsData?.data || {};

  // Get vendor's city from first product
  const vendorCityId = useMemo(() => {
    if (vendorProducts.length > 0) {
      return vendorProducts[0].cityId?._id || vendorProducts[0].cityId;
    }
    return null;
  }, [vendorProducts]);

  // Calculate stats
  const stats = useMemo(() => {
    const products = vendorProducts;
    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status).length,
      lowStock: products.filter(
        (p) => p.notifyQuantity && p.availableStock <= p.notifyQuantity
      ).length,
      totalStock: products.reduce((sum, p) => {
        // Handle different data types and ensure we get a valid number
        let stock = 0;
        if (p.availableStock !== null && p.availableStock !== undefined) {
          if (typeof p.availableStock === 'number') {
            stock = isNaN(p.availableStock) ? 0 : p.availableStock;
          } else if (typeof p.availableStock === 'string') {
            const parsed = parseFloat(p.availableStock);
            stock = isNaN(parsed) ? 0 : parsed;
          }
        }
        // Add all valid numbers (including 0)
        return sum + stock;
      }, 0),
    };
  }, [vendorProducts]);

  // Calculate today's orders statistics
  const todayOrdersStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });
    
    return {
      total: todayOrders.length,
      canceled: todayOrders.filter((order) => order.orderStatus === 'cancelled').length,
      delivered: todayOrders.filter((order) => order.orderStatus === 'delivered').length,
      pending: todayOrders.filter((order) => order.orderStatus === 'pending').length,
    };
  }, [allOrders]);

  // Get subcategories for selected category (My Products)
  const subCategories = useMemo(() => {
    if (categoryFilter === 'all' || !categoryFilter) return [];
    const selectedCategory = categories.find(cat => cat._id === categoryFilter);
    if (!selectedCategory) return [];
    
    // Get unique subcategories from vendor products in this category
    const categoryProducts = vendorProducts.filter(p => 
      p.productId?.category?._id === categoryFilter || 
      p.productId?.category === categoryFilter
    );
    const uniqueSubCategories = [...new Set(
      categoryProducts
        .map(p => p.productId?.subCategory)
        .filter(Boolean)
    )];
    return uniqueSubCategories;
  }, [categoryFilter, categories, vendorProducts]);

  // Get subcategories for catalog based on selected category
  const catalogSubCategories = useMemo(() => {
    if (catalogCategoryFilter === 'all' || !catalogCategoryFilter) return [];
    const selectedCategory = categories.find(cat => cat._id === catalogCategoryFilter);
    if (!selectedCategory) return [];
    
    // Get unique subcategories from global products in this category
    const categoryProducts = globalProducts.filter(p => 
      p.category?._id === catalogCategoryFilter || 
      p.category === catalogCategoryFilter
    );
    const uniqueSubCategories = [...new Set(
      categoryProducts
        .map(p => p.subCategory)
        .filter(Boolean)
    )];
    return uniqueSubCategories;
  }, [catalogCategoryFilter, categories, globalProducts]);

  // Filter and sort products
  const filteredVendorProducts = useMemo(() => {
    let filtered = [...vendorProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productId?.productName?.toLowerCase().includes(query) ||
          p.cityId?.name?.toLowerCase().includes(query) ||
          p.productId?.shortDescription?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(p => p.status === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(p => p.status === false);
    }

    // Stock filter
    if (stockFilter === 'inStock') {
      filtered = filtered.filter(p => (p.availableStock || 0) > 0);
    } else if (stockFilter === 'outOfStock') {
      filtered = filtered.filter(p => (p.availableStock || 0) === 0);
    } else if (stockFilter === 'zeroQuantity') {
      filtered = filtered.filter(p => (p.availableStock || 0) === 0);
    } else if (stockFilter === 'lowStock') {
      filtered = filtered.filter(p => 
        p.notifyQuantity && (p.availableStock || 0) <= p.notifyQuantity
      );
    }

    // Category filter
    if (categoryFilter !== 'all' && categoryFilter) {
      filtered = filtered.filter(p => 
        p.productId?.category?._id === categoryFilter || 
        p.productId?.category === categoryFilter
      );
    }

    // Subcategory filter
    if (subCategoryFilter !== 'all' && subCategoryFilter) {
      filtered = filtered.filter(p => 
        p.productId?.subCategory === subCategoryFilter
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stockAsc':
          return (a.availableStock || 0) - (b.availableStock || 0);
        case 'stockDesc':
          return (b.availableStock || 0) - (a.availableStock || 0);
        case 'nameAsc':
          return (a.productId?.productName || '').localeCompare(b.productId?.productName || '');
        case 'nameDesc':
          return (b.productId?.productName || '').localeCompare(a.productId?.productName || '');
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return filtered;
  }, [vendorProducts, searchQuery, statusFilter, stockFilter, categoryFilter, subCategoryFilter, sortBy]);

  const filteredGlobalProducts = useMemo(() => {
    let filtered = [...globalProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.productName?.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query) ||
          p.searchTags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (catalogCategoryFilter !== 'all' && catalogCategoryFilter) {
      filtered = filtered.filter(p => 
        p.category?._id === catalogCategoryFilter || 
        p.category === catalogCategoryFilter
      );
    }

    // Subcategory filter
    if (catalogSubCategoryFilter !== 'all' && catalogSubCategoryFilter) {
      filtered = filtered.filter(p => 
        p.subCategory === catalogSubCategoryFilter
      );
    }

    // Catalog status filter (added/not added)
    if (catalogStatusFilter !== 'all') {
      filtered = filtered.filter(p => {
        const isInCatalog = vendorProducts.some(
          (vp) => (vp.productId?._id || vp.productId) === p._id
        );
        if (catalogStatusFilter === 'added') {
          return isInCatalog;
        } else if (catalogStatusFilter === 'notAdded') {
          return !isInCatalog;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (catalogSortBy) {
        case 'nameAsc':
          return (a.productName || '').localeCompare(b.productName || '');
        case 'nameDesc':
          return (b.productName || '').localeCompare(a.productName || '');
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return filtered;
  }, [globalProducts, searchQuery, catalogCategoryFilter, catalogSubCategoryFilter, catalogSortBy, catalogStatusFilter, vendorProducts]);

  // Pagination
  const paginatedVendorProducts = useMemo(() => {
    const start = (myProductsPage - 1) * itemsPerPage;
    return filteredVendorProducts.slice(start, start + itemsPerPage);
  }, [filteredVendorProducts, myProductsPage]);

  const paginatedGlobalProducts = useMemo(() => {
    const start = (catalogPage - 1) * itemsPerPage;
    return filteredGlobalProducts.slice(start, start + itemsPerPage);
  }, [filteredGlobalProducts, catalogPage]);

  const vendorProductsTotalPages = Math.ceil(
    filteredVendorProducts.length / itemsPerPage
  );
  const globalProductsTotalPages = Math.ceil(
    filteredGlobalProducts.length / itemsPerPage
  );
  const ordersTotalPages = Math.ceil(
    (ordersData?.pagination?.total || orders.length) / itemsPerPage
  );

  // Handle errors - Don't redirect immediately on 401, might be cookie loading
  useEffect(() => {
    if (vendorProductsError) {
      const errorMessage =
        vendorProductsError?.response?.data?.message ||
        'Failed to fetch vendor products';
      const status = vendorProductsError?.response?.status;
      
      // Only redirect if it's a clear authentication error (not just loading)
      if (
        (errorMessage.includes('Authentication') || 
         errorMessage.includes('Unauthorized') ||
         errorMessage.includes('Forbidden')) &&
        status === 401 &&
        !vendorProductsLoading // Don't redirect while still loading
      ) {
        console.error('Vendor authentication failed:', errorMessage);
        navigate('/vendor/login');
      }
    }
  }, [vendorProductsError, vendorProductsLoading, navigate]);

  // Sync editingProduct from URL when editing product by id
  useEffect(() => {
    if (activeTab === 'add-product' && editingProductId && vendorProducts.length) {
      const product = vendorProducts.find((p) => (p._id || p.id) === editingProductId);
      setEditingProduct(product || null);
    } else if (activeTab === 'add-product' && !editingProductId) {
      setEditingProduct(null);
    } else if (activeTab !== 'add-product') {
      setEditingProduct(null);
    }
  }, [editingProductId, activeTab, vendorProducts]);

  // Handlers
  const handleLogout = async () => {
    // Cookie clear kara backend logout endpoint kadun
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/vendor/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/vendor/login');
    window.location.reload();
  };

  const handleProductSubmit = async (formData) => {
    try {
      if (editingProduct && editingProduct._id) {
        await updateMutation.mutateAsync({
          id: editingProduct._id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setEditingProduct(null);
      navigateToTab('products');
      setSearchQuery('');
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    navigateToTab('add-product', { productId: product._id || product.id });
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteMutation.mutateAsync(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      await toggleMutation.mutateAsync(productId);
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleAddToCatalog = (product) => {
    setEditingProduct({
      productId: product._id,
      cityId: vendorCityId || '',
    });
    navigateToTab('add-product');
  };

  const isProductInCatalog = (productId) => {
    return vendorProducts.some(
      (vp) => (vp.productId?._id || vp.productId) === productId
    );
  };

  const handleCancel = () => {
    setEditingProduct(null);
    navigateToTab('products');
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    if (window.confirm(`Are you sure you want to update order status to "${status}"?`)) {
      try {
        await updateOrderStatusMutation.mutateAsync({ id: orderId, status });
      } catch (error) {
        console.error('Error updating order status:', error);
        alert(error?.response?.data?.message || 'Failed to update order status');
      }
    }
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const response = await couponAPI.getVendorCoupons();
      if (response.success) {
        setCoupons(response.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch coupons when coupons tab is active
  useEffect(() => {
    if (activeTab === 'coupons' || activeTab === 'add-coupon') {
      fetchCoupons();
    }
  }, [activeTab]);

  // Fetch monthly orders for graph
  const fetchMonthlyOrders = async (year) => {
    try {
      const targetYear = year || selectedYear;
      const startOfYear = new Date(targetYear, 0, 1).toISOString();
      const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).toISOString();

      const response = await orderService.getVendorOrders({
        startDate: startOfYear,
        endDate: endOfYear,
        limit: 20000,
      });

      if (response?.success) {
        const orders = response.data || [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        // Initialize with 0 for both orders and sales
        const monthlyData = monthNames.map(name => ({ name, orders: 0, sales: 0 }));

        orders.forEach(order => {
          const orderDate = new Date(order.createdAt || order.order_date_and_time);

          // Verify year
          const isCorrectYear = !isNaN(orderDate) && orderDate.getFullYear() === targetYear;

          if (isCorrectYear) {
            const monthIndex = orderDate.getMonth();
            monthlyData[monthIndex].orders += 1;
            
            // Calculate sales (total amount) - check different possible fields
            const totalAmount = order.Net_total || 
                               order.billingDetails?.totalAmount || 
                               order.totalAmount || 
                               order.amount || 
                               0;
            monthlyData[monthIndex].sales += totalAmount || 0;
          }
        });

        setMonthlyOrdersData(monthlyData);
      }
    } catch (err) {
      console.error("Error fetching monthly orders:", err);
      setMonthlyOrdersData([]);
    }
  };

  // Fetch monthly orders when year changes or overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchMonthlyOrders(selectedYear);
    }
  }, [selectedYear, activeTab]);

  // Fetch all unpaid orders (paymentStatus: pending) for vendor - no date filter
  const fetchPendingOrders = async () => {
    try {
      const response = await orderService.getVendorOrders({
        paymentStatus: 'pending',
        limit: 1000,
      });

      if (response?.success) {
        const sortedOrders = (response.data || []).sort((a, b) => {
          const dateA = new Date(a.createdAt || a.order_date_and_time || 0);
          const dateB = new Date(b.createdAt || b.order_date_and_time || 0);
          return dateB - dateA;
        });
        setPendingOrders(sortedOrders);
      }
    } catch (err) {
      console.error("Error fetching unpaid orders:", err);
      setPendingOrders([]);
    }
  };

  // Fetch all unpaid orders when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchPendingOrders();
    }
    if (activeTab !== 'orders') {
      setOrderStatusFilter(null);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        navigateToTab={navigateToTab} 
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

        <main className="p-4">
          {/* Back Button - Show on all pages except dashboard, order details, and add-product page */}
          {activeTab !== 'overview' && !selectedOrderId && activeTab !== 'add-product' && (
            <div className="mb-4">
              <button
                onClick={() => navigateToTab('overview')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          )}

          {/* Back to My Products and Product Catalog Buttons - Show only on Edit Product page */}
          {activeTab === 'add-product' && editingProduct && (
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  navigateToTab('products');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to My Products
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  navigateToTab('catalog');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Product Catalog
              </button>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Today's Canceled Orders"
                  value={todayOrdersStats.canceled}
                  icon={
                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  trend="down"
                  trendValue="5%"
                  color="red"
                  comparisonText="vs yesterday"
                  onClick={() => {
                    setOrderStatusFilter('cancelled');
                    navigateToTab('orders');
                  }}
                />
                <StatsCard
                  title="Today's Orders"
                  value={todayOrdersStats.total}
                  icon={
                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  }
                  trend="up"
                  trendValue="12%"
                  color="blue"
                  comparisonText="vs yesterday"
                  onClick={() => {
                    setOrderStatusFilter(null);
                    navigateToTab('orders');
                  }}
                />
                <StatsCard
                  title="Today's Delivered Orders"
                  value={todayOrdersStats.delivered}
                  icon={
                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  }
                  trend="up"
                  trendValue="8%"
                  color="green"
                  comparisonText="vs yesterday"
                  onClick={() => {
                    setOrderStatusFilter('delivered');
                    navigateToTab('orders');
                  }}
                />
                <StatsCard
                  title="Today's Pending Orders"
                  value={todayOrdersStats.pending}
                  icon={
                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  trend="down"
                  trendValue="3%"
                  color="orange"
                  comparisonText="vs yesterday"
                  onClick={() => {
                    setOrderStatusFilter('pending');
                    navigateToTab('orders');
                  }}
                />
              </div>

              {/* Monthly Orders Graph */}
              <OrdersGraph
                ordersData={monthlyOrdersData}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                cities={[]}
                selectedCity=""
                onCityChange={() => {}}
                yAxisTicks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
                yAxisDomain={[0, 50]}
              />

              {/* Unpaid Orders Table - all orders in DB with payment status unpaid */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-800">Unpaid Orders</h2>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                        {pendingOrders.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">All orders with unpaid payment status</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">User ID</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Mobile</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendingOrders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-xs text-gray-500">
                            No unpaid orders found
                          </td>
                        </tr>
                      ) : (
                        pendingOrders.map((order) => {
                          // Use _id for API calls (MongoDB ObjectId), orderNumber is just for display
                          const orderId = order._id || order.order_id || order.id;
                          const displayOrderId = order.orderNumber || order._id || order.order_id;
                          return (
                            <tr key={orderId} className="hover:bg-gray-50 transition-colors cursor-pointer even:bg-gray-50" onClick={() => {
                              navigateToTab('orders', { orderId });
                            }}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900 leading-tight">
                                {formatOrderId(displayOrderId)}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm text-gray-500 leading-tight">{(() => {
                                const userId = order.user_id || order.userId?._id || order.userId || 'N/A';
                                if (!userId || userId === 'N/A') return 'N/A';
                                const idString = String(userId);
                                return idString.length > 6 ? idString.slice(-6) : idString;
                              })()}</span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs mr-3">
                                  {(order.Customer_Name || order.userId?.name || 'U').charAt(0)}
                                </div>
                                <div className="text-sm font-medium text-gray-900 leading-tight">{order.Customer_Name || order.userId?.name || 'Unknown'}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500 leading-tight">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {order.Phone || order.Customer_Mobile_No || order.userId?.phone || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900 leading-tight">₹{order.Net_total || order.totalAmount || order.billingDetails?.totalAmount || 0}</span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                              {new Date(order.createdAt || order.order_date_and_time || order.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                                {order.Order_status || order.orderStatus || 'Pending'}
                              </span>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* My Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">My Products</h1>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    navigateToTab('add-product');
                  }}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Product
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                  trend="up"
                  trendValue="12%"
                  color="blue"
                />
                <StatsCard
                  title="Active Products"
                  value={stats.activeProducts}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  trend="up"
                  trendValue="8%"
                  color="green"
                />
                <StatsCard
                  title="Low Stock"
                  value={stats.lowStock}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                  trend="down"
                  trendValue="5%"
                  color="orange"
                />
                <StatsCard
                  title="Total Stock"
                  value={stats.totalStock.toLocaleString()}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  trend="up"
                  trendValue="15%"
                  color="purple"
                />
              </div>

              {/* Filters and Sort */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter by</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setMyProductsPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Stock Filter */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock Status</label>
                    <select
                      value={stockFilter}
                      onChange={(e) => {
                        setStockFilter(e.target.value);
                        setMyProductsPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Stock</option>
                      <option value="inStock">In Stock</option>
                      <option value="lowStock">Low Stock</option>
                      <option value="outOfStock">Out Of Stock</option>
                      <option value="zeroQuantity">Zero Quantity</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setSubCategoryFilter('all');
                        setMyProductsPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Filter */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subcategory</label>
                    <select
                      value={subCategoryFilter}
                      onChange={(e) => {
                        setSubCategoryFilter(e.target.value);
                        setMyProductsPage(1);
                      }}
                      disabled={categoryFilter === 'all' || subCategories.length === 0}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">All Subcategories</option>
                      {subCategories.map((subCat, idx) => (
                        <option key={idx} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setMyProductsPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="newest">Newly Added first</option>
                      <option value="oldest">Old Added first</option>
                      <option value="stockAsc">Stock Ascending</option>
                      <option value="stockDesc">Stock Descending</option>
                      <option value="nameAsc">Product name Ascending</option>
                      <option value="nameDesc">Product name Descending</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(statusFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all' || sortBy !== 'newest') && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setStockFilter('all');
                        setCategoryFilter('all');
                        setSubCategoryFilter('all');
                        setSortBy('newest');
                        setMyProductsPage(1);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors whitespace-nowrap"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <ProductTable
                products={paginatedVendorProducts}
                isLoading={vendorProductsLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                currentPage={myProductsPage}
                totalPages={vendorProductsTotalPages}
                onPageChange={setMyProductsPage}
              />
            </div>
          )}

          {/* Product Catalog Tab */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">Product Catalog</h1>
              </div>

              <CatalogTable
                products={paginatedGlobalProducts}
                isLoading={globalProductsLoading}
                onAddToCatalog={handleAddToCatalog}
                isProductInCatalog={isProductInCatalog}
                currentPage={catalogPage}
                totalPages={globalProductsTotalPages}
                onPageChange={setCatalogPage}
                searchQuery={searchQuery}
                onSearchChange={(value) => {
                  setSearchQuery(value);
                  setCatalogPage(1);
                }}
                categories={categories}
                subCategories={catalogSubCategories}
                categoryFilter={catalogCategoryFilter}
                subCategoryFilter={catalogSubCategoryFilter}
                onCategoryFilterChange={(value) => {
                  setCatalogCategoryFilter(value);
                  setCatalogSubCategoryFilter('all');
                  setCatalogPage(1);
                }}
                onSubCategoryFilterChange={(value) => {
                  setCatalogSubCategoryFilter(value);
                  setCatalogPage(1);
                }}
                sortBy={catalogSortBy}
                onSortByChange={(value) => {
                  setCatalogSortBy(value);
                  setCatalogPage(1);
                }}
                catalogStatusFilter={catalogStatusFilter}
                onCatalogStatusFilterChange={(value) => {
                  setCatalogStatusFilter(value);
                  setCatalogPage(1);
                }}
              />
            </div>
          )}

          {/* Add/Edit Product Tab */}
          {activeTab === 'add-product' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h1>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              <ProductForm
                product={editingProduct}
                globalProducts={globalProducts}
                cities={cities}
                vendorCityId={vendorCityId}
                onSubmit={handleProductSubmit}
                onCancel={handleCancel}
                isLoading={
                  createMutation.isPending || updateMutation.isPending
                }
              />
            </div>
          )}

          {/* Orders Tab */}
          {/* Unpaid Customers Tab */}
          {activeTab === 'unpaid-customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">Unpaid Customers</h1>
              </div>
              <UnpaidCustomersTable
                orders={unpaidOrders}
                isLoading={unpaidOrdersLoading}
                onOrderClick={(orderId) => navigateToTab('orders', { orderId })}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {!selectedOrderId && (
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                  <h1 className="text-xl font-bold text-gray-900">
                    Orders
                    {orderStatusFilter && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({orderStatusFilter.charAt(0).toUpperCase() + orderStatusFilter.slice(1)})
                      </span>
                    )}
                  </h1>
                  {orderStatusFilter && (
                    <button
                      onClick={() => setOrderStatusFilter(null)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Clear Filter
                    </button>
                  )}
                  {orderStats && (
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="text-gray-600">
                        Total: <span className="font-semibold text-gray-900">{orderStats.totalOrders || 0}</span>
                      </div>
                      <div className="text-gray-600">
                        Pending: <span className="font-semibold text-yellow-600">{orderStats.pendingOrders || 0}</span>
                      </div>
                      <div className="text-gray-600">
                        Delivered: <span className="font-semibold text-green-600">{orderStats.deliveredOrders || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedOrderId ? (
                <OrderDetails
                  orderId={selectedOrderId}
                  onBack={() => {
                    navigateToTab('orders');
                    setOrderStatusFilter(null);
                  }}
                  onUpdateStatus={handleUpdateOrderStatus}
                />
              ) : (
                <OrdersTable
                  orders={orderStatusFilter ? orders.filter(order => {
                    const status = order.orderStatus?.toLowerCase() || 'pending';
                    if (orderStatusFilter === 'cancelled') return status === 'cancelled';
                    if (orderStatusFilter === 'delivered') return status === 'delivered';
                    if (orderStatusFilter === 'pending') return status === 'pending';
                    return true;
                  }) : orders}
                  isLoading={ordersLoading}
                  onUpdateStatus={handleUpdateOrderStatus}
                  currentPage={ordersPage}
                  totalPages={ordersTotalPages}
                  onPageChange={setOrdersPage}
                  onOrderClick={(id) => navigateToTab('orders', { orderId: id })}
                  allOrders={allOrders}
                />
              )}
            </div>
          )}

          {/* Order Records Tab */}
          {activeTab === 'order-records' && (
            <div className="space-y-4">
              <OrderRecords />
            </div>
          )}

          {/* Create Order Tab */}
          {activeTab === 'create-order' && (
            <div className="space-y-4">
              <CreateOrder />
            </div>
          )}

          {/* Create User Tab */}
          {activeTab === 'create-user' && (
            <div className="space-y-4">
              <UserForm
                onSuccess={() => {
                  // Optionally refresh data or show success message
                }}
              />
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
                {!editingCoupon && (
                  <button
                    onClick={() => {
                      setEditingCoupon({});
                      navigateToTab('add-coupon');
                    }}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Coupon
                  </button>
                )}
              </div>

              {editingCoupon ? (
                <CouponForm
                  coupon={editingCoupon}
                  onSubmit={async (couponData) => {
                    try {
                      setCouponsLoading(true);
                      if (editingCoupon._id) {
                        await couponAPI.updateCoupon(editingCoupon._id, couponData);
                      } else {
                        await couponAPI.createCoupon(couponData);
                      }
                      await fetchCoupons();
                      setEditingCoupon(null);
                      navigateToTab('coupons');
                    } catch (error) {
                      alert(error?.response?.data?.message || 'Failed to save coupon');
                    } finally {
                      setCouponsLoading(false);
                    }
                  }}
                  onCancel={() => {
                    setEditingCoupon(null);
                    navigateToTab('coupons');
                  }}
                  isLoading={couponsLoading}
                />
              ) : (
                <CouponsTable
                  coupons={coupons}
                  isLoading={couponsLoading}
                  onEdit={(coupon) => {
                    setEditingCoupon(coupon);
                    navigateToTab('add-coupon');
                  }}
                  onDelete={async (couponId) => {
                    try {
                      await couponAPI.deleteCoupon(couponId);
                      await fetchCoupons();
                    } catch (error) {
                      alert(error?.response?.data?.message || 'Failed to delete coupon');
                    }
                  }}
                  onToggleStatus={async (couponId) => {
                    try {
                      await couponAPI.toggleCouponStatus(couponId);
                      await fetchCoupons();
                    } catch (error) {
                      alert(error?.response?.data?.message || 'Failed to update coupon status');
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Add/Edit Coupon Tab */}
          {activeTab === 'add-coupon' && editingCoupon !== null && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-100 rounded-lg">
                <h1 className="text-xl font-bold text-gray-900">
                  {editingCoupon._id ? 'Edit Coupon' : 'Create Coupon'}
                </h1>
                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    navigateToTab('coupons');
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              <CouponForm
                coupon={editingCoupon}
                onSubmit={async (couponData) => {
                  try {
                    setCouponsLoading(true);
                    if (editingCoupon._id) {
                      await couponAPI.updateCoupon(editingCoupon._id, couponData);
                    } else {
                      await couponAPI.createCoupon(couponData);
                    }
                    await fetchCoupons();
                    setEditingCoupon(null);
                    navigateToTab('coupons');
                  } catch (error) {
                    alert(error?.response?.data?.message || 'Failed to save coupon');
                  } finally {
                    setCouponsLoading(false);
                  }
                }}
                onCancel={() => {
                  setEditingCoupon(null);
                  navigateToTab('coupons');
                }}
                isLoading={couponsLoading}
              />
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <VendorAccount />
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;

