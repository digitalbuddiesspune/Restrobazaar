/**
 * Order ID Formatter Utility
 * 
 * Converts order IDs to a standardized format showing the last 6 digits with # prefix
 */

/**
 * Formats an order ID to show only the last 6 digits with # prefix
 * 
 * @param {string|number} orderId - The original order ID (can be orderNumber, _id, or any ID format)
 * @returns {string} Formatted order ID with # prefix and last 6 digits
 * 
 * @example
 * formatOrderId('ORD-1234567890-1234') // Returns: '#01234'
 * formatOrderId('67890') // Returns: '#067890'
 * formatOrderId('1234567890') // Returns: '#456789'
 * formatOrderId('ABC123456789') // Returns: '#456789'
 * formatOrderId(null) // Returns: '#N/A'
 */
export const formatOrderId = (orderId) => {
  if (!orderId) return '#N/A';
  
  // Convert to string
  const idString = String(orderId);
  
  // Extract only numeric digits from the order ID (removes letters, hyphens, etc.)
  const digitsOnly = idString.replace(/\D/g, '');
  
  // If no digits found, return N/A
  if (digitsOnly.length === 0) return '#N/A';
  
  // Get the last 6 digits
  const lastSix = digitsOnly.length > 6 
    ? digitsOnly.slice(-6) 
    : digitsOnly.padStart(6, '0');
  
  return `#${lastSix}`;
};

/**
 * Alternative function name for backward compatibility
 * @deprecated Use formatOrderId instead
 */
export const getLastSixDigits = formatOrderId;
