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

// Helper function to calculate selectedPrice based on quantity and pricing data
const calculateSelectedPrice = (priceType, pricing, quantity) => {
  if (priceType === 'single' && pricing?.single?.price) {
    return {
      type: 'single',
      price: pricing.single.price,
      display: `₹${pricing.single.price} per piece`,
    };
  } else if (priceType === 'bulk' && pricing?.bulk?.length > 0) {
    // Find the appropriate price slab for the quantity
    const slab = pricing.bulk.find(
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
      const lastSlab = pricing.bulk[pricing.bulk.length - 1];
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
        // Update quantity if item exists - use minimumOrderQuantity instead of passed quantity
        const minQty = existingItem.minimumOrderQuantity || vendorProduct.minimumOrderQuantity || 1;
        const newQuantity = existingItem.quantity + minQty;
        existingItem.quantity = newQuantity;
        
        // Recalculate selectedPrice based on new quantity if bulk pricing
        if (existingItem.priceType === 'bulk' && existingItem.pricing?.bulk) {
          const recalculatedPrice = calculateSelectedPrice(
            existingItem.priceType,
            existingItem.pricing,
            newQuantity
          );
          if (recalculatedPrice) {
            existingItem.selectedPrice = recalculatedPrice;
            existingItem.price = recalculatedPrice.price;
          }
        }
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
          pricing: vendorProduct.pricing, // Store full pricing object to recalculate slabs
          quantity: quantity,
          minimumOrderQuantity: vendorProduct.minimumOrderQuantity || 1,
          availableStock: vendorProduct.availableStock || 0,
          unit: vendorProduct.productId?.unit || 'piece',
          gst: vendorProduct.gst || 0, // Store GST percentage
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
          
          // Recalculate selectedPrice based on new quantity if bulk pricing
          if (item.priceType === 'bulk' && item.pricing?.bulk) {
            const recalculatedPrice = calculateSelectedPrice(
              item.priceType,
              item.pricing,
              quantity
            );
            if (recalculatedPrice) {
              item.selectedPrice = recalculatedPrice;
              item.price = recalculatedPrice.price;
            }
          }
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
export const selectCartItemsCount = (state) => state.cart.items.length;
export const selectCartTotal = (state) =>
  state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
export const selectCartItemById = (itemId) => (state) =>
  state.cart.items.find(item => item.id === itemId);

export default cartSlice.reducer;

