import express from "express";
import { sendOTPViaMSG91, verifyOTPViaMSG91 } from "../../services/otpService.js";
import User from "../../models/users/user.js";
import jwt from "jsonwebtoken";

const otpRouter = express.Router();

/**
 * @desc    Send OTP
 * @route   POST /api/v1/otp/send-otp
 * @access  Public
 */
otpRouter.post("/otp/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;

    // Handle different phone formats
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    // Validate Indian phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // Send OTP via MSG91 (MSG91 generates the OTP)
    const sent = await sendOTPViaMSG91(validPhone);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent successfully to your phone number",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
});

/**
 * @desc    Verify OTP and login
 * @route   POST /api/v1/otp/verify-otp
 * @access  Public
 */
otpRouter.post("/otp/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Validate and clean phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let validPhone = cleanedPhone;

    // Handle different phone formats
    if (cleanedPhone.length === 13 && cleanedPhone.startsWith("91")) {
      validPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith("0")) {
      validPhone = cleanedPhone.substring(1);
    }

    // Validate Indian phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(validPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // Verify OTP via MSG91
    const verified = await verifyOTPViaMSG91(validPhone, otp);

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP. Please try again.",
      });
    }

    // Find or create user
    let user = await User.findOne({ phone: validPhone });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        phone: validPhone,
        name: `User ${validPhone}`, // Default name
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Set JWT in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: "OTP verified successfully",
      data: {
        user: userResponse,
        token, // Also send token in response for client-side storage if needed
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
});

export default otpRouter;
