import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CITY_STORAGE_KEY } from './CitySelectionPopup'

// Check authentication status
// Try to import from utils/auth, fallback to localStorage check
let isAuthenticated;
try {
  // eslint-disable-next-line
  const authUtils = require('../utils/auth');
  isAuthenticated = authUtils.isAuthenticated;
} catch (e) {
  // Fallback: check for token in localStorage
  isAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      return !!token;
    } catch {
      return false;
    }
  };
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState({ city: '', pincode: '' })
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const navigate = useNavigate()

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

  useEffect(() => {
    // Get delivery location from localStorage
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || 'Select City';
    const savedPincode = localStorage.getItem('pincode') || '';
    setDeliveryLocation({ city: savedCity, pincode: savedPincode });
  }, [])

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`${baseUrl}/categories`);
        const data = await response.json();
        
        if (data.success) {
          // Filter only active categories and sort by priority
          const activeCategories = data.data
            .filter(cat => cat.isActive !== false)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [baseUrl])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      closeMenu()
    }
  }

  const handleLocationClick = () => {
    // Navigate to a location selection page or show popup
    navigate('/location')
  }

  const handleCategoryClick = (category) => {
    const slug = category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    navigate(`/category/${slug}`);
    closeMenu();
  }

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen)
  }

  const closeAccountDropdown = () => {
    setIsAccountDropdownOpen(false)
  }

  const handleAccountOptionClick = (route) => {
    navigate(route)
    closeAccountDropdown()
    closeMenu()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown')) {
        closeAccountDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountDropdownOpen])

  const userAuthenticated = isAuthenticated()

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Main Header Navigation */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo - Left Side */}
          <div className="shrink-0">
            <NavLink 
              to="/" 
              className="text-lg md:text-xl font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              RestroBazaar
            </NavLink>
          </div>

          {/* Delivery Location */}
          <div 
            onClick={handleLocationClick}
            className="hidden md:flex items-center gap-1 cursor-pointer hover:text-red-600 transition-colors min-w-[120px]"
          >
            <svg 
              className="w-4 h-4 text-gray-600" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Deliver to</span>
              <span className="text-sm font-medium text-gray-700">
                {deliveryLocation.city}
                {deliveryLocation.pincode && `, ${deliveryLocation.pincode}`}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Right Side Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-4">
            {/* About */}
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              About
            </NavLink>

            {/* Contact */}
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              Contact
            </NavLink>

            {/* Account Dropdown */}
            <div className="relative account-dropdown">
              <button
                onClick={toggleAccountDropdown}
                className="text-gray-700 hover:text-red-600 transition-colors font-medium flex items-center gap-1"
              >
                Account
                <svg
                  className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isAccountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {userAuthenticated ? (
                    <button
                      onClick={() => handleAccountOptionClick('/account')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Account
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAccountOptionClick('/signin')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => handleAccountOptionClick('/signup')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Orders */}
            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              Orders
            </NavLink>

            {/* Cart */}
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              <div className="flex items-center gap-1">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Cart</span>
              </div>
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
            {/* Mobile Delivery Location */}
            <div 
              onClick={() => { handleLocationClick(); closeMenu(); }}
              className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
            >
              <svg 
                className="w-5 h-5 text-gray-600" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Deliver to</span>
                <span className="text-sm font-medium text-gray-700">
                  {deliveryLocation.city}
                  {deliveryLocation.pincode && `, ${deliveryLocation.pincode}`}
                </span>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleSearch} className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col pt-2">
              <NavLink
                to="/about"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
              >
                About
              </NavLink>
              
              <NavLink
                to="/contact"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
              >
                Contact
              </NavLink>

              {/* Account Dropdown - Mobile */}
              <div className="border-b border-gray-200 pb-2 mb-2">
                <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase">
                  Account
                </div>
                {userAuthenticated ? (
                  <button
                    onClick={() => handleAccountOptionClick('/account')}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
                  >
                    Account
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleAccountOptionClick('/signin')}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleAccountOptionClick('/signup')}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
                    >
                      Register
                    </button>
                  </>
                )}
              </div>
              
              <NavLink
                to="/orders"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
              >
                Orders
              </NavLink>
              
              <NavLink
                to="/cart"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Cart</span>
                </div>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Categories Strip */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap shrink-0">
                Categories:
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {categories.map((category) => (
                  <button
                    key={category._id || category.name}
                    onClick={() => handleCategoryClick(category)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
