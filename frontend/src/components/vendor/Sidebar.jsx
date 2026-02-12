import { useState, useEffect } from 'react';

const Sidebar = ({ activeTab, navigateToTab, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const setActiveTab = navigateToTab;
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'create-user', label: 'Create User', icon: '👥' },
    { id: 'coupons', label: 'Coupons', icon: '🎫' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  const productSubItems = [
    { id: 'products', label: 'My Products', icon: '📦' },
    { id: 'catalog', label: 'Product Catalog', icon: '🛍️' },
    { id: 'add-product', label: 'Add Product', icon: '➕' },
  ];

  const orderSubItems = [
    { id: 'orders', label: 'All Orders', icon: '📋' },
    { id: 'unpaid-customers', label: 'Unpaid Customers', icon: '💳' },
    { id: 'order-records', label: 'Order Records', icon: '📄' },
    { id: 'create-order', label: 'Create Order', icon: '🛒' },
  ];

  const isProductActive = ['products', 'catalog', 'add-product'].includes(activeTab);
  const isOrderActive = ['orders', 'unpaid-customers', 'order-records', 'create-order'].includes(activeTab);

  // Auto-expand dropdowns when a sub-item is active
  useEffect(() => {
    if (isProductActive && !isCollapsed) {
      setProductDropdownOpen(true);
    }
    if (isOrderActive && !isCollapsed) {
      setOrderDropdownOpen(true);
    }
  }, [activeTab, isCollapsed, isProductActive, isOrderActive]);

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
        className={`fixed left-0 top-0 h-full bg-[#2b2b2b] text-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 border-b border-gray-600 flex-shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold">R</span>
          ) : (
            <h1 className="text-lg font-bold">RestroBazaar</h1>
          )}
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-3 border-b border-gray-600 flex-shrink-0">
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide min-h-0">
          {/* Dashboard - First Menu Item */}
          <button
            onClick={() => {
              setActiveTab('overview');
              onClose(); // Close sidebar on mobile after selection
              // Scroll to top of the page
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              activeTab === 'overview'
                ? 'bg-[#e50914] text-white shadow-lg'
                : 'text-white hover:bg-[#4a4a4a] hover:text-white'
            }`}
            title={isCollapsed ? 'Dashboard' : ''}
          >
            <span className="text-base">📊</span>
            {!isCollapsed && <span className="font-medium">Dashboard</span>}
          </button>

          {/* Products Dropdown - Second Menu Item */}
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

          {/* Orders Dropdown - Third Menu Item */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isCollapsed) {
                  setOrderDropdownOpen(!orderDropdownOpen);
                } else {
                  // If collapsed, just switch to first order tab
                  setActiveTab('orders');
                  onClose();
                }
              }}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isOrderActive
                  ? 'bg-[#e50914] text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? 'Orders' : ''}
            >
              <span className="text-base">📋</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">Orders</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${orderDropdownOpen ? 'rotate-180' : ''}`}
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
            {!isCollapsed && orderDropdownOpen && (
              <div className="mt-1 ml-4 space-y-1">
                {orderSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveTab(subItem.id);
                      setOrderDropdownOpen(false);
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

        {/* Visit Website Button */}
        <div className="mt-auto p-3 border-t border-gray-600 bg-[#2b2b2b] flex-shrink-0">
          <a
            href="https://restrobazaar.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg text-white hover:bg-[#e50914] hover:text-white transition-all duration-200 text-sm`}
            title={isCollapsed ? 'Visit Website' : 'Visit RestroBazaar Website'}
          >
            <span className="text-base">🌐</span>
            {!isCollapsed && <span className="font-medium">Visit Website</span>}
          </a>
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-gray-600 bg-[#2b2b2b] flex-shrink-0">
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

      {/* Hide Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Sidebar;

