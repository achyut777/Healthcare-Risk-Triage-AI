/**
 * Queue Model - MongoDB Schema
 * Patient queue management
 */
import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  age: Number,
  gender: String,
  symptoms: String,
  contact: String,
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  urgencyScore: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'serving', 'completed', 'cancelled', 'no-show'],
    default: 'waiting'
  },
  counter: {
    type: Number,
    default: null
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facilityId: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  calledAt: Date,
  servedAt: Date,
  completedAt: Date,
  waitTime: Number, // in minutes
  serviceTime: Number, // in minutes
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  },
  notes: String
}, {
  timestamps: true
});

// Index for faster queries
queueEntrySchema.index({ facilityId: 1, status: 1, priority: 1 });
queueEntrySchema.index({ token: 1 });

// Virtual for position in queue
queueEntrySchema.virtual('position').get(async function() {
  const count = await mongoose.model('QueueEntry').countDocuments({
    facilityId: this.facilityId,
    status: 'waiting',
    createdAt: { $lt: this.createdAt }
  });
  return count + 1;
});

// Static method to generate token
queueEntrySchema.statics.generateToken = async function(facilityId) {
  const today = new Date();
  const year = today.getFullYear();
  const count = await this.countDocuments({
    facilityId,
    createdAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0))
    }
  });
  return `PT-${year}-${String(count + 1).padStart(4, '0')}`;
};

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

export default QueueEntry;
