const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Access denied. User not found or inactive.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Access denied. Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Authentication error'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient privileges.'
      });
    }

    next();
  };
};

// Check quota middleware
const checkQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user.checkQuota()) {
      return res.status(429).json({
        message: 'Quota exceeded. Please upgrade your plan or wait for the next billing cycle.',
        quotaUsed: user.quotaUsed,
        quotaLimit: user.quotaLimit
      });
    }

    req.userModel = user;
    next();
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({
      message: 'Failed to check quota'
    });
  }
};

module.exports = {
  auth,
  authorize,
  checkQuota
};