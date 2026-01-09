import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { vendorProductAPI, getSelectedCityId } from '../utils/api';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    // Get selected city
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || 'Select City';
    setSelectedCity(savedCity);

    // Reset page when query changes
    setPage(1);
  }, [query]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query || query.trim() === '') {
        setLoading(false);
        setProducts([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await vendorProductAPI.searchVendorProducts(query, {
          page,
          limit: 20,
          status: true,
        });

        if (response.success) {
          setProducts(response.data || []);
          setTotalPages(response.pagination?.pages || 1);
          setTotal(response.pagination?.total || 0);
        } else {
          setError(response.message || 'Failed to fetch search results');
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(err.response?.data?.message || 'Failed to load search results. Please try again.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, page]);

  const getProductPrice = (product) => {
    if (product.priceType === 'single' && product.pricing?.single?.price) {
      return `₹${product.pricing.single.price}`;
    } else if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      const firstSlab = product.pricing.bulk[0];
      return `₹${firstSlab.price} (${firstSlab.minQty}-${firstSlab.maxQty} pcs)`;
    }
    return 'Price on request';
  };

  const getProductImage = (product) => {
    if (product.productId?.images && product.productId.images.length > 0) {
      return product.productId.images[0].url || product.productId.images[0];
    }
    return 'https://via.placeholder.com/300x300?text=Product';
  };

  const handleProductClick = (product) => {
    const categorySlug = product.productId?.category?.slug || 
                        product.productId?.category?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (categorySlug) {
      navigate(`/category/${categorySlug}/${product._id}`);
    } else {
      navigate(`/product/${product._id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-sm text-gray-600">
              {total > 0 ? (
                <>
                  Found <span className="font-semibold">{total}</span> result{total !== 1 ? 's' : ''} for "
                  <span className="font-semibold text-red-600">{query}</span>"
                </>
              ) : (
                <>
                  No results found for "<span className="font-semibold text-red-600">{query}</span>"
                </>
              )}
            </p>
          )}
        </div>

        {/* City Info */}
        {selectedCity && selectedCity !== 'Select City' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-800">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm font-medium">
                Showing results for <span className="font-semibold">{selectedCity}</span>
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  {/* Product Image */}
                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                    <img
                      src={getProductImage(product)}
                      alt={product.productId?.productName || 'Product'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                      }}
                    />
                    {/* Stock Status Badge on Image */}
                    {product.availableStock !== undefined && (
                      <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded font-semibold shadow-md ${
                        product.availableStock > 0
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {product.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.productId?.productName || 'Product Name'}
                    </h3>
                    
                    {product.productId?.shortDescription && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {product.productId.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-red-600">
                        {getProductPrice(product)}
                      </span>
                    </div>

                    {product.vendorId && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span className="truncate">{product.vendorId.businessName || 'Vendor'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : !loading && query ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">No products found</p>
            <p className="text-gray-500 text-sm">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        ) : null}
      </div>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default SearchResults;



