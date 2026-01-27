/**
 * HealthTriage AI - Express.js Server
 * ====================================
 * Main entry point for the backend API
 * 
 * DISCLAIMER: This is a Clinical Decision Support System (CDSS)
 * for patient PRIORITIZATION only. It does NOT diagnose diseases.
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

// Route imports
import analyticsRoutes from './routes/analytics.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import authRoutes from './routes/auth.routes.js';
import billingRoutes from './routes/billing.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import patientRoutes from './routes/patient.routes.js';
import queueRoutes from './routes/queue.routes.js';
import staffRoutes from './routes/staff.routes.js';

// Middleware imports
import { auditMiddleware, getAuditLogs } from './middleware/audit.middleware.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================
// Security Middleware
// ============================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ============================
// Body Parsing & Logging
// ============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================
// Audit Logging (HIPAA Compliance)
// ============================
app.use(auditMiddleware);

// ============================
// API Routes
// ============================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/billing', billingRoutes);

// ============================
// Audit Logs (Admin Only)
// ============================
app.get('/api/audit-logs', (req, res) => {
  // In production, add authentication check here
  const filters = {
    userId: req.query.userId,
    action: req.query.action,
    resource: req.query.resource,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
  };
  
  const result = getAuditLogs(filters);
  res.json({
    success: true,
    data: result,
  });
});

// ============================
// Health Check & Root
// ============================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    disclaimer: 'Clinical Decision Support System - For prioritization only'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'HealthTriage AI API',
    version: '2.0.0',
    type: 'Clinical Decision Support System (CDSS)',
    disclaimer: `
      ⚠️ IMPORTANT: This system is for patient PRIORITIZATION only.
      It does NOT diagnose diseases or replace medical professionals.
      All outputs must be validated by licensed healthcare providers.
    `,
    endpoints: {
      auth: '/api/auth',
      patients: '/api/patients',
      assessments: '/api/assessments',
      queue: '/api/queue',
      analytics: '/api/analytics',
      chatbot: '/api/chatbot',
      staff: '/api/staff'
    }
  });
});

// ============================
// Error Handling
// ============================
app.use(notFound);
app.use(errorHandler);

// ============================
// Database Connection & Server Start
// ============================
const startServer = async () => {
  try {
    // Try to connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthtriage';
    
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ Connected to MongoDB');
    } catch (mongoError) {
      console.log('⚠️  MongoDB not available - running in demo mode');
      console.log('   Some features may be limited without database');
    }

    // Start server regardless of MongoDB status
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏥 HealthTriage AI Server                                   ║
║   Clinical Decision Support System                            ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   API Endpoint: http://localhost:${PORT}/api                    ║
║                                                               ║
║   ⚠️  For patient PRIORITIZATION only - NOT diagnosis         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
