import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorProductAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/cartSlice';
import { selectCartItems } from '../store/slices/cartSlice';
import { useWishlist, useRemoveFromWishlist } from '../hooks/useApiQueries';
import FlyingAnimation, { useFlyingAnimation } from '../components/FlyingAnimation';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const [removing, setRemoving] = useState({});
  const [addingToCart, setAddingToCart] = useState({});

  // Use flying animation hook
  const { flyingItems, triggerFlyingAnimation } = useFlyingAnimation();

  // React Query hooks for wishlist with caching
  const { data: wishlistResponse, isLoading: loading, error: wishlistError, refetch } = useWishlist({
    enabled: isAuthenticated(),
    retry: false,
  });

  const removeFromWishlistMutation = useRemoveFromWishlist();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/sign-in');
      return;
    }
  }, [navigate]);

  const wishlist = wishlistResponse?.success ? wishlistResponse.data : null;
  const error = wishlistError ? (wishlistError.message || 'Failed to fetch wishlist') : null;

  const handleRemoveFromWishlist = async (productId) => {
    setRemoving({ ...removing, [productId]: true });
    try {
      await removeFromWishlistMutation.mutateAsync(productId);
      // Query will automatically refetch due to invalidation in the mutation
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      alert('Failed to remove from wishlist. Please try again.');
    } finally {
      setRemoving({ ...removing, [productId]: false });
    }
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

  const handleAddToCart = async (e, productId) => {
    // Find the product from wishlist to get image immediately
    const wishlistProduct = products.find(p => p._id === productId);
    
    // Get product image for animation (use wishlist product image if available)
    const productImage = wishlistProduct?.images?.[0] || wishlistProduct?.image || 'https://via.placeholder.com/50x50?text=Product';
    
    // Trigger flying animation immediately when button is clicked
    if (e?.currentTarget) {
      triggerFlyingAnimation(e.currentTarget, productImage);
    }
    
    setAddingToCart({ ...addingToCart, [productId]: true });
    try {
      // Fetch full vendor product details
      const response = await vendorProductAPI.getVendorProductById(productId);
      
      if (!response.success || !response.data) {
        alert('Failed to fetch product details. Please try again.');
        setAddingToCart({ ...addingToCart, [productId]: false });
        return;
      }

      const product = response.data;
      
      // Check if product is in stock
      if (product.availableStock === 0 || product.availableStock === undefined) {
        alert('This product is out of stock');
        setAddingToCart({ ...addingToCart, [productId]: false });
        return;
      }

      const minQty = product.minimumOrderQuantity || 1;
      
      // Get the selected price based on minimum quantity
      const selectedPrice = getSelectedPriceForQuantity(product, minQty);
      
      if (!selectedPrice) {
        alert('Unable to determine price. Please view product details.');
        setAddingToCart({ ...addingToCart, [productId]: false });
        return;
      }

      // Check if product is already in cart
      const cartItemId = `${product._id}_${selectedPrice.type}_${selectedPrice.price}`;
      const existingCartItem = cartItems.find(item => item.id === cartItemId);

      if (existingCartItem) {
        // Product already in cart
        alert('Product is already in cart!');
        setAddingToCart({ ...addingToCart, [productId]: false });
        return;
      }

      // Add to cart using Redux
      dispatch(addToCart({
        vendorProduct: product,
        quantity: minQty,
        selectedPrice: selectedPrice,
      }));

      alert('Product added to cart!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart({ ...addingToCart, [productId]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const products = wishlist?.products || [];
  const isEmpty = products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Flying Animation Component */}
      <FlyingAnimation flyingItems={flyingItems} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Wishlist
        </h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-400 mb-4"
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Start adding products you love to your wishlist!
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {products.slice(0, 5).map((product) => {
              if (!product) return null;
              const discount = product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product._id}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden transform hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="aspect-square bg-white overflow-hidden relative flex-shrink-0">
                    {discount > 0 && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-red-50 text-red-600 border border-red-200 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                        {discount}% OFF
                      </div>
                    )}
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      disabled={removing[product._id]}
                      className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors border border-gray-200 disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                    <Link to={`/product/${product._id}`}>
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
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
                    </Link>
                  </div>
                  <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-end bg-gradient-to-b from-gray-100 to-gray-50">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product._id)}
                        disabled={addingToCart[product._id]}
                        className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 text-[10px] sm:text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
