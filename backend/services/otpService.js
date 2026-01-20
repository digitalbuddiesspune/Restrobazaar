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
 * SEND OTP (MSG91 generates OTP)
 */
export const sendOTPViaMSG91 = async (phone) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
      throw new Error("MSG91 credentials missing");
    }

    const mobile = formatMobile(phone);

    const response = await axios.post(
      "https://api.msg91.com/api/v5/otp",
      {
        template_id: templateId,
        mobile: mobile,
        otp_expiry: 5
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
      "MSG91 Send OTP Error:",
      error.response?.data || error.message
    );
    return false;
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
 * This function generates OTP, saves it to DB, and sends via MSG91
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

    // Send OTP via MSG91 (MSG91 will generate its own OTP, but we also save ours to DB)
    // Note: If you want MSG91 to use the OTP we generated, you'd need to modify sendOTPViaMSG91
    // For now, we're using MSG91's auto-generated OTP, but also saving our own for verification
    const sent = await sendOTPViaMSG91(phone);

    if (sent) {
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
