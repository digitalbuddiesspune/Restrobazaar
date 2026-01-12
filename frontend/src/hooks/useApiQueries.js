import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authAPI,
  userAPI,
  cityAPI,
  categoryAPI,
  vendorProductAPI,
  globalProductAPI,
  wishlistAPI,
  addressAPI,
  orderAPI,
  userCouponAPI,
} from '../utils/api';

// Query Keys Factory - Centralized query key management
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'],
  },
  
  // User
  user: {
    all: ['user'],
    current: () => [...queryKeys.user.all, 'current'],
    detail: (id) => [...queryKeys.user.all, id],
  },
  
  // Cities
  cities: {
    all: ['cities'],
    lists: () => [...queryKeys.cities.all, 'list'],
    list: (filters) => [...queryKeys.cities.lists(), filters],
    serviceable: () => [...queryKeys.cities.all, 'serviceable'],
  },
  
  // Categories
  categories: {
    all: ['categories'],
    lists: () => [...queryKeys.categories.all, 'list'],
    list: (filters) => [...queryKeys.categories.lists(), filters],
    detail: (id) => [...queryKeys.categories.all, id],
    slug: (slug) => [...queryKeys.categories.all, 'slug', slug],
  },
  
  // Vendor Products
  vendorProducts: {
    all: ['vendorProducts'],
    lists: () => [...queryKeys.vendorProducts.all, 'list'],
    list: (filters) => [...queryKeys.vendorProducts.lists(), filters],
    detail: (id) => [...queryKeys.vendorProducts.all, id],
    byCity: (cityId, filters) => [...queryKeys.vendorProducts.all, 'city', cityId, filters],
    byCityAndCategory: (cityId, categoryId, filters) => [
      ...queryKeys.vendorProducts.all,
      'city',
      cityId,
      'category',
      categoryId,
      filters,
    ],
    byVendor: (vendorId, filters) => [...queryKeys.vendorProducts.all, 'vendor', vendorId, filters],
    search: (query, filters) => [...queryKeys.vendorProducts.all, 'search', query, filters],
    myProducts: (filters) => [...queryKeys.vendorProducts.all, 'my-products', filters],
  },
  
  // Global Products (Product Catalog)
  globalProducts: {
    all: ['globalProducts'],
    lists: () => [...queryKeys.globalProducts.all, 'list'],
    list: (filters) => [...queryKeys.globalProducts.lists(), filters],
    detail: (id) => [...queryKeys.globalProducts.all, id],
  },
  
  // Wishlist
  wishlist: {
    all: ['wishlist'],
    list: () => [...queryKeys.wishlist.all, 'list'],
  },
  
  // Addresses
  addresses: {
    all: ['addresses'],
    lists: () => [...queryKeys.addresses.all, 'list'],
    list: () => [...queryKeys.addresses.lists()],
    detail: (id) => [...queryKeys.addresses.all, id],
  },
  
  // Orders
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (filters) => [...queryKeys.orders.lists(), filters],
    detail: (id) => [...queryKeys.orders.all, id],
  },
  
  // User Coupons
  userCoupons: {
    all: ['userCoupons'],
    available: (filters) => [...queryKeys.userCoupons.all, 'available', filters],
  },
};

// ==================== AUTH QUERIES ====================

/**
 * Get current authenticated user
 */
export const useCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => userAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    ...options,
  });
};

// ==================== USER MUTATIONS ====================

/**
 * Update user mutation
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }) => userAPI.updateUser(userId, userData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
    },
  });
};

// ==================== CITY QUERIES ====================

/**
 * Get all cities (with filters)
 */
export const useCities = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.cities.list(filters),
    queryFn: () => cityAPI.getAllCities(),
    staleTime: 30 * 60 * 1000, // 30 minutes - cities don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

/**
 * Get serviceable cities
 */
