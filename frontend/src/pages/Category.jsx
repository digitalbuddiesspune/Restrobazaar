import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryAPI, vendorProductAPI, getSelectedCityId, wishlistAPI } from '../utils/api';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';
import { isAuthenticated } from '../utils/auth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart, updateQuantity } from '../store/slices/cartSlice';
import { selectCartItems } from '../store/slices/cartSlice';

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
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [quantities, setQuantities] = useState({});
  const [showQuantitySelector, setShowQuantitySelector] = useState({});
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const subcategoryScrollRef = useRef(null);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

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

  // Fetch wishlist items when products change
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated() || products.length === 0) {
        setWishlistItems(new Set());
        return;
      }
      
      try {
        const response = await wishlistAPI.getWishlist();
        if (response.success && response.data?.products) {
          const wishlistProductIds = new Set(
            response.data.products.map(item => item._id)
          );
          setWishlistItems(wishlistProductIds);
        }
      } catch (err) {
        // Silently fail if user is not authenticated
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error('Error fetching wishlist:', err);
        }
        setWishlistItems(new Set());
      }
    };
    
    fetchWishlist();
  }, [products]);

  // Initialize quantities and show quantity selector for products in cart
  useEffect(() => {
    const initialQuantities = {};
    const productsInCart = {};
    
    products.forEach(product => {
      const productId = product._id;
      const minQty = product.minimumOrderQuantity || 1;
      
      // Check if product is in cart
      const cartItem = cartItems.find(item => item.vendorProductId === productId);
      
      if (cartItem) {
        // Product is in cart - show quantity selector and use cart quantity
        productsInCart[productId] = true;
        initialQuantities[productId] = cartItem.quantity;
      } else if (!quantities[productId]) {
        // Product not in cart - initialize with minQty
        initialQuantities[productId] = minQty;
      }
    });
    
    // Update quantities
    if (Object.keys(initialQuantities).length > 0) {
      setQuantities(prev => ({ ...prev, ...initialQuantities }));
    }
    
    // Show quantity selector for products in cart
    if (Object.keys(productsInCart).length > 0) {
      setShowQuantitySelector(prev => ({ ...prev, ...productsInCart }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, cartItems]);

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

  const checkScrollButtons = () => {
    if (subcategoryScrollRef.current) {
      // Hide arrows on desktop (lg and above)
      if (window.innerWidth >= 1024) {
        setShowLeftArrow(false);
        setShowRightArrow(false);
        return;
      }
      const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollSubcategories = (direction) => {
    if (subcategoryScrollRef.current) {
      const scrollAmount = 200; // pixels to scroll
      const newScrollLeft = subcategoryScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      subcategoryScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      // Check button visibility after scroll
      setTimeout(checkScrollButtons, 100);
    }
  };

  // Check scroll position on mount and when subcategories change
  useEffect(() => {
    const scrollElement = subcategoryScrollRef.current;
    if (scrollElement) {
      // Initial check
      setTimeout(checkScrollButtons, 100);
      // Add scroll listener
      scrollElement.addEventListener('scroll', checkScrollButtons);
      
      // On desktop, remove width constraint to show all items
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          const innerDiv = scrollElement.querySelector('div');
          if (innerDiv) {
            innerDiv.style.width = 'auto';
          }
          // Remove maxHeight on desktop
          scrollElement.style.maxHeight = 'none';
          // Hide arrows on desktop
          setShowLeftArrow(false);
          setShowRightArrow(false);
        } else {
          const innerDiv = scrollElement.querySelector('div');
          if (innerDiv) {
            innerDiv.style.width = 'max-content';
          }
          // Restore maxHeight on mobile
          scrollElement.style.maxHeight = '4.5rem';
        }
        checkScrollButtons();
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        scrollElement.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [selectedCategory, selectedCategory?.subcategories]);

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

  const handleWishlistToggle = async (e, product) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!isAuthenticated()) {
      // Store product ID to add to wishlist after login
      localStorage.setItem('pendingWishlistProduct', product._id);
      navigate('/sign-in');
      return;
    }
    
    if (!product?._id) return;
    
    setWishlistLoading(prev => ({ ...prev, [product._id]: true }));
    
    try {
      const isInWishlist = wishlistItems.has(product._id);
      
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(product._id);
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(product._id);
          return newSet;
        });
      } else {
        await wishlistAPI.addToWishlist(product._id);
        setWishlistItems(prev => new Set(prev).add(product._id));
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(prev => ({ ...prev, [product._id]: false }));
    }
  };

  // Helper function to round quantity to nearest multiple of minimumOrderQuantity
  const roundToMultiple = (value, multiple) => {
    if (multiple <= 0) return value;
    return Math.round(value / multiple) * multiple;
  };

  // Get quantity for a product (from state or cart or default to minQty)
  const getProductQuantity = (product) => {
    const productId = product._id;
    const minQty = product.minimumOrderQuantity || 1;
    
    // Always prioritize state quantity if it exists
    if (quantities[productId] !== undefined && quantities[productId] !== null) {
      return quantities[productId];
    }
    
    // Check if product is in cart
    const cartItem = cartItems.find(item => item.vendorProductId === productId);
    if (cartItem) {
      // Sync cart quantity to state if different (only if state is not set)
      if (quantities[productId] === undefined || quantities[productId] === null) {
        setQuantities(prev => ({ ...prev, [productId]: cartItem.quantity }));
      }
      return cartItem.quantity;
    }
    
    // Return quantity from state or default to minQty
    return quantities[productId] !== undefined ? quantities[productId] : minQty;
  };

  // Update quantity for a product
  const updateProductQuantity = (product, newQuantity) => {
    const productId = product._id;
    const minQty = product.minimumOrderQuantity || 1;
    const maxQty = product.availableStock || Infinity;
    
    // Round to nearest multiple of minQty
    let validQty = roundToMultiple(newQuantity, minQty);
    
    // Ensure within bounds
    if (validQty < minQty) {
      validQty = minQty;
    } else if (validQty > maxQty) {
      validQty = roundToMultiple(maxQty, minQty);
    }
    
    setQuantities(prev => ({ ...prev, [productId]: validQty }));
    return validQty;
  };

  // Get cart item ID for a product
  const getCartItemId = (product, selectedPrice) => {
    return `${product._id}_${selectedPrice?.type || 'single'}_${selectedPrice?.price || product.pricing?.single?.price || '0'}`;
  };

  // Get selected price based on quantity
  const getSelectedPriceForQuantity = (product, quantity) => {
    if (product.priceType === 'single' && product.pricing?.single?.price) {
      return {
        type: 'single',
        price: product.pricing.single.price,
        display: `₹${product.pricing.single.price} per piece`,
      };
    } else if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      // Find the appropriate price slab for the quantity
      const slab = product.pricing.bulk.find(
        s => quantity >= s.minQty && quantity <= s.maxQty
      );
      if (slab) {
        return {
          type: 'bulk',
          price: slab.price,
          display: `₹${slab.price} per piece (${slab.minQty}-${slab.maxQty} pieces)`,
          slab: slab,
        };
      } else {
        // If quantity exceeds all slabs, use the last (highest) slab
        const lastSlab = product.pricing.bulk[product.pricing.bulk.length - 1];
        return {
          type: 'bulk',
          price: lastSlab.price,
          display: `₹${lastSlab.price} per piece (${lastSlab.minQty}+ pieces)`,
          slab: lastSlab,
        };
      }
    }
    return null;
  };

  const handleAddToCartClick = async (e, product) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!product) return;
    
    // Check if product is in stock
    if (product.availableStock === 0 || product.availableStock === undefined) {
      alert('This product is out of stock');
      return;
    }
    
    const productId = product._id;
    const minQty = product.minimumOrderQuantity || 1;
    
    // Check if product is already in cart
    const cartItem = cartItems.find(item => item.vendorProductId === productId);
    
    if (!cartItem) {
      // Product not in cart - add to cart with minimum quantity
      try {
        const selectedPrice = getSelectedPriceForQuantity(product, minQty);
        if (selectedPrice) {
          dispatch(addToCart({
            vendorProduct: product,
            quantity: minQty,
            selectedPrice: selectedPrice,
          }));
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      // Product already in cart - add minimum orderable quantity
      try {
        const selectedPrice = getSelectedPriceForQuantity(product, minQty);
        if (selectedPrice) {
          dispatch(addToCart({
            vendorProduct: product,
            quantity: minQty,
            selectedPrice: selectedPrice,
          }));
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
    
    // Show quantity selector for this product
    setShowQuantitySelector(prev => ({ ...prev, [productId]: true }));
    
    // Initialize quantity if not set
    if (!quantities[productId]) {
      const initialQty = cartItem ? cartItem.quantity : minQty;
      setQuantities(prev => ({ ...prev, [productId]: initialQty }));
    }
  };

  const handleConfirmAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!product) return;
    
    const quantity = getProductQuantity(product);
    setAddingToCart(prev => ({ ...prev, [product._id]: true }));
    
    try {
      // Get the selected price based on quantity
      const selectedPrice = getSelectedPriceForQuantity(product, quantity);
      
      if (!selectedPrice) {
        alert('Unable to determine price. Please view product details.');
        setAddingToCart(prev => ({ ...prev, [product._id]: false }));
        return;
      }
      
      // Check if product is already in cart
      const cartItemId = getCartItemId(product, selectedPrice);
      const existingCartItem = cartItems.find(item => item.id === cartItemId);
      
      if (existingCartItem) {
        // Update quantity if item exists - use minimum orderable quantity
        const minQty = product.minimumOrderQuantity || 1;
        dispatch(updateQuantity({ itemId: cartItemId, quantity: existingCartItem.quantity + minQty }));
        alert(`Added ${minQty} more item(s) to cart!`);
      } else {
        // Add new item to cart
        dispatch(addToCart({
          vendorProduct: product,
          quantity: quantity,
          selectedPrice: selectedPrice,
        }));
        alert(`Added ${quantity} item(s) to cart!`);
      }
      
      // Keep quantity selector visible after adding to cart (don't hide it)
      setShowQuantitySelector(prev => ({ ...prev, [product._id]: true }));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  const handleQuantityChange = (e, product, delta) => {
    e.stopPropagation(); // Prevent card click navigation
    e.preventDefault();
    
    const productId = product._id;
    const minQty = product.minimumOrderQuantity || 1;
    
    // First check if product is in cart at all (by vendorProductId)
    const cartItemByProduct = cartItems.find(item => item.vendorProductId === productId);
    
    // If product is not in cart, don't update - user must click "Add to Cart" first
    if (!cartItemByProduct) {
      return;
    }
    
    // Get current quantity - prioritize state over cart
    let currentQty;
    if (quantities[productId] !== undefined) {
      currentQty = quantities[productId];
    } else {
      currentQty = cartItemByProduct.quantity;
    }
    
    const newQty = currentQty + delta;
    
    // Round to nearest multiple of minQty
    let validQty = roundToMultiple(newQty, minQty);
    
    // Only enforce minimum, not maximum
    if (validQty < minQty) {
      validQty = minQty;
    }
    
    // Update state immediately for instant UI feedback
    setQuantities(prev => ({ ...prev, [productId]: validQty }));
    
    // Get selected price for the updated quantity
    const selectedPrice = getSelectedPriceForQuantity(product, validQty);
    if (!selectedPrice) {
      console.error('No price found for quantity:', validQty);
      return;
    }
    
    // Find the cart item by ID (might change if price slab changes)
    const cartItemId = getCartItemId(product, selectedPrice);
    let existingCartItem = cartItems.find(item => item.id === cartItemId);
    
    // If cart item not found by ID, find by product ID (price might have changed)
    if (!existingCartItem) {
      existingCartItem = cartItemByProduct;
    }
    
    // Update cart quantity (product is already in cart)
    if (existingCartItem) {
      dispatch(updateQuantity({ itemId: existingCartItem.id, quantity: validQty }));
    }
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
       

        <div className="flex flex-col lg:flex-row gap-6">
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
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No categories available</p>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorySelect(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border ${
                        selectedCategory?._id === category._id
                          ? 'bg-red-600 text-white font-semibold shadow-md border-red-700'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border-gray-300'
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
                        <div className="relative">
                          <div
                            ref={subcategoryScrollRef}
                            className="overflow-x-auto lg:overflow-x-visible hide-scrollbar lg:max-h-none"
                            style={{ WebkitOverflowScrolling: 'touch', maxHeight: '4.5rem' }}
                          >
                            <div className="flex flex-wrap gap-2" style={{ width: 'max-content' }}>
                              <button
                                onClick={() => handleSubcategorySelect('all')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                                  selectedSubcategory === 'all'
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                All
                              </button>
                              {selectedCategory.subcategories.map((subcat, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSubcategorySelect(subcat)}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                                    selectedSubcategory === subcat
                                      ? 'bg-red-600 text-white shadow-md'
                                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {subcat}
                                </button>
                              ))}
                            </div>
                          </div>
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
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3 mb-8">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer flex flex-col"
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
                          <div className="aspect-square overflow-hidden bg-white relative flex items-center justify-center">
                            <img
                              src={getProductImage(product)}
                              alt={product.productId?.productName || 'Product'}
                              className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                              }}
                            />
                            {/* Stock Status Badge on Image - Top Left Corner */}
                            {product.availableStock !== undefined && (
                              <span className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-semibold shadow-md ${
                                product.availableStock > 0
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}>
                                {product.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            )}
                            {/* Wishlist Button - Top Right Corner */}
                            <button
                              onClick={(e) => handleWishlistToggle(e, product)}
                              disabled={wishlistLoading[product._id]}
                              className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-full shadow-lg transition-all z-10 ${
                                wishlistItems.has(product._id)
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                              }`}
                              title={wishlistItems.has(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                fill={wishlistItems.has(product._id) ? 'currentColor' : 'none'}
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
                            </button>
                          </div>

                          {/* Product Info */}
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                              {product.productId?.productName || 'Product Name'}
                            </h3>

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-base sm:text-lg font-bold text-red-600">
                                {product.priceType === 'single' && product.pricing?.single?.price ? (
                                  `₹${product.pricing.single.price}`
                                ) : product.priceType === 'bulk' && product.pricing?.bulk?.length > 0 ? (
                                  <>
                                    ₹{product.pricing.bulk[0].price}{' '}
                                    <span className="text-xs sm:text-sm font-normal">
                                      ({product.pricing.bulk[0].minQty}-{product.pricing.bulk[0].maxQty} pcs)
                                    </span>
                                  </>
                                ) : (
                                  'Price on request'
                                )}
                              </span>
                            </div>

                            {/* Add to Cart Button / Quantity Selector */}
                            <div className="mt-auto">
                            {product.availableStock > 0 ? (
                              (() => {
                                // Check if product is in cart
                                const cartItem = cartItems.find(item => item.vendorProductId === product._id);
                                const shouldShowQuantitySelector = showQuantitySelector[product._id] || cartItem;
                                
                                return shouldShowQuantitySelector ? (
                                // Show Quantity Selector with light gray background and black border (same size as Add to Cart button)
                                <div className="w-full bg-gray-50 border border-black rounded-lg flex items-stretch overflow-hidden" style={{ minHeight: '40px' }}>
                                  <button
                                    onClick={(e) => handleQuantityChange(e, product, -(product.minimumOrderQuantity || 1))}
                                    disabled={false}
                                    className="w-8 sm:w-10 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300 flex-shrink-0 self-stretch cursor-pointer"
                                    title={`Decrease by ${product.minimumOrderQuantity || 1}`}
                                  >
                                    <svg
                                      className="w-4 h-4 text-black"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20 12H4"
                                      />
                                    </svg>
                                  </button>
                                  <div className="flex-1 bg-white flex items-center justify-center border-x border-gray-300 self-stretch">
                                    <span className="text-xs sm:text-sm font-semibold text-black">
                                      {getProductQuantity(product)}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => handleQuantityChange(e, product, (product.minimumOrderQuantity || 1))}
                                    disabled={false}
                                    className="w-8 sm:w-10 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center border-l border-gray-300 flex-shrink-0 self-stretch cursor-pointer"
                                    title={`Increase by ${product.minimumOrderQuantity || 1}`}
                                  >
                                    <svg
                                      className="w-4 h-4 text-black"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                // Show initial Add to Cart Button
                                <button
                                  onClick={(e) => handleAddToCartClick(e, product)}
                                  className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
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
                                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                  <span>Add to Cart</span>
                                </button>
                              );
                              })()
                            ) : (
                              <button
                                disabled
                                className="w-full py-2 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed text-xs sm:text-sm"
                              >
                                Out of Stock
                              </button>
                            )}
                            </div>
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
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
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

