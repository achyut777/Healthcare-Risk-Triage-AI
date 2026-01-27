import { motion } from 'framer-motion';
import {
    Check,
    CheckCircle,
    Clock,
    FileText,
    MapPin,
    Phone,
    Plus,
    Search,
    Ticket,
    User,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Registration() {
  const { user } = useAuthStore();
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [todayStats, setTodayStats] = useState({
    registered: 0,
    inQueue: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, queueRes] = await Promise.all([
        api.get('/patients?limit=10'),
        api.get('/queue'),
      ]);
      
      setRecentPatients(patientsRes.data.data || []);
      
      const queueData = queueRes.data.data || [];
      setTodayStats({
        registered: patientsRes.data.total || 0,
        inQueue: queueData.filter(q => q.status === 'waiting').length,
        completed: queueData.filter(q => q.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Staff and admin can access
  if (!['staff', 'admin', 'nurse'].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Staff Access Only</h2>
          <p className="text-slate-600 mt-2">This page is for registration staff.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Registered Today', value: todayStats.registered, icon: FileText, color: 'bg-blue-500', emoji: '📋' },
    { label: 'In Queue', value: todayStats.inQueue, icon: Clock, color: 'bg-amber-500', emoji: '⏳' },
    { label: 'Completed', value: todayStats.completed, icon: CheckCircle, color: 'bg-green-500', emoji: '✅' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">📝 Patient Registration</h1>
          <p className="text-slate-600 mt-1">Register new patients and manage check-ins</p>
        </div>
        <button
          onClick={() => setShowNewPatientForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
              </div>
              <span className="text-3xl">{stat.emoji}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowNewPatientForm(true)}
          className="card p-6 text-left hover:border-primary-300 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
            <Plus className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-slate-900">New Registration</h3>
          <p className="text-sm text-slate-500 mt-1">Register a new patient</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-6 text-left hover:border-amber-300 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
            <Ticket className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Generate Token</h3>
          <p className="text-sm text-slate-500 mt-1">Create queue token</p>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-6 text-left hover:border-green-300 hover:shadow-lg transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
            <Search className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Find Patient</h3>
          <p className="text-sm text-slate-500 mt-1">Search existing records</p>
        </motion.button>
      </div>

      {/* Recent Registrations */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Registrations</h3>
          <span className="text-sm text-slate-500">{recentPatients.length} patients</span>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : recentPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No recent registrations</p>
            </div>
          ) : (
            recentPatients.map((patient, index) => (
              <motion.div
                key={patient._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                      {patient.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{patient.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>{patient.age} years • {patient.gender}</span>
                        {patient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-primary-600">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <NewPatientModal
          onClose={() => setShowNewPatientForm(false)}
          onSuccess={() => {
            fetchData();
            setShowNewPatientForm(false);
          }}
        />
      )}
    </div>
  );
}

function NewPatientModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    chiefComplaint: '',
    addToQueue: true,
    priority: 'normal',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.gender) {
      toast.error('Please fill required fields');
      return;
    }

    setLoading(true);
    try {
      // Create patient
      const patientRes = await api.post('/patients', {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        medicalHistory: formData.medicalHistory,
      });

      // Add to queue if requested
      if (formData.addToQueue) {
        const priorityMap = { normal: 'low', high: 'high', urgent: 'critical' };
        await api.post('/queue/add', {
          patient: patientRes.data.data._id,
          patientId: patientRes.data.data.patientId,
          patientName: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          symptoms: formData.chiefComplaint || 'General consultation',
          priority: priorityMap[formData.priority] || 'low',
          urgencyScore: formData.priority === 'urgent' ? 80 : formData.priority === 'high' ? 50 : 20,
        });
      }

      toast.success('Patient registered successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">New Patient Registration</h2>
              <p className="opacity-90 text-sm mt-1">Step {step} of 2</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Progress */}
          <div className="mt-4 flex gap-2">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" />
                Basic Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="150"
                    className="input w-full"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age in years"
                  />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    className="input w-full"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@email.com"
                  />
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select
                    className="input w-full"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="input w-full pl-10"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div>
                <label className="label">Emergency Contact</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    className="input w-full pl-10"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-500" />
                Medical Information
              </h3>

              <div>
                <label className="label">Known Allergies</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g., Penicillin, Peanuts (comma separated)"
                />
              </div>

              <div>
                <label className="label">Medical History</label>
                <textarea
                  className="input w-full h-24"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Any relevant medical history, conditions, or ongoing treatments..."
                />
              </div>

              <div>
                <label className="label">Chief Complaint / Reason for Visit</label>
                <textarea
                  className="input w-full h-20"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Describe the patient's main symptoms or reason for visit..."
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                <h4 className="font-medium text-slate-900">Queue Settings</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.addToQueue}
                    onChange={(e) => setFormData({ ...formData, addToQueue: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-slate-700">Add patient to queue immediately</span>
                </label>

                {formData.addToQueue && (
                  <div>
                    <label className="label">Priority</label>
                    <div className="flex gap-2">
                      {['normal', 'high', 'urgent'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium capitalize transition-colors ${
                            formData.priority === p
                              ? p === 'urgent' ? 'bg-red-500 text-white' :
                                p === 'high' ? 'bg-orange-500 text-white' :
                                'bg-primary-500 text-white'
                              : 'bg-white border hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1">
                Next
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Registering...' : 'Register Patient'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
