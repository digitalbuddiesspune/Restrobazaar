import jwt from "jsonwebtoken";
import User from "../models/users/user.js";
import SuperAdmin from "../models/admin/superAdmin.js";
import Vendor from "../models/admin/vendor.js";

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Try to get token from cookie first (preferred method)
    let token = req.cookies?.token;

    // Fallback to Authorization header for backward compatibility (optional)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized - Invalid token" });
      }
      if (jwtError.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized - Token expired" });
      }
      throw jwtError;
    }

    // Check if token is for super admin, vendor (has 'id' field with role), or regular user (has 'userId' field)
    let user = null;
    let userRole = null;

    if (decoded.id) {
      // Check if it's a vendor token (has role field)
      if (decoded.role === "vendor") {
        console.log("Vendor token detected:", { id: decoded.id, role: decoded.role });
        // Vendor token
        const vendor = await Vendor.findById(decoded.id);
        if (!vendor) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized - Vendor not found" });
        }
        if (!vendor.isActive) {
          return res
            .status(403)
            .json({ success: false, message: "Forbidden - Vendor account is inactive" });
        }
        if (!vendor.isApproved) {
          return res
            .status(403)
            .json({ success: false, message: "Forbidden - Vendor account is not approved" });
        }
        user = {
          _id: vendor._id,
          email: vendor.email,
          role: "vendor",
        };
        userRole = "vendor";
        console.log("Vendor authenticated:", { userId: vendor._id, role: userRole });
      } else {
        // Super admin token
        const superAdmin = await SuperAdmin.findById(decoded.id);
        if (!superAdmin) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized - Super admin not found" });
        }
        if (!superAdmin.isActive) {
          return res
            .status(403)
            .json({ success: false, message: "Forbidden - Super admin account is inactive" });
        }
        user = {
          _id: superAdmin._id,
          email: superAdmin.email,
          role: "super_admin",
        };
        userRole = "super_admin";
      }
    } else if (decoded.userId) {
      // Regular user token
      const foundUser = await User.findById(decoded.userId);
      if (!foundUser) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized - User not found" });
      }
      user = foundUser;
      // Default to "user" role if not set in the user model
      userRole = foundUser.role || "user";
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token payload" });
    }

    // Ensure role is set correctly
    if (!userRole) {
      console.error("Authentication error: userRole is not set", { 
        decoded, 
        user, 
        hasId: !!decoded.id, 
        hasUserId: !!decoded.userId,
        decodedRole: decoded.role 
      });
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token format. Token payload: " + JSON.stringify(decoded) });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: userRole,
      city: (user.city !== undefined) ? user.city : null,
    };
    
    console.log("Request authenticated:", { userId: req.user.userId, role: req.user.role, email: req.user.email });

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Authentication error", error: error.message });
  }
};

// Authorization middleware - Admin only
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Unauthorized - Authentication required",
        });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: `Forbidden - Insufficient permissions. Required role: ${roles.join(" or ")}, but got: ${req.user.role || "none"}`,
        });
    }

    next();
  };
};

// Optional authentication middleware - sets req.user if token exists, but doesn't fail if it doesn't
export const optionalAuthenticate = async (req, res, next) => {
  try {
    // Try to get token from cookie first (preferred method)
    let token = req.cookies?.token;

    // Fallback to Authorization header for backward compatibility (optional)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      // No token provided - continue without setting req.user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is for super admin, vendor (has 'id' field with role), or regular user (has 'userId' field)
      if (decoded.id) {
        if (decoded.role === "vendor") {
          // Vendor token
          const vendor = await Vendor.findById(decoded.id);
          if (vendor && vendor.isActive && vendor.isApproved) {
            req.user = {
              userId: vendor._id,
              email: vendor.email,
              role: "vendor",
              city: null,
            };
          }
        } else {
          // Super admin token
          const superAdmin = await SuperAdmin.findById(decoded.id);
          if (superAdmin && superAdmin.isActive) {
            req.user = {
              userId: superAdmin._id,
              email: superAdmin.email,
              role: "super_admin",
              city: null,
            };
          }
        }
      } else if (decoded.userId) {
        // Regular user token
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role || "user", // Default to "user" role if not set
            city: user.city || null,
          };
        }
      }
    } catch (tokenError) {
      // Token invalid or expired - continue without setting req.user
      // Don't fail the request, just proceed without authentication
    }

    next();
  } catch (error) {
    // On any other error, continue without authentication
    next();
  }
};

// Combined authenticate and authorize for admin (supports all admin roles)
export const authenticateAdmin = [
  authenticate,
  authorize("admin", "super_admin", "city_admin"),
];

export default authenticate;
