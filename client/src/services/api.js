import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('health-triage-auth')
      ? JSON.parse(localStorage.getItem('health-triage-auth'))?.state?.token
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('health-triage-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const assessmentAPI = {
  create: (data) => api.post('/assessments', data),
  getAll: (params) => api.get('/assessments', { params }),
  getById: (id) => api.get(`/assessments/${id}`),
  validate: (id, data) => api.put(`/assessments/${id}/validate`, data),
};

export const queueAPI = {
  add: (data) => api.post('/queue/add', data),
  getStatus: () => api.get('/queue/status'),
  checkToken: (token) => api.get(`/queue/check/${token}`),
  callPatient: (token, data) => api.post(`/queue/call/${token}`, data),
  servePatient: (token) => api.post(`/queue/serve/${token}`),
  completePatient: (token, data) => api.post(`/queue/complete/${token}`, data),
  updatePriority: (token, data) => api.put(`/queue/priority/${token}`, data),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getRiskFactors: (params) => api.get('/analytics/risk-factors', { params }),
  exportData: (params) => api.get('/analytics/export', { params }),
};

export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/message', data),
  getHistory: (sessionId) => api.get(`/chatbot/history/${sessionId}`),
  clearHistory: (sessionId) => api.delete(`/chatbot/history/${sessionId}`),
};

export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
  deactivate: (id) => api.put(`/staff/${id}/deactivate`),
  activate: (id) => api.put(`/staff/${id}/activate`),
  getStats: () => api.get('/staff/stats/overview'),
};

export const billingAPI = {
  // Get all bills
  getAll: (params) => api.get('/billing', { params }),
  // Get single bill by ID
  getById: (id) => api.get(`/billing/${id}`),
  // Create new bill
  create: (data) => api.post('/billing/create', data),
  // Add service to existing bill
  addService: (id, data) => api.put(`/billing/${id}/add-service`, data),
  // Process payment
  pay: (id, data) => api.post(`/billing/${id}/pay`, data),
  // Get receipt
  getReceipt: (id) => api.get(`/billing/${id}/receipt`),
  // Send email notification
  sendEmail: (id, data) => api.post(`/billing/${id}/send-email`, data),
  // Get patient bills
  getPatientBills: (patientId) => api.get(`/billing/patient/${patientId}`),
  // Get billing stats
  getStats: () => api.get('/billing/stats/overview'),
};

export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  search: (query) => api.get('/patients/search', { params: { q: query } }),
};
