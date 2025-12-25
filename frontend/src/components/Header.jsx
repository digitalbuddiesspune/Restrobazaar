import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { categoryCards, titleToSlug } from "./Categories";
import { isAuthenticated, removeToken } from "../utils/auth";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

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
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Sign In/Sign Up Button + Mobile Toggle */}
          <div className="flex items-center space-x-3 sm:space-x-4">
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
