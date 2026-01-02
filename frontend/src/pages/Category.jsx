import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryAPI, vendorProductAPI, getSelectedCityId } from '../utils/api';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';

const Category = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [allProducts, setAllProducts] = useState([]);

  // Fetch categories for sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAllCategories();
        if (response.success && response.data) {
          const activeCategories = response.data
            .filter(cat => cat.isActive !== false)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));
          setCategories(activeCategories);

          // If slug is provided, find and select that category
          if (slug) {
            const category = activeCategories.find(
              cat => cat.slug === slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
            );
            if (category) {
              console.log('Category found in list:', category.name, 'Subcategories:', category.subcategories);
              setSelectedCategory(category);
            } else {
              // Try to fetch category by slug from API
              try {
                const categoryResponse = await categoryAPI.getCategoryBySlug(slug);
                if (categoryResponse.success && categoryResponse.data) {
                  console.log('Category fetched by slug:', categoryResponse.data.name, 'Subcategories:', categoryResponse.data.subcategories);
                  setSelectedCategory(categoryResponse.data);
                } else {
                  setError('Category not found');
                }
              } catch (err) {
                console.error('Error fetching category by slug:', err);
                setError('Category not found');
              }
            }
          } else if (activeCategories.length > 0) {
            // If no slug, select first category by default
            setSelectedCategory(activeCategories[0]);
            navigate(`/category/${activeCategories[0].slug}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Get selected city
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || 'Select City';
    setSelectedCity(savedCity);
  }, [slug]);

  const fetchProducts = async (categoryId, pageNum = 1, fetchAll = false) => {
    try {
      setProductsLoading(true);
      setError('');

      const cityId = getSelectedCityId();
      if (!cityId) {
        setError('Please select a city to view products');
        setProductsLoading(false);
        return;
      }

      // If filtering by subcategory, fetch all products (use a large limit)
      const limit = fetchAll ? 1000 : 20;

      const response = await vendorProductAPI.getVendorProductsByCityAndCategory(categoryId, {
        page: pageNum,
        limit: limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (response.success) {
        const fetchedProducts = response.data || [];
        console.log('Fetched products count:', fetchedProducts.length);
        console.log('Sample product:', fetchedProducts[0]);
        setAllProducts(fetchedProducts); // Store all products
        
        // Apply subcategory filter if one is selected
        if (selectedSubcategory && selectedSubcategory !== 'all') {
          const filtered = fetchedProducts.filter((product) => {
            // Check both possible locations for subCategory
            const productSubCategory = product.productId?.subCategory || product.subCategory;
            // Trim and compare (in case of whitespace issues)
            const matches = productSubCategory?.trim() === selectedSubcategory.trim();
            if (matches) {
              console.log('Product matches subcategory:', product.productId?.productName, productSubCategory);
            }
            return matches;
          });
          console.log('Filtered products count:', filtered.length);
          setProducts(filtered);
        } else {
          setProducts(fetchedProducts);
        }
        setTotalPages(response.pagination?.pages || 1);
      } else {
        console.error('Failed to fetch products:', response.message);
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch products when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setSelectedSubcategory('all'); // Reset subcategory when category changes
      fetchProducts(selectedCategory._id, page, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, page]);

  // When subcategory changes, refetch all products to filter properly
  useEffect(() => {
    if (selectedCategory && selectedSubcategory && selectedSubcategory !== 'all') {
      // Fetch all products when filtering by subcategory
      fetchProducts(selectedCategory._id, 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubcategory]);

  // Filter products when subcategory changes (client-side filter as backup)
  useEffect(() => {
    if (selectedSubcategory && selectedSubcategory !== 'all' && allProducts.length > 0) {
      const filtered = allProducts.filter((product) => {
        // Check both possible locations for subCategory
        const productSubCategory = product.productId?.subCategory || product.subCategory;
        // Trim and compare (in case of whitespace issues)
        return productSubCategory?.trim() === selectedSubcategory.trim();
      });
      setProducts(filtered);
    } else if (selectedSubcategory === 'all') {
      setProducts(allProducts);
    }
  }, [selectedSubcategory, allProducts]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setPage(1); // Reset to first page
    setSelectedSubcategory('all'); // Reset subcategory filter
    setSidebarOpen(false); // Close sidebar on mobile
    // Update URL without navigation
    navigate(`/category/${category.slug}`, { replace: true });
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setPage(1); // Reset to first page when filtering
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {selectedCategory ? selectedCategory.name : 'Categories'}
          </h1>
          {selectedCity && selectedCity !== 'Select City' && (
            <p className="text-sm text-gray-600">
              Showing products available in <span className="font-semibold">{selectedCity}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow mb-4"
          >
            <svg
              className="w-5 h-5 text-gray-700"
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
            <span className="font-medium text-gray-700">
              {sidebarOpen ? 'Hide' : 'Show'} Categories
            </span>
          </button>

          {/* Sidebar - Categories */}
          <aside
            className={`lg:w-64 flex-shrink-0 ${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block`}
          >
            <div className="bg-white rounded-lg shadow-md p-4 lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-600"
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
                Categories
              </h2>
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No categories available</p>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedCategory?._id === category._id
                          ? 'bg-red-600 text-white font-semibold shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Products */}
          <main className="flex-1 min-w-0">
            {!selectedCategory ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-600">Please select a category to view products</p>
              </div>
            ) : (
              <>
                {/* Category Info */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    {selectedCategory.image && (
                      <img
                        src={selectedCategory.image}
                        alt={selectedCategory.name}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedCategory.name}</h2>
                      {selectedCategory.description && (
                        <p className="text-gray-600 text-xs mt-1">{selectedCategory.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Subcategories Filter - Always show for debugging */}
                  <div className="border-t pt-4 mt-4">
                    {selectedCategory.subcategories && Array.isArray(selectedCategory.subcategories) && selectedCategory.subcategories.length > 0 ? (
                      <>
                        <h3 className="text-xs font-semibold text-gray-700 mb-2">Filter by Subcategory:</h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleSubcategorySelect('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              selectedSubcategory === 'all'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {selectedCategory.subcategories.map((subcat, index) => (
                            <button
                              key={index}
                              onClick={() => handleSubcategorySelect(subcat)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedSubcategory === subcat
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {subcat}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-700 mb-2">Filter by Subcategory:</h3>
                        <p className="text-xs text-gray-500">
                          No subcategories available for this category
                          {selectedCategory.subcategories ? ` (subcategories: ${JSON.stringify(selectedCategory.subcategories)})` : ' (subcategories: undefined)'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {productsLoading ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-gray-600 text-lg mb-2">No products found</p>
                    <p className="text-gray-500 text-sm">
                      {selectedCity && selectedCity !== 'Select City'
                        ? `No products available in ${selectedCity} for this category`
                        : 'Please select a city to view products'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => {
                            const categorySlug = selectedCategory?.slug || selectedCategory?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            if (categorySlug) {
                              navigate(`/category/${categorySlug}/${product._id}`);
                            } else {
                              navigate(`/product/${product._id}`);
                            }
                          }}
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

                    {/* Pagination - Only show if not filtering by subcategory */}
                    {selectedSubcategory === 'all' && totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
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
                    {/* Show filtered count when subcategory is selected */}
                    {selectedSubcategory !== 'all' && (
                      <div className="text-center mt-4 text-sm text-gray-600">
                        Showing {products.length} product{products.length !== 1 ? 's' : ''} in this subcategory
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
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

export default Category;

