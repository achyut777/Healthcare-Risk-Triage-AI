import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { billingAPI, patientAPI, queueAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Icons
const BillIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Service categories with predefined items
const serviceCategories = {
  consultation: [
    { name: 'General Consultation', amount: 500 },
    { name: 'Emergency Consultation', amount: 1000 },
    { name: 'Specialist Consultation', amount: 800 },
    { name: 'Antenatal Consultation', amount: 800 },
    { name: 'Follow-up Consultation', amount: 300 },
  ],
  lab: [
    { name: 'Complete Blood Count (CBC)', amount: 350 },
    { name: 'Blood Glucose Test', amount: 150 },
    { name: 'HbA1c Test', amount: 450 },
    { name: 'Lipid Profile', amount: 600 },
    { name: 'Thyroid Profile (T3, T4, TSH)', amount: 700 },
    { name: 'Liver Function Test', amount: 500 },
    { name: 'Kidney Function Test', amount: 450 },
    { name: 'Urine Routine', amount: 150 },
    { name: 'Cardiac Enzymes (Troponin)', amount: 1200 },
    { name: 'Pregnancy Test (Beta hCG)', amount: 400 },
  ],
  radiology: [
    { name: 'Chest X-Ray', amount: 400 },
    { name: 'Obstetric Ultrasound', amount: 1500 },
    { name: 'Abdominal Ultrasound', amount: 1200 },
    { name: 'ECG', amount: 300 },
    { name: 'Echo Cardiogram', amount: 2500 },
  ],
  procedure: [
    { name: 'Nebulization', amount: 200 },
    { name: 'Oxygen Support', amount: 500 },
    { name: 'IV Cannulation', amount: 150 },
    { name: 'Wound Dressing', amount: 250 },
    { name: 'Injection (IM/IV)', amount: 100 },
  ],
  pharmacy: [
    { name: 'Medications (Generic)', amount: 200 },
    { name: 'Medications (Branded)', amount: 500 },
    { name: 'IV Medications', amount: 800 },
    { name: 'Iron & Folic Acid', amount: 180 },
    { name: 'Antibiotics Course', amount: 350 },
  ],
};

const Billing = () => {
  const { user } = useAuthStore();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [completedPatients, setCompletedPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [receipt, setReceipt] = useState(null);
  
  // Form states
  const [newBill, setNewBill] = useState({
    patientId: '',
    patientName: '',
    queueToken: '',
    services: [],
    discount: 0,
  });
  
  const [payment, setPayment] = useState({
    method: 'cash',
    amount: '',
    cardLast4: '',
    upiId: '',
    transactionId: '',
  });
  
  const [emailData, setEmailData] = useState({
    email: '',
    includeReceipt: true,
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDataSilent();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [billsRes, statsRes, queueRes, patientsRes] = await Promise.all([
        billingAPI.getAll(),
        billingAPI.getStats(),
        queueAPI.getStatus(),
        patientAPI.getAll({ limit: 100 }),
      ]);
      
      const billsData = billsRes.data.data || billsRes.data.bills || [];
      setBills(billsData);
      setStats(statsRes.data.data || statsRes.data.stats);
      
      // Get all patients
      const patients = patientsRes.data.data || patientsRes.data.patients || [];
      setAllPatients(patients);
      
      // Get completed patients who might need billing
      const queueData = queueRes.data.data || queueRes.data;
      const completed = (queueData.completed || []).filter(
        (q) => !billsData.some((b) => b.queueToken === q.token)
      );
      setCompletedPatients(completed);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setMessage({ type: 'error', text: 'Failed to load billing data' });
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh without loading state
  const fetchDataSilent = async () => {
    try {
      setRefreshing(true);
      const [billsRes, statsRes, queueRes, patientsRes] = await Promise.all([
        billingAPI.getAll(),
        billingAPI.getStats(),
        queueAPI.getStatus(),
        patientAPI.getAll({ limit: 100 }),
      ]);
      
      const billsData = billsRes.data.data || billsRes.data.bills || [];
      setBills(billsData);
      setStats(statsRes.data.data || statsRes.data.stats);
      
      // Get all patients
      const patients = patientsRes.data.data || patientsRes.data.patients || [];
      setAllPatients(patients);
      
      const queueData = queueRes.data.data || queueRes.data;
      const completed = (queueData.completed || []).filter(
        (q) => !billsData.some((b) => b.queueToken === q.token)
      );
      setCompletedPatients(completed);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDataSilent();
  };

  const handleCreateBill = async () => {
    if (!newBill.patientId || newBill.services.length === 0) {
      setMessage({ type: 'error', text: 'Please select a patient and add services' });
      return;
    }
    
    try {
      const subtotal = newBill.services.reduce((sum, s) => sum + (s.amount * s.quantity), 0);
      const tax = Math.round((subtotal - newBill.discount) * 0.05);
      const totalAmount = subtotal - newBill.discount + tax;
      
      const billData = {
        patientId: newBill.patientId,
        patientName: newBill.patientName,
        queueToken: newBill.queueToken,
        services: newBill.services.map((s, i) => ({
          _id: `svc-new-${i}`,
          ...s,
        })),
        consultationFee: newBill.services.find(s => s.category === 'consultation')?.amount || 0,
        discount: newBill.discount,
        tax,
        totalAmount,
        balanceDue: totalAmount,
      };
      
      await billingAPI.create(billData);
      setMessage({ type: 'success', text: 'Bill created successfully!' });
      setShowCreateModal(false);
      setNewBill({ patientId: '', patientName: '', queueToken: '', services: [], discount: 0 });
      fetchData();
    } catch (error) {
      console.error('Error creating bill:', error);
      setMessage({ type: 'error', text: 'Failed to create bill' });
    }
  };

  const handleAddService = (service, category) => {
    const existingIndex = newBill.services.findIndex(
      (s) => s.name === service.name && s.category === category
    );
    
    if (existingIndex >= 0) {
      const updated = [...newBill.services];
      updated[existingIndex].quantity += 1;
      setNewBill({ ...newBill, services: updated });
    } else {
      setNewBill({
        ...newBill,
        services: [...newBill.services, { ...service, category, quantity: 1 }],
      });
    }
  };

  const handleRemoveService = (index) => {
    const updated = [...newBill.services];
    updated.splice(index, 1);
    setNewBill({ ...newBill, services: updated });
  };

  const handlePayment = async () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    
    if (payment.method === 'card' && !payment.cardLast4) {
      setMessage({ type: 'error', text: 'Please enter card last 4 digits' });
      return;
    }
    
    if (payment.method === 'upi' && !payment.upiId) {
      setMessage({ type: 'error', text: 'Please enter UPI ID' });
      return;
    }
    
    try {
      const paymentData = {
        method: payment.method,
        amount: parseFloat(payment.amount),
        ...(payment.method === 'card' && { cardLast4: payment.cardLast4 }),
        ...(payment.method === 'upi' && { upiId: payment.upiId }),
        transactionId: payment.transactionId || `${payment.method.toUpperCase()}${Date.now()}`,
      };
      
      await billingAPI.pay(selectedBill._id, paymentData);
      setMessage({ type: 'success', text: 'Payment processed successfully!' });
      setShowPaymentModal(false);
      setPayment({ method: 'cash', amount: '', cardLast4: '', upiId: '', transactionId: '' });
      setSelectedBill(null);
      fetchData();
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage({ type: 'error', text: 'Failed to process payment' });
    }
  };

  const handleViewReceipt = async (bill) => {
    try {
      const res = await billingAPI.getReceipt(bill._id);
      setReceipt(res.data.data || res.data.receipt);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      setMessage({ type: 'error', text: 'Failed to load receipt' });
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.email) {
      setMessage({ type: 'error', text: 'Please enter email address' });
      return;
    }
    
    try {
      await billingAPI.sendEmail(selectedBill._id, emailData);
      setMessage({ type: 'success', text: 'Email sent successfully!' });
      setShowEmailModal(false);
      setEmailData({ email: '', includeReceipt: true });
      setSelectedBill(null);
      fetchData();
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage({ type: 'error', text: 'Failed to send email' });
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receipt?.billNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 18px; margin: 0; }
            .header p { margin: 5px 0; font-size: 12px; }
            .info { margin: 10px 0; font-size: 12px; }
            .info div { display: flex; justify-content: space-between; margin: 3px 0; }
            .services { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0; }
            .service { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .payment { background: #f5f5f5; padding: 10px; margin: 10px 0; font-size: 12px; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${receipt?.facility?.name}</h1>
            <p>${receipt?.facility?.address}</p>
            <p>GSTIN: ${receipt?.facility?.gstin}</p>
            <p>Phone: ${receipt?.facility?.phone}</p>
          </div>
          <div class="info">
            <div><span>Receipt No:</span><span>${receipt?.receiptNo}</span></div>
            <div><span>Bill No:</span><span>${receipt?.billNo}</span></div>
            <div><span>Date:</span><span>${new Date(receipt?.paidAt).toLocaleString()}</span></div>
            <div><span>Patient:</span><span>${receipt?.patientName}</span></div>
            <div><span>Patient ID:</span><span>${receipt?.patientId}</span></div>
          </div>
          <div class="services">
            ${receipt?.services?.map(s => `
              <div class="service">
                <span>${s.name} x${s.quantity}</span>
                <span>₹${(s.amount * s.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="info">
            <div><span>Subtotal:</span><span>₹${receipt?.subtotal?.toLocaleString()}</span></div>
            ${receipt?.discount > 0 ? `<div><span>Discount:</span><span>-₹${receipt?.discount?.toLocaleString()}</span></div>` : ''}
            <div><span>Tax (5%):</span><span>₹${receipt?.tax?.toLocaleString()}</span></div>
            <div class="total"><span>Total:</span><span>₹${receipt?.totalAmount?.toLocaleString()}</span></div>
          </div>
          <div class="payment">
            <strong>Payment Details:</strong><br>
            ${receipt?.payments?.map(p => `
              ${p.method.toUpperCase()}: ₹${p.amount.toLocaleString()}
              ${p.cardLast4 ? ` (**** ${p.cardLast4})` : ''}
              ${p.upiId ? ` (${p.upiId})` : ''}
              <br>
            `).join('')}
          </div>
          <div class="footer">
            <p>Thank you for visiting!</p>
            <p>Get well soon!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredBills = bills.filter((bill) => {
    if (activeTab === 'all') return true;
    return bill.status === activeTab;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600">Manage patient bills, payments, and receipts</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition ${refreshing ? 'opacity-50' : ''}`}
          >
            <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon /> Create Bill
          </button>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage({ type: '', text: '' })}
              className="float-right font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BillIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <PaymentIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.todayRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
                <BillIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">₹{stats.pendingAmount?.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <ReceiptIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
        {['all', 'pending', 'partial', 'paid'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'all' ? 'All Bills' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {bills.filter((b) => b.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <motion.tr
                  key={bill._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{bill.billNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{bill.patientName}</p>
                      <p className="text-sm text-gray-500">{bill.patientId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-gray-900">₹{bill.totalAmount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600 font-medium">₹{bill.amountPaid?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleViewReceipt(bill)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="View Details"
                      >
                        <EyeIcon />
                      </button>
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setPayment({ ...payment, amount: bill.balanceDue });
                            setShowPaymentModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Process Payment"
                        >
                          <PaymentIcon />
                        </button>
                      )}
                      {bill.status === 'paid' && (
                        <button
                          onClick={() => handleViewReceipt(bill)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Receipt"
                        >
                          <ReceiptIcon />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowEmailModal(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Send Email"
                      >
                        <EmailIcon />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && (
          <div className="text-center py-12">
            <BillIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bills found</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new bill to get started.</p>
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Create New Bill</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Patient Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient from Queue (Recently Completed)
                  </label>
                  <select
                    value={newBill.patientId}
                    onChange={(e) => {
                      const patient = completedPatients.find((p) => p.patientId === e.target.value);
                      setNewBill({
                        ...newBill,
                        patientId: e.target.value,
                        patientName: patient?.patientName || '',
                        queueToken: patient?.token || '',
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3"
                  >
                    <option value="">Select from queue...</option>
                    {completedPatients.map((patient) => (
                      <option key={patient.patientId || patient._id} value={patient.patientId || patient._id}>
                        {patient.patientName} ({patient.patientId || patient._id}) - Token: {patient.token}
                      </option>
                    ))}
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Select from All Patients
                  </label>
                  <select
                    value={newBill.patientId}
                    onChange={(e) => {
                      const patient = allPatients.find((p) => p.patientId === e.target.value || p._id === e.target.value);
                      setNewBill({
                        ...newBill,
                        patientId: patient?.patientId || e.target.value,
                        patientName: patient?.name || patient?.patientName || '',
                        queueToken: '',
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  >
                    <option value="">Select a patient...</option>
                    {allPatients.map((patient) => (
                      <option key={patient.patientId || patient._id} value={patient.patientId || patient._id}>
                        {patient.name || patient.patientName} ({patient.patientId || patient._id}) - {patient.age}yrs, {patient.gender}
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    Or enter manually:
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <input
                      type="text"
                      placeholder="Patient ID"
                      value={newBill.patientId}
                      onChange={(e) => setNewBill({ ...newBill, patientId: e.target.value })}
                      className="border border-gray-300 rounded-lg px-4 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Patient Name"
                      value={newBill.patientName}
                      onChange={(e) => setNewBill({ ...newBill, patientName: e.target.value })}
                      className="border border-gray-300 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>

                {/* Service Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Services
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(serviceCategories).map(([category, services]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 capitalize mb-3">{category}</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {services.map((service) => (
                            <button
                              key={service.name}
                              onClick={() => handleAddService(service, category)}
                              className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 rounded-lg flex justify-between items-center"
                            >
                              <span className="truncate">{service.name}</span>
                              <span className="text-green-600 font-medium ml-2">₹{service.amount}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Services */}
                {newBill.services.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selected Services
                    </label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Service</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {newBill.services.map((service, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm">{service.name}</td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={service.quantity}
                                  onChange={(e) => {
                                    const updated = [...newBill.services];
                                    updated[index].quantity = parseInt(e.target.value) || 1;
                                    setNewBill({ ...newBill, services: updated });
                                  }}
                                  className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                                />
                              </td>
                              <td className="px-4 py-2 text-right text-sm">₹{service.amount}</td>
                              <td className="px-4 py-2 text-right font-medium">
                                ₹{(service.amount * service.quantity).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => handleRemoveService(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Subtotal</span>
                        <span>₹{newBill.services.reduce((sum, s) => sum + (s.amount * s.quantity), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2 items-center">
                        <span>Discount</span>
                        <input
                          type="number"
                          min="0"
                          value={newBill.discount}
                          onChange={(e) => setNewBill({ ...newBill, discount: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tax (5%)</span>
                        <span>₹{Math.round((newBill.services.reduce((sum, s) => sum + (s.amount * s.quantity), 0) - newBill.discount) * 0.05).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total</span>
                        <span className="text-blue-600">
                          ₹{(
                            newBill.services.reduce((sum, s) => sum + (s.amount * s.quantity), 0) -
                            newBill.discount +
                            Math.round((newBill.services.reduce((sum, s) => sum + (s.amount * s.quantity), 0) - newBill.discount) * 0.05)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBill}
                  disabled={!newBill.patientId || newBill.services.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Bill
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-6">
                {/* Bill Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Bill No:</span>
                    <span className="font-medium">{selectedBill.billNo}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-medium">{selectedBill.patientName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold">₹{selectedBill.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Already Paid:</span>
                    <span className="text-green-600">₹{selectedBill.amountPaid?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Balance Due:</span>
                    <span className="text-red-600">₹{selectedBill.balanceDue?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cash', 'card', 'upi'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPayment({ ...payment, method })}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                          payment.method === method
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {method.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Enter amount"
                  />
                </div>

                {/* Card Details */}
                {payment.method === 'card' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength="4"
                      value={payment.cardLast4}
                      onChange={(e) => setPayment({ ...payment, cardLast4: e.target.value.replace(/\D/g, '') })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="1234"
                    />
                  </div>
                )}

                {/* UPI Details */}
                {payment.method === 'upi' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                    <input
                      type="text"
                      value={payment.upiId}
                      onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="example@upi"
                    />
                  </div>
                )}

                {/* Transaction ID */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={payment.transactionId}
                    onChange={(e) => setPayment({ ...payment, transactionId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckIcon /> Process Payment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && receipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReceiptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-6">
                {/* Facility Header */}
                <div className="text-center border-b border-dashed pb-4 mb-4">
                  <h3 className="text-lg font-bold">{receipt.facility?.name}</h3>
                  <p className="text-sm text-gray-600">{receipt.facility?.address}</p>
                  <p className="text-sm text-gray-600">GSTIN: {receipt.facility?.gstin}</p>
                  <p className="text-sm text-gray-600">Phone: {receipt.facility?.phone}</p>
                </div>

                {/* Receipt Info */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Receipt No:</span>
                    <span className="font-medium ml-2">{receipt.receiptNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bill No:</span>
                    <span className="font-medium ml-2">{receipt.billNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium ml-2">{new Date(receipt.paidAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-medium ml-2">{receipt.patientId}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-bold text-lg ml-2">{receipt.patientName}</span>
                </div>

                {/* Services */}
                <div className="border-t border-b border-dashed py-4 mb-4">
                  <h4 className="font-medium mb-2">Services</h4>
                  {receipt.services?.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span>{service.name} x{service.quantity}</span>
                      <span>₹{(service.amount * service.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{receipt.subtotal?.toLocaleString()}</span>
                  </div>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{receipt.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (5%)</span>
                    <span>₹{receipt.tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>₹{receipt.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-green-50 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-green-800 mb-2">Payment Details</h4>
                  {receipt.payments?.map((p, index) => (
                    <div key={index} className="text-sm text-green-700">
                      {p.method.toUpperCase()}: ₹{p.amount.toLocaleString()}
                      {p.cardLast4 && ` (**** ${p.cardLast4})`}
                      {p.upiId && ` (${p.upiId})`}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-dashed">
                  <p>Thank you for visiting!</p>
                  <p>Get well soon! 💚</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <PrintIcon /> Print Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && selectedBill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Send Email Notification</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Send bill details and/or receipt to the patient via email.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Email
                  </label>
                  <input
                    type="email"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailData.includeReceipt}
                      onChange={(e) => setEmailData({ ...emailData, includeReceipt: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include receipt attachment (if paid)</span>
                  </label>
                </div>

                {/* Email Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview</h4>
                  <div className="text-sm bg-gray-50 rounded p-3">
                    <p><strong>To:</strong> {emailData.email || 'patient@example.com'}</p>
                    <p><strong>Subject:</strong> {selectedBill.status === 'paid' ? 'Payment Receipt' : 'Bill Details'} - {selectedBill.billNo}</p>
                    <hr className="my-2" />
                    <p>Dear {selectedBill.patientName},</p>
                    <p className="mt-2">
                      {selectedBill.status === 'paid'
                        ? `Your payment of ₹${selectedBill.totalAmount?.toLocaleString()} has been received.`
                        : `Your bill of ₹${selectedBill.totalAmount?.toLocaleString()} is pending. Balance due: ₹${selectedBill.balanceDue?.toLocaleString()}`}
                    </p>
                  </div>
                </div>

                {/* Previous Emails */}
                {selectedBill.emailHistory?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Email History</h4>
                    <div className="space-y-2">
                      {selectedBill.emailHistory.map((email, index) => (
                        <div key={index} className="text-sm bg-gray-50 rounded p-2 flex justify-between">
                          <span>{email.email}</span>
                          <span className="text-gray-500">
                            {new Date(email.sentAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <EmailIcon /> Send Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Billing;
