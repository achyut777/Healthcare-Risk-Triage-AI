/**
 * Assessment Routes
 */
import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import { validateVitals } from '../middleware/validation.middleware.js';
import Assessment from '../models/Assessment.model.js';
import Patient from '../models/Patient.model.js';
import demoStore from '../services/demoData.service.js';
import { calculateRiskAssessment } from '../services/riskEngine.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   POST /api/assessments
 * @desc    Create a new risk assessment
 * @access  Private
 */
router.post('/', protect, validateVitals, async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age, gender, heartRate, bpSystolic, bpDiastolic,
      temperature, oxygenSaturation, respiratoryRate,
      symptomDurationDays, painLevel, chiefComplaint
    } = req.body;

    // Calculate risk assessment
    const vitals = {
      age, gender, heartRate, bpSystolic, bpDiastolic,
      temperature: temperature || 37.0,
      oxygenSaturation: oxygenSaturation || 98,
      respiratoryRate: respiratoryRate || 16,
      symptomDurationDays: symptomDurationDays || 1,
      painLevel: painLevel || 5
    };

    const riskResult = calculateRiskAssessment(vitals);

    if (!isMongoConnected()) {
      // Demo mode
      const newPatientId = patientId || `PT-${Date.now()}`;
      let patient = demoStore.patients.findOne({ patientId: newPatientId });
      
      if (!patient) {
        patient = demoStore.patients.create({
          patientId: newPatientId,
          name: patientName || 'Unknown Patient',
          age,
          gender: gender === 1 ? 'male' : 'female',
          facilityId: req.user.facilityId
        });
      }

      const assessment = demoStore.assessments.create({
        patient: patient._id,
        patientId: patient.patientId,
        patientName: patient.name,
        vitals,
        chiefComplaint,
        riskLevel: riskResult.riskLevel,
        urgencyScore: riskResult.urgencyScore,
        confidence: riskResult.confidence,
        contributingFactors: riskResult.contributingFactors,
        recommendations: riskResult.recommendations,
        assessedBy: req.user._id,
        facilityId: req.user.facilityId
      });

      return res.status(201).json({
        success: true,
        data: assessment,
        disclaimer: '⚠️ This is a preliminary risk assessment for patient prioritization only. It is NOT a medical diagnosis.'
      });
    }

    // MongoDB mode
    let patient = await Patient.findOne({ patientId });
    if (!patient) {
      patient = await Patient.create({
        patientId: patientId || `PT-${Date.now()}`,
        name: patientName || 'Unknown',
        age,
        gender: gender === 1 ? 'male' : 'female',
        facilityId: req.user.facilityId
      });
    }

    // Create assessment
    const assessment = await Assessment.create({
      patient: patient._id,
      patientId: patient.patientId,
      vitals,
      chiefComplaint,
      riskLevel: riskResult.riskLevel,
      urgencyScore: riskResult.urgencyScore,
      confidence: riskResult.confidence,
      contributingFactors: riskResult.contributingFactors,
      recommendations: riskResult.recommendations,
      assessedBy: req.user._id,
      facilityId: req.user.facilityId
    });

    // Update user's assessment count
    req.user.assessmentsCount += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      data: assessment,
      disclaimer: '⚠️ This is a preliminary risk assessment for patient prioritization only. It is NOT a medical diagnosis.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/assessments
 * @desc    Get all assessments for facility
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, riskLevel } = req.query;

    if (!isMongoConnected()) {
      // Demo mode
      let assessments = demoStore.assessments.find({ facilityId: req.user.facilityId });
      if (riskLevel) {
        assessments = assessments.filter(a => a.riskLevel === riskLevel);
      }
      
      const total = assessments.length;
      const startIndex = (page - 1) * limit;
      const paginatedAssessments = assessments.slice(startIndex, startIndex + parseInt(limit));

      return res.json({
        success: true,
        data: paginatedAssessments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    const query = { facilityId: req.user.facilityId };
    if (riskLevel) query.riskLevel = riskLevel;

    const assessments = await Assessment.find(query)
      .populate('assessedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Assessment.countDocuments(query);

    res.json({
      success: true,
      data: assessments,
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
 * @route   GET /api/assessments/:id
 * @desc    Get single assessment
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('patient')
      .populate('assessedBy', 'name role');

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/assessments/:id/validate
 * @desc    Doctor validates an assessment
 * @access  Private (Doctor only)
 */
router.put('/:id/validate', protect, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    assessment.validatedByDoctor = true;
    assessment.validatedAt = new Date();
    assessment.validatedBy = req.user._id;
    if (req.body.notes) assessment.notes = req.body.notes;

    await assessment.save();

    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
