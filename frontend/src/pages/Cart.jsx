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

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const [selectedCity] = useState(localStorage.getItem(CITY_STORAGE_KEY) || 'Select City');

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from cart?')) {
      dispatch(removeFromCart(itemId));
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
      dispatch(updateQuantity({ itemId, quantity }));
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Clear Cart
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Cart Items ({cartItems.length})
                    </h2>
                    <span className="text-sm text-gray-600">Delivering to: {selectedCity}</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.productImage || 'https://via.placeholder.com/150?text=Product'}
                            alt={item.productName}
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150?text=Product';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/product/${item.vendorProductId}`}
                                className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors line-clamp-2"
                              >
                                {item.productName}
                              </Link>
                              <p className="text-sm text-gray-600 mt-1">
                                Vendor: {item.vendorName}
                              </p>
                              {item.cityName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  City: {item.cityName}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="ml-4 text-red-600 hover:text-red-700 transition-colors"
                              title="Remove item"
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

                          {/* Price and Quantity */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                            <div>
                              <p className="text-xl font-bold text-red-600">
                                ₹{item.price.toFixed(2)} / {item.unit}
                              </p>
                              {item.priceType === 'bulk' && item.selectedPrice && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.selectedPrice.display}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">Qty:</label>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.id, item.quantity - 1)
                                    }
                                    disabled={item.quantity <= item.minimumOrderQuantity}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={item.minimumOrderQuantity}
                                    max={item.availableStock}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(item.id, parseInt(e.target.value) || item.minimumOrderQuantity)
                                    }
                                    className="w-16 px-2 py-1 text-center border-0 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                  />
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(item.id, item.quantity + 1)
                                    }
                                    disabled={item.quantity >= item.availableStock}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                                {item.availableStock < 10 && item.availableStock > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    Only {item.availableStock} left
                                  </p>
                                )}
                                {item.availableStock === 0 && (
                                  <p className="text-xs text-red-600 mt-1">Out of Stock</p>
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
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Charges</span>
                    <span className="font-medium">TBD</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-red-600">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg mb-4"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/"
                  className="block text-center text-gray-600 hover:text-red-600 transition-colors font-medium"
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

