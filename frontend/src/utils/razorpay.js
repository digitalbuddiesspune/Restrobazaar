// Razorpay utility functions
// Note: Razorpay Key ID should be in environment variables
// Add to your .env file:
// VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
// VITE_RAZORPAY_MERCHANT_VPA=your_merchant_vpa@razorpay (optional, for UPI QR)

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

/**
 * Generate UPI QR Code using Razorpay
 * This creates a UPI payment URL and converts it to QR code
 * 
 * For production, you should:
 * 1. Create a Razorpay order on your backend
 * 2. Get the QR code from Razorpay API
 * 3. Display it on frontend
 * 
 * This implementation uses standard UPI URL format which works with any UPI app
 */
export const generateUPIQRCode = async (amount, orderId, customerInfo) => {
  try {
    // UPI Payment URL format (standard UPI protocol):
    // upi://pay?pa=<merchant_vpa>&pn=<merchant_name>&am=<amount>&cu=INR&tn=<transaction_note>
    const merchantVPA = import.meta.env.VITE_RAZORPAY_MERCHANT_VPA || 'restrobazaar@razorpay';
    const merchantName = 'RestroBazaar';
    const transactionNote = `Order ${orderId} - RestroBazaar`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    // Generate QR code from UPI URL using QR code API
    // Using qrserver.com API (free service) - you can replace with your own QR code generator
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiUrl)}`;
    
    // Alternative: You can also use a client-side QR code library like qrcode.react
    // import QRCode from 'qrcode.react';
    // <QRCode value={upiUrl} size={300} />
    
    return {
      success: true,
      qrCodeUrl: qrCodeUrl,
      upiUrl: upiUrl,
      amount: amount,
      orderId: orderId,
      merchantVPA: merchantVPA,
    };
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Initialize Razorpay payment
 * This is for other payment methods (cards, netbanking, etc.)
 */
export const initializeRazorpay = (options) => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      // Load Razorpay script if not already loaded
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const razorpay = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          ...options,
        });
        razorpay.on('payment.success', (response) => {
          resolve(response);
        });
        razorpay.on('payment.failure', (response) => {
          reject(response);
        });
        razorpay.open();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    } else {
      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        ...options,
      });
      razorpay.on('payment.success', (response) => {
        resolve(response);
      });
      razorpay.on('payment.failure', (response) => {
        reject(response);
      });
      razorpay.open();
    }
  });
};

/**
 * Verify payment signature (should be done on backend)
 */
export const verifyPayment = async (paymentId, orderId, signature) => {
  // This should be called on the backend for security
  // Frontend should send payment details to backend for verification
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        paymentId,
        orderId,
        signature,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

