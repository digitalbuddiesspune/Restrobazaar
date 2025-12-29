import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  signUp: async (userData) => {
    const response = await api.post('/auth/sign-up', userData);
    return response.data;
  },
  
  signIn: async (credentials) => {
    const response = await api.post('/auth/sign-in', credentials);
    return response.data;
  },
};

// Category API functions
export const categoryAPI = {
  // Get all categories
  getAllCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  // Get category by slug
  getCategoryBySlug: async (slug) => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },
  
  // Seed categories (Admin only)
  seedCategories: async () => {
    const response = await api.post('/categories/seed');
    return response.data;
  },
  
  // Create category (Admin only)
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },
  
  // Update category (Admin only)
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },
  
  // Delete category (Admin only)
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Product API functions
export const productAPI = {
  // Get all products with optional filters
  getAllProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  // Get product by slug
  getProductBySlug: async (slug) => {
    const response = await api.get(`/products/slug/${slug}`);
    return response.data;
  },
  
  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  // Get products by category slug
  getProductsByCategory: async (categorySlug, params = {}) => {
    const response = await api.get(`/products/category/${categorySlug}`, { params });
    return response.data;
  },
  
  // Create product (Admin only)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  // Update product (Admin only)
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  // Delete product (Admin only)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Cart API functions
export const cartAPI = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },
  
  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    const response = await api.put('/cart/update', { productId, quantity });
    return response.data;
  },
  
  // Remove item from cart
  removeFromCart: async (productId) => {
    const response = await api.delete('/cart/remove', { data: { productId } });
    return response.data;
  },
  
  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};

// Wishlist API functions
export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },
  
  // Add product to wishlist
  addToWishlist: async (productId) => {
    const response = await api.post('/wishlist/add', { productId });
    return response.data;
  },
  
  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    const response = await api.delete('/wishlist/remove', { data: { productId } });
    return response.data;
  },
  
  // Check if product is in wishlist
  checkWishlist: async (productId) => {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response.data;
  },
};

export default api;


