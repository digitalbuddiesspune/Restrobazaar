import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { categoryCards, titleToSlug } from '../components/Categories';
import { productAPI } from '../utils/api';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Get selected city from localStorage
        const selectedCity = localStorage.getItem(CITY_STORAGE_KEY);
        const params = { limit: 100 };
        
        // Add city filter if city is selected and not "Other"
        if (selectedCity && selectedCity !== 'Other') {
          params.city = selectedCity;
        }
        
        const response = await productAPI.getAllProducts(params);
        if (response.success) {
          setProducts(response.data.products);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700 truncate">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold truncate">All Products</span>
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - All Categories */}
          <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="bg-gradient-to-br from-red-50 to-white lg:from-white rounded-lg sm:rounded-xl shadow-lg lg:shadow-sm border-2 lg:border border-red-200 lg:border-gray-200 overflow-hidden lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-120px)] lg:flex lg:flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 z-30 bg-gradient-to-r from-red-600 to-red-500 lg:from-white lg:to-white border-b-2 lg:border-b border-red-300 lg:border-gray-200 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white lg:text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 lg:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span>All Categories</span>
                </h3>
              </div>
              
              {/* Scrollable Categories List */}
              <div className="p-3 sm:p-4 overflow-y-auto flex-1 max-h-[400px] lg:max-h-none">
                <nav className="space-y-1.5 sm:space-y-2">
                  {/* All Products Link */}
                  <Link
                    to="/all-products"
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors mb-2 bg-red-50 text-red-600 font-semibold border border-red-200"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium flex-1">
                      All Products
                    </span>
                  </Link>
                  
                  {categoryCards.map((cat) => (
                    <Link
                      key={cat.title}
                      to={`/category/${titleToSlug(cat.title)}`}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={cat.image}
                          alt={cat.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium flex-1 line-clamp-2">
                        {cat.title}
                      </span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                All Products
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Browse all products from all categories
              </p>
            </div>

            {/* Products from All Categories */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-600">No products found</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-5 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                {products.map((product) => {
                  const discount = product.originalPrice && product.originalPrice > product.price 
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;
                  return (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden transform hover:-translate-y-1"
                  >
                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
                      {discount > 0 && (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-red-50 text-red-600 border border-red-200 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                          {discount}% OFF
                        </div>
                      )}
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="h-full w-full flex items-center justify-center text-gray-400" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                        <svg
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-sm text-gray-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // Add to cart logic here
                          }}
                          className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </Link>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;

