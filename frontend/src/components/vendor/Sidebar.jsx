import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  const productSubItems = [
    { id: 'products', label: 'My Products', icon: '📦' },
    { id: 'catalog', label: 'Product Catalog', icon: '🛍️' },
    { id: 'add-product', label: 'Add Product', icon: '➕' },
  ];

  const isProductActive = ['products', 'catalog', 'add-product'].includes(activeTab);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-[#2b2b2b] text-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 border-b border-gray-600 ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold">R</span>
          ) : (
            <h1 className="text-lg font-bold">RestroBazaar</h1>
          )}
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-3 border-b border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#e50914] rounded-full flex items-center justify-center text-sm font-semibold">
                V
              </div>
              <div>
                <p className="font-semibold text-xs">Vendor</p>
                <p className="text-xs text-gray-300">Dashboard</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:block absolute top-4 right-0 transform translate-x-1/2">
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 bg-[#e50914] rounded-full flex items-center justify-center hover:bg-[#f40612] transition text-white shadow-lg"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {/* Products Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isCollapsed) {
                  setProductDropdownOpen(!productDropdownOpen);
                } else {
                  // If collapsed, just switch to first product tab
                  setActiveTab('products');
                  onClose();
                }
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isProductActive
                  ? 'bg-[#e50914] text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? 'Products' : ''}
            >
              <span className="text-base">📦</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">Products</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${productDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {!isCollapsed && productDropdownOpen && (
              <div className="mt-1 ml-4 space-y-1">
                {productSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveTab(subItem.id);
                      setProductDropdownOpen(false);
                      onClose(); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                      activeTab === subItem.id
                        ? 'bg-[#e50914] text-white shadow-md'
                        : 'text-gray-300 hover:bg-[#4a4a4a] hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{subItem.icon}</span>
                    <span className="font-medium">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Other Menu Items */}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose(); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                activeTab === item.id
                  ? 'bg-[#e50914] text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-base">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-600">
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg text-white hover:bg-[#e50914] hover:text-white transition-all duration-200 text-sm`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <span className="text-base">🚪</span>
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

