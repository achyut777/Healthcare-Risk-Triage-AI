/**
 * Billing & Payment Routes
 * Handles payments, receipts, and email notifications
 */
import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware.js';
import demoStore from '../services/demoData.service.js';

const router = express.Router();

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * @route   GET /api/billing
 * @desc    Get all billing records
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;
    const { status, patientId, startDate, endDate } = req.query;

    if (!isMongoConnected()) {
      let bills = demoStore.billing.find({ facilityId });
      
      if (status) bills = bills.filter(b => b.status === status);
      if (patientId) bills = bills.filter(b => b.patientId === patientId);
      
      return res.json({
        success: true,
        data: bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/billing/:id
 * @desc    Get single billing record
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const bill = demoStore.billing.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, error: 'Bill not found' });
      }
      return res.json({ success: true, data: bill });
    }

    res.status(404).json({ success: false, error: 'Bill not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/billing/create
 * @desc    Create new bill for patient
 * @access  Private
 */
router.post('/create', protect, async (req, res) => {
  try {
    const { 
      patientId, 
      patientName, 
      queueToken,
      services, 
      consultationFee,
      discount,
      notes 
    } = req.body;

    if (!isMongoConnected()) {
      const bill = demoStore.billing.create({
        patientId,
        patientName,
        queueToken,
        services: services || [],
        consultationFee: consultationFee || 500,
        discount: discount || 0,
        notes,
        facilityId: req.user.facilityId,
        createdBy: req.user._id,
        createdByName: req.user.name
      });

      return res.status(201).json({
        success: true,
        data: bill,
        message: 'Bill created successfully'
      });
    }

    res.status(500).json({ success: false, error: 'Database not available' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/billing/:id/add-service
 * @desc    Add service to bill
 * @access  Private
 */
router.put('/:id/add-service', protect, async (req, res) => {
  try {
    const { name, amount, quantity, category } = req.body;

    if (!isMongoConnected()) {
      const bill = demoStore.billing.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, error: 'Bill not found' });
      }

      const service = {
        _id: `service-${Date.now()}`,
        name,
        amount: parseFloat(amount),
        quantity: quantity || 1,
        category: category || 'general',
        addedAt: new Date()
      };

      bill.services.push(service);
      bill.totalAmount = calculateTotal(bill);
      bill.updatedAt = new Date();

      return res.json({
        success: true,
        data: bill,
        message: 'Service added successfully'
      });
    }

    res.status(500).json({ success: false, error: 'Database not available' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/billing/:id/pay
 * @desc    Process payment for bill
 * @access  Private
 */
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const { 
      paymentMethod, 
      method,
      amountPaid,
      amount, 
      transactionId,
      cardLast4,
      upiId 
    } = req.body;

    // Support both property names
    const finalMethod = paymentMethod || method;
    const finalAmount = amountPaid || amount;

    if (!isMongoConnected()) {
      const bill = demoStore.billing.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, error: 'Bill not found' });
      }

      const payment = {
        _id: `payment-${Date.now()}`,
        method: finalMethod,
        amount: parseFloat(finalAmount),
        transactionId: transactionId || `TXN${Date.now()}`,
        cardLast4,
        upiId,
        paidAt: new Date(),
        processedBy: req.user._id,
        processedByName: req.user.name
      };

      bill.payments = bill.payments || [];
      bill.payments.push(payment);
      
      const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
      bill.amountPaid = totalPaid;
      bill.balanceDue = bill.totalAmount - totalPaid;
      
      if (bill.balanceDue <= 0) {
        bill.status = 'paid';
        bill.paidAt = new Date();
      } else if (totalPaid > 0) {
        bill.status = 'partial';
      }

      bill.updatedAt = new Date();

      // Generate receipt
      const receipt = generateReceipt(bill, payment);

      return res.json({
        success: true,
        data: { bill, receipt },
        message: bill.status === 'paid' ? 'Payment completed successfully' : 'Partial payment recorded'
      });
    }

    res.status(500).json({ success: false, error: 'Database not available' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/billing/:id/receipt
 * @desc    Get receipt for bill
 * @access  Private/Public (with token)
 */
router.get('/:id/receipt', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const bill = demoStore.billing.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, error: 'Bill not found' });
      }

      const receipt = {
        receiptNo: bill.receiptNo || `RCP-${bill._id.slice(-6).toUpperCase()}`,
        billNo: bill.billNo,
        date: bill.paidAt || bill.createdAt,
        patient: {
          id: bill.patientId,
          name: bill.patientName,
          token: bill.queueToken
        },
        facility: {
          name: 'Primary Health Centre - Sector 12',
          address: 'Sector 12, New Delhi - 110001',
          phone: '+91 11 2345 6789',
          email: 'phc12@healthtriage.ai',
          gstin: '07AAAAA0000A1Z5'
        },
        services: bill.services,
        summary: {
          subtotal: bill.services.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0),
          consultationFee: bill.consultationFee,
          discount: bill.discount,
          tax: bill.tax || 0,
          totalAmount: bill.totalAmount,
          amountPaid: bill.amountPaid,
          balanceDue: bill.balanceDue
        },
        payments: bill.payments || [],
        status: bill.status,
        createdBy: bill.createdByName,
        notes: bill.notes
      };

      return res.json({ success: true, data: receipt });
    }

    res.status(404).json({ success: false, error: 'Receipt not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/billing/:id/send-email
 * @desc    Send receipt via email
 * @access  Private
 */
router.post('/:id/send-email', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!isMongoConnected()) {
      const bill = demoStore.billing.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, error: 'Bill not found' });
      }

      // Create email notification record
      const notification = demoStore.notifications.create({
        type: 'receipt',
        recipientEmail: email,
        recipientName: bill.patientName,
        subject: `Payment Receipt - ${bill.billNo}`,
        content: generateEmailContent(bill),
        billId: bill._id,
        status: 'sent', // In demo mode, we simulate successful send
        sentAt: new Date(),
        facilityId: bill.facilityId
      });

      // Add to bill's email history
      bill.emailHistory = bill.emailHistory || [];
      bill.emailHistory.push({
        email,
        sentAt: new Date(),
        status: 'sent',
        notificationId: notification._id
      });

      return res.json({
        success: true,
        data: notification,
        message: `Receipt sent to ${email} successfully`
      });
    }

    res.status(500).json({ success: false, error: 'Database not available' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/billing/patient/:patientId
 * @desc    Get all bills for a patient
 * @access  Private
 */
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const bills = demoStore.billing.find({ patientId: req.params.patientId });
      return res.json({ success: true, data: bills });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/billing/stats
 * @desc    Get billing statistics
 * @access  Private (Admin/Staff)
 */
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    if (!isMongoConnected()) {
      const bills = demoStore.billing.find({ facilityId });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayBills = bills.filter(b => new Date(b.createdAt) >= today);
      
      const stats = {
        totalBills: bills.length,
        todayBills: todayBills.length,
        totalRevenue: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
        todayRevenue: todayBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
        pendingAmount: bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.balanceDue, 0),
        paymentMethods: {
          cash: bills.flatMap(b => b.payments || []).filter(p => p.method === 'cash').length,
          card: bills.flatMap(b => b.payments || []).filter(p => p.method === 'card').length,
          upi: bills.flatMap(b => b.payments || []).filter(p => p.method === 'upi').length
        },
        statusBreakdown: {
          pending: bills.filter(b => b.status === 'pending').length,
          partial: bills.filter(b => b.status === 'partial').length,
          paid: bills.filter(b => b.status === 'paid').length,
          cancelled: bills.filter(b => b.status === 'cancelled').length
        }
      };

      return res.json({ success: true, data: stats });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function calculateTotal(bill) {
  const servicesTotal = bill.services.reduce((sum, s) => sum + (s.amount * (s.quantity || 1)), 0);
  const subtotal = servicesTotal + (bill.consultationFee || 0);
  const afterDiscount = subtotal - (bill.discount || 0);
  const tax = afterDiscount * 0.05; // 5% GST
  return Math.round(afterDiscount + tax);
}

function generateReceipt(bill, payment) {
  return {
    receiptNo: `RCP-${Date.now().toString().slice(-8)}`,
    billNo: bill.billNo,
    patientName: bill.patientName,
    patientId: bill.patientId,
    paymentMethod: payment.method,
    amountPaid: payment.amount,
    transactionId: payment.transactionId,
    paidAt: payment.paidAt,
    totalAmount: bill.totalAmount,
    balanceDue: bill.balanceDue,
    status: bill.status
  };
}

function generateEmailContent(bill) {
  return `
Dear ${bill.patientName},

Thank you for visiting Primary Health Centre - Sector 12.

Your payment receipt details:

Bill No: ${bill.billNo}
Date: ${new Date(bill.paidAt || bill.createdAt).toLocaleDateString('en-IN')}
Amount: ₹${bill.totalAmount.toLocaleString('en-IN')}
Status: ${bill.status.toUpperCase()}

Services:
${bill.services.map(s => `- ${s.name}: ₹${s.amount}`).join('\n')}

${bill.status === 'paid' ? 'Payment received successfully. Thank you!' : `Balance Due: ₹${bill.balanceDue}`}

For any queries, please contact us at:
Phone: +91 11 2345 6789
Email: phc12@healthtriage.ai

Stay healthy!

Best regards,
Primary Health Centre - Sector 12
  `.trim();
}

export default router;
