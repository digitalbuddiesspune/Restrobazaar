import { useState, useEffect, useMemo } from 'react';
import { useVendorProfile } from '../../hooks/useVendorQueries';
import { vendorProductService } from '../../services/vendorService';

const CreateOrder = () => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Product filters
  const [productSearch, setProductSearch] = useState('');
  
  // Address related state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    addressType: 'home',
    isDefault: false,
  });
  const [addressFormError, setAddressFormError] = useState('');
  const [addressFormSuccess, setAddressFormSuccess] = useState('');
  const [addressFormLoading, setAddressFormLoading] = useState(false);

  const { data: vendorProfileData } = useVendorProfile();
  const vendor = vendorProfileData?.data;
  const vendorId = vendor?._id || vendor?.id;
  const vendorCityIds = vendor?.serviceCities?.map(city => city._id || city) || [];
  
  // Filter products based on search
  useEffect(() => {
    filterProducts();
  }, [productSearch, allProducts]);
  
  // Debug logging
  useEffect(() => {
    if (vendor) {
      console.log('Vendor data:', { vendorId, vendorCityIds, vendor });
    }
  }, [vendor, vendorId, vendorCityIds]);
  
  const filterProducts = () => {
    // Only show products when there's a search query
    if (!productSearch || productSearch.trim().length === 0) {
      setProducts([]);
      return;
    }
    
    let filtered = [...allProducts];
    
    // Filter by product name search
    filtered = filtered.filter(p => {
      const productName = p.productId?.productName || p.productName || '';
      return productName.toLowerCase().includes(productSearch.toLowerCase());
    });
    
    setProducts(filtered);
  };

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  // Fetch users only when search query has at least 2 characters
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      fetchUsers();
    } else {
      // Clear users when search is empty or too short
      setUsers([]);
    }
  }, [searchQuery]);

  // Fetch products when vendor is available
  useEffect(() => {
    if (vendor?._id) {
      fetchProducts();
    }
  }, [vendor?._id]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query params
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Get all users for selection
        sortBy: 'name', // Default sort by name
        sortOrder: 'asc',
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`${baseUrl}/vendor/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setError('');
      
      // Fetch vendor's own products - this automatically filters by vendor ID
      // We'll get products from all cities the vendor serves
      const allProducts = [];
      
      // If vendor has service cities, fetch products for each city
      if (vendorCityIds.length > 0) {
        for (const cityId of vendorCityIds) {
          try {
            // Use the city-specific endpoint with vendorId filter
            const cityIdStr = (cityId._id || cityId).toString();
            const response = await vendorProductService.getVendorProductsByCity(cityIdStr, {
              vendorId: vendorId,
              status: 'true',
              limit: 1000,
            });
            
            if (response && response.success && response.data && Array.isArray(response.data)) {
              // Filter to ensure only this vendor's products
              const vendorProducts = response.data.filter(p => {
                const productVendorId = p.vendorId?._id || p.vendorId;
                const vendorIdStr = (vendorId?._id || vendorId)?.toString();
                return productVendorId?.toString() === vendorIdStr;
              });
              allProducts.push(...vendorProducts);
              console.log(`Found ${vendorProducts.length} products for city ${cityIdStr}`);
            }
          } catch (err) {
            console.error(`Error fetching products for city ${cityId}:`, err);
          }
        }
      }
      
      // Fallback: Get all vendor's products if city-based fetch didn't work
      if (allProducts.length === 0) {
        try {
          const response = await vendorProductService.getMyProducts({
            status: 'true',
            limit: 1000,
          });
          
          if (response && response.success && response.data && Array.isArray(response.data)) {
            // Filter by vendor's service cities if available
            if (vendorCityIds.length > 0) {
              const filtered = response.data.filter(p => {
                const productCityId = p.cityId?._id || p.cityId;
                return vendorCityIds.some(cid => {
                  const cidStr = (cid._id || cid).toString();
                  const productCityStr = (productCityId?._id || productCityId)?.toString();
                  return cidStr === productCityStr;
                });
              });
              allProducts.push(...filtered);
            } else {
              allProducts.push(...response.data);
            }
          }
        } catch (err) {
          console.error('Error fetching vendor products:', err);
        }
      }
      
      // Remove duplicates based on vendorProduct _id
      const uniqueProducts = Array.from(
        new Map(allProducts.map(p => [p._id, p])).values()
      );
      
      setAllProducts(uniqueProducts);
      // filterProducts will be called by useEffect to update products
      
      if (uniqueProducts.length === 0) {
        console.warn('No products found for vendor');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    const user = users.find(u => u._id === userId);
    setSelectedUser(user);
    setCartItems([]); // Clear cart when user changes
    setSelectedAddressId(''); // Clear selected address
    setAddresses([]); // Clear addresses
    // Fetch addresses for the selected user
    if (userId) {
      fetchUserAddresses(userId);
    }
  };

  const handleRemoveUser = () => {
    setSelectedUserId('');
    setSelectedUser(null);
    setCartItems([]); // Clear cart when user is removed
    setSelectedAddressId(''); // Clear selected address
    setAddresses([]); // Clear addresses
    setSearchQuery(''); // Clear search query
  };
  
  // Fetch addresses for a user
  const fetchUserAddresses = async (userId) => {
    if (!userId) return;
    
    try {
      setAddressesLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseUrl}/vendor/addresses/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        const userAddresses = data.data || [];
        setAddresses(userAddresses);
        // Auto-select default address if available
        const defaultAddress = userAddresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (userAddresses.length > 0) {
          // Select first address if no default
          setSelectedAddressId(userAddresses[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };
  
  // Handle address form change
  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData({
      ...addressFormData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setAddressFormError('');
    setAddressFormSuccess('');
  };
  
  // Handle address form submission
  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    setAddressFormError('');
    setAddressFormSuccess('');

    // Validate required fields
    if (!addressFormData.name || !addressFormData.phone || !addressFormData.addressLine1 || 
        !addressFormData.city || !addressFormData.state || !addressFormData.pincode) {
      setAddressFormError('Please fill all required fields');
      return;
    }

    setAddressFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      const addressData = {
        ...addressFormData,
        userId: selectedUserId,
      };

      const response = await fetch(`${baseUrl}/vendor/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (data.success) {
        setAddressFormSuccess('Address created successfully!');
        // Reset form
        setAddressFormData({
          name: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          addressType: 'home',
          isDefault: false,
        });
        setShowAddressForm(false);
        // Refresh addresses
        fetchUserAddresses(selectedUserId);
      } else {
        setAddressFormError(data.message || 'Failed to save address');
      }
    } catch (err) {
      setAddressFormError('Failed to save address. Please try again.');
    } finally {
      setAddressFormLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const vendorProduct = product;
    const minimumOrderQuantity = vendorProduct.minimumOrderQuantity || 1;
    // Get the global Product ID (not VendorProduct ID)
    const globalProductId = vendorProduct.productId?._id || vendorProduct.productId;
    const vendorProductId = vendorProduct._id; // VendorProduct ID for reference
    
    // Check if item exists by vendorProductId (since same vendor product can only be added once)
    const existingItem = cartItems.find(item => item.vendorProductId === vendorProductId);
    
    if (existingItem) {
      // Increase by minimum order quantity (use stored value or product value)
      const minQty = existingItem.minimumOrderQuantity || minimumOrderQuantity;
      setCartItems(cartItems.map(item =>
        item.vendorProductId === vendorProductId
          ? { ...item, quantity: item.quantity + minQty }
          : item
      ));
    } else {
      // Add with minimum order quantity
      // Get price based on priceType
      let price = 0;
      if (vendorProduct.priceType === 'single') {
        price = vendorProduct.pricing?.single?.price || vendorProduct.price || 0;
      } else if (vendorProduct.priceType === 'bulk' && vendorProduct.pricing?.bulk?.length > 0) {
        // Use the first bulk price tier for initial calculation
        price = vendorProduct.pricing.bulk[0].price || 0;
      } else {
        price = vendorProduct.price || vendorProduct.sellingPrice || 0;
      }
      
      const productName = vendorProduct.productId?.productName || vendorProduct.productName || 'Product';
      // Handle different image formats: object with url, string, or array
      let productImage = '';
      if (vendorProduct.productId?.images?.[0]) {
        const firstImage = vendorProduct.productId.images[0];
        productImage = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
      } else if (vendorProduct.productId?.img) {
        productImage = vendorProduct.productId.img;
      } else if (vendorProduct.productImage) {
        productImage = vendorProduct.productImage;
      }
      
      // Get the global Product ID (not VendorProduct ID)
      const globalProductId = vendorProduct.productId?._id || vendorProduct.productId;
      
      setCartItems([
        ...cartItems,
        {
          productId: globalProductId, // Global Product ID (required by Order model)
          vendorProductId: vendorProduct._id, // VendorProduct ID (for reference)
          _id: vendorProduct._id, // Keep for cart operations
          name: productName,
          image: productImage,
          price: price,
          quantity: minimumOrderQuantity,
          minimumOrderQuantity: minimumOrderQuantity,
          vendorProduct: vendorProduct, // Store full product for price calculation
        }
      ]);
    }
  };

  const handleRemoveFromCart = (vendorProductId) => {
    setCartItems(cartItems.filter(item => (item.vendorProductId !== vendorProductId && item._id !== vendorProductId)));
  };

  const handleUpdateQuantity = (vendorProductId, quantity) => {
    const cartItem = cartItems.find(item => item.vendorProductId === vendorProductId || item._id === vendorProductId);
    if (!cartItem) return;
    
    const minimumOrderQuantity = cartItem.minimumOrderQuantity || 1;
    let newQuantity = parseInt(quantity) || minimumOrderQuantity;
    
    // Ensure quantity is not less than minimum
    if (newQuantity < minimumOrderQuantity) {
      newQuantity = minimumOrderQuantity;
    }
    
    // Round quantity to nearest multiple of minimum order quantity
    newQuantity = Math.max(minimumOrderQuantity, Math.round(newQuantity / minimumOrderQuantity) * minimumOrderQuantity);
    
    if (newQuantity <= 0) {
      handleRemoveFromCart(vendorProductId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      (item.vendorProductId === vendorProductId || item._id === vendorProductId)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  const handleIncreaseQuantity = (vendorProductId) => {
    const cartItem = cartItems.find(item => item.vendorProductId === vendorProductId || item._id === vendorProductId);
    if (!cartItem) return;
    
    const minimumOrderQuantity = cartItem.minimumOrderQuantity || 1;
    const newQuantity = cartItem.quantity + minimumOrderQuantity;
    
    setCartItems(cartItems.map(item =>
      (item.vendorProductId === vendorProductId || item._id === vendorProductId)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  const handleDecreaseQuantity = (vendorProductId) => {
    const cartItem = cartItems.find(item => item.vendorProductId === vendorProductId || item._id === vendorProductId);
    if (!cartItem) return;
    
    const minimumOrderQuantity = cartItem.minimumOrderQuantity || 1;
    const newQuantity = Math.max(minimumOrderQuantity, cartItem.quantity - minimumOrderQuantity);
    
    if (newQuantity < minimumOrderQuantity) {
      handleRemoveFromCart(vendorProductId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      (item.vendorProductId === vendorProductId || item._id === vendorProductId)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotals = useMemo(() => {
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate GST per product based on each product's GST percentage
    const gstBreakdown = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      // Get GST from vendorProduct if available, otherwise 0
      const gstPercentage = item.vendorProduct?.gst || 0;
      const gstAmount = (itemTotal * gstPercentage) / 100;
      return {
        itemId: item.vendorProductId || item._id,
        productName: item.name,
        gstPercentage,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
      };
    });
    
    const gstAmount = gstBreakdown.reduce((sum, item) => sum + item.gstAmount, 0);
    const shippingCharges = 0; // Free shipping
    const totalAmount = cartTotal + gstAmount + shippingCharges;
    
    return {
      cartTotal: parseFloat(cartTotal.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      gstBreakdown,
      shippingCharges,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }, [cartItems]);

  const handlePlaceOrder = async () => {
    if (!selectedUser) {
      setError('Please select a user first');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('Please add at least one product to the cart');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Note: This requires a vendor-specific endpoint to create orders for other users
      // The regular /orders endpoint creates orders for the authenticated user only
      // For now, we'll use a vendor-specific endpoint: /vendor/orders/create-for-user
      
      // Use selected address
      if (!selectedAddressId) {
        setError('Please select a delivery address for the user');
        setLoading(false);
        return;
      }
      
      const addressId = selectedAddressId;
      
      const orderData = {
        userId: selectedUser._id, // Specify the user for whom the order is being created
        addressId: addressId,
        cartItems: cartItems.map(item => ({
          _id: item.vendorProductId || item._id, // VendorProduct ID for reference
          productId: item.productId, // Global Product ID (required by Order model)
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod: 'cod', // Default to COD
        cartTotal: calculateTotals.cartTotal,
        gstAmount: calculateTotals.gstAmount,
        shippingCharges: calculateTotals.shippingCharges,
        totalAmount: calculateTotals.totalAmount,
      };

      // Use vendor-specific endpoint if available, otherwise try regular endpoint
      // Note: Backend needs to implement: POST /api/v1/vendor/orders/create-for-user
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/vendor/orders/create-for-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to place order');
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.success) {
        setSuccess('Order placed successfully!');
        setCartItems([]);
        setSelectedUserId('');
        setSelectedUser(null);
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-900">Create Order for User</h2>
        <p className="text-xs text-gray-600 mt-0.5">
          Select a user and add products to create an order on their behalf
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2 text-xs">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-2 text-xs">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-medium">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Selection Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Select User</h3>
          
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              {/* Dropdown User List - Only show when search query has at least 2 characters */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {usersLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="p-2 text-center text-xs text-gray-500">No users found</div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => {
                            handleUserSelect(user._id);
                            setSearchQuery(''); // Clear search after selection
                          }}
                          className={`w-full text-left p-2 hover:bg-gray-50 transition ${
                            selectedUserId === user._id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">ID: {user._id}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="mt-3 space-y-2">
              <div className="p-2 bg-purple-50 rounded-lg relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-900">Selected User:</div>
                  <button
                    onClick={handleRemoveUser}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Remove selected user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-gray-700">{selectedUser.name}</div>
                <div className="text-xs text-gray-600">{selectedUser.email}</div>
                <div className="text-xs text-gray-500">Phone: {selectedUser.phone || 'N/A'}</div>
              </div>
              
              {/* Address Selection */}
              <div className="p-2 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-900">Delivery Address</h4>
                  {!showAddressForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(true);
                        setAddressFormError('');
                        setAddressFormSuccess('');
                      }}
                      className="px-2 py-1 text-xs font-medium text-purple-600 border border-purple-300 rounded hover:bg-purple-50"
                    >
                      + Add Address
                    </button>
                  )}
                </div>
                
                {addressesLoading ? (
                  <div className="text-xs text-gray-500">Loading addresses...</div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-1.5">
                    {addresses.map((address) => (
                      <label
                        key={address._id}
                        className={`flex items-start p-2 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddressId === address._id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address._id}
                          checked={selectedAddressId === address._id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-0.5 mr-2"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="text-xs font-medium text-gray-900">{address.name}</span>
                            {address.isDefault && (
                              <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                                Default
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded capitalize">
                              {address.addressType}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700">{address.addressLine1}</p>
                          {address.addressLine2 && (
                            <p className="text-xs text-gray-700">{address.addressLine2}</p>
                          )}
                          <p className="text-xs text-gray-700">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-xs text-gray-600">Landmark: {address.landmark}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-0.5">Phone: {address.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No addresses found. Please add an address.
                  </div>
                )}
                
                {/* Add Address Form */}
                {showAddressForm && (
                  <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                    <h5 className="text-xs font-semibold text-gray-900 mb-2">Add New Address</h5>
                    
                    {addressFormError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2 mb-3 text-xs">
                        {addressFormError}
                      </div>
                    )}
                    
                    {addressFormSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-2 mb-3 text-xs">
                        {addressFormSuccess}
                      </div>
                    )}
                    
                    <form onSubmit={handleAddressFormSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={addressFormData.name}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Full Name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={addressFormData.phone}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Phone Number"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="addressLine1"
                          required
                          value={addressFormData.addressLine1}
                          onChange={handleAddressFormChange}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Street address, house number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="addressLine2"
                          value={addressFormData.addressLine2}
                          onChange={handleAddressFormChange}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={addressFormData.city}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="state"
                            required
                            value={addressFormData.state}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pincode <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="pincode"
                            required
                            value={addressFormData.pincode}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          name="landmark"
                          value={addressFormData.landmark}
                          onChange={handleAddressFormChange}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nearby landmark (optional)"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Address Type
                          </label>
                          <select
                            name="addressType"
                            value={addressFormData.addressType}
                            onChange={handleAddressFormChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center pt-6">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="isDefault"
                              checked={addressFormData.isDefault}
                              onChange={handleAddressFormChange}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-700">Set as default</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setAddressFormData({
                              name: '',
                              phone: '',
                              addressLine1: '',
                              addressLine2: '',
                              city: '',
                              state: '',
                              pincode: '',
                              landmark: '',
                              addressType: 'home',
                              isDefault: false,
                            });
                            setAddressFormError('');
                            setAddressFormSuccess('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addressFormLoading}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addressFormLoading ? 'Saving...' : 'Add Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Select Products</h3>
            {products.length > 0 && (
              <span className="text-xs text-gray-600">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Product Search */}
          {selectedUser && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}
          
          {!selectedUser ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Please select a user first
            </div>
          ) : !productSearch || productSearch.trim().length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              <p>Search for products to display them</p>
              <p className="text-xs mt-1">Type a product name in the search box above</p>
            </div>
          ) : productsLoading ? (
            <div className="text-center py-6 text-xs text-gray-500">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              <p>No products found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {products.map((product) => {
                const vendorProduct = product;
                // Get price based on priceType
                let price = 0;
                if (vendorProduct.priceType === 'single') {
                  price = vendorProduct.pricing?.single?.price || vendorProduct.price || 0;
                } else if (vendorProduct.priceType === 'bulk' && vendorProduct.pricing?.bulk?.length > 0) {
                  // Use the first bulk price tier for display
                  price = vendorProduct.pricing.bulk[0].price || 0;
                } else {
                  price = vendorProduct.price || vendorProduct.sellingPrice || 0;
                }
                const productName = vendorProduct.productId?.productName || vendorProduct.productName || 'Product';
                // Handle different image formats: object with url, string, or array
                let productImage = '';
                if (vendorProduct.productId?.images?.[0]) {
                  const firstImage = vendorProduct.productId.images[0];
                  productImage = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
                } else if (vendorProduct.productId?.img) {
                  productImage = vendorProduct.productId.img;
                } else if (vendorProduct.productImage) {
                  productImage = vendorProduct.productImage;
                }
                const minimumOrderQuantity = vendorProduct.minimumOrderQuantity || 1;
                const inCart = cartItems.some(item => (item.vendorProductId === vendorProduct._id || item._id === vendorProduct._id));
                
                return (
                  <div
                    key={vendorProduct._id}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-10 h-10 object-contain p-0.5 bg-white rounded"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40x40?text=No+Image';
                            e.target.onerror = null; // Prevent infinite loop
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{productName}</div>
                        <div className="text-xs text-gray-600">₹{price.toFixed(2)}</div>
                        {minimumOrderQuantity > 1 && (
                          <div className="text-xs text-gray-500">
                            Min: {minimumOrderQuantity}
                          </div>
                        )}
                      </div>
                    </div>
                    {inCart ? (
                      <button
                        onClick={() => handleRemoveFromCart(vendorProduct._id)}
                        className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(vendorProduct)}
                        className="px-2 py-1 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      {cartItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Order Summary</h3>
          
          <div className="space-y-2 mb-3">
            {cartItems.map((item) => (
              <div key={item.vendorProductId || item._id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 flex-1">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-contain p-0.5 bg-white rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-600">₹{item.price.toFixed(2)} each</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDecreaseQuantity(item.vendorProductId || item._id)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-xs"
                    title={`Decrease by ${item.minimumOrderQuantity || 1}`}
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min={item.minimumOrderQuantity || 1}
                      step={item.minimumOrderQuantity || 1}
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.vendorProductId || item._id, parseInt(e.target.value) || (item.minimumOrderQuantity || 1))}
                      className="w-14 px-1 py-0.5 text-xs text-center border border-gray-300 rounded"
                    />
                    {item.minimumOrderQuantity && item.minimumOrderQuantity > 1 && (
                      <span className="text-xs text-gray-500">
                        Min: {item.minimumOrderQuantity}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleIncreaseQuantity(item.vendorProductId || item._id)}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-xs"
                    title={`Increase by ${item.minimumOrderQuantity || 1}`}
                  >
                    +
                  </button>
                  <div className="w-20 text-right text-sm font-medium text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.vendorProductId || item._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">₹{calculateTotals.cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">GST:</span>
              <span className="text-gray-900">₹{calculateTotals.gstAmount.toFixed(2)}</span>
            </div>
            {/* GST Breakdown */}
            {calculateTotals.gstBreakdown && calculateTotals.gstBreakdown.some(item => item.gstPercentage > 0) && (
              <div className="pl-2 border-l-2 border-gray-200 space-y-0.5">
                {calculateTotals.gstBreakdown
                  .filter(item => item.gstPercentage > 0)
                  .map((item, index) => (
                    <div key={item.itemId || index} className="flex justify-between text-xs text-gray-600">
                      <span>{item.productName} ({item.gstPercentage}%):</span>
                      <span>₹{item.gstAmount.toFixed(2)}</span>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Shipping:</span>
              <span className="text-gray-900">₹{calculateTotals.shippingCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
              <span>Total:</span>
              <span>₹{calculateTotals.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedUser}
            className="w-full mt-3 px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
