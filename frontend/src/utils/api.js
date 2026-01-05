const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Helper function to make API requests
// Uses credentials: "include" to automatically send HTTP-only cookies
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    credentials: 'include', // Include cookies in requests (required for HTTP-only cookies)
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        response: {
          data: data,
          status: response.status,
        },
      };
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  signIn: async (credentials) => {
    return apiRequest('/users/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  signUp: async (userData) => {
    return apiRequest('/users/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/users/logout', {
      method: 'POST',
    });
  },
};

// User API
export const userAPI = {
  getCurrentUser: async () => {
    return apiRequest('/users/me', {
      method: 'GET',
    });
  },

  updateUser: async (userId, userData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// City API
export const cityAPI = {
  getAllCities: async () => {
    return apiRequest('/cities?isActive=true&isServiceable=true', {
      method: 'GET',
    });
  },

  getServiceableCities: async () => {
    return apiRequest('/cities/serviceable', {
      method: 'GET',
    });
  },
};

// Category API
export const categoryAPI = {
  getAllCategories: async () => {
    return apiRequest('/categories?isActive=true', {
      method: 'GET',
    });
  },

  getCategoryById: async (id) => {
    return apiRequest(`/categories/${id}`, {
      method: 'GET',
    });
  },

  getCategoryBySlug: async (slug) => {
    return apiRequest(`/categories/slug/${slug}`, {
      method: 'GET',
    });
  },
};

// Helper function to get selected city ID from localStorage
export const getSelectedCityId = () => {
  try {
    return localStorage.getItem('selectedCityId') || null;
  } catch {
    return null;
  }
};

// Helper function to make authenticated API requests with Bearer token
const authenticatedApiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        response: {
          data: data,
          status: response.status,
        },
      };
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Vendor Product API
export const vendorProductAPI = {
  // Get all vendor products (optionally filtered by city)
  getAllVendorProducts: async (filters = {}) => {
    const cityId = getSelectedCityId();
    const queryParams = new URLSearchParams();
    
    // Add city filter if city is selected
    if (cityId) {
      queryParams.append('cityId', cityId);
    }
    
    // Add status filter (only show active products by default)
    if (filters.status === undefined) {
      queryParams.append('status', 'true');
    } else {
      queryParams.append('status', filters.status);
    }
    
    // Add other filters
    if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
    if (filters.productId) queryParams.append('productId', filters.productId);
    if (filters.priceType) queryParams.append('priceType', filters.priceType);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    
    const queryString = queryParams.toString();
    return apiRequest(`/vendor-products${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Get vendor products by city ID
  getVendorProductsByCity: async (cityId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
    if (filters.productId) queryParams.append('productId', filters.productId);
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    } else {
      queryParams.append('status', 'true'); // Default to active products
    }
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    return apiRequest(`/vendor-products/city/${cityId}${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Get vendor products by city ID and category ID
  // If cityId is not provided, uses the selected city from localStorage
  getVendorProductsByCityAndCategory: async (categoryId, filters = {}) => {
    // Get cityId from filters or from localStorage
    let cityId = filters.cityId || getSelectedCityId();
    
    if (!cityId) {
      throw new Error('City ID is required. Please select a city first.');
    }
    
    if (!categoryId) {
      throw new Error('Category ID is required.');
    }
    
    const queryParams = new URLSearchParams();
    
    if (filters.vendorId) queryParams.append('vendorId', filters.vendorId);
    if (filters.priceType) queryParams.append('priceType', filters.priceType);
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    } else {
      queryParams.append('status', 'true'); // Default to active products
    }
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    
    const queryString = queryParams.toString();
    return apiRequest(`/vendor-products/city/${cityId}/category/${categoryId}${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Get vendor product by ID
  getVendorProductById: async (id) => {
    return apiRequest(`/vendor-products/${id}`, {
      method: 'GET',
    });
  },

  // Get vendor products by vendor ID
  getVendorProductsByVendor: async (vendorId, filters = {}) => {
    const cityId = getSelectedCityId();
    const queryParams = new URLSearchParams();
    
    if (cityId) queryParams.append('cityId', cityId);
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    } else {
      queryParams.append('status', 'true');
    }
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    return apiRequest(`/vendor-products/vendor/${vendorId}${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Search vendor products
  searchVendorProducts: async (query, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    queryParams.append('q', query);
    
    // Get cityId from filters or from localStorage
    let cityId = filters.cityId || getSelectedCityId();
    if (cityId) queryParams.append('cityId', cityId);
    
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    } else {
      queryParams.append('status', 'true'); // Default to active products
    }
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    
    const queryString = queryParams.toString();
    return apiRequest(`/vendor-products/search?${queryString}`, {
      method: 'GET',
    });
  },

  // Get vendor's own products (requires authentication)
  getMyVendorProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.cityId) queryParams.append('cityId', filters.cityId);
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    }
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    return authenticatedApiRequest(`/vendor-products/my-products${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },
};

// Global Product API (Product Catalog)
export const globalProductAPI = {
  // Get all products (product catalog)
  getAllProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.subCategory) queryParams.append('subCategory', filters.subCategory);
    if (filters.status !== undefined) {
      queryParams.append('status', filters.status);
    } else {
      queryParams.append('status', 'true'); // Default to active products
    }
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    
    const queryString = queryParams.toString();
    return authenticatedApiRequest(`/products${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },
};


// Wishlist API
export const wishlistAPI = {
  getWishlist: async () => {
    return apiRequest('/users/wishlist', {
      method: 'GET',
    });
  },

  addToWishlist: async (productId) => {
    return apiRequest('/users/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  removeFromWishlist: async (productId) => {
    return apiRequest(`/users/wishlist/${productId}`, {
      method: 'DELETE',
    });
  },
};

// Address API
export const addressAPI = {
  // Get all addresses for current user
  getUserAddresses: async () => {
    return authenticatedApiRequest('/addresses', {
      method: 'GET',
    });
  },

  // Get address by ID
  getAddressById: async (addressId) => {
    return authenticatedApiRequest(`/addresses/${addressId}`, {
      method: 'GET',
    });
  },

  // Create new address
  createAddress: async (addressData) => {
    return authenticatedApiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    return authenticatedApiRequest(`/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  },

  // Delete address
  deleteAddress: async (addressId) => {
    return authenticatedApiRequest(`/addresses/${addressId}`, {

      method: 'DELETE',
    });
  },
};

// Cart API (for adding from wishlist to cart)
export const cartAPI = {
  addToCart: async (productId, quantity = 1) => {
    // This uses Redux, but we can also add a backend endpoint if needed
    // For now, return success - the frontend will handle it via Redux
    return { success: true, message: 'Product added to cart' };
  },
};

// Order API
export const orderAPI = {
  // Create a new order
  createOrder: async (orderData) => {
    return authenticatedApiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get all orders for current user
  getUserOrders: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    return authenticatedApiRequest(`/orders${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    return authenticatedApiRequest(`/orders/${orderId}`, {
      method: 'GET',
    });
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    return authenticatedApiRequest(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
  },
};

export default {
  authAPI,
  userAPI,
  cityAPI,
  categoryAPI,
  vendorProductAPI,
  globalProductAPI,

  wishlistAPI,
  cartAPI,

  addressAPI,
  orderAPI,

};

