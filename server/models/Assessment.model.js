/**
 * Assessment Model - MongoDB Schema
 * Stores risk assessment results
 */
import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientId: {
    type: String,
    required: true
  },
  // Vital Signs Input
  vitals: {
    age: { type: Number, required: true },
    gender: { type: Number, required: true }, // 0=Female, 1=Male
    heartRate: { type: Number, required: true },
    bpSystolic: { type: Number, required: true },
    bpDiastolic: { type: Number, required: true },
    temperature: { type: Number, required: true },
    oxygenSaturation: { type: Number, required: true },
    respiratoryRate: { type: Number, required: true },
    symptomDurationDays: { type: Number, required: true },
    painLevel: { type: Number, required: true, min: 0, max: 10 }
  },
  chiefComplaint: {
    type: String,
    trim: true
  },
  // Risk Assessment Results
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true
  },
  urgencyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  contributingFactors: {
    type: Map,
    of: Number
  },
  recommendations: [{
    type: String
  }],
  // Metadata
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facilityId: {
    type: String,
    required: true
  },
  validatedByDoctor: {
    type: Boolean,
    default: false
  },
  validatedAt: Date,
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  disclaimer: {
    type: String,
    default: '⚠️ This is a preliminary risk assessment for patient prioritization only. It is NOT a medical diagnosis.'
  }
}, {
  timestamps: true
});

// Index for faster queries
assessmentSchema.index({ patientId: 1, createdAt: -1 });
assessmentSchema.index({ riskLevel: 1 });
assessmentSchema.index({ facilityId: 1, createdAt: -1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;
