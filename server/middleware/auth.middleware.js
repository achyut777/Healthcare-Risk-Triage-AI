/**
 * Authentication Middleware
 */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import demoStore from '../services/demoData.service.js';

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key-for-development');
      
      let user;
      if (isMongoConnected()) {
        user = await User.findById(decoded.id).select('-password');
      } else {
        // Demo mode - use in-memory store
        user = demoStore.users.findById(decoded.id);
      }
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
