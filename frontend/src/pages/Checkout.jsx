import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectCartItems, selectCartTotal, clearCart } from '../store/slices/cartSlice';
import { addressAPI, orderAPI, userCouponAPI, vendorAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { calculateShippingCharges } from '../utils/shipping';
import Modal from '../components/Modal';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../components/Button';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [hasGST, setHasGST] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    addressType: 'home', // home, work, other
  });

  // Fetch vendor details
  const fetchVendorDetails = async () => {
    try {
      // Get vendorId from cart items
      const vendorId = cartItems[0]?.vendorId || null;
      
      if (!vendorId) {
        setVendorDetails(null);
        return;
      }

      // Check if all items are from the same vendor
      const allSameVendor = cartItems.every(item => {
        const itemVendorId = item.vendorId?.toString() || item.vendorId;
        return itemVendorId === vendorId?.toString() || itemVendorId === vendorId;
      });

      if (!allSameVendor) {
        setVendorDetails(null);
        return;
      }

      // Use public endpoint for bank details
      const response = await vendorAPI.getVendorBankDetails(vendorId);
      if (response.success) {
        setVendorDetails(response.data);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      setVendorDetails(null);
    }
  };

  // Fetch available coupons
  const fetchAvailableCoupons = async () => {
    try {
      // Get vendorId from cart items if available
      const vendorId = cartItems[0]?.vendorId || null;
      
      // Check if all items are from the same vendor
      const allSameVendor = cartItems.every(item => {
        const itemVendorId = item.vendorId?.toString() || item.vendorId;
        return itemVendorId === vendorId?.toString() || itemVendorId === vendorId;
      });

      if (!allSameVendor || !vendorId) {
        setAvailableCoupons([]);
        return;
      }

      const response = await userCouponAPI.getAvailableCoupons({
        vendorId,
        cartTotal,
        cartItems: JSON.stringify(cartItems), // Send cart items to verify vendor match
      });
      if (response.success) {
        setAvailableCoupons(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setAvailableCoupons([]);
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setCouponError('');
      const vendorId = cartItems[0]?.vendorId || null;
      
      // Send cartItems to validate that all items belong to the coupon's vendor
      const response = await userCouponAPI.validateCoupon(couponCode, cartTotal, vendorId, cartItems);
      
      if (response.success) {
        setAppliedCoupon(response.data);
        setCouponDiscount(response.data.discount);
        setCouponCode('');
      }
    } catch (error) {
      setCouponError(error?.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await addressAPI.getUserAddresses();
      if (response.success && response.data) {
        setAddresses(response.data);
        // Auto-select first address if available
        if (response.data.length > 0 && !selectedAddress) {
          setSelectedAddress(response.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError(err.response?.data?.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddress(addressId);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      addressType: 'home',
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address._id);
    setAddressForm({
      name: address.name || '',
      phone: address.phone || '',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      addressType: address.addressType || 'home',
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await addressAPI.deleteAddress(addressId);
      if (response.success) {
        setAddresses(addresses.filter(addr => addr._id !== addressId));
        if (selectedAddress === addressId) {
          setSelectedAddress(null);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAddress) {
        // Update address
        const response = await addressAPI.updateAddress(editingAddress, addressForm);
        if (response.success) {
          await fetchAddresses();
          setShowAddressModal(false);
        }
      } else {
        // Create new address
        const response = await addressAPI.createAddress(addressForm);
        if (response.success) {
          await fetchAddresses();
          setShowAddressModal(false);
          // Auto-select newly created address
          if (response.data?._id) {
            setSelectedAddress(response.data._id);
          }
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    // Show payment section
    setShowPaymentSection(true);
    // Scroll to top to show payment section prominently
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Calculate billing details (moved before handleConfirmOrder)
  // Calculate GST per product based on each product's GST percentage
  const gstBreakdown = cartItems.map(item => {
    const itemTotal = item.price * item.quantity;
    const gstPercentage = item.gst || 0;
    const gstAmount = (itemTotal * gstPercentage) / 100;
    return {
      itemId: item.id,
      productName: item.productName,
      gstPercentage,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      itemTotal,
    };
  });
  
  const gstAmount = gstBreakdown.reduce((sum, item) => sum + item.gstAmount, 0);
  
  // Group items by GST percentage and calculate SGST/CGST
  const gstGroups = {};
  gstBreakdown.forEach(item => {
    if (item.gstPercentage > 0 && item.gstAmount > 0) {
      const gstKey = item.gstPercentage.toFixed(2);
      if (!gstGroups[gstKey]) {
        gstGroups[gstKey] = {
          percentage: item.gstPercentage,
          totalGst: 0
        };
      }
      gstGroups[gstKey].totalGst += item.gstAmount;
    }
  });
  
  // Convert groups to array and calculate SGST/CGST for each
  const sgstCgstBreakdown = Object.keys(gstGroups)
    .sort((a, b) => parseFloat(b) - parseFloat(a))
    .map(gstKey => {
      const group = gstGroups[gstKey];
      const totalGst = parseFloat(group.totalGst.toFixed(2));
      const sgstAmount = parseFloat((totalGst / 2).toFixed(2));
      const cgstAmount = parseFloat((totalGst / 2).toFixed(2));
      const sgstRate = parseFloat((group.percentage / 2).toFixed(2));
      const cgstRate = sgstRate;
      
      return {
        gstPercentage: group.percentage,
        sgstRate,
        cgstRate,
        sgstAmount,
        cgstAmount,
        totalGst
      };
    });
  const shippingCharges = calculateShippingCharges(cartTotal);
  // Apply coupon discount to final total
  const totalBeforeCoupon = cartTotal + gstAmount + shippingCharges;
  const totalAmount = Math.max(0, totalBeforeCoupon - couponDiscount);

  const handleConfirmOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      // Ensure payment section is visible and scroll to it
      setShowPaymentSection(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      return;
    }

    setPlacingOrder(true);
    try {
      // Prepare order data
      const orderPayload = {
        addressId: selectedAddress,
        paymentMethod: paymentMethod,
        cartItems: cartItems,
        totalAmount: totalAmount,
        cartTotal: cartTotal,
        gstAmount: gstAmount,
        shippingCharges: shippingCharges,
        paymentId: qrCodeData?.paymentId || null,
        transactionId: qrCodeData?.transactionId || null,
        couponCode: appliedCoupon?.code || null,
        gstNumber: hasGST && gstNumber ? gstNumber.trim() : null, // Include GST number if provided
      };

      // Create order
      const response = await orderAPI.createOrder(orderPayload);
      
      if (response.success) {
        // Store order data for success modal
        setOrderData(response.data);
        
        // Clear cart
        dispatch(clearCart());
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Redirect to orders page
    navigate('/orders');
  };

  // Generate QR code function (defined after totalAmount calculation)
  const generateQRCode = useCallback(() => {
    if (paymentMethod !== 'online') return;
    
    try {
      // Generate a temporary order ID (in production, create order on backend first)
      const tempOrderId = `ORDER_${Date.now()}`;
      const selectedAddressData = addresses.find(addr => addr._id === selectedAddress);
      
      // Get vendor UPI ID and account name from vendor details
      const upiId = vendorDetails?.bankDetails?.upiId || import.meta.env.VITE_UPI_ID || 'yourname@paytm';
      const accountName = vendorDetails?.bankDetails?.accountHolderName || vendorDetails?.businessName || 'RestroBazaar';
      const transactionNote = `Order ${tempOrderId} - ${accountName}`;
      
      // Create UPI payment URL
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(accountName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      
      const qrData = {
        success: true,
        upiUrl: upiUrl,
        amount: totalAmount,
        orderId: tempOrderId,
        merchantVPA: upiId,
        accountName: accountName,
      };
      
      setQrCodeData(qrData);
    } catch (err) {
      console.error('Error generating QR code:', err);
      alert('Failed to generate QR code. Please try again.');
    }
  }, [paymentMethod, selectedAddress, totalAmount, addresses, vendorDetails]);

  // Load GST number from localStorage on mount
  useEffect(() => {
    const savedHasGST = localStorage.getItem('customerHasGST') === 'true';
    const savedGstNumber = localStorage.getItem('customerGSTNumber') || '';
    setHasGST(savedHasGST);
    setGstNumber(savedGstNumber);
  }, []);

  // Save GST number to localStorage when changed
  useEffect(() => {
    localStorage.setItem('customerHasGST', hasGST.toString());
    if (hasGST && gstNumber) {
      localStorage.setItem('customerGSTNumber', gstNumber);
    } else {
      localStorage.removeItem('customerGSTNumber');
    }
  }, [hasGST, gstNumber]);

  // Fetch addresses and coupons on component mount
  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Fetch addresses
    fetchAddresses();

    // Fetch vendor details and coupons if cart has items
    if (cartItems && cartItems.length > 0) {
      fetchVendorDetails();
      fetchAvailableCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Refetch vendor details when cart items change (e.g., city switch)
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchVendorDetails();
    } else {
      setVendorDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Regenerate QR code when payment method is online and amount/address changes
  useEffect(() => {
    if (paymentMethod === 'online' && selectedAddress && totalAmount > 0) {
      generateQRCode();
    }
  }, [paymentMethod, selectedAddress, totalAmount, generateQRCode]);

  const selectedAddressData = addresses.find(addr => addr._id === selectedAddress);

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold text-xs">
                  1
                </div>
                <span className="text-sm font-medium text-gray-700">MY BAG</span>
              </div>
              <div className="w-12 h-0.5 bg-red-600"></div>
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full ${showPaymentSection ? 'bg-red-600' : 'bg-red-600'} text-white flex items-center justify-center font-semibold text-xs`}>
                  2
                </div>
                <span className={`text-sm font-medium ${showPaymentSection ? 'text-gray-700' : 'text-red-600'}`}>ADDRESS</span>
              </div>
              <div className={`w-12 h-0.5 ${showPaymentSection ? 'bg-red-600' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full ${showPaymentSection ? 'bg-red-600' : 'bg-gray-300'} text-white flex items-center justify-center font-semibold text-xs`}>
                  3
                </div>
                <span className={`text-sm font-medium ${showPaymentSection ? 'text-red-600' : 'text-gray-500'}`}>PAYMENT</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payment Section - Show at top when active */}
            {showPaymentSection && (
              <div id="payment-section" className="lg:col-span-2 order-first">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Select Payment Method</h2>

                  <div className="space-y-2">
                    {/* COD Option */}
                    <div
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`${paymentMethod === 'cod' ? 'text-red-600' : 'text-gray-400'}`}>
                          {paymentMethod === 'cod' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">Cash on Delivery (COD)</h3>
                              <p className="text-sm text-gray-600">Pay when you receive your order</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Online Payment Option */}
                    <div
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        paymentMethod === 'online'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setPaymentMethod('online');
                        // Generate QR code when online payment is selected
                        generateQRCode();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`${paymentMethod === 'online' ? 'text-red-600' : 'text-gray-400'}`}>
                          {paymentMethod === 'online' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">UPI Online Payment</h3>
                              <p className="text-sm text-gray-600">Pay instantly using UPI QR Code</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* UPI QR Code Section */}
                    {paymentMethod === 'online' && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">Scan QR Code to Pay</h3>
                          <p className="text-sm text-gray-600 mb-3">Use any UPI app (PhonePe, Google Pay, Paytm, etc.) to scan and pay</p>
                          
                          {/* QR Code Container */}
                          <div className="flex justify-center mb-3">
                            <div className="bg-white p-3 rounded-lg shadow-lg">
                              {qrCodeData ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center p-3">
                                    <QRCodeSVG
                                      value={qrCodeData.upiUrl}
                                      size={192}
                                      level="H"
                                      includeMargin={true}
                                    />
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1 text-center break-all max-w-xs">
                                    {qrCodeData.upiUrl}
                                  </p>
                                </div>
                              ) : (
                                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <svg className="w-24 h-24 mx-auto text-gray-400 mb-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                                    </svg>
                                    <p className="text-sm text-gray-500">Select UPI payment to generate QR Code</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Details */}
                          <div className="bg-white rounded-lg p-3 mb-3">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Amount to Pay:</span>
                                <span className="font-semibold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                              </div>
                              {qrCodeData && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Order ID:</span>
                                    <span className="font-mono text-gray-900 text-sm">{qrCodeData.orderId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Account Name:</span>
                                    <span className="font-semibold text-gray-900 text-sm">
                                      {qrCodeData.accountName || vendorDetails?.bankDetails?.accountHolderName || vendorDetails?.businessName || 'RestroBazaar'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">UPI ID:</span>
                                    <span className="font-mono text-gray-900 text-sm">
                                      {qrCodeData.merchantVPA || vendorDetails?.bankDetails?.upiId || import.meta.env.VITE_UPI_ID || 'yourname@paytm'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {qrCodeData && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                              <p className="text-sm text-blue-800 text-center">
                                <strong>Instructions:</strong> Open any UPI app, tap "Scan QR Code", and scan the code above to complete payment.
                              </p>
                            </div>
                          )}

                          <p className="text-sm text-gray-500">
                            After payment, your order will be confirmed automatically
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Left Section - Delivery Address */}
            <div className={`lg:col-span-2 ${showPaymentSection ? 'order-last' : ''}`}>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Delivery To</h2>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddAddress}
                    className="flex items-center gap-1"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Address
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading addresses...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-sm text-red-600">{error}</div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">No addresses found. Add your first address!</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddAddress}
                    >
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Address Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Delivery Address *
                      </label>
                      <select
                        value={selectedAddress || ''}
                        onChange={(e) => handleAddressSelect(e.target.value)}
                        className="w-full px-3 py-2 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      >
                        <option value="">Select an address</option>
                        {addresses.map((address) => (
                          <option key={address._id} value={address._id}>
                            {address.name} - {address.addressLine1}, {address.city}, {address.state} {address.pincode} ({address.addressType === 'home' ? 'Home' : address.addressType === 'work' ? 'Work' : 'Other'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* GST Number Section */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="hasGST"
                          checked={hasGST}
                          onChange={(e) => {
                            setHasGST(e.target.checked);
                            if (!e.target.checked) {
                              setGstNumber('');
                            }
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor="hasGST" className="text-sm font-medium text-gray-700 cursor-pointer">
                          I have a GST Number
                        </label>
                      </div>
                      {hasGST && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            GST Number *
                          </label>
                          <input
                            type="text"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value.toUpperCase().trim())}
                            placeholder="Enter GST Number (e.g., 27DJSPK2679K1ZB)"
                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                            maxLength={15}
                          />
                          <p className="text-xs text-gray-500 mt-1">GST number will be included in your invoice</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Address Details */}
                    {selectedAddress && selectedAddressData && (
                      <div className="border-2 border-red-500 bg-red-50 rounded-lg p-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <h3 className="text-base font-semibold text-gray-900">{selectedAddressData.name}</h3>
                              {selectedAddressData.addressType && (
                                <span className="text-sm px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                  {selectedAddressData.addressType === 'home' ? 'Home' : selectedAddressData.addressType === 'work' ? 'Work' : 'Other'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="icon"
                                onClick={() => handleEditAddress(selectedAddressData)}
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </Button>
                              <Button
                                variant="icon"
                                onClick={() => handleDeleteAddress(selectedAddressData._id)}
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">
                            {selectedAddressData.addressLine1}
                            {selectedAddressData.addressLine2 && `, ${selectedAddressData.addressLine2}`}
                          </p>
                          <p className="text-sm text-gray-700">
                            {selectedAddressData.city}, {selectedAddressData.state} - {selectedAddressData.pincode}
                          </p>
                          {selectedAddressData.landmark && (
                            <p className="text-sm text-gray-600">
                              Landmark: {selectedAddressData.landmark}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            📱 {selectedAddressData.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Billing Details */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3">BILLING DETAILS</h2>

                {/* Coupon Section */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Have a Coupon?</h3>
                    {availableCoupons.length > 0 && (
                      <Button
                        variant="textGray"
                        size="sm"
                        type="button"
                        onClick={() => setShowCoupons(!showCoupons)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showCoupons ? 'Hide' : 'View'} Available ({availableCoupons.length})
                      </Button>
                    )}
                  </div>

                  {showCoupons && availableCoupons.length > 0 && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      {availableCoupons.map((coupon) => (
                        <div
                          key={coupon._id}
                          className="mb-1.5 p-1.5 bg-white rounded border border-gray-200 cursor-pointer hover:border-blue-500"
                          onClick={() => {
                            setCouponCode(coupon.code);
                            handleApplyCoupon();
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">{coupon.code}</div>
                              <div className="text-sm text-gray-600">
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}% OFF`
                                  : `₹${coupon.discountValue} OFF`}
                                {' • '}Min. ₹{coupon.minimumOrderAmount}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-green-600">
                              Save ₹{coupon.estimatedDiscount?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!appliedCoupon ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-green-800">
                            {appliedCoupon.code} Applied
                          </div>
                          <div className="text-sm text-green-600">
                            You saved ₹{couponDiscount.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="text"
                          size="sm"
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <div className="mt-1 text-sm text-red-600">{couponError}</div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Cart Total (Excl. of all taxes)</span>
                    <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>GST</span>
                    <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  {/* SGST/CGST Breakdown */}
                  {sgstCgstBreakdown.length > 0 && (
                    <div className="pl-2 border-l-2 border-gray-200 space-y-1">
                      {sgstCgstBreakdown.map((group, index) => (
                        <div key={`gst-group-${index}`} className="space-y-0.5">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>SGST ({group.sgstRate}%):</span>
                            <span>₹{group.sgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>CGST ({group.cgstRate}%):</span>
                            <span>₹{group.cgstAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Shipping Charges</span>
                    <div className="text-right">
                      {shippingCharges === 0 ? (
                        <span className="font-medium text-green-600">Free</span>
                      ) : (
                        <span className="font-medium">₹{shippingCharges.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-medium">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base font-bold text-gray-900">
                      <span>Total Amount</span>
                      <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!showPaymentSection ? (
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleContinueToPayment}
                    disabled={!selectedAddress}
                    className="mb-3"
                  >
                    CONTINUE TO PAYMENT
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleConfirmOrder}
                    disabled={!paymentMethod || placingOrder}
                    loading={placingOrder}
                    className="mb-3"
                  >
                    CONFIRM ORDER
                  </Button>
                )}

                <Link
                  to="/cart"
                  className="block text-center text-gray-600 hover:text-red-600 transition-colors font-medium mt-3 text-sm"
                >
                  ← Back to Cart
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Address Modal */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)}>
        <div className="bg-white rounded-lg p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </h2>
          
          <form onSubmit={handleAddressSubmit} className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="House/Flat No., Building Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Street, Area, Colony"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Pincode"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nearby landmark (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Type *
              </label>
              <select
                required
                value={addressForm.addressType}
                onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowAddressModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
              >
                {editingAddress ? 'Update Address' : 'Save Address'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={handleSuccessModalClose}>
        <div className="bg-white rounded-lg p-4 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            {orderData && (
              <div className="space-y-1 mt-3">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Order Number:</span>{' '}
                  <span className="text-red-600 font-mono">{orderData.orderNumber}</span>
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Total Amount:</span>{' '}
                  <span className="text-red-600 font-semibold">₹{orderData.billingDetails?.totalAmount?.toFixed(2) || totalAmount.toFixed(2)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Payment Method:</span>{' '}
                  {orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Online Payment'}
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Your order has been confirmed and will be delivered soon.
                </p>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSuccessModalClose}
          >
            View My Orders
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Checkout;

