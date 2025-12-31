import jwt from "jsonwebtoken";
import User from "../models/users/user.js";
import SuperAdmin from "../models/admin/superAdmin.js";

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Unauthorized - Invalid token format",
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for super admin (has 'id' field) or regular user (has 'userId' field)
    let user = null;
    let userRole = null;

    if (decoded.id) {
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
    } else if (decoded.userId) {
      // Regular user token
      const foundUser = await User.findById(decoded.userId);
      if (!foundUser) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized - User not found" });
      }
      user = foundUser;
      userRole = foundUser.role;
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token payload" });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: userRole,
      city: (user.city !== undefined) ? user.city : null,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Token expired" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Authentication error" });
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
          message: "Forbidden - Insufficient permissions",
        });
    }

    next();
  };
};

// Optional authentication middleware - sets req.user if token exists, but doesn't fail if it doesn't
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue without setting req.user
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      // Invalid token format - continue without setting req.user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is for super admin (has 'id' field) or regular user (has 'userId' field)
      if (decoded.id) {
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
      } else if (decoded.userId) {
        // Regular user token
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
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
