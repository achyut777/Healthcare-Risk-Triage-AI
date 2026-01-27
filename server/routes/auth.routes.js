/**
 * Authentication Routes
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import { validateLogin, validateUserRegistration } from '../middleware/validation.middleware.js';
import User from '../models/User.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'demo-secret-key-for-development', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { name, email, password, role, facilityId, facilityName, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'staff',
      facilityId,
      facilityName,
      phone
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facilityId: user.facilityId,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if MongoDB is connected
    if (isMongoConnected()) {
      // Use MongoDB
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          facilityId: user.facilityId,
          facilityName: user.facilityName,
          token: generateToken(user._id)
        }
      });
    } else {
      // Demo mode - use in-memory store
      const user = await demoStore.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          facilityId: user.facilityId,
          facilityName: user.facilityName,
          token: generateToken(user._id)
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode - user is already attached by protect middleware
      return res.json({ 
        success: true, 
        data: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          facilityId: req.user.facilityId,
          facilityName: req.user.facilityName,
          phone: req.user.phone
        }
      });
    }
    
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    if (!isMongoConnected()) {
      // Demo mode - update in-memory user
      const user = demoStore.users.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const updatedUser = demoStore.users.findByIdAndUpdate(req.user._id, {
        name: name || user.name,
        phone: phone || user.phone,
        avatar: avatar || user.avatar
      });
      
      return res.json({ 
        success: true, 
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          facilityId: updatedUser.facilityId,
          facilityName: updatedUser.facilityName,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar
        }
      });
    }
    
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
