import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart,
  updateQuantity,
  clearCart,
} from '../store/slices/cartSlice';
import { CITY_STORAGE_KEY } from '../components/CitySelectionPopup';
import { calculateShippingCharges } from '../utils/shipping';
import Button from '../components/Button';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const [selectedCity] = useState(localStorage.getItem(CITY_STORAGE_KEY) || 'Select City');
  
  // Calculate shipping charges based on cart total
  const shippingCharges = calculateShippingCharges(cartTotal);
  const grandTotal = cartTotal + shippingCharges;

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from cart?')) {
      dispatch(removeFromCart(itemId));
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;
    
    const minOrderQty = item.minimumOrderQuantity || 1;
    let quantity = parseInt(newQuantity);
    
    // Calculate maximum valid quantity (round down available stock to nearest multiple of minOrderQty)
    const maxValidQty = Math.floor(item.availableStock / minOrderQty) * minOrderQty;
    
    // Ensure quantity is at least minimum order quantity
    if (quantity < minOrderQty) {
      quantity = minOrderQty;
    }
    
    // Round to nearest multiple of minimum order quantity
    const roundedQty = Math.round(quantity / minOrderQty) * minOrderQty;
    
    // Ensure quantity doesn't exceed the maximum valid quantity (which is a multiple of minOrderQty)
    const finalQty = Math.max(minOrderQty, Math.min(roundedQty, maxValidQty));
    
    if (finalQty > 0) {
      dispatch(updateQuantity({ itemId, quantity: finalQty }));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    // Navigate to checkout page (you can create this later)
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to your cart to get started!</p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            {cartItems.length > 0 && (
              <Button
                variant="text"
                size="sm"
                onClick={handleClearCart}
              >
                Clear Cart
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">
                      Cart Items ({cartItems.length})
                    </h2>
                    <span className="text-sm text-gray-600">Delivering to: {selectedCity}</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.productImage || 'https://via.placeholder.com/150?text=Product'}
                            alt={item.productName}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-1 bg-white rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Product';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/product/${item.vendorProductId}`}
                                className="text-base font-semibold text-gray-900 hover:text-red-600 transition-colors line-clamp-2"
                              >
                                {item.productName}
                              </Link>
                              <p className="text-sm text-gray-600 mt-0.5">
                                Vendor: {item.vendorName}
                              </p>
                              {item.cityName && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  City: {item.cityName}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="ml-2 flex-shrink-0"
                              title="Remove item"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </Button>
                          </div>

                          {/* Price and Quantity */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                            <div>
                              <p className="text-base font-bold text-red-600">
                                ₹{item.price.toFixed(2)} / {item.unit}
                              </p>
                              {item.priceType === 'bulk' && item.selectedPrice && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {item.selectedPrice.display}
                                </p>
                              )}
                            </div>

                              <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <label className="text-sm text-gray-700">Qty:</label>
                                <div className="flex items-center border border-gray-300 rounded">
                                  <Button
                                    variant="textGray"
                                    size="sm"
                                    onClick={() => {
                                      const minOrderQty = item.minimumOrderQuantity || 1;
                                      const newQty = Math.max(
                                        item.minimumOrderQuantity || 1,
                                        item.quantity - minOrderQty
                                      );
                                      handleQuantityChange(item.id, newQty);
                                    }}
                                    disabled={item.quantity <= item.minimumOrderQuantity}
                                    className="px-2 py-0.5 hover:bg-gray-100 border-0 rounded-none"
                                    title={`Decrease by ${item.minimumOrderQuantity || 1}`}
                                  >
                                    −
                                  </Button>
                                  <input
                                    type="number"
                                    min={item.minimumOrderQuantity}
                                    max={(() => {
                                      const minOrderQty = item.minimumOrderQuantity || 1;
                                      return Math.floor(item.availableStock / minOrderQty) * minOrderQty;
                                    })()}
                                    step={item.minimumOrderQuantity || 1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(item.id, parseInt(e.target.value) || item.minimumOrderQuantity)
                                    }
                                    className="w-12 px-1 py-0.5 text-sm text-center border-0 focus:ring-1 focus:ring-red-500 focus:outline-none"
                                  />
                                  <Button
                                    variant="textGray"
                                    size="sm"
                                    onClick={() => {
                                      const minOrderQty = item.minimumOrderQuantity || 1;
                                      // Calculate maximum valid quantity (round down available stock to nearest multiple of minOrderQty)
                                      const maxValidQty = Math.floor(item.availableStock / minOrderQty) * minOrderQty;
                                      const newQty = Math.min(
                                        maxValidQty,
                                        item.quantity + minOrderQty
                                      );
                                      handleQuantityChange(item.id, newQty);
                                    }}
                                    disabled={(() => {
                                      const minOrderQty = item.minimumOrderQuantity || 1;
                                      const maxValidQty = Math.floor(item.availableStock / minOrderQty) * minOrderQty;
                                      return item.quantity >= maxValidQty;
                                    })()}
                                    className="px-2 py-0.5 hover:bg-gray-100 border-0 rounded-none"
                                    title={`Increase by ${item.minimumOrderQuantity || 1}`}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-bold text-gray-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                                {item.availableStock < 10 && item.availableStock > 0 && (
                                  <p className="text-sm text-orange-600 mt-0.5">
                                    Only {item.availableStock} left
                                  </p>
                                )}
                                {item.availableStock === 0 && (
                                  <p className="text-sm text-red-600 mt-0.5">Out of Stock</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h2>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Shipping Charges</span>
                    <div className="text-right">
                      {shippingCharges === 0 ? (
                        <span className="font-medium text-green-600">Free</span>
                      ) : (
                        <span className="font-medium">₹{shippingCharges.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-red-600">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleCheckout}
                  className="mb-3"
                >
                  Place Order
                </Button>

                <Link
                  to="/"
                  className="block text-center text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

