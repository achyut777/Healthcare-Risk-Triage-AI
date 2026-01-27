import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    Check,
    ClipboardCheck,
    Droplet,
    Heart,
    RefreshCw,
    Ruler,
    Scale,
    Search,
    Stethoscope,
    Thermometer,
    User,
    Wind,
    X,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Vitals() {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, needs-vitals, vitals-done

  useEffect(() => {
    fetchQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get('/queue');
      // Get all queue entries (not just waiting)
      setQueue(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only nurses and doctors should access this
  if (!['nurse', 'doctor', 'admin'].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Access Restricted</h2>
          <p className="text-slate-600 mt-2">This page is for nursing staff only.</p>
        </div>
      </div>
    );
  }

  const filteredQueue = queue.filter(patient => {
    const matchesSearch = patient.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.token?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'needs-vitals') {
      return matchesSearch && !patient.vitalsRecorded && patient.status === 'waiting';
    } else if (filter === 'vitals-done') {
      return matchesSearch && patient.vitalsRecorded;
    }
    return matchesSearch;
  });

  const needsVitals = queue.filter(q => !q.vitalsRecorded && q.status === 'waiting').length;
  const vitalsDone = queue.filter(q => q.vitalsRecorded).length;
  const criticalCount = queue.filter(q => q.priority === 'critical' && q.status === 'waiting').length;

  const stats = [
    { label: 'Needs Vitals', value: needsVitals, icon: Activity, color: 'text-blue-600', bgColor: 'bg-blue-100', emoji: '📋' },
    { label: 'Vitals Done', value: vitalsDone, icon: Check, color: 'text-green-600', bgColor: 'bg-green-100', emoji: '✅' },
    { label: 'Critical', value: criticalCount, icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100', emoji: '🚨' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">💉 Vitals & Triage</h1>
          <p className="text-slate-600 mt-1">Record patient vital signs and perform triage assessments</p>
        </div>
        <button 
          onClick={fetchQueue}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
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

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Queue */}
        <div className="lg:col-span-1 card">
          <div className="p-4 border-b space-y-3">
            <h3 className="font-semibold text-slate-900">Patients Queue</h3>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 w-full text-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'needs-vitals', label: 'Needs Vitals' },
                { key: 'vitals-done', label: 'Done' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.key 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No patients found</p>
              </div>
            ) : (
              filteredQueue.map((patient, index) => {
                const priorityColors = {
                  critical: 'bg-red-100 text-red-700 border-red-300',
                  high: 'bg-orange-100 text-orange-700 border-orange-300',
                  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                  low: 'bg-green-100 text-green-700 border-green-300',
                };
                const bgColor = priorityColors[patient.priority] || priorityColors.medium;
                
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          patient.vitalsRecorded ? 'bg-green-100' : 'bg-slate-100'
                        }`}>
                          {patient.vitalsRecorded ? (
                            <ClipboardCheck className="w-5 h-5 text-green-600" />
                          ) : (
                            <User className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{patient.patientName}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono">{patient.token}</span>
                            <span>•</span>
                            <span>{patient.age} yrs</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bgColor}`}>
                          {patient.priority}
                        </span>
                        {patient.isPediatric && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">👶 Pediatric</span>
                        )}
                        {patient.isPregnant && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">🤰 Pregnant</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{patient.symptoms}</p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Vitals Entry Form */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <VitalsEntryForm
              patient={selectedPatient}
              onComplete={() => {
                fetchQueue();
                setSelectedPatient(null);
              }}
              onClose={() => setSelectedPatient(null)}
            />
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Stethoscope className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-600">Select a Patient</h3>
              <p className="text-slate-400 mt-2">Choose a patient from the queue to record vitals</p>
              <p className="text-sm text-slate-400 mt-4">
                <span className="font-medium text-green-600">{needsVitals}</span> patients waiting for vitals
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VitalsEntryForm({ patient, onComplete, onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: vitals, 2: assessment result
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    bloodGlucose: '',
    weight: '',
    height: '',
    painLevel: 5,
    chiefComplaint: patient.symptoms || '',
  });

  const vitalInputs = [
    {
      key: 'bloodPressure',
      label: 'Blood Pressure',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      unit: 'mmHg',
      dual: true,
      inputs: [
        { key: 'bloodPressureSystolic', placeholder: 'Systolic', min: 60, max: 220 },
        { key: 'bloodPressureDiastolic', placeholder: 'Diastolic', min: 40, max: 140 },
      ],
      normalRange: '90-120 / 60-80',
    },
    {
      key: 'heartRate',
      label: 'Heart Rate',
      icon: Activity,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      unit: 'bpm',
      placeholder: '60-100',
      min: 30,
      max: 220,
      normalRange: '60-100 bpm',
    },
    {
      key: 'temperature',
      label: 'Temperature',
      icon: Thermometer,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      unit: '°C',
      placeholder: '36.5-37.5',
      min: 34,
      max: 42,
      step: 0.1,
      normalRange: '36.5-37.5°C',
    },
    {
      key: 'respiratoryRate',
      label: 'Respiratory Rate',
      icon: Wind,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      unit: '/min',
      placeholder: '12-20',
      min: 8,
      max: 40,
      normalRange: '12-20/min',
    },
    {
      key: 'oxygenSaturation',
      label: 'Oxygen Saturation',
      icon: Droplet,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      unit: '%',
      placeholder: '95-100',
      min: 70,
      max: 100,
      normalRange: '95-100%',
    },
    {
      key: 'bloodGlucose',
      label: 'Blood Glucose',
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      unit: 'mg/dL',
      placeholder: '70-140',
      min: 30,
      max: 500,
      normalRange: '70-140 mg/dL',
    },
    {
      key: 'weight',
      label: 'Weight',
      icon: Scale,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      unit: 'kg',
      placeholder: 'Weight',
      min: 1,
      max: 300,
      step: 0.1,
    },
    {
      key: 'height',
      label: 'Height',
      icon: Ruler,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      unit: 'cm',
      placeholder: 'Height',
      min: 30,
      max: 250,
    },
  ];

  const handleSubmitVitals = async () => {
    // Validate required vitals
    if (!vitals.bloodPressureSystolic || !vitals.bloodPressureDiastolic || !vitals.heartRate) {
      toast.error('Please fill in blood pressure and heart rate');
      return;
    }
    
    setLoading(true);
    try {
      // Create assessment with vitals
      const assessmentPayload = {
        patientName: patient.patientName,
        patientId: patient.patientId,
        age: Number(patient.age),
        gender: patient.gender === 'male' ? 1 : 0,
        heartRate: Number(vitals.heartRate),
        bpSystolic: Number(vitals.bloodPressureSystolic),
        bpDiastolic: Number(vitals.bloodPressureDiastolic),
        temperature: Number(vitals.temperature) || 37.0,
        oxygenSaturation: Number(vitals.oxygenSaturation) || 98,
        respiratoryRate: Number(vitals.respiratoryRate) || 16,
        symptomDurationDays: 1,
        painLevel: Number(vitals.painLevel),
        chiefComplaint: vitals.chiefComplaint || patient.symptoms,
        weight: vitals.weight ? Number(vitals.weight) : null,
        height: vitals.height ? Number(vitals.height) : null,
        bloodGlucose: vitals.bloodGlucose ? Number(vitals.bloodGlucose) : null,
      };

      const response = await assessmentAPI.create(assessmentPayload);
      setAssessmentResult(response.data.data);
      
      // Update queue entry to mark vitals recorded
      await api.put(`/queue/${patient._id}/vitals`, {
        vitalsRecorded: true,
        assessment: response.data.data._id,
        urgencyScore: response.data.data.urgencyScore,
        priority: response.data.data.riskLevel?.toLowerCase() || 'medium',
      });

      setStep(2);
      toast.success('Vitals recorded & assessment complete!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatus = (key, value) => {
    if (!value) return null;
    const val = parseFloat(value);
    
    const ranges = {
      heartRate: { low: 60, high: 100 },
      temperature: { low: 36.5, high: 37.5 },
      oxygenSaturation: { low: 95, high: 100 },
      respiratoryRate: { low: 12, high: 20 },
    };
    
    if (!ranges[key]) return null;
    
    if (val < ranges[key].low) return 'low';
    if (val > ranges[key].high) return 'high';
    return 'normal';
  };

  const riskColors = {
    critical: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', gradient: 'from-red-500 to-red-600' },
    high: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', gradient: 'from-orange-500 to-orange-600' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50', gradient: 'from-yellow-500 to-yellow-600' },
    low: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', gradient: 'from-green-500 to-green-600' },
  };

  // Step 2: Assessment Result
  if (step === 2 && assessmentResult) {
    const riskLevel = assessmentResult.riskLevel?.toLowerCase() || 'medium';
    const colors = riskColors[riskLevel] || riskColors.medium;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Assessment Complete</h2>
              <p className="opacity-90">{patient.patientName} • {patient.token}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Risk Score */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl ${colors.light}`}>
              <AlertTriangle className={`w-8 h-8 ${colors.text}`} />
              <div className="text-left">
                <p className="text-sm text-slate-600">Risk Level</p>
                <p className={`text-2xl font-bold ${colors.text} uppercase`}>{riskLevel}</p>
              </div>
              <div className="text-left ml-4">
                <p className="text-sm text-slate-600">Urgency Score</p>
                <p className="text-2xl font-bold text-slate-900">{assessmentResult.urgencyScore}/100</p>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-medium text-slate-900 mb-3">AI Recommendations</h4>
            <ul className="space-y-2">
              {assessmentResult.recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Vitals Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-xs text-slate-500">BP</p>
              <p className="font-bold text-slate-900">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}</p>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg text-center">
              <p className="text-xs text-slate-500">HR</p>
              <p className="font-bold text-slate-900">{vitals.heartRate} bpm</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <p className="text-xs text-slate-500">Temp</p>
              <p className="font-bold text-slate-900">{vitals.temperature || '-'}°C</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xs text-slate-500">SpO2</p>
              <p className="font-bold text-slate-900">{vitals.oxygenSaturation || '-'}%</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onComplete} className="btn-primary flex-1">
              <Check className="w-4 h-4 mr-2" />
              Done - Next Patient
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Step 1: Vitals Entry
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.patientName}</h2>
              <p className="opacity-90">{patient.token} • {patient.age} years • {patient.gender}</p>
              <p className="text-sm opacity-75 mt-1">{patient.symptoms}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vitals Form */}
      <div className="p-6">
        {/* Chief Complaint */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Chief Complaint</label>
          <textarea
            value={vitals.chiefComplaint}
            onChange={(e) => setVitals({ ...vitals, chiefComplaint: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="Describe patient's main symptoms..."
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {vitalInputs.map((input) => (
            <div key={input.key} className={`p-4 ${input.bgColor} rounded-xl`}>
              <div className="flex items-center gap-2 mb-3">
                <input.icon className={`w-5 h-5 ${input.color}`} />
                <span className="font-medium text-slate-900">{input.label}</span>
                {(input.key === 'heartRate' || input.key === 'bloodPressure') && (
                  <span className="text-xs text-red-500">*</span>
                )}
              </div>
              
              {input.dual ? (
                <div className="flex gap-2">
                  {input.inputs.map((subInput) => (
                    <div key={subInput.key} className="flex-1">
                      <input
                        type="number"
                        placeholder={subInput.placeholder}
                        min={subInput.min}
                        max={subInput.max}
                        value={vitals[subInput.key]}
                        onChange={(e) => setVitals({ ...vitals, [subInput.key]: e.target.value })}
                        className="input w-full text-center"
                      />
                    </div>
                  ))}
                  <span className="self-center text-sm text-slate-500">{input.unit}</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder={input.placeholder}
                    min={input.min}
                    max={input.max}
                    step={input.step || 1}
                    value={vitals[input.key]}
                    onChange={(e) => setVitals({ ...vitals, [input.key]: e.target.value })}
                    className={`input flex-1 ${
                      getVitalStatus(input.key, vitals[input.key]) === 'low' ? 'border-blue-500 bg-blue-50' :
                      getVitalStatus(input.key, vitals[input.key]) === 'high' ? 'border-red-500 bg-red-50' :
                      getVitalStatus(input.key, vitals[input.key]) === 'normal' ? 'border-green-500 bg-green-50' : ''
                    }`}
                  />
                  <span className="text-sm text-slate-500 w-12">{input.unit}</span>
                </div>
              )}
              
              {input.normalRange && (
                <p className="text-xs text-slate-500 mt-2">Normal: {input.normalRange}</p>
              )}
            </div>
          ))}
        </div>

        {/* Pain Level */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-slate-900">Pain Level</span>
            <span className={`font-bold text-lg ${
              vitals.painLevel <= 3 ? 'text-green-600' :
              vitals.painLevel <= 6 ? 'text-yellow-600' : 'text-red-600'
            }`}>{vitals.painLevel}/10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={vitals.painLevel}
            onChange={(e) => setVitals({ ...vitals, painLevel: parseInt(e.target.value) })}
            className="w-full h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>No Pain</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmitVitals}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                Record & Assess
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
