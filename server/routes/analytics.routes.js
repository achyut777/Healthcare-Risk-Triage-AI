/**
 * Analytics Routes
 */
import express from 'express';
import mongoose from 'mongoose';
import { authorize, protect } from '../middleware/auth.middleware.js';
import Assessment from '../models/Assessment.model.js';
import Patient from '../models/Patient.model.js';
import QueueEntry from '../models/Queue.model.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    // Demo mode - use in-memory data
    if (!isMongoConnected()) {
      const analytics = demoStore.getAnalytics(facilityId);
      return res.json({
        success: true,
        data: analytics
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date(today);
    thisMonth.setDate(1);

    // Get counts
    const [
      totalPatientsToday,
      totalAssessmentsToday,
      totalAssessmentsWeek,
      totalAssessmentsMonth,
      criticalToday,
      highRiskToday,
      queueWaiting,
      avgWaitTime
    ] = await Promise.all([
      Patient.countDocuments({ facilityId, createdAt: { $gte: today } }),
      Assessment.countDocuments({ facilityId, createdAt: { $gte: today } }),
      Assessment.countDocuments({ facilityId, createdAt: { $gte: thisWeek } }),
      Assessment.countDocuments({ facilityId, createdAt: { $gte: thisMonth } }),
      Assessment.countDocuments({ facilityId, riskLevel: 'critical', createdAt: { $gte: today } }),
      Assessment.countDocuments({ facilityId, riskLevel: 'high', createdAt: { $gte: today } }),
      QueueEntry.countDocuments({ facilityId, status: 'waiting' }),
      QueueEntry.aggregate([
        { $match: { facilityId, status: 'completed', waitTime: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$waitTime' } } }
      ])
    ]);

    // Risk distribution
    const riskDistribution = await Assessment.aggregate([
      { $match: { facilityId, createdAt: { $gte: thisWeek } } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    // Hourly trends today
    const hourlyTrends = await Assessment.aggregate([
      { $match: { facilityId, createdAt: { $gte: today } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          patientsToday: totalPatientsToday,
          assessmentsToday: totalAssessmentsToday,
          assessmentsWeek: totalAssessmentsWeek,
          assessmentsMonth: totalAssessmentsMonth,
          criticalCases: criticalToday,
          highRiskCases: highRiskToday,
          queueLength: queueWaiting,
          avgWaitTime: avgWaitTime[0]?.avg || 0
        },
        riskDistribution: riskDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 }),
        hourlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trend data for charts
 * @access  Private
 */
router.get('/trends', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;
    const { days = 7 } = req.query;

    // Demo mode - return data based on actual demo assessments and queue
    if (!isMongoConnected()) {
      const today = new Date();
      const dailyAssessments = [];
      const queuePerformance = [];
      
      // Get analytics from demo store for base data
      const analytics = demoStore.getAnalytics(facilityId);
      const { riskDistribution } = analytics;
      
      // Generate realistic trends based on actual risk distribution
      const baseTotal = Math.max(
        (riskDistribution.critical || 0) + 
        (riskDistribution.high || 0) + 
        (riskDistribution.medium || 0) + 
        (riskDistribution.low || 0),
        15
      );
      
      for (let i = parseInt(days) - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Simulate daily variations with realistic patterns
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const multiplier = isWeekend ? 0.7 : (dayOfWeek === 1 || dayOfWeek === 5 ? 1.2 : 1.0);
        
        const dayTotal = Math.round(baseTotal * multiplier * (0.8 + Math.random() * 0.4));
        
        dailyAssessments.push({
          _id: dateStr,
          total: dayTotal,
          critical: Math.max(0, Math.round((riskDistribution.critical || 1) * multiplier * (0.5 + Math.random() * 1))),
          high: Math.max(1, Math.round((riskDistribution.high || 2) * multiplier * (0.6 + Math.random() * 0.8))),
          medium: Math.max(2, Math.round((riskDistribution.medium || 3) * multiplier * (0.7 + Math.random() * 0.6))),
          low: Math.max(1, Math.round((riskDistribution.low || 2) * multiplier * (0.8 + Math.random() * 0.4)))
        });
        
        // Queue performance - served slightly more than assessments
        const served = Math.round(dayTotal * (1.1 + Math.random() * 0.3));
        queuePerformance.push({
          _id: dateStr,
          served: served,
          avgWait: Math.round(8 + Math.random() * 10 + (isWeekend ? -3 : 2)),
          avgService: Math.round(12 + Math.random() * 8)
        });
      }
      
      return res.json({
        success: true,
        data: {
          dailyAssessments,
          queuePerformance
        }
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Daily assessments
    const dailyAssessments = await Assessment.aggregate([
      { $match: { facilityId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Queue performance
    const queuePerformance = await QueueEntry.aggregate([
      { $match: { facilityId, createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          served: { $sum: 1 },
          avgWait: { $avg: '$waitTime' },
          avgService: { $avg: '$serviceTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        dailyAssessments,
        queuePerformance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/analytics/risk-factors
 * @desc    Get common risk factors analysis
 * @access  Private (Admin/Doctor)
 */
router.get('/risk-factors', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const facilityId = req.user.facilityId;
    const { days = 30 } = req.query;

    // Demo mode
    if (!isMongoConnected()) {
      return res.json({
        success: true,
        data: {
          topRiskFactors: [
            { _id: 'Elevated Heart Rate', count: 45 },
            { _id: 'High Blood Pressure', count: 38 },
            { _id: 'Low Oxygen Saturation', count: 32 },
            { _id: 'Fever', count: 28 },
            { _id: 'Chest Pain', count: 22 },
            { _id: 'Shortness of Breath', count: 18 },
            { _id: 'Elderly Patient', count: 15 },
            { _id: 'Diabetic', count: 12 },
            { _id: 'Previous Heart Condition', count: 10 },
            { _id: 'Severe Pain', count: 8 }
          ],
          ageDistribution: [
            { _id: { min: 0, max: 18 }, count: 8 },
            { _id: { min: 18, max: 30 }, count: 12 },
            { _id: { min: 30, max: 45 }, count: 18 },
            { _id: { min: 45, max: 60 }, count: 25 },
            { _id: { min: 60, max: 75 }, count: 20 },
            { _id: { min: 75, max: 100 }, count: 15 }
          ]
        }
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const riskFactors = await Assessment.aggregate([
      { $match: { facilityId, createdAt: { $gte: startDate } } },
      { $unwind: '$contributingFactors' },
      {
        $group: {
          _id: '$contributingFactors',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Age distribution of high-risk patients
    const ageDistribution = await Assessment.aggregate([
      { $match: { facilityId, riskLevel: { $in: ['critical', 'high'] }, createdAt: { $gte: startDate } } },
      {
        $bucket: {
          groupBy: '$vitals.age',
          boundaries: [0, 18, 30, 45, 60, 75, 100],
          default: 'Other',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        topRiskFactors: riskFactors,
        ageDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private (Admin)
 */
router.get('/export', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, type = 'assessments' } = req.query;
    const facilityId = req.user.facilityId;

    // Demo mode
    if (!isMongoConnected()) {
      const data = type === 'assessments' 
        ? demoStore.assessments.find({ facilityId })
        : demoStore.queue.find({ facilityId });
      
      return res.json({
        success: true,
        count: data.length,
        data
      });
    }

    const query = { facilityId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let data;
    if (type === 'assessments') {
      data = await Assessment.find(query)
        .populate('assessedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
    } else if (type === 'queue') {
      data = await QueueEntry.find(query)
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
