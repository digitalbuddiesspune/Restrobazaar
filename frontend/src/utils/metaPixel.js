/**
 * Meta Pixel Event Tracking Utility
 * Provides a clean interface and class for Meta Ads (Facebook Pixel) tracking in RestroBazaar
 */

const DEFAULT_CURRENCY = 'INR';

class MetaPixelTracker {
  constructor(defaultCurrency = DEFAULT_CURRENCY) {
    this.defaultCurrency = defaultCurrency;
  }

  /**
   * Helper to check if fbq is available on window
   */
  isReady() {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  /**
   * Safe event dispatcher for Meta Pixel
   * @param {string} eventType - 'track' or 'trackCustom'
   * @param {string} eventName - Standard or Custom event name
   * @param {object} data - Event parameters
   */
  send(eventType, eventName, data = {}) {
    if (this.isReady()) {
      try {
        window.fbq(eventType, eventName, data);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Meta Pixel] ${eventType}: ${eventName}`, data);
        }
      } catch (err) {
        console.warn(`[Meta Pixel] Error tracking ${eventName}:`, err);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Meta Pixel] fbq not available for event: ${eventName}`, data);
      }
    }
  }

  /**
   * Track standard Meta Pixel event
   * @param {string} eventName
   * @param {object} data
   */
  track(eventName, data = {}) {
    this.send('track', eventName, data);
  }

  /**
   * Track custom Meta Pixel event
   * @param {string} eventName
   * @param {object} data
   */
  trackCustom(eventName, data = {}) {
    this.send('trackCustom', eventName, data);
  }

  /**
   * Helper: Extract product ID safely from various object shapes
   */
  getProductId(product) {
    if (!product) return '';
    return String(
      product._id ||
      product.id ||
      product.vendorProductId ||
      product.productId?._id ||
      (typeof product.productId === 'string' ? product.productId : '') ||
      ''
    );
  }

  /**
   * Helper: Extract product Name safely
   */
  getProductName(product) {
    if (!product) return 'Product';
    return (
      product.productId?.productName ||
      product.productName ||
      product.name ||
      product.title ||
      'Product'
    );
  }

  /**
   * Helper: Extract price safely
   */
  getProductPrice(product, selectedPrice = null) {
    if (selectedPrice?.price != null) return Number(selectedPrice.price);
    if (product?.selectedPrice?.price != null) return Number(product.selectedPrice.price);
    if (product?.price != null) return Number(product.price);
    if (product?.pricing?.single?.price != null) return Number(product.pricing.single.price);
    if (Array.isArray(product?.pricing?.bulk) && product.pricing.bulk.length > 0) {
      return Number(product.pricing.bulk[0].price);
    }
    if (product?.defaultPrice != null) return Number(product.defaultPrice);
    if (product?.originalPrice != null) return Number(product.originalPrice);
    return 0;
  }

  /**
   * Track PageView (e.g. on route change)
   */
  pageView() {
    this.track('PageView');
  }

  /**
   * Track Category View (ViewContent)
   * Route: /category/:slug
   * @param {object} category
   * @param {Array} products
   */
  viewCategory(category, products = []) {
    if (!category) return;
    const categoryName = category.name || category.slug || 'Category';
    const productIds = Array.isArray(products)
      ? products.map((p) => this.getProductId(p)).filter(Boolean)
      : [];

    this.track('ViewContent', {
      content_name: categoryName,
      content_category: categoryName,
      content_ids: productIds.slice(0, 10), // Send first 10 IDs
      content_type: 'product_group',
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track Product Detail View (ViewContent)
   * Route: /category/:categorySlug/:productId or /product/:productId
   * @param {object} product
   * @param {string|object} category
   */
  viewProduct(product, category = '') {
    if (!product) return;
    const id = this.getProductId(product);
    const name = this.getProductName(product);
    const price = this.getProductPrice(product);
    const categoryName = typeof category === 'string' ? category : (category?.name || '');

    this.track('ViewContent', {
      content_name: name,
      content_category: categoryName,
      content_ids: id ? [id] : [],
      content_type: 'product',
      value: price,
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track Add To Cart
   * @param {object} product
   * @param {number} quantity
   * @param {object} selectedPrice
   */
  addToCart(product, quantity = 1, selectedPrice = null) {
    if (!product) return;
    const id = this.getProductId(product);
    const name = this.getProductName(product);
    const unitPrice = this.getProductPrice(product, selectedPrice);
    const qty = Number(quantity) || 1;
    const totalValue = parseFloat((unitPrice * qty).toFixed(2));

    this.track('AddToCart', {
      content_name: name,
      content_ids: id ? [id] : [],
      content_type: 'product',
      value: totalValue,
      currency: this.defaultCurrency,
      content_quantity: qty,
      contents: [
        {
          id: id,
          quantity: qty,
          item_price: unitPrice,
        },
      ],
    });
  }

  /**
   * Track Remove From Cart (Custom event)
   * @param {object} product
   */
  removeFromCart(product) {
    if (!product) return;
    const id = this.getProductId(product);
    const name = this.getProductName(product);
    const price = this.getProductPrice(product);

    this.trackCustom('RemoveFromCart', {
      content_name: name,
      content_ids: id ? [id] : [],
      content_type: 'product',
      value: price,
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track View Cart Page
   * Route: /cart
   * @param {Array} cartItems
   * @param {number} cartTotal
   */
  viewCart(cartItems = [], cartTotal = 0) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const contentIds = items.map((item) => this.getProductId(item)).filter(Boolean);
    const totalValue = Number(cartTotal) || items.reduce(
      (sum, item) => sum + (this.getProductPrice(item) * (item.quantity || 1)),
      0
    );

    this.trackCustom('ViewCart', {
      content_name: 'Shopping Cart',
      content_ids: contentIds,
      content_type: 'product_group',
      value: parseFloat(Number(totalValue).toFixed(2)),
      currency: this.defaultCurrency,
      num_items: items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    });
  }

  /**
   * Track Add To Wishlist
   * @param {object} product
   */
  addToWishlist(product) {
    if (!product) return;
    const id = this.getProductId(product);
    const name = this.getProductName(product);
    const price = this.getProductPrice(product);

    this.track('AddToWishlist', {
      content_name: name,
      content_ids: id ? [id] : [],
      content_type: 'product',
      value: price,
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track Remove From Wishlist (Custom event)
   * @param {object} product
   */
  removeFromWishlist(product) {
    if (!product) return;
    const id = this.getProductId(product);
    const name = this.getProductName(product);
    const price = this.getProductPrice(product);

    this.trackCustom('RemoveFromWishlist', {
      content_name: name,
      content_ids: id ? [id] : [],
      content_type: 'product',
      value: price,
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track View Wishlist Page
   * Route: /wishlist
   * @param {Array} wishlistItems
   */
  viewWishlist(wishlistItems = []) {
    const items = Array.isArray(wishlistItems) ? wishlistItems : [];
    const contentIds = items.map((item) => this.getProductId(item)).filter(Boolean);
    const totalValue = items.reduce(
      (sum, item) => sum + this.getProductPrice(item),
      0
    );

    this.trackCustom('ViewWishlist', {
      content_name: 'Wishlist',
      content_ids: contentIds,
      content_type: 'product_group',
      value: parseFloat(Number(totalValue).toFixed(2)),
      currency: this.defaultCurrency,
      num_items: items.length,
    });
  }

  /**
   * Track Initiate Checkout
   * Route: /checkout
   * @param {Array} cartItems
   * @param {number} totalAmount
   */
  initiateCheckout(cartItems = [], totalAmount = 0) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const contentIds = items.map((item) => this.getProductId(item)).filter(Boolean);
    const contents = items.map((item) => ({
      id: this.getProductId(item),
      quantity: Number(item.quantity) || 1,
      item_price: this.getProductPrice(item),
    }));

    const numItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const value = parseFloat(Number(totalAmount).toFixed(2));

    this.track('InitiateCheckout', {
      content_name: 'Checkout',
      content_ids: contentIds,
      contents: contents,
      num_items: numItems,
      value: value,
      currency: this.defaultCurrency,
    });
  }

  /**
   * Track Purchase
   * @param {object} orderData - Order payload or created order object
   */
  purchase(orderData = {}) {
    const items = orderData.cartItems || orderData.items || orderData.products || [];
    const contentIds = items.map((item) => this.getProductId(item)).filter(Boolean);
    const contents = items.map((item) => ({
      id: this.getProductId(item),
      quantity: Number(item.quantity) || 1,
      item_price: this.getProductPrice(item),
    }));

    const numItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const value = parseFloat(Number(orderData.totalAmount || orderData.total || orderData.amount || 0).toFixed(2));

    this.track('Purchase', {
      content_name: 'Order Purchase',
      content_ids: contentIds,
      contents: contents,
      num_items: numItems,
      value: value,
      currency: this.defaultCurrency,
      order_id: orderData._id || orderData.orderId || orderData.id || undefined,
    });
  }
}

// Create singleton instance
export const metaPixel = new MetaPixelTracker();

// Backward compatibility functional exports
export const trackEvent = (eventName, data = {}) => metaPixel.track(eventName, data);
export const trackCustomEvent = (eventName, data = {}) => metaPixel.trackCustom(eventName, data);
export const trackPageView = () => metaPixel.pageView();
export const trackViewContent = (product, category) => metaPixel.viewProduct(product, category);
export const trackViewCategory = (category, products) => metaPixel.viewCategory(category, products);
export const trackAddToCart = (product, quantity, selectedPrice) => metaPixel.addToCart(product, quantity, selectedPrice);
export const trackRemoveFromCart = (product) => metaPixel.removeFromCart(product);
export const trackViewCart = (cartItems, totalValue) => metaPixel.viewCart(cartItems, totalValue);
export const trackAddToWishlist = (product) => metaPixel.addToWishlist(product);
export const trackRemoveFromWishlist = (product) => metaPixel.removeFromWishlist(product);
export const trackViewWishlist = (wishlistItems) => metaPixel.viewWishlist(wishlistItems);
export const trackInitiateCheckout = (cartItems, totalValue) => metaPixel.initiateCheckout(cartItems, totalValue);
export const trackPurchase = (orderData) => metaPixel.purchase(orderData);

export { MetaPixelTracker };
export default metaPixel;