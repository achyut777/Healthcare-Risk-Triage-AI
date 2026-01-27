/**
 * Staff Routes
 */
import express from 'express';
import mongoose from 'mongoose';
import { authorize, protect } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/staff
 * @desc    Get all staff members for facility
 * @access  Private (Admin only)
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    if (!isMongoConnected()) {
      // Demo mode
      let staff = demoStore.users.findAll().map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      
      if (role) staff = staff.filter(s => s.role === role);
      
      const total = staff.length;
      const startIndex = (page - 1) * limit;
      const paginatedStaff = staff.slice(startIndex, startIndex + parseInt(limit));

      return res.json({
        success: true,
        data: paginatedStaff,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    const query = { facilityId: req.user.facilityId };

    if (role) query.role = role;

    const staff = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/staff/:id
 * @desc    Get staff member by ID
 * @access  Private (Admin only)
 */
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const staff = demoStore.users.findById(req.params.id);
      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }
      const { password, ...staffWithoutPassword } = staff;
      return res.json({ success: true, data: staffWithoutPassword });
    }

    const staff = await User.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/staff
 * @desc    Create new staff member
 * @access  Private (Admin only)
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (!isMongoConnected()) {
      // Demo mode
      const existingUser = demoStore.users.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User with this email already exists' });
      }

      const newStaff = demoStore.users.create({
        name,
        email,
        password,
        role: role || 'staff',
        phone: phone || '',
        facilityId: req.user.facilityId,
        facilityName: req.user.facilityName
      });

      const { password: _, ...staffWithoutPassword } = newStaff;
      return res.status(201).json({ 
        success: true, 
        data: staffWithoutPassword,
        message: 'Staff member created successfully'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const newStaff = await User.create({
      name,
      email,
      password,
      role: role || 'staff',
      phone,
      facilityId: req.user.facilityId,
      facilityName: req.user.facilityName
    });

    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json({ 
      success: true, 
      data: staffResponse,
      message: 'Staff member created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/staff/:id
 * @desc    Update staff member
 * @access  Private (Admin only)
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, role, phone, isActive } = req.body;
    
    if (!isMongoConnected()) {
      // Demo mode
      const staff = demoStore.users.findByIdAndUpdate(req.params.id, { name, role, phone, isActive });
      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }
      const { password, ...staffWithoutPassword } = staff;
      return res.json({ success: true, data: staffWithoutPassword, message: 'Staff member updated successfully' });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ success: true, data: staff, message: 'Staff member updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete staff member
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const deleted = demoStore.users.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }
      return res.json({ success: true, message: 'Staff member deleted successfully' });
    }

    const staff = await User.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/staff/:id/deactivate
 * @desc    Deactivate staff member
 * @access  Private (Admin only)
 */
router.put('/:id/deactivate', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const staff = demoStore.users.findByIdAndUpdate(req.params.id, { isActive: false });
      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }
      const { password, ...staffWithoutPassword } = staff;
      return res.json({ success: true, message: 'Staff member deactivated', data: staffWithoutPassword });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ success: true, message: 'Staff member deactivated', data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/staff/:id/activate
 * @desc    Activate staff member
 * @access  Private (Admin only)
 */
router.put('/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const staff = demoStore.users.findByIdAndUpdate(req.params.id, { isActive: true });
      if (!staff) {
        return res.status(404).json({ success: false, error: 'Staff member not found' });
      }
      const { password, ...staffWithoutPassword } = staff;
      return res.json({ success: true, message: 'Staff member activated', data: staffWithoutPassword });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    res.json({ success: true, message: 'Staff member activated', data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/staff/stats/overview
 * @desc    Get staff statistics
 * @access  Private (Admin only)
 */
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    const [totalStaff, activeStaff, roleDistribution] = await Promise.all([
      User.countDocuments({ facilityId }),
      User.countDocuments({ facilityId, isActive: true }),
      User.aggregate([
        { $match: { facilityId } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        inactiveStaff: totalStaff - activeStaff,
        roleDistribution: roleDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
