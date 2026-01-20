import axios from "axios";
import OTP from "../models/users/otp.js";

/**
 * Utility: format mobile number to 91XXXXXXXXXX
 */
const formatMobile = (phone) => {
  let mobile = phone.replace(/\D/g, "");
  if (mobile.length === 10) {
    mobile = "91" + mobile;
  }
  return mobile;
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * SEND OTP via MSG91 Flow API
 * Generates OTP and sends via MSG91 Flow API
 */
export const sendOTPViaMSG91 = async (phone, customOTP = null) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID || "696f2ce7c7301501947d99a3";

    if (!authKey) {
      throw new Error("MSG91_AUTH_KEY missing in environment variables");
    }

    if (!templateId) {
      throw new Error("MSG91_TEMPLATE_ID missing in environment variables");
    }

    // Format mobile number to 91XXXXXXXXXX
    const mobile = formatMobile(phone);

    // Generate OTP if not provided
    const otp = customOTP || generateOTP();

    // Prepare request body for Flow API
    const requestBody = {
      template_id: templateId,
      short_url: "0",
      short_url_expiry: "86400",
      realTimeResponse: "1",
      recipients: [
        {
          mobiles: mobile,
          OTP: otp
        }
      ]
    };

    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow",
      requestBody,
      {
        headers: {
          accept: "application/json",
          authkey: authKey,
          "content-type": "application/json"
        }
      }
    );

    // Check if request was successful
    // MSG91 Flow API typically returns success in response
    if (response.status === 200) {
      return { success: true, otp: otp };
    }

    return { success: false, otp: null };
  } catch (error) {
    console.error(
      "MSG91 Send OTP Error:",
      error.response?.data || error.message
    );
    return { success: false, otp: null };
  }
};

/**
 * VERIFY OTP (MSG91 verifies OTP)
 */
export const verifyOTPViaMSG91 = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) throw new Error("MSG91_AUTH_KEY missing");

    const mobile = formatMobile(phone);

    const response = await axios.post(
      "https://api.msg91.com/api/v5/otp/verify",
      {
        mobile,
        otp
      },
      {
        headers: {
          Authkey: authKey,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data?.type === "success";
  } catch (error) {
    console.error(
      "MSG91 Verify OTP Error:",
      error.response?.data || error.message
    );
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
 * This function generates OTP, saves it to DB, and sends via MSG91 Flow API
 * @param {string} phone - Phone number
 * @param {string} email - Email (optional)
 * @param {string} type - Type: 'signup' or 'login'
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendAndSaveOTP = async (phone, email = null, type = "login") => {
  try {
    // Generate and save OTP to database
    const { otp, saved } = await saveOTP(phone, email, type);

    if (!saved || !otp) {
      return {
        success: false,
        message: "Failed to generate OTP. Please try again.",
      };
    }

    // Send OTP via MSG91 Flow API using the generated OTP
    const result = await sendOTPViaMSG91(phone, otp);

    if (result.success) {
      return {
        success: true,
        message: "OTP sent successfully to your phone number",
      };
    } else {
      // Even if MSG91 fails, we have OTP in DB for development/testing
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV MODE] OTP saved to DB: ${otp} for ${phone}`);
        return {
          success: true,
          message: "OTP generated (dev mode - check console for OTP)",
        };
      }
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
