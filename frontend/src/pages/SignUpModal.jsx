import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { setUserInfo } from '../utils/auth';

const SignUpModal = ({ onClose, onSwitchToSignIn }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: form fields, 2: verify OTP
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    restaurantName: '',
    gstNumber: '',
  });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Focus first OTP input when step changes to 2
  useEffect(() => {
    if (step === 2 && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

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

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Validate phone number
  const validatePhone = (phone) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    let validPhone = cleanedPhone;
    
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) {
      validPhone = cleanedPhone.substring(1);
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(validPhone);
  };

  // Validate form before sending OTP
  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.phone) {
      setError('Please enter your phone number');
      return false;
    }
    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.sendOTPForSignup({ phone: formData.phone });
      
      if (response.success) {
        setOtpSent(true);
        setStep(2);
        setSuccess('OTP sent successfully to your phone number');
        startResendTimer();
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.sendOTPForSignup({ phone: formData.phone });
      
      if (response.success) {
        setSuccess('OTP resent successfully');
        setOtpDigits(['', '', '', '', '', '']);
        startResendTimer();
        otpInputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete signup
  const handleVerifyAndSignup = async (e) => {
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
      const response = await authAPI.verifyOTPAndSignup({
        name: formData.name,
        phone: formData.phone,
        otp: otp,
        restaurantName: formData.restaurantName || undefined,
        gstNumber: formData.gstNumber || undefined,
      });
      
      if (response.success && response.data) {
        setUserInfo(response.data);
        onClose();
        navigate('/');
        window.dispatchEvent(new Event('authChange'));
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Go back to form step
  const handleBack = () => {
    setStep(1);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-gray-900">
          {step === 1 ? 'Create Account' : 'Verify OTP'}
        </h2>
        <p className="text-gray-500 text-xs">
          {step === 1 ? 'Fill in your details to get started' : 'Enter the OTP sent to your phone'}
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

      {step === 1 ? (
        // Step 1: Registration Form
        <form className="space-y-3" onSubmit={handleSendOTP}>
          {/* Name Input */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-xs font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-xs font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
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
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <p className="text-xs text-gray-500">10-digit mobile number starting with 6, 7, 8, or 9</p>
          </div>

          {/* Restaurant Name Input (Optional) */}
          <div className="space-y-1">
            <label htmlFor="restaurantName" className="block text-xs font-medium text-gray-700">
              Restaurant Name <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <input
                id="restaurantName"
                name="restaurantName"
                type="text"
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="Your restaurant name"
                value={formData.restaurantName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* GST Number Input (Optional) */}
          <div className="space-y-1">
            <label htmlFor="gstNumber" className="block text-xs font-medium text-gray-700">
              GST Number <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <input
                id="gstNumber"
                name="gstNumber"
                type="text"
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="GST Number (e.g., 22AAAAA0000A1Z5)"
                value={formData.gstNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Send OTP Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
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

          {/* Sign In Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      ) : (
        // Step 2: OTP Verification
        <form className="space-y-3" onSubmit={handleVerifyAndSignup}>
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to edit details
          </button>

          {/* Phone display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-600">OTP sent to</p>
            <p className="text-sm font-medium text-gray-900">+91 {formData.phone}</p>
            <p className="text-xs text-gray-500 mt-1">Name: {formData.name}</p>
            {formData.restaurantName && (
              <p className="text-xs text-gray-500">Restaurant: {formData.restaurantName}</p>
            )}
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
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || loading}
                className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed mt-2"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* Verify & Create Account Button */}
          <button
            type="submit"
            disabled={loading || getOtpString().length < 6}
            className="w-full flex items-center justify-center px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
              'Verify & Create Account'
            )}
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      )}

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

export default SignUpModal;
