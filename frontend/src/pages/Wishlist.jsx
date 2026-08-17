import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorProductAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart, updateQuantity } from '../store/slices/cartSlice';
import { selectCartItems } from '../store/slices/cartSlice';
import { useWishlist, useRemoveFromWishlist } from '../hooks/useApiQueries';
import FlyingAnimation, { useFlyingAnimation } from '../components/FlyingAnimation';
import metaPixel from '../utils/metaPixel';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const [removing, setRemoving] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [quantities, setQuantities] = useState({});
  const [showQuantitySelector, setShowQuantitySelector] = useState({});
  const [enrichedProducts, setEnrichedProducts] = useState([]);
  const [enriching, setEnriching] = useState(false);

  const { flyingItems, triggerFlyingAnimation } = useFlyingAnimation();

  const { data: wishlistResponse, isLoading: loading, error: wishlistError, refetch } = useWishlist({
    enabled: isAuthenticated(),
    retry: false,
  });

  const removeFromWishlistMutation = useRemoveFromWishlist();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/sign-in');
    }
  }, [navigate]);

  const wishlist = wishlistResponse?.success ? wishlistResponse.data : null;
  const error = wishlistError ? (wishlistError.message || 'Failed to fetch wishlist') : null;
  const wishlistProducts = useMemo(
    () => (wishlist?.products || []).filter(Boolean),
    [wishlist],
  );

  // Hydrate full vendor-product data (MOQ, stock, pricing) — same as Flutter wishlist.
  useEffect(() => {
    let cancelled = false;

    const enrich = async () => {
      if (!wishlistProducts.length) {
        setEnrichedProducts([]);
        return;
      }

      setEnriching(true);
      try {
        const results = await Promise.all(
          wishlistProducts.map(async (item) => {
            try {
              const response = await vendorProductAPI.getVendorProductById(item._id);
              if (response?.success && response.data) {
                return {
                  ...response.data,
                  // Keep wishlist-friendly display fallbacks
                  name:
                    response.data.productId?.productName ||
                    item.name ||
                    item.productName ||
                    'Product',
                  images:
                    response.data.productId?.images?.map((img) => img.url || img) ||
                    item.images ||
                    [],
                  originalPrice:
                    response.data.defaultPrice ??
                    response.data.productId?.originalPrice ??
                    item.originalPrice,
                };
              }
            } catch (err) {
              console.error('Failed to enrich wishlist product', item._id, err);
            }
            return item;
          }),
        );
        if (!cancelled) setEnrichedProducts(results);
      } finally {
        if (!cancelled) setEnriching(false);
      }
    };

    enrich();
    return () => {
      cancelled = true;
    };
  }, [wishlistProducts]);

  const products = enrichedProducts.length ? enrichedProducts : wishlistProducts;

  // Track Wishlist view in Meta Pixel
  useEffect(() => {
    if (products.length > 0) {
      metaPixel.viewWishlist(products);
    }
  }, [products]);

  const handleRemoveFromWishlist = async (productId) => {
    const productToRemove = products.find((p) => productKey(p) === String(productId));
    setRemoving({ ...removing, [productId]: true });
    try {
      await removeFromWishlistMutation.mutateAsync(productId);
      if (productToRemove) {
        metaPixel.removeFromWishlist(productToRemove);
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      alert('Failed to remove from wishlist. Please try again.');
    } finally {
      setRemoving({ ...removing, [productId]: false });
    }
  };

  const getDisplayPrice = (product) => {
    if (product.priceType === 'single' && product.pricing?.single?.price != null) {
      return product.pricing.single.price;
    }
    if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      return product.pricing.bulk[product.pricing.bulk.length - 1].price;
    }
    return product.price;
  };

  const getProductImage = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    if (product.productId?.images?.length > 0) {
      const first = product.productId.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return 'https://via.placeholder.com/50x50?text=Product';
  };

  const isInStock = (product) =>
    product.availableStock == null || product.availableStock > 0;

  const productKey = (product) => String(product?._id ?? product?.id ?? '');

  const findCartItem = (productId) =>
    cartItems.find((item) => String(item.vendorProductId) === String(productId));

  const getMinQty = (product) => {
    const value = product.minimumOrderQuantity || 1;
    return value > 0 ? value : 1;
  };

  const roundToMultiple = (value, multiple) => {
    if (multiple <= 0) return value;
    return Math.round(value / multiple) * multiple;
  };

  const getSelectedPriceForQuantity = (product, quantity) => {
    if (product.priceType === 'single' && product.pricing?.single?.price) {
      return {
        type: 'single',
        price: product.pricing.single.price,
        display: `₹${product.pricing.single.price} per piece`,
      };
    }
    if (product.priceType === 'bulk' && product.pricing?.bulk?.length > 0) {
      const sortedSlabs = [...product.pricing.bulk].sort((a, b) => a.minQty - b.minQty);
      const matchingSlabs = sortedSlabs.filter((s) => quantity >= s.minQty);

      if (matchingSlabs.length > 0) {
        const slab = matchingSlabs.sort((a, b) => b.minQty - a.minQty)[0];
        return {
          type: 'bulk',
          price: slab.price,
          display: `₹${slab.price} per piece (${slab.minQty}+ pieces)`,
          slab,
        };
      }
    }
    if (product.price != null) {
      return {
        type: 'single',
        price: product.price,
        display: `₹${product.price} per piece`,
      };
    }
    return null;
  };

  const getCartItemId = (product, selectedPrice) =>
    `${product._id}_${selectedPrice?.type || 'single'}_${selectedPrice?.price || product.pricing?.single?.price || '0'}`;

  const getProductQuantity = (product) => {
    const productId = productKey(product);
    const minQty = getMinQty(product);

    if (quantities[productId] !== undefined && quantities[productId] !== null) {
      return quantities[productId];
    }

    const cartItem = findCartItem(productId);
    if (cartItem) return cartItem.quantity;

    return minQty;
  };

  const handleAddToCartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;

    if (!isInStock(product)) {
      alert('This product is out of stock');
      return;
    }

    const productId = productKey(product);
    const minQty = getMinQty(product);
    const productImage = getProductImage(product);

    if (e?.currentTarget) {
      triggerFlyingAnimation(e.currentTarget, productImage);
    }

    const selectedPrice = getSelectedPriceForQuantity(product, minQty);
    if (!selectedPrice) {
      alert('Unable to determine price. Please view product details.');
      return;
    }

    // Ensure cart slice always gets a string _id for reliable matching.
    const vendorProduct = { ...product, _id: productId };

    const cartItem = findCartItem(productId);
    if (!cartItem) {
      dispatch(
        addToCart({
          vendorProduct,
          quantity: minQty,
          selectedPrice,
        }),
      );
      metaPixel.addToCart(vendorProduct, minQty, selectedPrice);
    } else {
      dispatch(
        updateQuantity({
          itemId: cartItem.id,
          quantity: cartItem.quantity + minQty,
        }),
      );
      metaPixel.addToCart(vendorProduct, minQty, selectedPrice);
    }

    setShowQuantitySelector((prev) => ({ ...prev, [productId]: true }));
    setQuantities((prev) => ({
      ...prev,
      [productId]: cartItem ? cartItem.quantity + minQty : minQty,
    }));
  };

  const handleQuantityChange = (e, product, delta) => {
    e.stopPropagation();
    e.preventDefault();

    const productId = productKey(product);
    const minQty = getMinQty(product);
    const cartItemByProduct = findCartItem(productId);

    if (!cartItemByProduct) return;

    let currentQty =
      quantities[productId] !== undefined
        ? quantities[productId]
        : cartItemByProduct.quantity;

    let validQty = roundToMultiple(currentQty + delta, minQty);
    if (validQty < minQty) validQty = minQty;

    const maxStock = product.availableStock;
    if (maxStock != null && validQty > maxStock) {
      validQty = roundToMultiple(maxStock, minQty);
      if (validQty < minQty) validQty = minQty;
      if (validQty > maxStock) validQty = Math.floor(maxStock / minQty) * minQty;
      if (validQty < minQty) return;
    }

    setQuantities((prev) => ({ ...prev, [productId]: validQty }));

    const selectedPrice = getSelectedPriceForQuantity(product, validQty);
    if (!selectedPrice) return;

    const cartItemId = getCartItemId(product, selectedPrice);
    let existingCartItem = cartItems.find((item) => item.id === cartItemId);
    if (!existingCartItem) existingCartItem = cartItemByProduct;

    if (existingCartItem) {
      dispatch(updateQuantity({ itemId: existingCartItem.id, quantity: validQty }));
    }
  };

  if (loading || (enriching && !products.length)) {
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

  const isEmpty = products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 relative">
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
            {products.map((product) => {
              if (!product) return null;

              const displayPrice = getDisplayPrice(product);
              const originalPrice = product.originalPrice ?? product.defaultPrice;
              const discount =
                originalPrice && displayPrice && originalPrice > displayPrice
                  ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
                  : 0;
              const productName =
                product.name ||
                product.productName ||
                product.productId?.productName ||
                'Product';
              const imageUrl = getProductImage(product);
              const inStock = isInStock(product);
              const minQty = getMinQty(product);
              const id = productKey(product);
              const cartItem = findCartItem(id);
              const shouldShowQuantitySelector =
                Boolean(showQuantitySelector[id]) || Boolean(cartItem);

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
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="h-full w-full flex items-center justify-center text-gray-400"
                        style={{ display: imageUrl ? 'none' : 'flex' }}
                      >
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
                        {productName}
                      </h3>
                    </Link>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          {displayPrice != null ? `₹${displayPrice}` : 'Price on request'}
                        </span>
                        {originalPrice && displayPrice && originalPrice > displayPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Same Add to Cart / MOQ stepper as Category */}
                      {inStock ? (
                        shouldShowQuantitySelector ? (
                          <div
                            className="w-full bg-gray-50 border border-black rounded-lg flex items-stretch overflow-hidden"
                            style={{ minHeight: '32px' }}
                          >
                            <button
                              onClick={(e) => handleQuantityChange(e, product, -minQty)}
                              className="w-8 sm:w-10 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center border-r border-gray-300 flex-shrink-0 self-stretch cursor-pointer"
                              title={`Decrease by ${minQty}`}
                            >
                              <svg
                                className="w-4 h-4 text-black"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <div className="flex-1 bg-white flex items-center justify-center border-x border-gray-300 self-stretch">
                              <span className="text-xs sm:text-sm font-semibold text-black">
                                {getProductQuantity(product)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleQuantityChange(e, product, minQty)}
                              className="w-8 sm:w-10 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center border-l border-gray-300 flex-shrink-0 self-stretch cursor-pointer"
                              title={`Increase by ${minQty}`}
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
                          <button
                            onClick={(e) => handleAddToCartClick(e, product)}
                            disabled={addingToCart[product._id]}
                            className="w-full bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                            style={{ minHeight: '32px' }}
                          >
                            <span>
                              {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                            </span>
                          </button>
                        )
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
        )}
      </div>
    </div>
  );
};

export default Wishlist;
