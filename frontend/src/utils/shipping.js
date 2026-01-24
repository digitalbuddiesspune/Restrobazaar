/**
 * Calculate shipping charges based on order amount
 * @param {number} orderAmount - The cart total/order amount
 * @returns {number} - Shipping charges in rupees
 */
export const calculateShippingCharges = (orderAmount) => {
  if (orderAmount >= 6000) {
    return 0; // Free shipping for orders ₹6000 and above
  } else if (orderAmount >= 3000) {
    return 200; // ₹200 for orders between ₹3000 to ₹5999
  } else {
    return 300; // ₹300 for orders between ₹0 to ₹2999
  }
};
