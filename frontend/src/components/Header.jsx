import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CITY_STORAGE_KEY, CITY_ID_KEY } from './CitySelectionPopup'
import { isAuthenticated, logout } from '../utils/auth'
import { useAppSelector } from '../store/hooks'
import { selectCartItemsCount } from '../store/slices/cartSlice'
import { useCategories, useServiceableCities, useWishlist } from '../hooks/useApiQueries'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deliveryLocation, setDeliveryLocation] = useState({ city: '', pincode: '' })
  const [userAuthenticated, setUserAuthenticated] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState('')
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const navigate = useNavigate()
  
  // Get cart items count from Redux
  const cartItemsCount = useAppSelector(selectCartItemsCount)

  // React Query hooks for data fetching with caching
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: citiesData, isLoading: citiesLoading } = useServiceableCities()
  const { data: wishlistData } = useWishlist({ enabled: userAuthenticated })

  // Process categories - filter active and sort by priority
  const categories = categoriesData?.success 
    ? (categoriesData.data || [])
        .filter(cat => cat.isActive !== false)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    : []

  // Get cities from response
  const cities = citiesData?.success && citiesData?.data ? citiesData.data : []

  // Get wishlist count
  const wishlistCount = wishlistData?.success && wishlistData?.data?.products
    ? wishlistData.data.products.length
    : 0

  // Check authentication status on mount and when auth changes
  useEffect(() => {
    const checkAuth = () => {
      setUserAuthenticated(isAuthenticated())
    }
    
    // Check initial auth status
    checkAuth()
    
    // Listen for auth changes
    window.addEventListener('authChange', checkAuth)
    
    return () => {
      window.removeEventListener('authChange', checkAuth)
    }
  }, [])

  useEffect(() => {
    // Get delivery location from localStorage
    const updateDeliveryLocation = () => {
      const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || 'Select City';
      const savedPincode = localStorage.getItem('pincode') || '';
      const savedCityId = localStorage.getItem(CITY_ID_KEY) || '';
      setDeliveryLocation({ city: savedCity, pincode: savedPincode });
      setSelectedCityId(savedCityId);
    };
    
    // Initial load
    updateDeliveryLocation();
    
    // Listen for city changes
    window.addEventListener('cityChange', updateDeliveryLocation);
    
    return () => {
      window.removeEventListener('cityChange', updateDeliveryLocation);
    };
  }, [])


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    setIsMobileSearchOpen(false) // Close search when menu opens
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen)
    setIsMenuOpen(false) // Close menu when search opens
  }

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      closeMenu()
      closeMobileSearch()
    }
  }

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    if (cityId) {
      const selectedCity = cities.find(c => c._id === cityId);
      if (selectedCity) {
        // Save selected city to localStorage
        localStorage.setItem(CITY_STORAGE_KEY, selectedCity.displayName);
        localStorage.setItem(CITY_ID_KEY, selectedCity._id);
        
        // Update state
        setSelectedCityId(cityId);
        setDeliveryLocation({ 
          city: selectedCity.displayName, 
          pincode: deliveryLocation.pincode 
        });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cityChange'));
      }
    }
  }

  const handleCitySelect = (cityId) => {
    if (cityId) {
      const selectedCity = cities.find(c => c._id === cityId);
      if (selectedCity) {
        // Save selected city to localStorage
        localStorage.setItem(CITY_STORAGE_KEY, selectedCity.displayName);
        localStorage.setItem(CITY_ID_KEY, selectedCity._id);
        
        // Update state
        setSelectedCityId(cityId);
        setDeliveryLocation({ 
          city: selectedCity.displayName, 
          pincode: deliveryLocation.pincode 
        });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('cityChange'));
      }
    }
    setIsCityDropdownOpen(false);
  }

  const toggleCityDropdown = () => {
    setIsCityDropdownOpen(!isCityDropdownOpen);
  }

  const closeCityDropdown = () => {
    setIsCityDropdownOpen(false);
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
    // Handle modal routes
    if (route === '/signin' && window.openSignInModal) {
      window.openSignInModal();
    } else if (route === '/signup' && window.openSignUpModal) {
      window.openSignUpModal();
    } else if (route === '/super_admin/login' && window.openSuperAdminLoginModal) {
      window.openSuperAdminLoginModal();
    } else if (route === '/vendor/login' && window.openVendorLoginModal) {
      window.openVendorLoginModal();
    } else {
      navigate(route);
    }
    closeAccountDropdown();
    closeMenu();
  }

  const handleLogout = async () => {
    closeAccountDropdown()
    closeMenu()
    
    // Show confirmation alert
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (confirmed) {
      await logout()
      navigate('/signin')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAccountDropdownOpen && !event.target.closest('.account-dropdown')) {
        closeAccountDropdown()
      }
      if (isCityDropdownOpen && !event.target.closest('.city-dropdown')) {
        closeCityDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountDropdownOpen, isCityDropdownOpen])

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Main Header Navigation */}
      <div className="w-full px-1 sm:px-2 md:px-3">
        <div className="flex items-center justify-between h-12 sm:h-14 md:h-16 gap-1.5 sm:gap-2 md:gap-3">
          {/* Logo - Left Side */}
          <div className="shrink-0">
            <NavLink 
              to="/" 
              className="block"
            >
              {/* Hardcoded logo text - commented out */}
              {/* <span className="text-lg md:text-xl font-semibold text-red-600 hover:text-red-700 transition-colors">
                RestroBazaar
              </span> */}
              
              {/* Logo Image */}
              <img 
                src="https://res.cloudinary.com/debhhnzgh/image/upload/v1767956041/RestroLogo_vmcnsl.png?v=2" 
                alt="RestroBazaar Logo" 
                className="h-10 sm:h-7 md:h-8 lg:h-10 xl:h-12 w-auto rounded-lg object-contain max-w-full"
              />
            </NavLink>
          </div>

          {/* Delivery Location */}
          <div className="hidden lg:flex items-center gap-2 min-w-[140px] lg:min-w-[160px] xl:min-w-[180px] city-dropdown relative">
            <svg 
              className="w-4 h-4 text-gray-600 shrink-0" 
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
            <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-500 whitespace-nowrap">Deliver to</span>
                <button
                  onClick={toggleCityDropdown}
                  disabled={citiesLoading}
                  className="text-xs sm:text-sm font-medium bg-transparent border-none outline-none cursor-pointer pr-4 truncate text-left flex items-center gap-1"
                >
                <span className={selectedCityId ? 'text-red-600' : 'text-gray-700'}>
                  {deliveryLocation.city || 'Select City'}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''} ${selectedCityId ? 'text-red-600' : 'text-gray-600'}`}
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
              
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border-2 border-gray-200 z-50 max-h-80 overflow-y-auto">
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => handleCitySelect('')}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                          !selectedCityId 
                            ? 'text-red-600 bg-red-50 border-red-200' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                        }`}
                      >
                        Select City
                      </button>
                    </li>
                    {cities.map((city) => (
                      <li key={city._id}>
                        <button
                          onClick={() => handleCitySelect(city._id)}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                            selectedCityId === city._id
                              ? 'text-red-600 bg-red-50 border-red-200'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                          }`}
                        >
                          {city.displayName}{city.state ? `, ${city.state}` : ''}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-md xl:max-w-lg mx-1 lg:mx-2"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-3 py-1 pl-8 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <svg
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5">
            {/* About */}
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-xs sm:text-sm text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap ${
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
                `text-xs sm:text-sm text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap ${
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
                className="text-xs sm:text-sm text-gray-700 hover:text-red-600 transition-colors font-medium flex items-center gap-1 whitespace-nowrap"
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
                    <>
                      <button
                        onClick={() => handleAccountOptionClick('/account')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Account
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </>
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
                `text-xs sm:text-sm text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              Orders
            </NavLink>

            {/* Wishlist */}
            <NavLink
              to="/wishlist"
              className={({ isActive }) =>
                `relative text-sm xl:text-base text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
            </NavLink>

            {/* Cart */}
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `relative text-sm xl:text-base text-gray-700 hover:text-red-600 transition-colors font-medium whitespace-nowrap ${
                  isActive ? 'text-red-600' : ''
                }`
              }
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </div>
            </NavLink>
          </nav>

          {/* Mobile Search Icon and Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Search Icon Button */}
            <button
              onClick={toggleMobileSearch}
              className="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
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
        </div>

        {/* Mobile Search Bar - Shows in Header */}
        {isMobileSearchOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-2 py-2">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full px-3 py-1.5 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 mt-2 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide pb-4">
            {/* Mobile Delivery Location */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 city-dropdown relative">
              <svg 
                className="w-5 h-5 text-gray-600 shrink-0" 
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
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs text-gray-500 mb-1">Deliver to</span>
                <button
                  onClick={toggleCityDropdown}
                  disabled={citiesLoading}
                  className="text-sm font-medium bg-white border-2 border-gray-300 rounded px-3 py-2 w-full cursor-pointer text-left flex items-center justify-between hover:border-red-400 transition-colors"
                >
                  <span className={selectedCityId ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {deliveryLocation.city || 'Select City'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''} ${selectedCityId ? 'text-red-600' : 'text-gray-600'}`}
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
                
                {isCityDropdownOpen && (
                  <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-lg shadow-lg border-2 border-gray-200 z-50 max-h-80 overflow-y-auto">
                    <ul className="py-2">
                      <li>
                        <button
                          onClick={() => handleCitySelect('')}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                            !selectedCityId 
                              ? 'text-red-600 bg-red-50 border-red-200' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                          }`}
                        >
                          Select City
                        </button>
                      </li>
                      {cities.map((city) => (
                        <li key={city._id}>
                          <button
                            onClick={() => handleCitySelect(city._id)}
                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                              selectedCityId === city._id
                                ? 'text-red-600 bg-red-50 border-red-200'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                            }`}
                          >
                            {city.displayName}{city.state ? `, ${city.state}` : ''}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

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
                  <>
                    <button
                      onClick={() => handleAccountOptionClick('/account')}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
                    >
                      Account
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </>
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
            </nav>

            {/* Categories - Inside Mobile Menu */}
            {!categoriesLoading && categories.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 mt-2">
                <div className="w-full px-4 py-2">
                  <span className="text-xs font-semibold text-gray-600 block mb-2">
                    Categories:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {categories.map((category) => (
                      <button
                        key={category._id || category.name}
                        onClick={() => {
                          handleCategoryClick(category);
                          closeMenu();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Categories Strip - Horizontal (All screen sizes) */}
      {!isMenuOpen && !categoriesLoading && categories.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="w-full px-1 sm:px-2 md:px-3">
            <div className="flex items-center gap-1 sm:gap-1.5 py-1 sm:py-2 overflow-x-auto scrollbar-hide">
              
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                {categories.map((category) => (
                  <button
                    key={category._id || category.name}
                    onClick={() => handleCategoryClick(category)}
                    className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors whitespace-nowrap shrink-0"
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
