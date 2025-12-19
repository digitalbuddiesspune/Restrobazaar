import { useState } from "react";
import { NavLink } from "react-router-dom";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  const linkClass = ({ isActive }) =>
    `font-inter text-base sm:text-lg text-gray-700 hover:text-gray-900 transition-colors ${
      isActive ? "font-semibold text-gray-900" : ""
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
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
              ? "max-h-64 opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="pt-3 pb-2 border-t border-gray-200 flex flex-col space-y-2">
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
            <NavLink
              to="/signin"
              className="sm:hidden mt-2 px-4 py-2 bg-red-600 text-white text-sm font-inter font-medium rounded-lg hover:bg-red-700 transition-colors text-center"
              onClick={() => setMobileOpen(false)}
            >
              Sign In / Sign Up
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
