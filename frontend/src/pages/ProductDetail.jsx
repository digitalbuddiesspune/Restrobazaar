import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vendorProductAPI, categoryAPI } from '../utils/api';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/cartSlice';
import { selectCartItems } from '../store/slices/cartSlice';
import { isAuthenticated } from '../utils/auth';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist, useVendorProducts } from '../hooks/useApiQueries';

const ProductDetail = () => {
  const { productId, categorySlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // React Query hooks for wishlist
  const { data: wishlistData } = useWishlist({ 
    enabled: isAuthenticated() && !!productId 
  });
  
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // Check if product is in wishlist
  const isInWishlist = wishlistData?.success && wishlistData?.data?.products
    ? wishlistData.data.products.some(item => item._id === productId)
    : false;

  // Get category ID from product
  const categoryId = useMemo(() => {
    if (!product?.productId?.category) return null;
    if (typeof product.productId.category === 'object') {
      return product.productId.category._id || product.productId.category;
    }
    return product.productId.category;
  }, [product]);

  // Fetch suggested products from the same category with caching
  // Simple approach: fetch all vendor products and filter by category
  const { 
    data: suggestedProductsData, 
    isLoading: suggestedProductsLoading,
    error: suggestedProductsError
  } = useVendorProducts(
    {
      status: 'true',
      limit: 100, // Fetch more to ensure we get enough after filtering
    },
    {
      enabled: !!categoryId && !!product, // Only fetch when we have category and product
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    }
  );

  // Filter products by category and exclude current product
  const suggestedProducts = useMemo(() => {
    if (!suggestedProductsData || !categoryId) return [];
    
    // Handle different response structures
    let products = [];
    if (suggestedProductsData.success && suggestedProductsData.data) {
      products = Array.isArray(suggestedProductsData.data) 
        ? suggestedProductsData.data 
        : (suggestedProductsData.data?.data || []);
    } else if (Array.isArray(suggestedProductsData)) {
      products = suggestedProductsData;
    }
    
    if (!Array.isArray(products) || products.length === 0) return [];
    
    // Filter by category ID and exclude current product
    const filtered = products.filter((item) => {
      // Get category from productId
      const itemCategoryId = item.productId?.category 
        ? (typeof item.productId.category === 'object' 
          ? item.productId.category._id || item.productId.category 
          : item.productId.category)
        : null;
      
      // Match category and exclude current product
      return itemCategoryId === categoryId 
        && item._id !== productId 
        && (item.availableStock > 0 || item.availableStock === undefined);
    });
    
    return filtered.slice(0, 12); // Show max 12 suggested products
  }, [suggestedProductsData, categoryId, productId]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Suggested Products Debug:', {
        categoryId,
        hasProduct: !!product,
        suggestedProductsData,
        suggestedProductsCount: suggestedProducts.length,
        error: suggestedProductsError
      });
    }
  }, [categoryId, product, suggestedProductsData, suggestedProducts.length, suggestedProductsError]);

  useEffect(() => {
    // Get selected city
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY) || 'Select City';
    setSelectedCity(savedCity);

    // Fetch product details
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');

        if (!productId) {
          setError('Product ID is required');
          setLoading(false);
          return;
        }

        const response = await vendorProductAPI.getVendorProductById(productId);

        if (response.success && response.data) {
          setProduct(response.data);

          // Fetch category details if available
          if (response.data.productId?.category) {
            try {
              // Try to get category by ID (if it's an object with _id) or fetch it
              const categoryId = typeof response.data.productId.category === 'object'
                ? response.data.productId.category._id || response.data.productId.category
                : response.data.productId.category;

              const categoryResponse = await categoryAPI.getCategoryById(categoryId);
              if (categoryResponse.success && categoryResponse.data) {
                setCategory(categoryResponse.data);
              }
            } catch (err) {
              console.error('Error fetching category:', err);
              // Category fetch is optional, continue without it
            }
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || 'Failed to load product. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const getProductImages = () => {
    if (product?.productId?.images && product.productId.images.length > 0) {
      return product.productId.images.map(img => img.url || img);
    }
    return ['https://via.placeholder.com/600x600?text=Product+Image'];
  };

  const getProductPrice = () => {
    if (!product) return null;

    if (product.priceType === 'single' && product.pricing?.single?.price) {
      return {
        type: 'single',
        price: product.pricing.single.price,
        display: `₹${product.pricing.single.price}`,
      };
    } else if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      return {
        type: 'bulk',
        slabs: product.pricing.bulk,
        display: 'Bulk pricing available',
      };
    }
    return null;
  };

  const getPriceForQuantity = (qty) => {
    if (!product) return null;

    if (product.priceType === 'single' && product.pricing?.single?.price) {
      return product.pricing.single.price * qty;
    } else if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      // Find the appropriate price slab for the quantity
      const slab = product.pricing.bulk.find(
        s => qty >= s.minQty && qty <= s.maxQty
      );
      if (slab) {
        return slab.price * qty;
      }
      // If quantity exceeds all slabs, use the last (highest) slab
      const lastSlab = product.pricing.bulk[product.pricing.bulk.length - 1];
      return lastSlab.price * qty;
    }
    return null;
  };

  // Helper function to round quantity to nearest multiple of minimumOrderQuantity
  const roundToMultiple = (value, multiple) => {
    if (multiple <= 0) return value;
    return Math.round(value / multiple) * multiple;
  };

  // Helper function to ensure quantity is valid (multiple of minOrderQty and within bounds)
  const validateAndSetQuantity = (value, minQty, maxQty) => {
    if (isNaN(value) || value < minQty) {
      return minQty;
    }
    if (value > maxQty) {
      return roundToMultiple(maxQty, minQty);
    }
    return roundToMultiple(value, minQty);
  };

  const handleQuantityChange = (e) => {
    const inputValue = parseInt(e.target.value) || 0;
    const minQty = product?.minimumOrderQuantity || 1;
    const maxQty = product?.availableStock || Infinity;
    
    if (isNaN(inputValue) || inputValue < minQty) {
      setQuantityError(`Minimum quantity is ${minQty}`);
      setQuantity(minQty);
      return;
    }

    if (inputValue > maxQty) {
      setQuantityError(`Maximum quantity is ${maxQty}`);
      const validQty = roundToMultiple(maxQty, minQty);
      setQuantity(validQty);
      return;
    }

    // Check if value is a multiple of minimumOrderQuantity
    if (inputValue % minQty !== 0) {
      setQuantityError(`Quantity must be in multiples of ${minQty}`);
      const roundedQty = roundToMultiple(inputValue, minQty);
      setQuantity(roundedQty);
    } else {
      setQuantityError('');
      setQuantity(inputValue);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Validate quantity
    if (quantity < (product.minimumOrderQuantity || 1)) {
      setQuantityError(`Minimum quantity is ${product.minimumOrderQuantity || 1}`);
      return;
    }
    
    if (quantity > product.availableStock) {
      setQuantityError(`Only ${product.availableStock} items available`);
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // Get the selected price based on quantity
      let selectedPrice = null;
      
      if (product.priceType === 'single' && product.pricing?.single?.price) {
        selectedPrice = {
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
          selectedPrice = {
            type: 'bulk',
            price: slab.price,
            display: `₹${slab.price} per piece (${slab.minQty}-${slab.maxQty} pieces)`,
            slab: slab,
          };
        } else {
          // If quantity exceeds all slabs, use the last (highest) slab
          const lastSlab = product.pricing.bulk[product.pricing.bulk.length - 1];
          selectedPrice = {
            type: 'bulk',
            price: lastSlab.price,
            display: `₹${lastSlab.price} per piece (${lastSlab.minQty}+ pieces)`,
            slab: lastSlab,
          };
        }
      }
      
      if (!selectedPrice) {
        alert('Unable to determine price. Please try again.');
        setAddingToCart(false);
        return;
      }
      
      // Check if product is already in cart
      const cartItemId = `${product._id}_${selectedPrice?.type || 'single'}_${selectedPrice?.price || product.pricing?.single?.price || '0'}`;
      const existingCartItem = cartItems.find(item => item.id === cartItemId);
      const minQty = product.minimumOrderQuantity || 1;
      
      // Dispatch add to cart action
      dispatch(addToCart({
        vendorProduct: product,
        quantity: existingCartItem ? minQty : quantity,
        selectedPrice: selectedPrice,
      }));
      
      // Show success message
      if (existingCartItem) {
        alert(`Added ${minQty} more item(s) to cart!`);
      } else {
        alert(`Added ${quantity} item(s) to cart!`);
      }
      
      // Optional: Navigate to cart
      // navigate('/cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  // Initialize quantity to minimumOrderQuantity when product loads
  // IMPORTANT: This hook must be called before any early returns
  useEffect(() => {
    if (product && product.minimumOrderQuantity) {
      setQuantity(product.minimumOrderQuantity);
    }
  }, [product?._id]); // Only reset when product changes


  const handleShareProduct = async () => {
    if (!product?._id) return;
    
    const productUrl = `${window.location.origin}/product/${product._id}`;
    const productName = product.productId?.productName || 'Product';
    
    // Try using Web Share API if available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out this product: ${productName}`,
          url: productUrl,
        });
        return;
      } catch (err) {
        // User cancelled or error occurred, fall back to clipboard
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(productUrl);
      alert('Product link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Product link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link. Please copy manually: ' + productUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      // Store product ID to add to wishlist after login
      localStorage.setItem('pendingWishlistProduct', product._id);
      navigate('/sign-in');
      return;
    }
    
    if (!product?._id) return;
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlistMutation.mutateAsync(product._id);
        alert('Removed from wishlist');
      } else {
        await addToWishlistMutation.mutateAsync(product._id);
        alert('Added to wishlist');
      }
      // React Query will automatically refetch and update isInWishlist via cache invalidation
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleWishlistToggleForSuggested = async (e, suggestedProduct) => {
    e.stopPropagation();
    
    if (!isAuthenticated()) {
      localStorage.setItem('pendingWishlistProduct', suggestedProduct._id);
      navigate('/sign-in');
      return;
    }
    
    if (!suggestedProduct?._id) return;
    
    setWishlistLoading(true);
    try {
      const isInWishlist = wishlistData?.success && wishlistData?.data?.products
        ? wishlistData.data.products.some(item => item._id === suggestedProduct._id)
        : false;
      
      if (isInWishlist) {
        await removeFromWishlistMutation.mutateAsync(suggestedProduct._id);
      } else {
        await addToWishlistMutation.mutateAsync(suggestedProduct._id);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      alert('Failed to update wishlist. Please try again.');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCartFromSuggested = (e, suggestedProduct) => {
    e.stopPropagation();
    
    if (!suggestedProduct) return;
    
    if (suggestedProduct.availableStock === 0 || suggestedProduct.availableStock === undefined) {
      alert('This product is out of stock');
      return;
    }
    
    const minQty = suggestedProduct.minimumOrderQuantity || 1;
    
    // Get selected price
    let selectedPrice = null;
    if (suggestedProduct.priceType === 'single' && suggestedProduct.pricing?.single?.price) {
      selectedPrice = {
        type: 'single',
        price: suggestedProduct.pricing.single.price,
        display: `₹${suggestedProduct.pricing.single.price} per piece`,
      };
    } else if (suggestedProduct.priceType === 'bulk' && suggestedProduct.pricing?.bulk?.length > 0) {
      const firstSlab = suggestedProduct.pricing.bulk[0];
      selectedPrice = {
        type: 'bulk',
        price: firstSlab.price,
        display: `₹${firstSlab.price} per piece (${firstSlab.minQty}-${firstSlab.maxQty} pieces)`,
        slab: firstSlab,
      };
    }
    
    if (!selectedPrice) {
      alert('Unable to determine price. Please try again.');
      return;
    }
    
    // Check if product is already in cart
    const cartItemId = `${suggestedProduct._id}_${selectedPrice.type}_${selectedPrice.price}`;
    const existingCartItem = cartItems.find(item => item.id === cartItemId);
    
    if (existingCartItem) {
      dispatch(addToCart({
        vendorProduct: suggestedProduct,
        quantity: minQty,
        selectedPrice: selectedPrice,
      }));
      alert(`Added ${minQty} more item(s) to cart!`);
    } else {
      dispatch(addToCart({
        vendorProduct: suggestedProduct,
        quantity: minQty,
        selectedPrice: selectedPrice,
      }));
      alert(`Added ${minQty} item(s) to cart!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
            <Link
              to="/"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = getProductImages();
  const priceInfo = getProductPrice();
  const totalPrice = getPriceForQuantity(quantity);
  const minOrderQty = product?.minimumOrderQuantity || 1;

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Products Button */}
        <div className="mb-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Products</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4 lg:sticky lg:top-[104px] self-start z-20">
            {/* Main Image */}
            <div className="aspect-[5/4] bg-white rounded-lg shadow-md overflow-hidden relative flex items-center justify-center max-w-lg mx-auto">
              <img
                src={images[selectedImageIndex]}
                alt={product.productId?.productName || 'Product'}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600?text=Product+Image';
                }}
              />
              {/* Share Product Button - Top Right Corner (Left of Wishlist) */}
              <button
                onClick={handleShareProduct}
                className="absolute top-2 right-12 sm:top-2.5 sm:right-14 md:top-3 md:right-16 p-1.5 sm:p-2 md:p-2.5 rounded-full shadow-lg transition-all z-10 bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                title="Share product"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
              {/* Wishlist Button - Top Right Corner */}
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 md:top-3 md:right-3 p-1.5 sm:p-2 md:p-2.5 rounded-full shadow-lg transition-all z-10 ${
                  isInWishlist
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5"
                  fill={isInWishlist ? 'currentColor' : 'none'}
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

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-red-600 ring-2 ring-red-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.productId?.productName} ${index + 1}`}
                      className="w-full h-full object-contain p-1 bg-white"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150?text=Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Name & Category */}
            <div>
              {category && (
                <Link
                  to={`/category/${category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="inline-block text-xs text-red-600 hover:text-red-700 font-medium mb-2"
                >
                  {category.name}
                </Link>
              )}
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {product.productId?.productName || 'Product Name'} 
              </h1>
              {/* Price Display */}
              {priceInfo?.type === 'single' ? (
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-black">
                    ₹{priceInfo.price}
                  </span>
                  <span className="text-gray-500 text-sm">per piece</span>
                </div>
              ) : priceInfo?.type === 'bulk' && priceInfo.slabs?.length > 0 ? (
                <div className="mb-2">
                  <span className="text-3xl font-bold text-black">
                    ₹{priceInfo.slabs[priceInfo.slabs.length - 1].price}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({priceInfo.slabs[priceInfo.slabs.length - 1].maxQty} pcs)
                  </span>
                </div>
              ) : (
                <div className="mb-2">
                  <span className="text-sm font-semibold text-gray-600">Price on request</span>
                </div>
              )}
              {product.productId?.shortDescription && (
                <p className="text-gray-600 text-sm">
                  {product.productId.shortDescription}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="mb-4">
                <span className="text-xs text-gray-600 block mb-1">Price</span>
                {priceInfo?.type === 'single' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-red-600">
                      ₹{priceInfo.price}
                    </span>
                    <span className="text-gray-500 text-xs">per piece</span>
                  </div>
                ) : priceInfo?.type === 'bulk' ? (
                  <div>
                    <span className="text-lg font-bold text-red-600">Volume Pricing ⭐</span>
                    <div className="mt-3 space-y-2">
                      {priceInfo.slabs.map((slab, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs bg-white p-2 rounded"
                        >
                          <span className="text-gray-700">
                          Buy {slab.maxQty} Pieces 
                          </span>
                          <span className="font-semibold text-gray-900">₹{slab.price}/piece</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-gray-600">Price on request</span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Availability</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.availableStock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.availableStock > 0
                      ? `In Stock `
                      : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              {product.availableStock > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Quantity (Min: {minOrderQty}, Step: {minOrderQty})
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const newQty = Math.max(minOrderQty, quantity - minOrderQty);
                          setQuantity(newQty);
                          setQuantityError('');
                        }}
                        disabled={quantity <= minOrderQty}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Decrease by ${minOrderQty}`}
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
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <div className="flex flex-col">
                        <input
                          type="number"
                          value={quantity}
                          onChange={handleQuantityChange}
                          onBlur={(e) => {
                            // Validate and round on blur
                            const inputValue = parseInt(e.target.value) || minOrderQty;
                            const validQty = validateAndSetQuantity(
                              inputValue,
                              minOrderQty,
                              product.availableStock
                            );
                            setQuantity(validQty);
                            setQuantityError('');
                          }}
                          min={minOrderQty}
                          max={product.availableStock}
                          step={minOrderQty}
                          className={`w-20 text-center border rounded-lg py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                            quantityError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {quantityError && (
                          <span className="text-xs text-red-600 mt-1 text-center">
                            {quantityError}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const newQty = Math.min(
                            roundToMultiple(product.availableStock, minOrderQty),
                            quantity + minOrderQty
                          );
                          setQuantity(newQty);
                          setQuantityError('');
                        }}
                        disabled={quantity >= roundToMultiple(product.availableStock, minOrderQty)}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Increase by ${minOrderQty}`}
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-[10px]">
                      Quantity must be in multiples of {minOrderQty}
                    </p>
                  </div>

                  {totalPrice && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-700">Total Price</span>
                        <span className="text-lg font-bold text-red-600">
                          ₹{totalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || quantityError !== ''}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addingToCart ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Vendor Information */}
          
            {/* Product Details */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="space-y-3">
                {/* Basic Information */}
                {product.productId?.subCategory && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Sub Category</span>
                    <span className="text-xs text-gray-900">{product.productId.subCategory}</span>
                  </div>
                )}
                {product.productId?.otherCategory && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Other Category</span>
                    <span className="text-xs text-gray-900">{product.productId.otherCategory}</span>
                  </div>
                )}

                {/* Physical Specifications */}
                {(product.productId?.unit || product.productId?.weight || product.productId?.capacity || product.productId?.size) && (
                  <>
                    {product.productId?.unit && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Unit</span>
                        <span className="text-xs text-gray-900 capitalize">{product.productId.unit}</span>
                      </div>
                    )}
                    {product.productId?.weight && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Weight</span>
                        <span className="text-xs text-gray-900">{product.productId.weight}</span>
                      </div>
                    )}
                    {product.productId?.capacity && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Capacity</span>
                        <span className="text-xs text-gray-900">{product.productId.capacity}</span>
                      </div>
                    )}
                    {product.productId?.size && (product.productId.size.height || product.productId.size.width || product.productId.size.base) && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-xs text-gray-600">Size</span>
                        <span className="text-xs text-gray-900">
                          {[
                            product.productId.size.height && `Height: ${product.productId.size.height}`,
                            product.productId.size.width && `Width: ${product.productId.size.width}`,
                            product.productId.size.base && `Base: ${product.productId.size.base}`
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Pricing & Stock Information */}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">Minimum Order</span>
                  <span className="text-xs text-gray-900">{minOrderQty} pieces</span>
                </div>
               

                {/* Purchase Information */}
                {product.purchasedMode && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Purchase Mode</span>
                    <span className="text-xs text-gray-900">{product.purchasedMode}</span>
                  </div>
                )}
                {product.purchasedAmount && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Purchase Amount</span>
                    <span className="text-xs text-gray-900">₹{product.purchasedAmount}</span>
                  </div>
                )}

                {/* Tax Information */}
                {product.sgst > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">SGST</span>
                    <span className="text-xs text-gray-900">{product.sgst}%</span>
                  </div>
                )}

                {/* Status Information */}
                {product.productId?.isReturnable !== undefined && (
                  <div className="flex justify-between py-2">
                    <span className="text-xs text-gray-600">Returnable</span>
                    <span className={`text-xs font-semibold ${
                      product.productId.isReturnable ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {product.productId.isReturnable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Products Section */}
        {(suggestedProducts.length > 0 || suggestedProductsLoading) && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
            {suggestedProductsLoading && suggestedProducts.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3">
                {suggestedProducts.map((suggestedProduct) => {
                  const suggestedImage = suggestedProduct.productId?.images?.[0]?.url || 
                    suggestedProduct.productId?.images?.[0] || 
                    'https://via.placeholder.com/300x300?text=Product';
                  
                  const isInWishlistSuggested = wishlistData?.success && wishlistData?.data?.products
                    ? wishlistData.data.products.some(item => item._id === suggestedProduct._id)
                    : false;

                  return (
                    <div
                      key={suggestedProduct._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer flex flex-col"
                      onClick={() => {
                        const slug = categorySlug || category?.slug || category?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'products';
                        navigate(`/category/${slug}/${suggestedProduct._id}`);
                      }}
                    >
                      {/* Product Image */}
                      <div className="aspect-square overflow-hidden bg-white relative flex items-center justify-center">
                        <img
                          src={suggestedImage}
                          alt={suggestedProduct.productId?.productName || 'Product'}
                          className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=Product';
                          }}
                        />
                        {/* Stock Status Badge on Image - Top Left Corner */}
                        {suggestedProduct.availableStock !== undefined && (
                          <span className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-semibold shadow-md ${
                            suggestedProduct.availableStock > 0
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {suggestedProduct.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        )}
                        {/* Wishlist Button - Top Right Corner */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggleForSuggested(e, suggestedProduct);
                          }}
                          disabled={wishlistLoading}
                          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-full shadow-lg transition-all z-10 ${
                            isInWishlistSuggested
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                          }`}
                          title={isInWishlistSuggested ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill={isInWishlistSuggested ? 'currentColor' : 'none'}
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
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1 truncate">
                          {suggestedProduct.productId?.productName || 'Product Name'}
                        </h3>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base sm:text-lg font-bold text-red-600 whitespace-nowrap truncate">
                            {suggestedProduct.priceType === 'single' && suggestedProduct.pricing?.single?.price ? (
                              `₹${suggestedProduct.pricing.single.price}`
                            ) : suggestedProduct.priceType === 'bulk' && suggestedProduct.pricing?.bulk?.length > 0 ? (
                              <>
                                ₹{suggestedProduct.pricing.bulk[0].price}{' '}
                                <span className="text-xs sm:text-sm font-normal">
                                  ({suggestedProduct.pricing.bulk[0].minQty}-{suggestedProduct.pricing.bulk[0].maxQty} pcs)
                                </span>
                              </>
                            ) : (
                              'Price on request'
                            )}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-2">
                          {suggestedProduct.availableStock > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCartFromSuggested(e, suggestedProduct);
                              }}
                              className="w-full bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm"
                              style={{ minHeight: '32px' }}
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
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed text-xs sm:text-sm"
                              style={{ minHeight: '32px' }}
                            >
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No similar products found in this category.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

