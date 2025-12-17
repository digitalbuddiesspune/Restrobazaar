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
    `font-inter text-gray-700 hover:text-gray-900 transition-colors ${
      isActive ? "font-semibold text-gray-900" : ""
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center">
            <h1 className="text-2xl font-heading font-bold text-gray-800">
              RestroBazaar
            </h1>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Sign In/Sign Up Button + Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <NavLink
              to="/signin"
              className="px-4 py-2 bg-red-600 text-white font-inter font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign In / Sign Up
            </NavLink>
            <button
              type="button"
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span
                className={`block w-5 h-0.5 bg-current transition-transform duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-[6px]" : ""
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current my-1 transition-opacity duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current transition-transform duration-300 ${
                  mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
            mobileOpen ? "max-height-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-4 pb-2 flex flex-col space-y-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
