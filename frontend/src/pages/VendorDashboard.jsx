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

  // Orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
  } = useVendorOrders(
    { page: ordersPage, limit: itemsPerPage },
    { enabled: activeTab === 'orders' }
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
  const orders = ordersData?.data || [];
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
      totalStock: products.reduce((sum, p) => sum + (p.availableStock || 0), 0),
    };
  }, [vendorProducts]);

  // Filter products based on search
  const filteredVendorProducts = useMemo(() => {
    if (!searchQuery) return vendorProducts;
    const query = searchQuery.toLowerCase();
    return vendorProducts.filter(
      (p) =>
        p.productId?.productName?.toLowerCase().includes(query) ||
        p.cityId?.name?.toLowerCase().includes(query) ||
        p.productId?.shortDescription?.toLowerCase().includes(query)
    );
  }, [vendorProducts, searchQuery]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon="📦"
                  trend="up"
                  trendValue="12%"
                  color="blue"
                />
                <StatsCard
                  title="Active Products"
                  value={stats.activeProducts}
                  icon="✅"
                  trend="up"
                  trendValue="8%"
                  color="green"
                />
                <StatsCard
                  title="Low Stock"
                  value={stats.lowStock}
                  icon="⚠️"
                  trend="down"
                  trendValue="5%"
                  color="orange"
                />
                <StatsCard
                  title="Total Stock"
                  value={stats.totalStock.toLocaleString()}
                  icon="📊"
                  trend="up"
                  trendValue="15%"
                  color="purple"
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

