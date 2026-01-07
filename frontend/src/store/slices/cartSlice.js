import { createSlice } from '@reduxjs/toolkit';

// Load cart from localStorage on initialization
const loadCartFromStorage = () => {
  try {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

const initialState = {
  items: loadCartFromStorage(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { vendorProduct, quantity, selectedPrice } = action.payload;
      
      // Create a unique cart item ID (vendorProduct._id + priceType + price)
      const itemId = `${vendorProduct._id}_${selectedPrice?.type || 'single'}_${selectedPrice?.price || vendorProduct.pricing?.single?.price || '0'}`;
      
      // Check if item already exists in cart
      const existingItem = state.items.find(item => item.id === itemId);
      
      if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += quantity;
      } else {
        // Add new item to cart
        const newItem = {
          id: itemId,
          vendorProductId: vendorProduct._id,
          productId: vendorProduct.productId?._id || vendorProduct.productId,
          productName: vendorProduct.productId?.productName || 'Product',
          productImage: vendorProduct.productId?.images?.[0]?.url || vendorProduct.productId?.img || '',
          vendorId: vendorProduct.vendorId?._id || vendorProduct.vendorId,
          vendorName: vendorProduct.vendorId?.businessName || 'Vendor',
          cityId: vendorProduct.cityId?._id || vendorProduct.cityId,
          cityName: vendorProduct.cityId?.name || '',
          priceType: vendorProduct.priceType || 'single',
          price: selectedPrice?.price || vendorProduct.pricing?.single?.price || 0,
          selectedPrice: selectedPrice, // Store the selected price object for bulk pricing
          quantity: quantity,
          minimumOrderQuantity: vendorProduct.minimumOrderQuantity || 1,
          availableStock: vendorProduct.availableStock || 0,
          unit: vendorProduct.productId?.unit || 'piece',
        };
        state.items.push(newItem);
      }
      
      // Save to localStorage
      saveCartToStorage(state.items);
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      saveCartToStorage(state.items);
    },
    
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          state.items = state.items.filter(item => item.id !== itemId);
        } else {
          item.quantity = quantity;
        }
        saveCartToStorage(state.items);
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },
    
    // Initialize cart from localStorage (useful for hydration)
    initializeCart: (state) => {
      state.items = loadCartFromStorage();
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  initializeCart 
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartItemsCount = (state) => 
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectCartItemById = (itemId) => (state) =>
  state.cart.items.find(item => item.id === itemId);

export default cartSlice.reducer;

