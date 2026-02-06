import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, wishlistAPI } from '../utils/api';
import { setUserInfo } from '../utils/auth';

const SignInModal = ({ onClose, onSwitchToSignUp }) => {
  const navigate = useNavigate();
  
  // OTP login state
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Focus first OTP input when OTP is sent
  useEffect(() => {
    if (otpSent && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [otpSent]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP key down (for backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        otpInputRefs.current[index - 1]?.focus();
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index - 1] = '';
        setOtpDigits(newOtpDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtpDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtpDigits[i] = pastedData[i];
      }
      setOtpDigits(newOtpDigits);
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtpDigits.findIndex(d => !d);
      if (nextEmptyIndex !== -1) {
        otpInputRefs.current[nextEmptyIndex]?.focus();
      } else {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  // Get OTP string from digits
  const getOtpString = () => otpDigits.join('');

  // OTP Timer countdown
  const startOtpTimer = () => {
    setOtpTimer(60);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Validate phone number
  const validatePhone = (phoneNum) => {
    const cleanedPhone = phoneNum.replace(/\D/g, '');
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
      validPhone = cleanedPhone.substring(1);
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(validPhone);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await authAPI.sendOTPForLogin(phone);
      if (response.success) {
        setOtpSent(true);
        setSuccess('OTP sent successfully to your phone number');
        startOtpTimer();
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const otp = getOtpString();
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTPAndLogin(phone, otp);
      if (response.success && response.data) {
        setUserInfo(response.data);
        
        // Check if there's a pending wishlist product to add
        const pendingProductId = localStorage.getItem('pendingWishlistProduct');
        if (pendingProductId) {
          try {
            await wishlistAPI.addToWishlist(pendingProductId);
            localStorage.removeItem('pendingWishlistProduct');
            onClose();
            navigate('/wishlist');
            window.dispatchEvent(new Event('authChange'));
            return;
          } catch (wishlistErr) {
            console.error('Error adding product to wishlist:', wishlistErr);
            localStorage.removeItem('pendingWishlistProduct');
          }
        }
        
        onClose();
        navigate('/');
        window.dispatchEvent(new Event('authChange'));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetOtpForm = () => {
    setPhone('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpTimer(0);
    setError('');
    setSuccess('');
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    
    setError('');
    setSuccess('');
    setOtpLoading(true);

    try {
      const response = await authAPI.sendOTPForLogin(phone);
      if (response.success) {
        setSuccess('OTP resent successfully');
        setOtpDigits(['', '', '', '', '', '']);
        startOtpTimer();
        otpInputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-gray-900">
          Sign In
        </h2>
        <p className="text-gray-500 text-xs">
          {otpSent ? 'Enter the OTP sent to your phone' : 'Enter your phone number to continue'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 animate-shake">
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-2.5">
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* OTP Login Form */}
      <form className="space-y-3" onSubmit={otpSent ? handleOtpLogin : handleSendOTP}>
        {!otpSent ? (
          <>
            {/* Phone Input */}
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-xs font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 placeholder-gray-400"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  maxLength="10"
                />
              </div>
              <p className="text-xs text-gray-500">10-digit mobile number starting with 6, 7, 8, or 9</p>
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full flex items-center justify-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {otpLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </>
        ) : (
          <>
            {/* Phone display */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-600">OTP sent to</p>
              <p className="text-sm font-medium text-gray-900">+91 {phone}</p>
            </div>

            {/* Boxy OTP Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700 text-center">
                Enter 6-digit OTP
              </label>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-10 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all bg-white text-gray-900"
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP & Change Number */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetOtpForm}
                className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                Change Phone Number
              </button>
              {otpTimer > 0 ? (
                <p className="text-xs text-gray-500">
                  Resend OTP in {otpTimer}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={otpLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* Verify OTP Button */}
            <button
              type="submit"
              disabled={loading || getOtpString().length < 6}
              className="w-full flex items-center justify-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>
          </>
        )}
      </form>

      {/* Sign Up Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
};

export default SignInModal;
