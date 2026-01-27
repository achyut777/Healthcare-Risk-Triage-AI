import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Heart,
    Pill,
    RefreshCw,
    Stethoscope,
    User,
    UserCheck,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Consultations() {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('my-patients');

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, assessmentsRes] = await Promise.all([
        api.get('/queue'),
        api.get('/assessments')
      ]);
      
      // Queue entries that are in consultation or waiting with vitals
      const queueData = queueRes.data.data || [];
      setQueue(queueData);
      
      // Assessment data
      const assessmentData = assessmentsRes.data.data || [];
      setAssessments(assessmentData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only doctors should access this
  if (user?.role !== 'doctor' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Stethoscope className="w-16 h-16 mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Doctor Access Only</h2>
          <p className="text-slate-600 mt-2">This page is only available for doctors.</p>
        </div>
      </div>
    );
  }

  // Get patients for consultation
  const myPatients = queue.filter(q => 
    q.status === 'in-consultation' && 
    (q.assignedDoctor === user?._id || !q.assignedDoctor)
  );
  
  const waitingPatients = queue.filter(q => 
    q.status === 'waiting' && q.vitalsRecorded
  ).sort((a, b) => b.urgencyScore - a.urgencyScore);

  const completedToday = queue.filter(q => q.status === 'completed');
  
  const criticalPatients = waitingPatients.filter(q => q.priority === 'critical');

  const currentList = filter === 'my-patients' ? myPatients : 
                      filter === 'waiting' ? waitingPatients : 
                      completedToday;

  const handleCallPatient = async (patient) => {
    try {
      await api.put(`/queue/${patient._id}/assign`, {
        doctorId: user._id,
        doctorName: user.name
      });
      toast.success(`Called ${patient.patientName}`);
      fetchData();
      setSelectedPatient(patient);
    } catch (error) {
      toast.error('Failed to call patient');
    }
  };

  const priorityConfig = {
    critical: { color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50', label: '🚨 Critical', border: 'border-red-300' },
    high: { color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50', label: '⚠️ High', border: 'border-orange-300' },
    medium: { color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50', label: '📋 Medium', border: 'border-yellow-300' },
    low: { color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50', label: '✅ Low', border: 'border-green-300' },
  };

  const stats = [
    { label: 'My Patients', value: myPatients.length, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: UserCheck, emoji: '👨‍⚕️' },
    { label: 'Waiting', value: waitingPatients.length, color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock, emoji: '⏳' },
    { label: 'Critical', value: criticalPatients.length, color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle, emoji: '🚨' },
    { label: 'Completed', value: completedToday.length, color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, emoji: '✅' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">🩺 My Consultations</h1>
          <p className="text-slate-600 mt-1">Review patients, diagnose, and prescribe treatments</p>
        </div>
        <button 
          onClick={fetchData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4 flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
            <span className="ml-auto text-2xl">{stat.emoji}</span>
          </motion.div>
        ))}
      </div>

      {/* Critical Alert Banner */}
      {criticalPatients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-bold">🚨 Critical Patients Waiting</p>
              <p className="text-sm opacity-90">
                {criticalPatients.map(p => p.patientName).join(', ')} need immediate attention
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFilter('waiting');
              setSelectedPatient(criticalPatients[0]);
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            View Now
          </button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Consultation List */}
        <div className="lg:col-span-1 card">
          <div className="p-4 border-b">
            <div className="flex gap-2">
              {[
                { key: 'my-patients', label: `Active (${myPatients.length})` },
                { key: 'waiting', label: `Queue (${waitingPatients.length})` },
                { key: 'completed', label: `Done (${completedToday.length})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : currentList.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No {filter === 'my-patients' ? 'active consultations' : filter === 'waiting' ? 'waiting patients' : 'completed consultations'}</p>
                {filter === 'my-patients' && waitingPatients.length > 0 && (
                  <button 
                    onClick={() => setFilter('waiting')}
                    className="mt-3 text-primary-600 text-sm font-medium hover:underline"
                  >
                    View {waitingPatients.length} waiting patients →
                  </button>
                )}
              </div>
            ) : (
              currentList.map((patient, index) => {
                const priority = priorityConfig[patient.priority] || priorityConfig.medium;
                return (
                  <motion.div
                    key={patient._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedPatient?._id === patient._id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${priority.bgLight} flex items-center justify-center`}>
                          <User className={`w-5 h-5 ${priority.textColor}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{patient.patientName}</h4>
                          <p className="text-xs text-slate-500">{patient.token} • {patient.age} yrs</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.bgLight} ${priority.textColor}`}>
                          {priority.label}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Score: {patient.urgencyScore}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{patient.symptoms}</p>
                    
                    {filter === 'waiting' && patient.status === 'waiting' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCallPatient(patient);
                        }}
                        className="mt-2 w-full py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Call Patient
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedPatient ? (
              <PatientConsultationCard 
                key={selectedPatient._id}
                patient={selectedPatient}
                assessment={assessments.find(a => a._id === selectedPatient.assessment)}
                onComplete={() => {
                  fetchData();
                  setSelectedPatient(null);
                }}
                onClose={() => setSelectedPatient(null)}
                onCall={handleCallPatient}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <Stethoscope className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-lg font-medium text-slate-600">Select a Patient</h3>
                <p className="text-slate-400 mt-2">Choose a patient from the list to start consultation</p>
                {waitingPatients.length > 0 && (
                  <p className="text-sm text-primary-600 mt-4">
                    {waitingPatients.length} patients waiting for consultation
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PatientConsultationCard({ patient, assessment, onComplete, onClose, onCall }) {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [loading, setLoading] = useState(false);

  const priorityConfig = {
    critical: { gradient: 'from-red-500 to-red-600' },
    high: { gradient: 'from-orange-500 to-orange-600' },
    medium: { gradient: 'from-yellow-500 to-amber-500' },
    low: { gradient: 'from-green-500 to-green-600' },
  };

  const priority = priorityConfig[patient.priority] || priorityConfig.medium;
  const isWaiting = patient.status === 'waiting';
  const isInConsultation = patient.status === 'in-consultation';
  const isCompleted = patient.status === 'completed';

  const handleComplete = async () => {
    if (!diagnosis) {
      toast.error('Please enter a diagnosis');
      return;
    }
    
    setLoading(true);
    try {
      // Complete the consultation
      await api.post(`/queue/complete/${patient.token}`, {
        notes,
        diagnosis,
        prescription,
        followUp
      });
      
      // Update the assessment if exists
      if (assessment) {
        await api.put(`/assessments/${assessment._id}`, {
          status: 'completed',
          notes,
          diagnosis,
          prescription,
          followUp,
          completedBy: user._id,
          completedByName: user.name
        });
      }
      
      toast.success('Consultation completed successfully');
      onComplete();
    } catch (error) {
      toast.error('Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  // Get vitals from assessment or patient
  const vitals = assessment?.vitals || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${priority.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.patientName}</h2>
              <p className="opacity-90">{patient.age} years • {patient.gender}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm opacity-75 font-mono">{patient.token}</span>
                {patient.isPediatric && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">👶 Pediatric</span>}
                {patient.isPregnant && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🤰 Pregnant</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
              isCompleted ? 'bg-green-100 text-green-800' :
              isInConsultation ? 'bg-blue-100 text-blue-800' :
              'bg-white/20'
            }`}>
              {isCompleted ? '✅ Completed' : isInConsultation ? '🩺 In Progress' : '⏳ Waiting'}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Call Button for waiting patients */}
        {isWaiting && (
          <button
            onClick={() => onCall(patient)}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5" />
            Call Patient for Consultation
          </button>
        )}

        {/* Risk & Vitals Overview */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Risk Assessment
            </h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">{patient.urgencyScore || assessment?.urgencyScore || '-'}</span>
              <span className="text-slate-500 mb-1">/100</span>
            </div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  patient.priority === 'critical' ? 'bg-red-500' :
                  patient.priority === 'high' ? 'bg-orange-500' :
                  patient.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                } transition-all`}
                style={{ width: `${patient.urgencyScore || assessment?.urgencyScore || 0}%` }}
              />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-pink-500" />
              Vitals Overview
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">BP:</span>
                <span className="ml-2 font-medium">{vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">HR:</span>
                <span className="ml-2 font-medium">{vitals.heartRate || 'N/A'} bpm</span>
              </div>
              <div>
                <span className="text-slate-500">Temp:</span>
                <span className="ml-2 font-medium">{vitals.temperature || 'N/A'}°C</span>
              </div>
              <div>
                <span className="text-slate-500">SpO2:</span>
                <span className="ml-2 font-medium">{vitals.oxygenSaturation || 'N/A'}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms & Complaint */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">🩺 Chief Complaint & Symptoms</h4>
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-slate-700">{patient.symptoms || assessment?.chiefComplaint || 'No symptoms recorded'}</p>
            {assessment?.symptoms && (
              <div className="flex flex-wrap gap-2 mt-3">
                {assessment.symptoms.map((symptom, index) => (
                  <span key={index} className="badge bg-blue-100 text-blue-700 text-xs">
                    {symptom}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        {assessment?.recommendations && (
          <div>
            <h4 className="font-medium text-slate-900 mb-2">🤖 AI Recommendations</h4>
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-xl">
              <ul className="space-y-2">
                {assessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-primary-800">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Doctor Input - Only for in-consultation */}
        {isInConsultation && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Doctor's Consultation Notes
            </h4>
            
            <div>
              <label className="label">Diagnosis <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input w-full"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter primary diagnosis..."
              />
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                Prescription
              </label>
              <textarea
                className="input w-full h-24"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Enter medications, dosage, duration..."
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Follow-up</label>
                <input
                  type="text"
                  className="input w-full"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g., 1 week, 2 weeks"
                />
              </div>
              <div>
                <label className="label">Additional Notes</label>
                <input
                  type="text"
                  className="input w-full"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Consultation
                </>
              )}
            </button>
          </div>
        )}

        {/* Completed Summary */}
        {isCompleted && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Consultation Completed</span>
            </div>
            {patient.diagnosis && (
              <div className="mt-2">
                <p className="text-sm text-slate-500">Diagnosis:</p>
                <p className="text-slate-700 font-medium">{patient.diagnosis}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
