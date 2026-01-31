import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { queueAPI } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Queue() {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    patientName: "",
    age: "",
    gender: "male",
    symptoms: "",
    contact: "",
    priority: "medium",
  });

  const fetchQueue = async () => {
    try {
      const response = await queueAPI.getStatus();
      setStatus(response.data.data);
      setQueue(response.data.data.queue || []);
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const addToQueue = async (e) => {
    e.preventDefault();
    try {
      await queueAPI.add(newPatient);
      toast.success("Patient added to queue");
      setShowAddModal(false);
      setNewPatient({
        patientName: "",
        age: "",
        gender: "male",
        symptoms: "",
        contact: "",
        priority: "medium",
      });
      fetchQueue();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add patient");
    }
  };

  const callPatient = async (token) => {
    try {
      await queueAPI.callPatient(token, { counter: 1 });
      toast.success(`Calling patient ${token}`);
      fetchQueue();
    } catch (error) {
      toast.error("Failed to call patient");
    }
  };

  const completePatient = async (token) => {
    try {
      await queueAPI.completePatient(token, {});
      toast.success("Patient marked as completed");
      fetchQueue();
    } catch (error) {
      toast.error("Failed to complete");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "badge-critical";
      case "high":
        return "badge-high";
      case "medium":
        return "badge-medium";
      default:
        return "badge-low";
    }
  };

  // Role-specific titles and capabilities
  const roleConfig = {
    admin: {
      title: "📋 Queue Management",
      subtitle: "Full queue control and oversight",
      canAdd: true,
      canCall: true,
      canComplete: true,
    },
    doctor: {
      title: "🩺 Patient Queue",
      subtitle: "View and call patients for consultation",
      canAdd: false,
      canCall: true,
      canComplete: true,
    },
    nurse: {
      title: "⏳ Triage Queue",
      subtitle: "Manage patient triage and vitals",
      canAdd: true,
      canCall: true,
      canComplete: false,
    },
    staff: {
      title: "📝 Queue Display",
      subtitle: "Register patients and manage queue",
      canAdd: true,
      canCall: true,
      canComplete: false,
    },
  };

  const config = roleConfig[user?.role] || roleConfig.staff;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {config.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {config.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchQueue}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {config.canAdd && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Patient
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {status?.totalWaiting || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Waiting
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {status?.servedToday || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Served Today
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {status?.averageWaitTime || 0}m
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Avg Wait
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {status?.priorityBreakdown?.critical || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Critical
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Now Serving */}
      {status?.nowServing?.length > 0 && (
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Now Serving</p>
              <p className="text-4xl font-display font-bold mt-1">
                {status.nowServing[0]}
              </p>
            </div>
            <Volume2 className="w-10 h-10 opacity-50" />
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Waiting Queue
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Token
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Wait Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {queue.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No patients in queue
                  </td>
                </tr>
              ) : (
                queue.map((patient, index) => (
                  <motion.tr
                    key={patient.token}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                        {patient.token}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {patient.patientName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Age: {patient.age}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getPriorityColor(patient.priority)}>
                        {patient.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {Math.round(
                        (Date.now() - new Date(patient.createdAt)) / 60000,
                      )}{" "}
                      min
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {config.canCall && (
                          <button
                            onClick={() => callPatient(patient.token)}
                            className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/70"
                            title="Call Patient"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                        {config.canComplete && (
                          <button
                            onClick={() => completePatient(patient.token)}
                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70"
                            title="Complete"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Add Patient to Queue
            </h2>
            <form onSubmit={addToQueue} className="space-y-4">
              <div>
                <label className="label">Patient Name *</label>
                <input
                  type="text"
                  value={newPatient.patientName}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      patientName: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    value={newPatient.priority}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, priority: e.target.value })
                    }
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Symptoms</label>
                <textarea
                  value={newPatient.symptoms}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, symptoms: e.target.value })
                  }
                  className="input h-20"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Add to Queue
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
