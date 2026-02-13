// UPI utility functions for direct UPI payments (no payment gateway fees)

/**
 * Generate UPI QR Code using direct UPI ID
 * This creates a UPI payment URL and converts it to QR code
 * No transaction fees - direct UPI transfer
 * 
 * Add to your .env file:
 * VITE_UPI_ID=yourname@paytm (or yourname@ybl, yourname@okaxis, etc.)
 */
export const generateUPIQRCode = async (amount, orderId, customerInfo) => {
  try {
    // UPI Payment URL format (standard UPI protocol):
    // upi://pay?pa=<upi_id>&pn=<merchant_name>&am=<amount>&cu=INR&tn=<transaction_note>
    const upiId = import.meta.env.VITE_UPI_ID || 'yourname@paytm';
    const merchantName = 'RestroBazaar';
    const transactionNote = `Order ${orderId} - RestroBazaar`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
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
      upiId: upiId,
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
 * Note: Razorpay functions removed as we're using direct UPI payments
 * If you need payment gateway features in the future, you can add them back
 */

