import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Baby,
  CheckCircle,
  ClipboardList,
  Copy,
  Heart,
  Loader2,
  ShieldAlert,
  Thermometer,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { assessmentAPI, queueAPI } from "../services/api";
import { useAuthStore } from "../stores/authStore";

const initialVitals = {
  patientName: "",
  patientId: "",
  age: "",
  gender: 1,
  heartRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  temperature: "",
  oxygenSaturation: "",
  respiratoryRate: "",
  symptomDurationDays: "",
  painLevel: 5,
  chiefComplaint: "",
};

export default function Assessment() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [vitals, setVitals] = useState(initialVitals);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueToken, setQueueToken] = useState(null);
  const [addingToQueue, setAddingToQueue] = useState(false);

  // Role-specific configuration
  const roleConfig = {
    admin: {
      title: "📊 Risk Assessment System",
      subtitle: "Full administrative access to all assessments",
    },
    doctor: {
      title: "🩺 Patient Assessment",
      subtitle: "Evaluate patients and review AI recommendations",
    },
    nurse: {
      title: "💉 Triage Assessment",
      subtitle: "Initial patient triage and vital signs entry",
    },
    staff: {
      title: "📝 Quick Assessment",
      subtitle: "Basic patient intake assessment",
    },
  };
  const config = roleConfig[user?.role] || roleConfig.staff;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!vitals.patientName || !vitals.age) {
        toast.error("Please fill in patient name and age");
        return false;
      }
    } else if (step === 2) {
      if (!vitals.heartRate || !vitals.bpSystolic || !vitals.bpDiastolic) {
        toast.error("Please fill in all vital signs");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...vitals,
        age: Number(vitals.age),
        gender: Number(vitals.gender),
        heartRate: Number(vitals.heartRate),
        bpSystolic: Number(vitals.bpSystolic),
        bpDiastolic: Number(vitals.bpDiastolic),
        temperature: Number(vitals.temperature) || 37.0,
        oxygenSaturation: Number(vitals.oxygenSaturation) || 98,
        respiratoryRate: Number(vitals.respiratoryRate) || 16,
        symptomDurationDays: Number(vitals.symptomDurationDays) || 1,
        painLevel: Number(vitals.painLevel),
      };

      const response = await assessmentAPI.create(payload);
      setResult(response.data.data);
      setStep(4);
      toast.success("Assessment completed!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Assessment failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVitals(initialVitals);
    setResult(null);
    setQueueToken(null);
    setStep(1);
  };

  const addToQueue = async () => {
    if (!result) return;

    setAddingToQueue(true);
    try {
      // Map risk level to priority
      const priorityMap = {
        CRITICAL: "critical",
        HIGH: "high",
        MEDIUM: "medium",
        LOW: "low",
      };

      const queueData = {
        patientName: vitals.patientName,
        age: Number(vitals.age),
        gender: vitals.gender === 1 ? "male" : "female",
        symptoms: vitals.chiefComplaint || "General consultation",
        contact: vitals.contact || "",
        priority: priorityMap[result.riskLevel] || "medium",
        urgencyScore: result.urgencyScore,
      };

      const response = await queueAPI.add(queueData);
      if (response.data.success) {
        setQueueToken(response.data.data.token);
        toast.success(`Added to queue! Token: ${response.data.data.token}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add to queue");
    } finally {
      setAddingToQueue(false);
    }
  };

  const copyToken = () => {
    if (queueToken) {
      navigator.clipboard.writeText(queueToken);
      toast.success("Token copied to clipboard!");
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      default:
        return "green";
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {config.title}
        </h1>
        <p className="text-slate-600 mt-1">{config.subtitle}</p>
      </div>

      {/* Progress Steps */}
      {step < 4 && (
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: "Patient Info" },
            { num: 2, label: "Vital Signs" },
            { num: 3, label: "Symptoms" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  step >= s.num
                    ? "bg-primary-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`ml-2 text-sm font-medium hidden sm:inline ${
                  step >= s.num ? "text-primary-600" : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`w-12 sm:w-24 h-1 mx-2 rounded-full ${
                    step > s.num ? "bg-primary-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <AnimatePresence mode="wait">
          {/* Step 1: Patient Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-body space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Patient Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Patient Name *</label>
                  <input
                    type="text"
                    name="patientName"
                    value={vitals.patientName}
                    onChange={handleChange}
                    className="input"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="label">Patient ID</label>
                  <input
                    type="text"
                    name="patientId"
                    value={vitals.patientId}
                    onChange={handleChange}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={vitals.age}
                    onChange={handleChange}
                    className="input"
                    placeholder="Years"
                    min="0"
                    max="120"
                  />
                </div>
                <div>
                  <label className="label">Gender *</label>
                  <select
                    name="gender"
                    value={vitals.gender}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value={1}>Male</option>
                    <option value={0}>Female</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Vital Signs */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-body space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-100">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Vital Signs</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Heart Rate (bpm) *</label>
                  <input
                    type="number"
                    name="heartRate"
                    value={vitals.heartRate}
                    onChange={handleChange}
                    className="input"
                    placeholder="60-100 normal"
                    min="20"
                    max="250"
                  />
                </div>
                <div>
                  <label className="label">Blood Pressure (mmHg) *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="bpSystolic"
                      value={vitals.bpSystolic}
                      onChange={handleChange}
                      className="input"
                      placeholder="Systolic"
                      min="60"
                      max="250"
                    />
                    <span className="flex items-center text-slate-400">/</span>
                    <input
                      type="number"
                      name="bpDiastolic"
                      value={vitals.bpDiastolic}
                      onChange={handleChange}
                      className="input"
                      placeholder="Diastolic"
                      min="40"
                      max="150"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Temperature (°C)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={vitals.temperature}
                    onChange={handleChange}
                    className="input"
                    placeholder="36.1-37.2 normal"
                    step="0.1"
                    min="30"
                    max="45"
                  />
                </div>
                <div>
                  <label className="label">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    name="oxygenSaturation"
                    value={vitals.oxygenSaturation}
                    onChange={handleChange}
                    className="input"
                    placeholder="95-100 normal"
                    min="50"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">Respiratory Rate (/min)</label>
                  <input
                    type="number"
                    name="respiratoryRate"
                    value={vitals.respiratoryRate}
                    onChange={handleChange}
                    className="input"
                    placeholder="12-20 normal"
                    min="5"
                    max="60"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Symptoms */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-body space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold">Symptoms & Complaints</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Chief Complaint</label>
                  <textarea
                    name="chiefComplaint"
                    value={vitals.chiefComplaint}
                    onChange={handleChange}
                    className="input h-24 resize-none"
                    placeholder="Describe the main symptoms..."
                  />
                </div>
                <div>
                  <label className="label">Symptom Duration (days)</label>
                  <input
                    type="number"
                    name="symptomDurationDays"
                    value={vitals.symptomDurationDays}
                    onChange={handleChange}
                    className="input"
                    placeholder="How many days?"
                    min="0"
                    max="365"
                  />
                </div>
                <div>
                  <label className="label">
                    Pain Level: {vitals.painLevel}/10
                  </label>
                  <input
                    type="range"
                    name="painLevel"
                    value={vitals.painLevel}
                    onChange={handleChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    min="0"
                    max="10"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>No pain</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 4 && result && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-body"
            >
              {/* Risk Level Header */}
              <div
                className={`p-6 -mx-6 -mt-6 mb-6 bg-${getRiskColor(result.riskLevel)}-50 border-b border-${getRiskColor(result.riskLevel)}-100`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Risk Assessment Result
                    </p>
                    <h2
                      className={`text-3xl font-display font-bold text-${getRiskColor(result.riskLevel)}-700 uppercase`}
                    >
                      {result.riskLevel} Risk
                    </h2>
                    {result.pediatricAdjusted && (
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        <Baby className="w-3 h-3" /> Pediatric Assessment
                      </span>
                    )}
                  </div>
                  <div
                    className={`w-20 h-20 rounded-full bg-${getRiskColor(result.riskLevel)}-100 flex items-center justify-center`}
                  >
                    <span
                      className={`text-2xl font-bold text-${getRiskColor(result.riskLevel)}-700`}
                    >
                      {result.urgencyScore}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Confidence: {result.confidence}%
                </p>
              </div>

              {/* Critical Alerts Section */}
              {result.criticalAlerts?.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase">
                      Critical Alerts
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {result.criticalAlerts.map((alert, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 font-medium"
                      >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Scores Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {/* NEWS2 Score */}
                {result.news2Score !== undefined && (
                  <div
                    className={`p-4 rounded-lg border ${
                      result.news2Score >= 7
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : result.news2Score >= 5
                          ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                          : result.news2Score >= 3
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                            : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Thermometer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                        NEWS2 Score
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        result.news2Score >= 7
                          ? "text-red-700"
                          : result.news2Score >= 5
                            ? "text-orange-700"
                            : result.news2Score >= 3
                              ? "text-yellow-700"
                              : "text-green-700"
                      }`}
                    >
                      {result.news2Score}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {result.news2Score >= 7
                        ? "High Clinical Risk"
                        : result.news2Score >= 5
                          ? "Medium Clinical Risk"
                          : result.news2Score >= 3
                            ? "Low-Medium Risk"
                            : "Low Clinical Risk"}
                    </p>
                  </div>
                )}

                {/* qSOFA Score */}
                {result.qsofaScore !== undefined && (
                  <div
                    className={`p-4 rounded-lg border ${
                      result.qsofaPositive
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                        qSOFA Score
                      </span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${
                        result.qsofaPositive ? "text-red-700" : "text-green-700"
                      }`}
                    >
                      {result.qsofaScore}/3
                    </div>
                    <p className="text-xs mt-1">
                      {result.qsofaPositive ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ⚠️ Sepsis Screening Positive
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          Sepsis Screening Negative
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Contributing Factors */}
              {result.contributingFactors?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Contributing Factors
                  </h3>
                  <div className="space-y-2">
                    {result.contributingFactors.map((factor, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Disclaimer:</strong> This is a preliminary risk
                  assessment for patient prioritization only. It is NOT a
                  medical diagnosis. Always consult with a qualified healthcare
                  professional.
                </p>
              </div>

              {/* Queue Token Display */}
              {queueToken && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center"
                >
                  <p className="text-sm text-green-700 font-medium mb-2">
                    Patient added to queue!
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold text-green-800">
                      {queueToken}
                    </span>
                    <button
                      onClick={copyToken}
                      className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      title="Copy token"
                    >
                      <Copy className="w-5 h-5 text-green-600" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Share this token with the patient to check their queue
                    status
                  </p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {!queueToken && (
                  <button
                    onClick={addToQueue}
                    disabled={addingToQueue}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {addingToQueue ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add to Queue
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className={`${queueToken ? "btn-primary flex-1" : "btn-secondary"} flex items-center justify-center gap-2`}
                >
                  New Assessment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="btn-primary flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Get Assessment
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
