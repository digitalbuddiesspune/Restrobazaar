import { useState, useEffect } from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const mainMenuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'order-records', label: 'Order Records', icon: '📄' },
  ];

  // Sections with sub-items
  const sections = [
    {
      id: 'products',
      label: 'Products',
      icon: '📦',
      subItems: [
        { id: 'products', label: 'View Products', icon: '👁️' },
        { id: 'add-product', label: 'Add Product', icon: '➕' },
      ],
    },
    {
      id: 'cities',
      label: 'Cities',
      icon: '🏙️',
      subItems: [
        { id: 'cities', label: 'View Cities', icon: '👁️' },
        { id: 'add-city', label: 'Add City', icon: '➕' },
      ],
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: '📁',
      subItems: [
        { id: 'categories', label: 'View Categories', icon: '👁️' },
        { id: 'add-category', label: 'Add Category', icon: '➕' },
      ],
    },
    {
      id: 'vendors',
      label: 'Vendors',
      icon: '👥',
      subItems: [
        { id: 'vendors', label: 'View Vendors', icon: '👁️' },
        { id: 'add-vendor', label: 'Add Vendor', icon: '➕' },
      ],
    },
    {
      id: 'users',
      label: 'Users',
      icon: '👤',
      subItems: [
        { id: 'users', label: 'View Users', icon: '👁️' },
      ],
    },
    {
      id: 'testimonials',
      label: 'Testimonials',
      icon: '⭐',
      subItems: [
        { id: 'testimonials', label: 'View All Reviews', icon: '👁️' },
        { id: 'add-testimonial', label: 'Add Review', icon: '➕' },
      ],
    },
  ];

  // Auto-expand section if activeTab belongs to it
  const getInitialExpandedSection = () => {
    for (const section of sections) {
      if (section.subItems.some(item => item.id === activeTab)) {
        return section.id;
      }
    }
    return null;
  };
  
  const [expandedSection, setExpandedSection] = useState(getInitialExpandedSection());
  
  // Update expanded section when activeTab changes
  useEffect(() => {
    const newExpandedSection = getInitialExpandedSection();
    if (newExpandedSection && newExpandedSection !== expandedSection) {
      setExpandedSection(newExpandedSection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Check if a section is active (any of its subItems matches activeTab)
  const isSectionActive = (section) => {
    return section.subItems.some(item => item.id === activeTab);
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (tabId) => {
    setActiveTab(tabId);
    onClose(); // Close sidebar on mobile after selection
    setExpandedSection(null); // Close expanded section after selection
    // Scroll to top when clicking Dashboard/Overview
    if (tabId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-sm font-semibold">
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
            className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition text-white shadow-lg"
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
          {/* Main Menu Items */}
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                activeTab === item.id
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-white hover:bg-[#4a4a4a] hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-base">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}

          {/* Sections with Sub-items */}
          {sections.map((section) => {
            const isActive = isSectionActive(section);
            const isExpanded = expandedSection === section.id;

            return (
              <div key={section.id} className="relative">
                <button
                  onClick={() => {
                    if (isCollapsed) {
                      // If collapsed, just switch to first sub-item
                      handleMenuItemClick(section.subItems[0].id);
                    } else {
                      toggleSection(section.id);
                    }
                  }}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-white hover:bg-[#4a4a4a] hover:text-white'
                  }`}
                  title={isCollapsed ? section.label : ''}
                >
                  <span className="text-base">{section.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="font-medium flex-1 text-left">{section.label}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Sub-items Menu */}
                {!isCollapsed && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {section.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleMenuItemClick(subItem.id)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                          activeTab === subItem.id
                            ? 'bg-red-600 text-white shadow-md'
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
            );
          })}
        </nav>

        {/* Visit Website Button */}
        <div className="mt-auto p-3 border-t border-gray-600 bg-[#2b2b2b] flex-shrink-0">
          <a
            href="https://restrobazaar.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg text-white hover:bg-red-600 hover:text-white transition-all duration-200 text-sm`}
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
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'} px-3 py-2 rounded-lg text-white hover:bg-red-600 hover:text-white transition-all duration-200 text-sm`}
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
