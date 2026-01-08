import { useState } from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'order-records', label: 'Order Records', icon: '📄' },
  ];

  const addSubItems = [
    { id: 'add-product', label: 'Add Product', icon: '➕' },
    { id: 'add-city', label: 'Add City', icon: '🏙️' },
    { id: 'add-category', label: 'Add Category', icon: '📁' },
    { id: 'add-vendor', label: 'Add Vendor', icon: '👤' },
  ];

  const viewSubItems = [
    { id: 'products', label: 'All Products', icon: '📦' },
    { id: 'cities', label: 'All Cities', icon: '🏙️' },
    { id: 'categories', label: 'All Categories', icon: '📁' },
    { id: 'vendors', label: 'All Vendors', icon: '👥' },
  ];

  const isAddActive = ['add-product', 'add-city', 'add-category', 'add-vendor'].includes(activeTab);
  const isViewActive = ['products', 'cities', 'categories', 'vendors'].includes(activeTab);

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
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                SA
              </div>
              <div>
                <p className="font-semibold text-xs">Super Admin</p>
                <p className="text-xs text-gray-300">Dashboard</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden lg:block absolute top-4 right-0 transform translate-x-1/2">
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition text-white shadow-lg"
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
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Overview */}
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose(); // Close sidebar on mobile after selection
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                activeTab === item.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-base">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}

          {/* Add Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isCollapsed) {
                  setAddDropdownOpen(!addDropdownOpen);
                } else {
                  // If collapsed, just switch to first add tab
                  setActiveTab('add-product');
                  onClose();
                }
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isAddActive
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? 'Add' : ''}
            >
              <span className="text-base">➕</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">Add</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${addDropdownOpen ? 'rotate-180' : ''}`}
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
            {!isCollapsed && addDropdownOpen && (
              <div className="mt-1 ml-4 space-y-1">
                {addSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveTab(subItem.id);
                      setAddDropdownOpen(false);
                      onClose(); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                      activeTab === subItem.id
                        ? 'bg-purple-600 text-white shadow-md'
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

          {/* View Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isCollapsed) {
                  setViewDropdownOpen(!viewDropdownOpen);
                } else {
                  // If collapsed, just switch to first view tab
                  setActiveTab('products');
                  onClose();
                }
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isViewActive
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? 'View' : ''}
            >
              <span className="text-base">👁️</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">View All</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${viewDropdownOpen ? 'rotate-180' : ''}`}
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
            {!isCollapsed && viewDropdownOpen && (
              <div className="mt-1 ml-4 space-y-1">
                {viewSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveTab(subItem.id);
                      setViewDropdownOpen(false);
                      onClose(); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                      activeTab === subItem.id
                        ? 'bg-purple-600 text-white shadow-md'
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
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-600">
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg text-white hover:bg-purple-600 hover:text-white transition-all duration-200 text-sm`}
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

