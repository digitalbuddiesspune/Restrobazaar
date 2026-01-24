import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const vendorApi = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookie automatically send hotay
});

// Add request interceptor - cookie-only, localStorage nahi
vendorApi.interceptors.request.use(
  (config) => {
    // localStorage.getItem('token') remove kara
    // Cookie automatically send hotay withCredentials: true mule
    config.withCredentials = true; // Ensure cookies are sent
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
vendorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // localStorage.removeItem remove kara - cookie clear kara backend kadun
      window.location.href = '/vendor/login';
    }
    return Promise.reject(error);
  }
);

// Vendor Product Services
export const vendorProductService = {
  // Get vendor's own products
  getMyProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.status !== undefined) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await vendorApi.get(`/vendor-products/my-products?${params.toString()}`);
    return response.data;
  },

  // Get all vendor products (public)
  getAllVendorProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.vendorId) params.append('vendorId', filters.vendorId);
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.priceType) params.append('priceType', filters.priceType);
    if (filters.status !== undefined) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await vendorApi.get(`/vendor-products?${params.toString()}`);
    return response.data;
  },

  // Get vendor product by ID
  getVendorProductById: async (id) => {
    const response = await vendorApi.get(`/vendor-products/${id}`);
    return response.data;
  },

  // Create vendor product
  createVendorProduct: async (productData) => {
    const response = await vendorApi.post('/vendor-products', productData);
    return response.data;
  },

  // Update vendor product
  updateVendorProduct: async (id, productData) => {
    const response = await vendorApi.put(`/vendor-products/${id}`, productData);
    return response.data;
  },

  // Delete vendor product
  deleteVendorProduct: async (id) => {
    const response = await vendorApi.delete(`/vendor-products/${id}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id, stockData) => {
    const response = await vendorApi.patch(`/vendor-products/${id}/stock`, stockData);
    return response.data;
  },

  // Toggle status
  toggleStatus: async (id) => {
    const response = await vendorApi.patch(`/vendor-products/${id}/status`);
    return response.data;
  },

  // Get vendor products by city ID
  getVendorProductsByCity: async (cityId, filters = {}) => {
    const params = new URLSearchParams();
    params.append('cityId', cityId);
    if (filters.vendorId) params.append('vendorId', filters.vendorId);
    if (filters.status !== undefined) {
      params.append('status', filters.status);
    } else {
      params.append('status', 'true'); // Default to active products
    }
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await vendorApi.get(`/vendor-products/city/${cityId}?${params.toString()}`);
    return response.data;
  },
};

// Global Product Services
export const globalProductService = {
  // Get all products (catalog)
  getAllProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.subCategory) params.append('subCategory', filters.subCategory);
    if (filters.status !== undefined) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await vendorApi.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await vendorApi.get(`/products/${id}`);
    return response.data;
  },
};

// City Services
export const cityService = {
  getAllCities: async () => {
    const response = await vendorApi.get('/cities?isActive=true&isServiceable=true');
    return response.data;
  },
};

// Order Services
export const orderService = {
  // Get vendor's orders (orders containing vendor's products)
  getVendorOrders: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.orderStatus) params.append('orderStatus', filters.orderStatus);
    if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    // Assuming there's a vendor orders endpoint
    // If not, this will need to be created in the backend
    const response = await vendorApi.get(`/vendor/orders?${params.toString()}`);
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await vendorApi.get(`/vendor/orders/${id}`);
    return response.data;
  },

  // Update order status (e.g., confirm, ship, deliver)
  updateOrderStatus: async (id, status) => {
    const response = await vendorApi.patch(`/vendor/orders/${id}/status`, { orderStatus: status });
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await vendorApi.patch(`/vendor/orders/${id}/payment-status`, { paymentStatus });
    return response.data;
  },

  // Update order items
  updateOrderItems: async (id, items, billingDetails) => {
    const response = await vendorApi.patch(`/vendor/orders/${id}/items`, { items, billingDetails });
    return response.data;
  },

  // Get order statistics
  getOrderStats: async () => {
    const response = await vendorApi.get('/vendor/orders/stats');
    return response.data;
  },
};

// Vendor Account Services
export const vendorAccountService = {
  // Get vendor's own profile
  getVendorProfile: async () => {
    const response = await vendorApi.get('/vendor/me');
    return response.data;
  },
};

export default vendorApi;

