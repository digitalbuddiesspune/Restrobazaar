import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to check if still exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - User not found' });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      city: user.city || null
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized - Token expired' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Authorization middleware - Admin only
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication middleware - sets req.user if token exists, but doesn't fail if it doesn't
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without setting req.user
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // Invalid token format - continue without setting req.user
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to check if still exists
      const user = await User.findById(decoded.userId);
      
      if (user) {
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          city: user.city || null
        };
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
  authorize('admin', 'super_admin', 'city_admin')
];

export default authenticate;