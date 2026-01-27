/**
 * Patient Model - MongoDB Schema
 */
import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 120
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  contact: {
    phone: String,
    email: String,
    address: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    medications: [String],
    previousVisits: [{
      date: Date,
      reason: String,
      diagnosis: String
    }]
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facilityId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Generate patient ID before saving
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    const year = new Date().getFullYear();
    this.patientId = `PT-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
