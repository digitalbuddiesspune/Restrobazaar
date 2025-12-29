import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { categoryCards, titleToSlug } from "./Categories";
import { isAuthenticated, removeToken } from "../utils/auth";
import { CITY_STORAGE_KEY, CITIES } from "./CitySelectionPopup";
import { cartAPI } from "../utils/api";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Other');
  const [cartItemCount, setCartItemCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    // Get selected city from localStorage
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY);
    if (savedCity) {
      setSelectedCity(savedCity);
    }
    // Fetch cart count if authenticated
    if (authStatus) {
      fetchCartCount();
    }
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await cartAPI.getCart();
      if (response.success && response.data) {
        const count = response.data.items?.length || 0;
        setCartItemCount(count);
      }
    } catch (err) {
      // Silently fail - user might not have cart yet
      console.error('Failed to fetch cart count:', err);
    }
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    localStorage.setItem(CITY_STORAGE_KEY, newCity);
    setSelectedCity(newCity);
    // Reload page to apply city filter
    window.location.reload();
  };

  const handleSignOut = () => {
    removeToken();
    setAuthenticated(false);
    navigate('/');
    window.location.reload();
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/all-products", label: "Categories" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const linkClass = ({ isActive }) =>
    `font-inter text-base sm:text-lg text-gray-700 hover:text-gray-900 transition-colors ${
      isActive ? "font-semibold text-gray-900" : ""
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-gray-800">
              RestroBazaar
            </h1>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            {/* City Selector */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <select
                value={selectedCity}
                onChange={handleCityChange}
                className="px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors cursor-pointer"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart, Wishlist Icons + Sign In/Sign Up Button + Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Cart and Wishlist Icons - Desktop Only */}
            {authenticated && (
              <div className="hidden md:flex items-center space-x-3">
                {/* Wishlist Icon */}
                <NavLink
                  to="/wishlist"
                  className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
                  aria-label="Wishlist"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </NavLink>

                {/* Cart Icon */}
                <NavLink
                  to="/cart"
                  className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
                  aria-label="Shopping Cart"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </NavLink>
              </div>
            )}

            {authenticated ? (
              <>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm sm:text-base font-inter font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
                <button
                  onClick={handleSignOut}
                  className="sm:hidden px-3 py-1.5 bg-red-600 text-white text-xs font-inter font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/signin"
                  className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm sm:text-base font-inter font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign In / Sign Up
                </NavLink>
                <NavLink
                  to="/signin"
                  className="sm:hidden px-3 py-1.5 bg-red-600 text-white text-xs font-inter font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sign In
                </NavLink>
              </>
            )}
            <button
              type="button"
              className="md:hidden relative h-9 w-9 sm:h-10 sm:w-10 inline-flex flex-col items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span
                className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen
                    ? "rotate-45 top-1/2 -translate-y-1/2"
                    : "top-2"
                }`}
              />
              <span
                className={`absolute top-1/2 -translate-y-1/2 block w-5 h-0.5 bg-current transition-opacity duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen
                    ? "-rotate-45 top-1/2 -translate-y-1/2"
                    : "bottom-2"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen
              ? "max-h-[calc(100vh-80px)] opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="pt-3 pb-2 border-t border-gray-200 flex flex-col">
            {/* Navigation Items */}
            <div className="space-y-2 mb-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${linkClass({ isActive })} py-2 px-2 rounded-lg hover:bg-gray-50 ${
                      isActive ? "bg-gray-50" : ""
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* City Selector - Mobile */}
            <div className="mb-4 px-2 pb-3 border-b border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select City
              </label>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <select
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors cursor-pointer"
                  onClick={() => setMobileOpen(false)}
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories Section */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">
                Categories
              </h3>
              <div className="max-h-[60vh] overflow-y-auto space-y-1">
                {categoryCards.map((category) => (
                  <NavLink
                    key={category.title}
                    to={`/category/${titleToSlug(category.title)}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 px-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-red-50 text-red-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {category.title}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Cart and Wishlist - Mobile */}
            {authenticated && (
              <div className="md:hidden border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center space-x-4 px-2">
                  <NavLink
                    to="/wishlist"
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Wishlist</span>
                  </NavLink>
                  <NavLink
                    to="/cart"
                    className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors relative"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Cart</span>
                    {cartItemCount > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount > 9 ? '9+' : cartItemCount}
                      </span>
                    )}
                  </NavLink>
                </div>
              </div>
            )}

            {/* Sign In/Sign Out Button */}
            {authenticated ? (
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileOpen(false);
                }}
                className="sm:hidden mt-2 px-4 py-2 bg-red-600 text-white text-sm font-inter font-medium rounded-lg hover:bg-red-700 transition-colors text-center w-full"
              >
                Sign Out
              </button>
            ) : (
              <NavLink
                to="/signin"
                className="sm:hidden mt-2 px-4 py-2 bg-red-600 text-white text-sm font-inter font-medium rounded-lg hover:bg-red-700 transition-colors text-center"
                onClick={() => setMobileOpen(false)}
              >
                Sign In / Sign Up
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
