import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorProductService, globalProductService, cityService, orderService, vendorAccountService } from '../services/vendorService';

// Query Keys
export const vendorQueryKeys = {
  myProducts: (filters) => ['vendor', 'products', 'my-products', filters],
  allVendorProducts: (filters) => ['vendor', 'products', 'all', filters],
  vendorProduct: (id) => ['vendor', 'products', id],
  globalProducts: (filters) => ['vendor', 'global-products', filters],
  globalProduct: (id) => ['vendor', 'global-product', id],
  cities: () => ['vendor', 'cities'],
  orders: (filters) => ['vendor', 'orders', filters],
  order: (id) => ['vendor', 'orders', id],
  orderStats: () => ['vendor', 'orders', 'stats'],
  vendorProfile: () => ['vendor', 'profile'],
};

// ==================== VENDOR PRODUCT QUERIES ====================

/**
 * Get vendor's own products
 */
export const useMyVendorProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.myProducts(filters),
    queryFn: () => vendorProductService.getMyProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Get all vendor products
 */
export const useAllVendorProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.allVendorProducts(filters),
    queryFn: () => vendorProductService.getAllVendorProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get vendor product by ID
 */
export const useVendorProduct = (id, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.vendorProduct(id),
    queryFn: () => vendorProductService.getVendorProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// ==================== GLOBAL PRODUCT QUERIES ====================

/**
 * Get all global products (catalog)
 */
export const useGlobalProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.globalProducts(filters),
    queryFn: () => globalProductService.getAllProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Get global product by ID
 */
export const useGlobalProduct = (id, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.globalProduct(id),
    queryFn: () => globalProductService.getProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// ==================== CITY QUERIES ====================

/**
 * Get all cities
 */
export const useCities = (options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.cities(),
    queryFn: () => cityService.getAllCities(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// ==================== VENDOR PRODUCT MUTATIONS ====================

/**
 * Create vendor product mutation
 */
export const useCreateVendorProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData) => vendorProductService.createVendorProduct(productData),
    onSuccess: () => {
      // Invalidate and refetch my products
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', 'my-products'] });
    },
  });
};

/**
 * Update vendor product mutation
 */
export const useUpdateVendorProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => vendorProductService.updateVendorProduct(id, data),
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', 'my-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', variables.id] });
    },
  });
};

/**
 * Delete vendor product mutation
 */
export const useDeleteVendorProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => vendorProductService.deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', 'my-products'] });
    },
  });
};

/**
 * Update stock mutation
 */
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, stockData }) => vendorProductService.updateStock(id, stockData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', 'my-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', variables.id] });
    },
  });
};

/**
 * Toggle status mutation
 */
export const useToggleStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => vendorProductService.toggleStatus(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', 'my-products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', variables] });
    },
  });
};

// ==================== ORDER QUERIES ====================

/**
 * Get vendor's orders
 */
export const useVendorOrders = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.orders(filters),
    queryFn: () => orderService.getVendorOrders(filters),
    staleTime: 1 * 60 * 1000, // 1 minute - orders change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Get order by ID
 */
export const useVendorOrder = (id, options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.order(id),
    queryFn: () => orderService.getOrderById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

/**
 * Get order statistics
 */
export const useOrderStats = (options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.orderStats(),
    queryFn: () => orderService.getOrderStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== ORDER MUTATIONS ====================

/**
 * Update order status mutation
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => orderService.updateOrderStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', 'stats'] });
    },
  });
};

/**
 * Update payment status mutation
 */
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentStatus }) => orderService.updatePaymentStatus(id, paymentStatus),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', 'stats'] });
    },
  });
};

/**
 * Update order items mutation
 */
export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, items, billingDetails }) => orderService.updateOrderItems(id, items, billingDetails),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', 'stats'] });
    },
  });
};

// ==================== VENDOR PROFILE QUERIES ====================

/**
 * Get vendor's own profile
 */
export const useVendorProfile = (options = {}) => {
  return useQuery({
    queryKey: vendorQueryKeys.vendorProfile(),
    queryFn: () => vendorAccountService.getVendorProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

