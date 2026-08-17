/**
 * Meta Pixel Event Tracking Utility
 * Tracks user events for Meta Ads conversion tracking
 */

export const trackEvent = (eventName, data = {}) => {
  if (window.fbq) {
    window.fbq('track', eventName, data);
  } else {
    console.warn('Meta Pixel not loaded yet');
  }
};

export const trackViewContent = (product) => {
  trackEvent('ViewContent', {
    content_name: product.name || product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD'
  });
};

export const trackViewCategory = (categoryData) => {
  trackEvent('ViewContent', {
    content_name: categoryData.name || categoryData.title,
    content_type: 'product_group',
    content_ids: categoryData.products?.map(p => p.id) || [],
    currency: 'USD'
  });
};

export const trackAddToCart = (product, quantity = 1) => {
  trackEvent('AddToCart', {
    content_name: product.name || product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD',
    content_quantity: quantity
  });
};

export const trackRemoveFromCart = (product) => {
  trackEvent('RemoveFromCart', {
    content_name: product.name || product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD'
  });
};

export const trackViewCart = (cartItems) => {
  const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  trackEvent('ViewCart', {
    content_name: 'Shopping Cart',
    content_ids: cartItems.map(item => item.id),
    content_type: 'product_group',
    value: totalValue,
    currency: 'USD',
    num_items: cartItems.length
  });
};

export const trackAddToWishlist = (product) => {
  trackEvent('AddToWishlist', {
    content_name: product.name || product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD'
  });
};

export const trackRemoveFromWishlist = (product) => {
  trackEvent('RemoveFromWishlist', {
    content_name: product.name || product.title,
    content_ids: [product.id],
    content_type: 'product',
    value: product.price,
    currency: 'USD'
  });
};

export const trackViewWishlist = (wishlistItems) => {
  const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);
  
  trackEvent('ViewContent', {
    content_name: 'Wishlist',
    content_ids: wishlistItems.map(item => item.id),
    content_type: 'product_group',
    value: totalValue,
    currency: 'USD'
  });
};

export const trackPurchase = (orderData) => {
  trackEvent('Purchase', {
    value: orderData.total || orderData.amount,
    currency: 'USD',
    content_type: 'product_group',
    content_ids: orderData.items?.map(item => item.id) || [],
    content_name: 'Order Purchase',
    num_items: orderData.items?.length || 0
  });
};

export default {
  trackViewContent,
  trackViewCategory,
  trackAddToCart,
  trackRemoveFromCart,
  trackViewCart,
  trackAddToWishlist,
  trackRemoveFromWishlist,
  trackViewWishlist,
  trackPurchase
};