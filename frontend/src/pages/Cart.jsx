import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/sign-in');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        setCart(response.data);
      } else {
        setError('Failed to fetch cart');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/sign-in');
      } else {
        setError(err.message || 'Failed to fetch cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating({ ...updating, [productId]: true });
    try {
      const response = await cartAPI.updateCartItem(productId, newQuantity);
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdating({ ...updating, [productId]: false });
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }
    
    setUpdating({ ...updating, [productId]: true });
    try {
      const response = await cartAPI.removeFromCart(productId);
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Failed to remove item. Please try again.');
    } finally {
      setUpdating({ ...updating, [productId]: false });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }
    
    try {
      const response = await cartAPI.clearCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
      alert('Failed to clear cart. Please try again.');
    }
  };

  // Calculate item price with bulk offers and tax (same logic as ProductDetail)
  const calculateItemPrice = (product, quantity) => {
    if (!product) return { basePrice: 0, tax: 0, total: 0, taxDetails: { type: '', rate: 0, breakdown: '', cgstAmount: 0, sgstAmount: 0, igstAmount: 0 } };
    
    // Find the best bulk offer (highest minQty that user qualifies for)
    const bulkOffer = product.bulkOffers
      ?.filter((offer) => quantity >= offer.minQty)
      .sort((a, b) => b.minQty - a.minQty)[0];
    
    // Calculate base price (with bulk offer if available)
    let basePrice = 0;
    if (bulkOffer && quantity >= bulkOffer.minQty) {
      basePrice = bulkOffer.pricePerPiece * quantity;
    } else {
      basePrice = product.price * quantity;
    }
    
    // Calculate tax according to Indian GST system
    let tax = 0;
    let taxDetails = {
      type: '',
      rate: 0,
      breakdown: '',
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0
    };
    
    // Priority 1: If IGST is set (for inter-state sales)
    if (product.igst && parseFloat(product.igst) > 0) {
      const igstRate = parseFloat(product.igst);
      tax = (basePrice * igstRate) / 100;
      taxDetails = {
        type: 'IGST',
        rate: igstRate,
        breakdown: `IGST ${igstRate}%`,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: tax
      };
    }
    // Priority 2: If CGST and SGST are set (for intra-state sales)
    else if (product.cgst && product.sgst && (parseFloat(product.cgst) > 0 || parseFloat(product.sgst) > 0)) {
      const cgstRate = parseFloat(product.cgst) || 0;
      const sgstRate = parseFloat(product.sgst) || 0;
      const cgstAmount = (basePrice * cgstRate) / 100;
      const sgstAmount = (basePrice * sgstRate) / 100;
      tax = cgstAmount + sgstAmount;
      const totalGstRate = cgstRate + sgstRate;
      taxDetails = {
        type: 'CGST+SGST',
        rate: totalGstRate,
        breakdown: `CGST ${cgstRate}% + SGST ${sgstRate}%`,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        igstAmount: 0
      };
    }
    // Priority 3: If only CGST is set
    else if (product.cgst && parseFloat(product.cgst) > 0) {
      const cgstRate = parseFloat(product.cgst);
      tax = (basePrice * cgstRate) / 100;
      taxDetails = {
        type: 'CGST',
        rate: cgstRate,
        breakdown: `CGST ${cgstRate}%`,
        cgstAmount: tax,
        sgstAmount: 0,
        igstAmount: 0
      };
    }
    // Priority 4: If only SGST is set
    else if (product.sgst && parseFloat(product.sgst) > 0) {
      const sgstRate = parseFloat(product.sgst);
      tax = (basePrice * sgstRate) / 100;
      taxDetails = {
        type: 'SGST',
        rate: sgstRate,
        breakdown: `SGST ${sgstRate}%`,
        cgstAmount: 0,
        sgstAmount: tax,
        igstAmount: 0
      };
    }
    // Priority 5: If gstOrTaxPercent is set (general GST)
    else if (product.gstOrTaxPercent && parseFloat(product.gstOrTaxPercent) > 0) {
      const gstRate = parseFloat(product.gstOrTaxPercent);
      tax = (basePrice * gstRate) / 100;
      taxDetails = {
        type: 'GST',
        rate: gstRate,
        breakdown: `GST ${gstRate}%`,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0
      };
    }
    
    const total = basePrice + tax;
    
    return { basePrice, tax, total, taxDetails, bulkOffer };
  };

  // Calculate cart totals
  const calculateCartTotals = () => {
    if (!cart || !cart.items) {
      return { subtotal: 0, totalTax: 0, total: 0 };
    }

    let subtotal = 0;
    let totalTax = 0;

    cart.items.forEach((item) => {
      if (item.product) {
        const priceDetails = calculateItemPrice(item.product, item.quantity);
        subtotal += priceDetails.basePrice;
        totalTax += priceDetails.tax;
      }
    });

    const total = subtotal + totalTax;

    return { subtotal, totalTax, total };
  };

  const cartTotals = calculateCartTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
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
            onClick={fetchCart}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Shopping Cart
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/all-products"
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                if (!item.product) return null;
                const product = item.product;
                const priceDetails = calculateItemPrice(product, item.quantity);
                const discount = product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={item.product._id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <Link
                        to={`/product/${product.slug}`}
                        className="flex-shrink-0 w-full sm:w-32 aspect-square sm:h-32 bg-gray-100 rounded-lg overflow-hidden"
                      >
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain sm:object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-12 h-12"
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
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${product.slug}`}
                              className="text-lg sm:text-xl font-bold text-gray-900 hover:text-red-600 line-clamp-2"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <Link
                                to={`/category/${product.category.slug}`}
                                className="text-sm text-gray-500 hover:text-red-600"
                              >
                                {product.category.name}
                              </Link>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(product._id)}
                            disabled={updating[product._id]}
                            className="flex-shrink-0 ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Remove item"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xl font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-sm text-gray-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                              {discount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                                  {discount}% OFF
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Bulk Offer Info */}
                        {priceDetails.bulkOffer && item.quantity >= priceDetails.bulkOffer.minQty && (
                          <div className="mb-2">
                            <p className="text-xs text-green-700 font-medium">
                              ✓ Bulk offer applied: ₹{priceDetails.bulkOffer.pricePerPiece}/{product.units || 'Piece'}
                            </p>
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                          <div className="flex items-center gap-0 border-2 border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleUpdateQuantity(product._id, item.quantity - 1)}
                              disabled={updating[product._id] || item.quantity <= 1}
                              className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="px-4 py-1.5 text-gray-900 font-bold text-base min-w-[3rem] text-center bg-white border-x border-gray-300">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(product._id, item.quantity + 1)}
                              disabled={updating[product._id]}
                              className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Item Price Breakdown */}
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Subtotal:</span>
                            <span className="text-sm font-semibold text-gray-700">₹{priceDetails.basePrice.toFixed(2)}</span>
                          </div>
                          {priceDetails.tax > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Tax ({priceDetails.taxDetails.breakdown}):</span>
                              <span className="text-sm font-semibold text-gray-700">₹{priceDetails.tax.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Item Total:</span>
                            <span className="text-lg font-bold text-gray-900">₹{priceDetails.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold">₹{cartTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {cartTotals.totalTax > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Tax:</span>
                      <span className="font-semibold">₹{cartTotals.totalTax.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-red-600">
                      ₹{cartTotals.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-bold text-base shadow-md hover:shadow-lg transition-all"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/all-products"
                  className="block w-full mt-3 text-center px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
