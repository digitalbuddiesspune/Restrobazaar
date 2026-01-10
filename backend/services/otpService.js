import axios from "axios";
import OTP from "../models/users/otp.js";

/**
 * MSG91 OTP Service
 * 
 * Environment variables required:
 * - MSG91_AUTH_KEY: Your MSG91 authentication key
 * - MSG91_TEMPLATE_ID: Your MSG91 OTP template ID (optional, can use default)
 * - MSG91_SENDER_ID: Your MSG91 sender ID (optional)
 */

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via MSG91
 * @param {string} phone - Phone number (10 digits, e.g., 9876543210)
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<boolean>} - Returns true if OTP sent successfully
 */
export const sendOTPViaMSG91 = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "RESTRO"; // Default sender ID

    if (!authKey) {
      console.error("MSG91_AUTH_KEY is not set in environment variables");
      // In development, allow OTP to be sent without MSG91 (for testing)
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        return true;
      }
      return false;
    }

    // Ensure phone number is in correct format (should have country code 91)
    let formattedPhone = phone.replace(/\D/g, ""); // Remove non-digits
    // Add country code 91 if not present
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    // MSG91 Send OTP API (standard endpoint)
    // Format: https://control.msg91.com/api/sendotp.php?authkey={authkey}&mobile={mobile}&message={message}&sender={sender}&otp={otp}
    const message = `Your RestroBazaar verification code is ${otp}. Valid for 10 minutes.`;
    const sendOtpUrl = `https://control.msg91.com/api/sendotp.php`;
    
    const params = new URLSearchParams({
      authkey: authKey,
      mobile: formattedPhone,
      message: message,
      sender: senderId,
      otp: otp,
    });

    const response = await axios.get(`${sendOtpUrl}?${params.toString()}`);

    // MSG91 returns "success" as a string or object with type: "success"
    if (response.data && (response.data === "success" || response.data.type === "success" || response.data.message === "OTP sent successfully")) {
      console.log(`OTP sent successfully to ${formattedPhone}`);
      return true;
    } else {
      console.error("MSG91 OTP sending failed:", response.data);
      // In development, still return true for testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("Error sending OTP via MSG91:", error.response?.data || error.message);
    // In development, allow fallback
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV MODE] OTP for ${phone}: ${otp} (MSG91 error, but allowing in dev)`);
      return true;
    }
    return false;
  }
};

/**
 * Verify OTP via MSG91 (optional - we're using DB verification instead)
 * @param {string} phone - Phone number (with country code)
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} - Returns true if OTP is valid
 */
export const verifyOTPViaMSG91 = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      console.error("MSG91_AUTH_KEY is not set in environment variables");
      // In development, allow verification
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      return false;
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("91") && formattedPhone.length === 10) {
      formattedPhone = "91" + formattedPhone;
    }

    // MSG91 verify OTP endpoint
    const verifyUrl = `https://control.msg91.com/api/verifyRequestOTP.php`;
    const params = new URLSearchParams({
      authkey: authKey,
      mobile: formattedPhone,
      otp: otp,
    });

    const response = await axios.get(`${verifyUrl}?${params.toString()}`);

    // MSG91 returns "success" as a string or object with type: "success"
    if (response.data && (response.data === "success" || response.data.type === "success")) {
      return true;
    } else {
      console.error("MSG91 OTP verification failed:", response.data);
      // In development, allow fallback
      if (process.env.NODE_ENV === "development") {
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("Error verifying OTP via MSG91:", error.response?.data || error.message);
    // In development, allow fallback
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    return false;
  }
};

/**
 * Save OTP to database
 * @param {string} phone - Phone number
 * @param {string} email - Email (optional, for signup)
 * @param {string} type - Type of OTP: 'signup' or 'login'
 * @returns {Promise<{otp: string, saved: boolean}>} - Returns OTP and save status
 */
export const saveOTP = async (phone, email = null, type = "login") => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

    // Invalidate previous OTPs for this phone and type
    await OTP.updateMany(
      { phone, type, verified: false },
      { verified: true } // Mark as verified/used to invalidate
    );

    // Save new OTP
    const otpRecord = await OTP.create({
      phone,
      email,
      otp,
      type,
      expiresAt,
    });

    return { otp, saved: true, recordId: otpRecord._id };
  } catch (error) {
    console.error("Error saving OTP:", error);
    return { otp: null, saved: false };
  }
};

/**
 * Verify OTP from database
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @param {string} type - Type of OTP: 'signup' or 'login'
 * @returns {Promise<boolean>} - Returns true if OTP is valid
 */
export const verifyOTPFromDB = async (phone, otp, type = "login") => {
  try {
    const otpRecord = await OTP.findOne({
      phone,
      otp,
      type,
      verified: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (otpRecord) {
      // Mark OTP as verified
      otpRecord.verified = true;
      await otpRecord.save();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error verifying OTP from DB:", error);
    return false;
  }
};

/**
 * Send and save OTP (combined function)
 * @param {string} phone - Phone number
 * @param {string} email - Email (optional)
 * @param {string} type - Type: 'signup' or 'login'
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendAndSaveOTP = async (phone, email = null, type = "login") => {
  try {
    // Generate and save OTP
    const { otp, saved } = await saveOTP(phone, email, type);

    if (!saved || !otp) {
      return {
        success: false,
        message: "Failed to generate OTP. Please try again.",
      };
    }

    // Send OTP via MSG91
    const sent = await sendOTPViaMSG91(phone, otp);

    if (sent) {
      return {
        success: true,
        message: "OTP sent successfully to your phone number",
      };
    } else {
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error in sendAndSaveOTP:", error);
    return {
      success: false,
      message: "An error occurred. Please try again.",
    };
  }
};