export const useServiceableCities = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.cities.serviceable(),
    queryFn: () => cityAPI.getServiceableCities(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// ==================== CATEGORY QUERIES ====================

/**
 * Get all categories
 */
export const useCategories = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: () => categoryAPI.getAllCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

/**
 * Get category by ID
 */
export const useCategoryById = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoryAPI.getCategoryById(id),
    enabled: !!id, // Only run if id is provided
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

/**
 * Get category by slug
 */
export const useCategoryBySlug = (slug, options = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.slug(slug),
    queryFn: () => categoryAPI.getCategoryBySlug(slug),
    enabled: !!slug, // Only run if slug is provided
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// ==================== VENDOR PRODUCT QUERIES ====================

/**
 * Get all vendor products (with filters)
 */
export const useVendorProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.list(filters),
    queryFn: () => vendorProductAPI.getAllVendorProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - products may change more frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get vendor products by city ID
 */
export const useVendorProductsByCity = (cityId, filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.byCity(cityId, filters),
    queryFn: () => vendorProductAPI.getVendorProductsByCity(cityId, filters),
    enabled: !!cityId, // Only run if cityId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get vendor products by city ID and category ID
 */
export const useVendorProductsByCityAndCategory = (
  categoryId,
  filters = {},
  options = {}
) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.byCityAndCategory(
      filters.cityId,
      categoryId,
      filters
    ),
    queryFn: () =>
      vendorProductAPI.getVendorProductsByCityAndCategory(categoryId, filters),
    enabled: !!categoryId && !!filters.cityId, // Only run if both are provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get vendor product by ID
 */
export const useVendorProductById = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.detail(id),
    queryFn: () => vendorProductAPI.getVendorProductById(id),
    enabled: !!id, // Only run if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get vendor products by vendor ID
 */
export const useVendorProductsByVendor = (vendorId, filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.byVendor(vendorId, filters),
    queryFn: () => vendorProductAPI.getVendorProductsByVendor(vendorId, filters),
    enabled: !!vendorId, // Only run if vendorId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Search vendor products
 */
export const useSearchVendorProducts = (query, filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.search(query, filters),
    queryFn: () => vendorProductAPI.searchVendorProducts(query, filters),
    enabled: !!query && query.trim() !== '', // Only run if query is provided and not empty
    staleTime: 2 * 60 * 1000, // 2 minutes - search results may change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Get vendor's own products (My Products)
 */
export const useMyVendorProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.vendorProducts.myProducts(filters),
    queryFn: () => vendorProductAPI.getMyVendorProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - vendor's own products may change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== GLOBAL PRODUCT QUERIES ====================

/**
 * Get all global products (Product Catalog)
 */
export const useGlobalProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.globalProducts.list(filters),
    queryFn: () => globalProductAPI.getAllProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - product catalog doesn't change too often
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

// ==================== AUTH MUTATIONS ====================

/**
 * Sign in mutation
 */
export const useSignIn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials) => authAPI.signIn(credentials),
    onSuccess: () => {
      // Invalidate user queries to refetch after login
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

/**
 * Sign up mutation
 */
export const useSignUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => authAPI.signUp(userData),
    onSuccess: () => {
      // Invalidate user queries to refetch after signup
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
};

/**
 * Logout mutation
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });
};

// ==================== WISHLIST QUERIES ====================

/**
 * Get user wishlist
 */
export const useWishlist = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.wishlist.list(),
    queryFn: () => wishlistAPI.getWishlist(),
    staleTime: 2 * 60 * 1000, // 2 minutes - wishlist may change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== WISHLIST MUTATIONS ====================

/**
 * Add to wishlist mutation
 */
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => wishlistAPI.addToWishlist(productId),
    onSuccess: () => {
      // Invalidate and refetch wishlist
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
};

/**
 * Remove from wishlist mutation
 */
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => wishlistAPI.removeFromWishlist(productId),
    onSuccess: () => {
      // Invalidate and refetch wishlist
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
};

// ==================== ADDRESS QUERIES ====================

/**
 * Get user addresses
 */
export const useAddresses = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.addresses.list(),
    queryFn: () => addressAPI.getUserAddresses(),
    staleTime: 5 * 60 * 1000, // 5 minutes - addresses don't change too often
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get address by ID
 */
export const useAddressById = (addressId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.addresses.detail(addressId),
    queryFn: () => addressAPI.getAddressById(addressId),
    enabled: !!addressId, // Only run if addressId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

// ==================== ADDRESS MUTATIONS ====================

/**
 * Create address mutation
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressData) => addressAPI.createAddress(addressData),
    onSuccess: () => {
      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

/**
 * Update address mutation
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ addressId, addressData }) => addressAPI.updateAddress(addressId, addressData),
    onSuccess: (data, variables) => {
      // Invalidate addresses list and specific address
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.detail(variables.addressId) });
    },
  });
};

/**
 * Delete address mutation
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (addressId) => addressAPI.deleteAddress(addressId),
    onSuccess: () => {
      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: queryKeys.addresses.all });
    },
  });
};

// ==================== ORDER QUERIES ====================

/**
 * Get user orders
 */
export const useOrders = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => orderAPI.getUserOrders(filters),
    staleTime: 1 * 60 * 1000, // 1 minute - orders can change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Get order by ID
 */
export const useOrderById = (orderId, options = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => orderAPI.getOrderById(orderId),
    enabled: !!orderId, // Only run if orderId is provided
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== ORDER MUTATIONS ====================

/**
 * Create order mutation
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData) => orderAPI.createOrder(orderData),
    onSuccess: () => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      // Also invalidate wishlist in case items were removed
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
};

/**
 * Cancel order mutation
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderId) => orderAPI.cancelOrder(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate orders list and specific order
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    },
  });
};

// ==================== USER COUPON QUERIES ====================

/**
 * Get available coupons for user
 */
export const useAvailableCoupons = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.userCoupons.available(filters),
    queryFn: () => userCouponAPI.getAvailableCoupons(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - coupons may change
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== USER COUPON MUTATIONS ====================

/**
 * Validate coupon mutation
 */
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: ({ code, cartTotal, vendorId, cartItems }) =>
      userCouponAPI.validateCoupon(code, cartTotal, vendorId, cartItems),
  });
};
