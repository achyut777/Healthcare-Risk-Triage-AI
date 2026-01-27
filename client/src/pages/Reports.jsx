import { motion } from 'framer-motion';
import {
    Calendar,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Printer,
    Search,
    User,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Reports() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/assessments?status=completed');
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only doctors and admin should access
  if (!['doctor', 'admin'].includes(user?.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Access Restricted</h2>
          <p className="text-slate-600 mt-2">Medical reports are only accessible to doctors.</p>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || report.riskLevel === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: FileText, color: 'bg-blue-500' },
    { label: 'This Week', value: reports.filter(r => {
      const date = new Date(r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length, icon: Calendar, color: 'bg-green-500' },
    { label: 'High Risk', value: reports.filter(r => ['critical', 'high'].includes(r.riskLevel)).length, icon: Clock, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">📋 Medical Reports</h1>
          <p className="text-slate-600 mt-1">View and manage completed consultation reports</p>
        </div>
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
            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              High
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Completed Reports</h3>
          <span className="text-sm text-slate-500">{filteredReports.length} reports</span>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading reports...</div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No reports found</p>
            </div>
          ) : (
            filteredReports.map((report, index) => {
              const priorityColors = {
                critical: 'bg-red-100 text-red-700',
                high: 'bg-orange-100 text-orange-700',
                medium: 'bg-yellow-100 text-yellow-700',
                low: 'bg-green-100 text-green-700',
              };
              return (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedReport(report)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                        {report.patientName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{report.patientName}</h4>
                        <p className="text-sm text-slate-500">
                          Age: {report.patientAge} • {report.patientGender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${priorityColors[report.riskLevel] || priorityColors.medium}`}>
                        {report.riskLevel?.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">Score: {report.riskScore}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  {report.diagnosis && (
                    <p className="mt-3 text-sm text-slate-600 ml-16">
                      <span className="font-medium">Diagnosis:</span> {report.diagnosis}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

function ReportDetailModal({ report, onClose }) {
  const priorityConfig = {
    critical: { gradient: 'from-red-500 to-red-600' },
    high: { gradient: 'from-orange-500 to-orange-600' },
    medium: { gradient: 'from-yellow-500 to-yellow-600' },
    low: { gradient: 'from-green-500 to-green-600' },
  };
  
  const priority = priorityConfig[report.riskLevel] || priorityConfig.medium;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${priority.gradient} p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{report.patientName}</h2>
                <p className="opacity-90">Age: {report.patientAge} • {report.patientGender}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Risk Score */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm text-slate-500">Risk Assessment</p>
              <p className="text-3xl font-bold text-slate-900">{report.riskScore}/100</p>
            </div>
            <span className={`badge text-lg px-4 py-2 ${
              report.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
              report.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
              report.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {report.riskLevel?.toUpperCase()} RISK
            </span>
          </div>

          {/* Symptoms */}
          {report.symptoms?.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-900 mb-3">🩺 Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {report.symptoms.map((symptom, index) => (
                  <span key={index} className="badge bg-blue-100 text-blue-700">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vitals */}
          {report.vitals && (
            <div>
              <h4 className="font-medium text-slate-900 mb-3">💓 Vitals</h4>
              <div className="grid grid-cols-2 gap-3">
                {report.vitals.bloodPressure && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Blood Pressure</p>
                    <p className="font-semibold text-slate-900">{report.vitals.bloodPressure} mmHg</p>
                  </div>
                )}
                {report.vitals.heartRate && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Heart Rate</p>
                    <p className="font-semibold text-slate-900">{report.vitals.heartRate} bpm</p>
                  </div>
                )}
                {report.vitals.temperature && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Temperature</p>
                    <p className="font-semibold text-slate-900">{report.vitals.temperature}°F</p>
                  </div>
                )}
                {report.vitals.oxygenSaturation && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">SpO2</p>
                    <p className="font-semibold text-slate-900">{report.vitals.oxygenSaturation}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {report.diagnosis && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">📋 Diagnosis</h4>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-xl">{report.diagnosis}</p>
            </div>
          )}

          {/* Prescription */}
          {report.prescription && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">💊 Prescription</h4>
              <p className="text-slate-700 bg-green-50 p-4 rounded-xl">{report.prescription}</p>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">🤖 AI Recommendations</h4>
              <ul className="space-y-2 bg-primary-50 p-4 rounded-xl">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-primary-800">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-primary-500" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
