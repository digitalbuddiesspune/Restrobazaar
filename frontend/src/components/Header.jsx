import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLoginClick = () => {
    closeMenu()
    navigate('/signin')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="shrink-0">
            <NavLink to="/" className="text-2xl md:text-3xl font-bold text-red-600 hover:text-red-700 transition-colors">
              RestroBazaar
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600 border-b-2 border-red-600 pb-1' : ''
                }`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600 border-b-2 border-red-600 pb-1' : ''
                }`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-gray-700 hover:text-red-600 transition-colors font-medium ${
                  isActive ? 'text-red-600 border-b-2 border-red-600 pb-1' : ''
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* Login Button - Desktop */}
          <div className="hidden md:block">
            <button
              onClick={handleLoginClick}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Login / Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              // Close icon (X)
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
              // Hamburger icon
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
            <nav className="flex flex-col space-y-4 pt-4">
              <NavLink
                to="/"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
                end
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
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
                  `px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors font-medium ${
                    isActive ? 'text-red-600 bg-red-50' : ''
                  }`
                }
              >
                Contact
              </NavLink>
              <button
                onClick={handleLoginClick}
                className="mx-4 mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md text-center"
              >
                Login / Sign Up
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
