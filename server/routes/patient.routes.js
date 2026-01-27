/**
 * Patient Routes
 */
import express from 'express';
import mongoose from 'mongoose';
import { authorize, protect } from '../middleware/auth.middleware.js';
import Patient from '../models/Patient.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/patients
 * @desc    Get all patients for facility
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    if (!isMongoConnected()) {
      // Demo mode
      let patients = demoStore.patients.find({});
      
      if (search) {
        const searchLower = search.toLowerCase();
        patients = patients.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.patientId.toLowerCase().includes(searchLower)
        );
      }

      const total = patients.length;
      const startIndex = (page - 1) * limit;
      const paginatedPatients = patients.slice(startIndex, startIndex + parseInt(limit));

      return res.json({
        success: true,
        data: paginatedPatients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    const query = { facilityId: req.user.facilityId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: patients,
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
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const patient = demoStore.patients.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      return res.json({ success: true, data: patient });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const patient = demoStore.patients.create({
        ...req.body,
        facilityId: req.user.facilityId
      });
      return res.status(201).json({ success: true, data: patient });
    }

    const patient = await Patient.create({
      ...req.body,
      facilityId: req.user.facilityId
    });
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const patient = demoStore.patients.update(req.params.id, req.body);
      if (!patient) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      return res.json({ success: true, data: patient });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete patient
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const deleted = demoStore.patients.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      return res.json({ success: true, message: 'Patient deleted' });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
