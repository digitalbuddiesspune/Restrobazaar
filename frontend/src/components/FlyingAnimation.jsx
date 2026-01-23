import { useState, useCallback } from 'react';

/**
 * Hook to manage flying animations for cart and wishlist
 * @returns {Object} { flyingItems, triggerFlyingAnimation, triggerFlyingAnimationForWishlist }
 */
export const useFlyingAnimation = () => {
  const [flyingItems, setFlyingItems] = useState([]);

  /**
   * Trigger flying animation to cart
   * @param {HTMLElement} buttonElement - The button element that triggered the action
   * @param {string} productImage - URL of the product image
   */
  const triggerFlyingAnimation = useCallback((buttonElement, productImage) => {
    if (!buttonElement) return;

    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    const startX = buttonRect.left + buttonRect.width / 2;
    const startY = buttonRect.top + buttonRect.height / 2;

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // Check if we're on mobile (window width < 1024px) or desktop
      const isMobile = window.innerWidth < 1024;
      
      let cartContainer = null;
      
      if (isMobile) {
        // Mobile: Find cart icon in footer bottom navigation
        cartContainer = document.querySelector('.fixed.bottom-0 a[href="/cart"]');
      } else {
        // Desktop: Find cart icon in header navigation
        // Try multiple selectors to find the cart link
        const selectors = [
          'header nav a[href="/cart"]',
          'header a[href="/cart"]',
          'header .relative a[href="/cart"]',
          'a[href="/cart"]:not(.fixed.bottom-0 a)',
        ];
        
        for (const selector of selectors) {
          cartContainer = document.querySelector(selector);
          if (cartContainer) break;
        }
        
        // If still not found, try finding by the cart SVG and traverse up
        if (!cartContainer) {
          const allCartLinks = document.querySelectorAll('a[href="/cart"]');
          for (const link of allCartLinks) {
            // Check if this link is in the header (not in footer)
            const header = link.closest('header');
            if (header) {
              cartContainer = link;
              break;
            }
          }
        }
      }
      
      // Fallback: try any cart link if still not found
      if (!cartContainer) {
        cartContainer = document.querySelector('a[href="/cart"]');
      }
      
      if (!cartContainer) {
        console.warn('Cart icon not found for animation');
        return;
      }

      // Get cart container position (more accurate than just the SVG)
      const cartRect = cartContainer.getBoundingClientRect();
      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;

      // Create unique ID for this animation
      const animationId = Date.now() + Math.random();

      // Add flying item
      setFlyingItems(prev => [...prev, {
        id: animationId,
        startX,
        startY,
        endX,
        endY,
        image: productImage,
        type: 'cart', // Mark as cart animation
      }]);

      // Remove after animation completes
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== animationId));
      }, 1000);
    }, 10); // Small delay to ensure DOM is ready
  }, []);

  /**
   * Trigger flying animation to wishlist
   * @param {HTMLElement} buttonElement - The button element that triggered the action
   * @param {string} productImage - URL of the product image (not used for wishlist, but kept for compatibility)
   */
  const triggerFlyingAnimationForWishlist = useCallback((buttonElement, productImage) => {
    if (!buttonElement) return;

    // Get button position
    const buttonRect = buttonElement.getBoundingClientRect();
    const startX = buttonRect.left + buttonRect.width / 2;
    const startY = buttonRect.top + buttonRect.height / 2;

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      // Check if we're on mobile (window width < 1024px) or desktop
      const isMobile = window.innerWidth < 1024;
      
      let wishlistContainer = null;
      
      if (isMobile) {
        // Mobile: Find wishlist icon in footer bottom navigation
        wishlistContainer = document.querySelector('.fixed.bottom-0 a[href="/wishlist"]');
      } else {
        // Desktop: Find wishlist icon in header navigation
        const selectors = [
          'header nav a[href="/wishlist"]',
          'header a[href="/wishlist"]',
          'header .relative a[href="/wishlist"]',
          'a[href="/wishlist"]:not(.fixed.bottom-0 a)',
        ];
        
        for (const selector of selectors) {
          wishlistContainer = document.querySelector(selector);
          if (wishlistContainer) break;
        }
        
        // If still not found, try finding by traversing all wishlist links
        if (!wishlistContainer) {
          const allWishlistLinks = document.querySelectorAll('a[href="/wishlist"]');
          for (const link of allWishlistLinks) {
            const header = link.closest('header');
            if (header) {
              wishlistContainer = link;
              break;
            }
          }
        }
      }
      
      // Fallback: try any wishlist link if still not found
      if (!wishlistContainer) {
        wishlistContainer = document.querySelector('a[href="/wishlist"]');
      }
      
      if (!wishlistContainer) {
        console.warn('Wishlist icon not found for animation');
        return;
      }

      // Get wishlist container position
      const wishlistRect = wishlistContainer.getBoundingClientRect();
      const endX = wishlistRect.left + wishlistRect.width / 2;
      const endY = wishlistRect.top + wishlistRect.height / 2;

      // Create unique ID for this animation
      const animationId = Date.now() + Math.random();

      // Add flying item with type 'wishlist' to show heart icon
      setFlyingItems(prev => [...prev, {
        id: animationId,
        startX,
        startY,
        endX,
        endY,
        type: 'wishlist', // Mark as wishlist animation (will show heart icon)
      }]);

      // Remove after animation completes
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== animationId));
      }, 1000);
    }, 10);
  }, []);

  return {
    flyingItems,
    triggerFlyingAnimation,
    triggerFlyingAnimationForWishlist,
  };
};

/**
 * Component to render flying animation items
 * @param {Array} flyingItems - Array of flying item objects with { id, startX, startY, endX, endY, image, type }
 */
const FlyingAnimation = ({ flyingItems }) => {
  if (!flyingItems || flyingItems.length === 0) return null;

  return (
    <>
      {flyingItems.map((item) => {
        const deltaX = item.endX - item.startX;
        const deltaY = item.endY - item.startY;
        const isWishlist = item.type === 'wishlist';
        
        return (
          <div
            key={item.id}
            className="flying-item"
            style={{
              position: 'fixed',
              left: `${item.startX}px`,
              top: `${item.startY}px`,
              width: isWishlist ? '40px' : '50px',
              height: isWishlist ? '40px' : '50px',
              zIndex: 9999,
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              animation: `flyToCart 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
              '--delta-x': `${deltaX}px`,
              '--delta-y': `${deltaY}px`,
            }}
          >
            {isWishlist ? (
              // Heart icon for wishlist animation
              <svg
                className="w-full h-full text-red-600 drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              // Product image for cart animation
              <img
                src={item.image}
                alt="Flying product"
                className="w-full h-full object-contain rounded-lg shadow-lg border-2 border-red-500 bg-white"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/50x50?text=Product';
                }}
              />
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes flyToCart {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(calc(-50% + var(--delta-x) * 0.5), calc(-50% + var(--delta-y) * 0.5)) scale(0.8) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translate(calc(-50% + var(--delta-x)), calc(-50% + var(--delta-y))) scale(0.3) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default FlyingAnimation;
