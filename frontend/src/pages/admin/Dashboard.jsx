import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI } from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    activeProducts: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productAPI.getAllProducts({ limit: 1 }),
          categoryAPI.getAllCategories()
        ]);

        setStats({
          totalProducts: productsRes.data?.pagination?.total || 0,
          totalCategories: categoriesRes.data?.length || 0,
          activeProducts: productsRes.data?.products?.filter(p => p.isActive)?.length || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/admin/products'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      icon: '✅',
      color: 'bg-green-500',
      link: '/admin/products'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: '📁',
      color: 'bg-purple-500',
      link: '/admin/categories'
    },
    {
      title: 'Orders',
      value: 0,
      icon: '🛒',
      color: 'bg-orange-500',
      link: '/admin/orders'
    }
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to the admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} rounded-full p-3 text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/products/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <div>
                <p className="font-semibold text-gray-900">Add New Product</p>
                <p className="text-sm text-gray-600">Create a new product</p>
              </div>
            </Link>
            <Link
              to="/admin/categories/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📁</span>
              <div>
                <p className="font-semibold text-gray-900">Add New Category</p>
                <p className="text-sm text-gray-600">Create a new category</p>
              </div>
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-semibold text-gray-900">Manage Products</p>
                <p className="text-sm text-gray-600">View and edit products</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






