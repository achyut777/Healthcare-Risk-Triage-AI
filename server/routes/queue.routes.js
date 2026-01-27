/**
 * Queue Management Routes
 */
import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import QueueEntry from '../models/Queue.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/queue
 * @desc    Get all queue entries
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    if (!isMongoConnected()) {
      // Demo mode - return all queue entries
      const allQueue = demoStore.queue.find({});
      const waiting = allQueue.filter(q => q.status === 'waiting').sort((a, b) => b.urgencyScore - a.urgencyScore);
      
      return res.json({
        success: true,
        data: waiting.map((entry, index) => ({
          ...entry,
          position: index + 1,
          estimatedWait: (index + 1) * 8
        }))
      });
    }

    const queue = await QueueEntry.find({ status: 'waiting' })
      .sort({ priority: 1, createdAt: 1 });

    res.json({
      success: true,
      data: queue.map((entry, index) => ({
        ...entry.toObject(),
        position: index + 1,
        estimatedWait: (index + 1) * 8
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/queue/add
 * @desc    Add patient to queue
 * @access  Private
 */
router.post('/add', protect, async (req, res) => {
  try {
    const { patientName, age, gender, symptoms, contact, priority, urgencyScore } = req.body;

    if (!isMongoConnected()) {
      // Demo mode
      const queueEntry = demoStore.queue.create({
        patientName,
        age,
        gender,
        symptoms,
        contact,
        priority: priority || 'medium',
        urgencyScore: urgencyScore || 50,
        facilityId: req.user.facilityId,
        status: 'waiting'
      });

      const queue = demoStore.queue.find({ facilityId: req.user.facilityId, status: 'waiting' });
      const position = queue.findIndex(q => q._id === queueEntry._id) + 1;
      const estimatedWait = position * 8;

      return res.status(201).json({
        success: true,
        data: { ...queueEntry, position, estimatedWait },
        message: 'Patient added to queue successfully'
      });
    }

    const token = await QueueEntry.generateToken(req.user.facilityId);

    const queueEntry = await QueueEntry.create({
      token,
      patientName,
      age,
      gender,
      symptoms,
      contact,
      priority: priority || 'medium',
      urgencyScore,
      facilityId: req.user.facilityId
    });

    // Calculate position
    const position = await QueueEntry.countDocuments({
      facilityId: req.user.facilityId,
      status: 'waiting',
      createdAt: { $lte: queueEntry.createdAt }
    });

    const estimatedWait = position * 8; // 8 minutes per patient average

    res.status(201).json({
      success: true,
      data: {
        ...queueEntry.toObject(),
        position,
        estimatedWait
      },
      message: 'Patient added to queue successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/queue/status
 * @desc    Get current queue status
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    if (!isMongoConnected()) {
      // Demo mode
      const allQueue = demoStore.queue.find({ facilityId });
      const waiting = allQueue.filter(q => q.status === 'waiting').sort((a, b) => b.urgencyScore - a.urgencyScore);
      const serving = allQueue.filter(q => q.status === 'in-consultation');
      const completed = allQueue.filter(q => q.status === 'completed');

      const priorityCounts = {
        critical: waiting.filter(p => p.priority === 'critical').length,
        high: waiting.filter(p => p.priority === 'high').length,
        medium: waiting.filter(p => p.priority === 'medium').length,
        low: waiting.filter(p => p.priority === 'low').length
      };

      return res.json({
        success: true,
        data: {
          totalWaiting: waiting.length,
          nowServing: serving.map(s => s.token),
          nextUp: waiting[0]?.token || null,
          priorityBreakdown: priorityCounts,
          averageWaitTime: waiting.length * 8,
          servedToday: completed.length,
          queue: waiting.slice(0, 20),
          serving: serving,
          completed: completed
        }
      });
    }

    const waiting = await QueueEntry.find({ facilityId, status: 'waiting' })
      .sort({ priority: 1, createdAt: 1 });
    
    const serving = await QueueEntry.find({ facilityId, status: 'serving' });
    
    const completedEntries = await QueueEntry.find({
      facilityId,
      status: 'completed',
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).sort({ completedAt: -1 });

    const priorityCounts = {
      critical: waiting.filter(p => p.priority === 'critical').length,
      high: waiting.filter(p => p.priority === 'high').length,
      medium: waiting.filter(p => p.priority === 'medium').length,
      low: waiting.filter(p => p.priority === 'low').length
    };

    res.json({
      success: true,
      data: {
        totalWaiting: waiting.length,
        nowServing: serving.map(s => s.token),
        nextUp: waiting[0]?.token || null,
        priorityBreakdown: priorityCounts,
        averageWaitTime: waiting.length * 8,
        servedToday: completedEntries.length,
        queue: waiting.slice(0, 20),
        serving: serving,
        completed: completedEntries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/queue/check/:token
 * @desc    Check queue position by token
 * @access  Public
 */
router.get('/check/:token', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const entry = demoStore.queue.findOne({ token: req.params.token.toUpperCase() });
      if (!entry) {
        return res.json({ found: false, message: 'Token not found in queue' });
      }

      const waiting = demoStore.queue.find({ facilityId: entry.facilityId, status: 'waiting' });
      const position = waiting.findIndex(q => q._id === entry._id) + 1;

      return res.json({
        found: true,
        data: {
          token: entry.token,
          status: entry.status,
          position: entry.status === 'waiting' ? position : null,
          estimatedWait: entry.status === 'waiting' ? position * 8 : null,
          patientName: entry.patientName,
          priority: entry.priority
        }
      });
    }

    const entry = await QueueEntry.findOne({ token: req.params.token.toUpperCase() });

    if (!entry) {
      return res.json({ found: false, message: 'Token not found in queue' });
    }

    if (entry.status === 'waiting') {
      const position = await QueueEntry.countDocuments({
        facilityId: entry.facilityId,
        status: 'waiting',
        createdAt: { $lte: entry.createdAt }
      });

      return res.json({
        found: true,
        data: {
          token: entry.token,
          name: entry.patientName,
          position,
          estimatedWait: position * 8,
          priority: entry.priority,
          status: entry.status
        }
      });
    }

    res.json({
      found: true,
      data: {
        token: entry.token,
        status: entry.status,
        message: entry.status === 'serving' ? 'You are being served' : 'Patient has been processed'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/queue/public-status
 * @desc    Get public queue status (no auth required)
 * @access  Public
 */
router.get('/public-status', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode - get all queue entries
      const allQueue = demoStore.queue.find({});
      const waiting = allQueue.filter(q => q.status === 'waiting').sort((a, b) => b.urgencyScore - a.urgencyScore);
      const serving = allQueue.filter(q => q.status === 'in-consultation' || q.status === 'serving');
      const completed = allQueue.filter(q => q.status === 'completed');

      return res.json({
        success: true,
        data: {
          totalWaiting: waiting.length,
          nowServing: serving[0]?.token || null,
          averageWaitTime: Math.max(1, waiting.length) * 8,
          servedToday: completed.length,
          queue: waiting.slice(0, 10).map((entry, index) => ({
            token: entry.token,
            priority: entry.priority,
            position: index + 1
          }))
        }
      });
    }

    // MongoDB mode
    const waiting = await QueueEntry.find({ status: 'waiting' })
      .sort({ priority: 1, createdAt: 1 })
      .select('token priority createdAt');
    
    const serving = await QueueEntry.findOne({ status: { $in: ['serving', 'in-consultation'] } })
      .select('token');
    
    const completedToday = await QueueEntry.countDocuments({
      status: 'completed',
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      success: true,
      data: {
        totalWaiting: waiting.length,
        nowServing: serving?.token || null,
        averageWaitTime: Math.max(1, waiting.length) * 8,
        servedToday: completedToday,
        queue: waiting.slice(0, 10).map((entry, index) => ({
          token: entry.token,
          priority: entry.priority,
          position: index + 1
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/queue/call/:token
 * @desc    Call next patient
 * @access  Private
 */
router.post('/call/:token', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const entry = demoStore.queue.findOne({ token: req.params.token.toUpperCase() });
      if (!entry || entry.status !== 'waiting') {
        return res.status(404).json({ success: false, error: 'Patient not found or already called' });
      }
      
      const updated = demoStore.queue.findByIdAndUpdate(entry._id, {
        status: 'called',
        calledAt: new Date(),
        counter: req.body.counter || 1
      });
      
      return res.json({
        success: true,
        message: `Calling patient ${entry.patientName}`,
        data: updated
      });
    }

    const entry = await QueueEntry.findOne({ 
      token: req.params.token.toUpperCase(),
      status: 'waiting'
    });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Patient not found or already called' });
    }

    entry.status = 'called';
    entry.calledAt = new Date();
    entry.assignedTo = req.user._id;
    entry.counter = req.body.counter || 1;
    await entry.save();

    res.json({
      success: true,
      message: `Calling patient ${entry.patientName}`,
      data: entry
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/queue/serve/:token
 * @desc    Start serving patient
 * @access  Private
 */
router.post('/serve/:token', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const entry = demoStore.queue.findOne({ token: req.params.token.toUpperCase() });
      if (!entry) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      
      const updated = demoStore.queue.findByIdAndUpdate(entry._id, {
        status: 'in-consultation',
        servedAt: new Date(),
        waitTime: Math.round((new Date() - new Date(entry.addedAt)) / 60000)
      });
      
      return res.json({ success: true, data: updated });
    }

    const entry = await QueueEntry.findOne({ token: req.params.token.toUpperCase() });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    entry.status = 'serving';
    entry.servedAt = new Date();
    if (entry.calledAt) {
      entry.waitTime = Math.round((entry.servedAt - entry.addedAt) / 60000);
    }
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/queue/complete/:token
 * @desc    Mark patient as completed
 * @access  Private
 */
router.post('/complete/:token', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Demo mode
      const entry = demoStore.queue.findOne({ token: req.params.token.toUpperCase() });
      if (!entry) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      
      const updated = demoStore.queue.findByIdAndUpdate(entry._id, {
        status: 'completed',
        completedAt: new Date(),
        notes: req.body.notes || ''
      });
      
      return res.json({ success: true, message: 'Patient marked as completed', data: updated });
    }

    const entry = await QueueEntry.findOne({ token: req.params.token.toUpperCase() });

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    entry.status = 'completed';
    entry.completedAt = new Date();
    if (entry.servedAt) {
      entry.serviceTime = Math.round((entry.completedAt - entry.servedAt) / 60000);
    }
    if (req.body.notes) entry.notes = req.body.notes;
    await entry.save();

    res.json({ success: true, message: 'Patient marked as completed', data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/queue/priority/:token
 * @desc    Update patient priority
 * @access  Private
 */
router.put('/priority/:token', protect, async (req, res) => {
  try {
    const { priority } = req.body;
    
    if (!isMongoConnected()) {
      // Demo mode
      const entry = demoStore.queue.findOne({ token: req.params.token.toUpperCase() });
      if (!entry) {
        return res.status(404).json({ success: false, error: 'Patient not found' });
      }
      
      const updated = demoStore.queue.findByIdAndUpdate(entry._id, { priority });
      return res.json({ success: true, data: updated });
    }
    
    const entry = await QueueEntry.findOneAndUpdate(
      { token: req.params.token.toUpperCase() },
      { priority },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/queue/:id/vitals
 * @desc    Update queue entry with vitals/assessment info
 * @access  Private
 */
router.put('/:id/vitals', protect, async (req, res) => {
  try {
    const { vitalsRecorded, assessment, urgencyScore, priority } = req.body;
    
    if (!isMongoConnected()) {
      // Demo mode
      const updated = demoStore.queue.findByIdAndUpdate(req.params.id, {
        vitalsRecorded: vitalsRecorded || true,
        assessment,
        urgencyScore,
        priority: priority || undefined,
        vitalsRecordedAt: new Date(),
        vitalsRecordedBy: req.user._id
      });
      
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Queue entry not found' });
      }
      
      return res.json({ success: true, data: updated });
    }
    
    const entry = await QueueEntry.findByIdAndUpdate(
      req.params.id,
      {
        vitalsRecorded: vitalsRecorded || true,
        assessment,
        urgencyScore,
        priority: priority || undefined,
        vitalsRecordedAt: new Date(),
        vitalsRecordedBy: req.user._id
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/queue/:id/assign
 * @desc    Assign patient to doctor
 * @access  Private
 */
router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { doctorId, doctorName } = req.body;
    
    if (!isMongoConnected()) {
      // Demo mode
      const updated = demoStore.queue.findByIdAndUpdate(req.params.id, {
        assignedDoctor: doctorId,
        assignedDoctorName: doctorName,
        status: 'in-consultation',
        calledAt: new Date()
      });
      
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Queue entry not found' });
      }
      
      return res.json({ success: true, data: updated, message: `Patient assigned to ${doctorName}` });
    }
    
    const entry = await QueueEntry.findByIdAndUpdate(
      req.params.id,
      {
        assignedDoctor: doctorId,
        assignedDoctorName: doctorName,
        status: 'in-consultation',
        calledAt: new Date()
      },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    res.json({ success: true, data: entry, message: `Patient assigned to ${doctorName}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
