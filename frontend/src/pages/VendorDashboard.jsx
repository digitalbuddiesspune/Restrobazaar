import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/vendor/Sidebar';
import Header from '../components/vendor/Header';
import StatsCard from '../components/vendor/StatsCard';
import ProductTable from '../components/vendor/ProductTable';
import CatalogTable from '../components/vendor/CatalogTable';
import ProductForm from '../components/vendor/ProductForm';
import OrdersTable from '../components/vendor/OrdersTable';
import OrderDetails from '../components/vendor/OrderDetails';
import VendorAccount from '../components/vendor/VendorAccount';
import OrderRecords from '../components/OrderRecords';
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

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const [myProductsPage, setMyProductsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const itemsPerPage = 10;

  // Filter and Sort states for My Products
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [stockFilter, setStockFilter] = useState('all'); // all, inStock, outOfStock, zeroQuantity
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, stockAsc, stockDesc, nameAsc, nameDesc

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

  // Get subcategories for selected category
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
    if (!searchQuery) return globalProducts;
    const query = searchQuery.toLowerCase();
    return globalProducts.filter(
      (p) =>
        p.productName?.toLowerCase().includes(query) ||
        p.shortDescription?.toLowerCase().includes(query) ||
        p.searchTags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [globalProducts, searchQuery]);

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

  // Handle errors
  useEffect(() => {
    if (vendorProductsError) {
      const errorMessage =
        vendorProductsError?.response?.data?.message ||
        'Failed to fetch vendor products';
      if (
        errorMessage.includes('Authentication') ||
        vendorProductsError?.response?.status === 401
      ) {
        navigate('/vendor/login');
      }
    }
  }, [vendorProductsError, navigate]);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/vendor/login');
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
      setActiveTab('products');
      setSearchQuery('');
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setActiveTab('add-product');
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
    setActiveTab('add-product');
  };

  const isProductInCatalog = (productId) => {
    return vendorProducts.some(
      (vp) => (vp.productId?._id || vp.productId) === productId
    );
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setActiveTab('products');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Dashboard Overview</h1>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Today's Canceled Orders"
                  value={todayOrdersStats.canceled}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  trend="down"
                  trendValue="5%"
                  color="red"
                  comparisonText="vs yesterday"
                />
                <StatsCard
                  title="Today's Orders"
                  value={todayOrdersStats.total}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  trend="up"
                  trendValue="12%"
                  color="blue"
                  comparisonText="vs yesterday"
                />
                <StatsCard
                  title="Today's Delivered Orders"
                  value={todayOrdersStats.delivered}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  }
                  trend="up"
                  trendValue="8%"
                  color="green"
                  comparisonText="vs yesterday"
                />
                <StatsCard
                  title="Today's Pending Orders"
                  value={todayOrdersStats.pending}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  trend="down"
                  trendValue="3%"
                  color="orange"
                  comparisonText="vs yesterday"
                />
              </div>

              {/* Recent Products */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Recent Products
                </h2>
                <ProductTable
                  products={paginatedVendorProducts.slice(0, 5)}
                  isLoading={vendorProductsLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              </div>
            </div>
          )}

          {/* My Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">My Products</h1>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setActiveTab('add-product');
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear all filters
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
              <div className="flex items-center justify-between mb-4">
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
                onSearchChange={setSearchQuery}
              />
            </div>
          )}

          {/* Add/Edit Product Tab */}
          {activeTab === 'add-product' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
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
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Orders</h1>
                {orderStats && (
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="text-gray-600">
                      Total: <span className="font-semibold text-gray-900">{orderStats.totalOrders || 0}</span>
                    </div>
                    <div className="text-gray-600">
                      Pending: <span className="font-semibold text-yellow-600">{orderStats.pendingOrders || 0}</span>
                    </div>
                    <div className="text-gray-600">
                      Completed: <span className="font-semibold text-green-600">{orderStats.completedOrders || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedOrderId ? (
                <OrderDetails
                  orderId={selectedOrderId}
                  onBack={() => setSelectedOrderId(null)}
                  onUpdateStatus={handleUpdateOrderStatus}
                />
              ) : (
                <OrdersTable
                  orders={orders}
                  isLoading={ordersLoading}
                  onUpdateStatus={handleUpdateOrderStatus}
                  currentPage={ordersPage}
                  totalPages={ordersTotalPages}
                  onPageChange={setOrdersPage}
                  onOrderClick={setSelectedOrderId}
                />
              )}
            </div>
          )}

          {/* Order Records Tab */}
          {activeTab === 'order-records' && (
            <div className="space-y-4">
              <OrderRecords userRole="vendor" />
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <VendorAccount />
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">Analytics coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;

