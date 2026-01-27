import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    RefreshCw,
    Stethoscope,
    TrendingDown,
    TrendingUp,
    User,
    UserCheck,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI, queueAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { t } = useSettingsStore();
  const [stats, setStats] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashboardRes, queueRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: null } })),
        queueAPI.getStatus().catch(() => ({ data: { data: null } }))
      ]);
      setStats(dashboardRes.data.data);
      setQueueStatus(queueRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const userRole = user?.role || 'staff';

  // Role-specific greetings
  const greetings = {
    admin: { title: 'Admin Dashboard', subtitle: 'System overview and management', emoji: '🛡️' },
    doctor: { title: 'Doctor Dashboard', subtitle: 'Your patients and consultations', emoji: '🩺' },
    nurse: { title: 'Nurse Station', subtitle: 'Triage and patient vitals', emoji: '💉' },
    staff: { title: 'Reception Desk', subtitle: 'Queue and patient registration', emoji: '📋' },
  };

  const greeting = greetings[userRole] || greetings.staff;

  return (
    <div className="space-y-6 animate-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {greeting.emoji} {greeting.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! {greeting.subtitle}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </button>
      </div>

      {/* Role-specific Dashboard Content */}
      {userRole === 'admin' && <AdminDashboard stats={stats} queueStatus={queueStatus} loading={loading} />}
      {userRole === 'doctor' && <DoctorDashboard stats={stats} queueStatus={queueStatus} loading={loading} user={user} />}
      {userRole === 'nurse' && <NurseDashboard stats={stats} queueStatus={queueStatus} loading={loading} />}
      {userRole === 'staff' && <StaffDashboard stats={stats} queueStatus={queueStatus} loading={loading} />}
    </div>
  );
}

// ========================
// ADMIN DASHBOARD
// ========================
function AdminDashboard({ stats, queueStatus, loading }) {
  const adminCards = [
    { title: "Total Patients", value: stats?.overview?.patientsToday || 0, icon: Users, color: 'bg-blue-500', trend: '+12%', trendUp: true },
    { title: 'Staff Active', value: 4, icon: UserCheck, color: 'bg-green-500', trend: '+2', trendUp: true },
    { title: 'Critical Alerts', value: stats?.overview?.criticalCases || 0, icon: AlertTriangle, color: 'bg-red-500', trend: '-3', trendUp: false },
    { title: 'System Uptime', value: '99.9%', icon: Activity, color: 'bg-primary-500', trend: '', trendUp: true },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminCards.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} index={index} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Overview */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📊 Risk Distribution Overview</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { level: 'Critical', count: stats?.riskDistribution?.critical || 0, color: 'bg-red-500', emoji: '🔴' },
                { level: 'High', count: stats?.riskDistribution?.high || 0, color: 'bg-orange-500', emoji: '🟠' },
                { level: 'Medium', count: stats?.riskDistribution?.medium || 0, color: 'bg-yellow-500', emoji: '🟡' },
                { level: 'Low', count: stats?.riskDistribution?.low || 0, color: 'bg-green-500', emoji: '🟢' }
              ].map((item) => (
                <div key={item.level} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="text-2xl mb-1">{item.emoji}</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{item.count}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{item.level}</div>
                </div>
              ))}
            </div>
            
            {/* Progress bars */}
            <div className="mt-6 space-y-3">
              {[
                { level: 'Critical', pct: 15, color: 'bg-red-500' },
                { level: 'High', pct: 25, color: 'bg-orange-500' },
                { level: 'Medium', pct: 35, color: 'bg-yellow-500' },
                { level: 'Low', pct: 25, color: 'bg-green-500' }
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-slate-600 dark:text-slate-400">{item.level}</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                  <span className="w-10 text-sm text-slate-600 dark:text-slate-400 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Quick Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">👥 Staff Status</h2>
          </div>
          <div className="card-body space-y-3">
            {[
              { name: 'Dr. Sarah Johnson', role: 'Doctor', status: 'Active', color: 'green', avatar: '👩‍⚕️' },
              { name: 'Nurse Priya Sharma', role: 'Nurse', status: 'Active', color: 'green', avatar: '👩‍🔬' },
              { name: 'Staff Amit Kumar', role: 'Staff', status: 'Active', color: 'green', avatar: '👨‍💼' },
            ].map((staff) => (
              <div key={staff.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{staff.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{staff.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{staff.role}</p>
                  </div>
                </div>
                <span className={`badge badge-${staff.color}`}>{staff.status}</span>
              </div>
            ))}
            <Link to="/staff" className="btn-primary w-full mt-4">
              Manage Staff <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <QuickActions role="admin" />
    </>
  );
}

// ========================
// DOCTOR DASHBOARD
// ========================
function DoctorDashboard({ stats, queueStatus, loading, user }) {
  const doctorCards = [
    { title: "My Patients Today", value: stats?.overview?.patientsToday || 8, icon: Users, color: 'bg-blue-500', trend: '+3', trendUp: true },
    { title: 'Pending Consultations', value: queueStatus?.totalWaiting || 0, icon: Clock, color: 'bg-amber-500', trend: '-2', trendUp: false },
    { title: 'Completed Today', value: queueStatus?.servedToday || 0, icon: CheckCircle, color: 'bg-green-500', trend: '+5', trendUp: true },
    { title: 'Critical Cases', value: stats?.overview?.criticalCases || 0, icon: AlertTriangle, color: 'bg-red-500', trend: '-1', trendUp: false },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {doctorCards.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} index={index} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📋 Today's Patient Queue</h2>
            <span className="badge badge-primary">{queueStatus?.totalWaiting || 0} Waiting</span>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {(queueStatus?.queue || []).slice(0, 5).map((patient, idx) => (
                <motion.div 
                  key={patient._id || idx} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      patient.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/50' :
                      patient.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/50' :
                      patient.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
                      'bg-green-100 dark:bg-green-900/50'
                    }`}>
                      {patient.priority === 'critical' ? '🚨' :
                       patient.priority === 'high' ? '⚠️' :
                       patient.priority === 'medium' ? '📝' : '✅'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{patient.patientName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{patient.symptoms || 'General checkup'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${patient.priority}`}>{patient.priority}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{patient.token}</p>
                  </div>
                </motion.div>
              ))}
              {(!queueStatus?.queue || queueStatus.queue.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm">No patients waiting</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current Patient */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🩺 Now Consulting</h2>
          </div>
          <div className="card-body">
            {queueStatus?.nowServing?.[0] ? (
              <div className="text-center py-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 mx-auto mb-4 flex items-center justify-center text-4xl">
                  👤
                </div>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 font-mono">{queueStatus.nowServing[0]}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-2">In Consultation</p>
                <div className="flex gap-2 mt-6">
                  <button className="btn-secondary flex-1">View Details</button>
                  <button className="btn-primary flex-1">Complete</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No Active Consultation</p>
                <Link to="/queue" className="btn-primary w-full mt-4">
                  Call Next Patient
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickActions role="doctor" />
    </>
  );
}

// ========================
// NURSE DASHBOARD
// ========================
function NurseDashboard({ stats, queueStatus, loading }) {
  const nurseCards = [
    { title: "Triage Queue", value: queueStatus?.totalWaiting || 0, icon: Users, color: 'bg-blue-500', trend: '+4', trendUp: true },
    { title: 'Assessments Done', value: stats?.overview?.assessmentsToday || 0, icon: Activity, color: 'bg-primary-500', trend: '+12', trendUp: true },
    { title: 'Critical Patients', value: queueStatus?.priorityBreakdown?.critical || 0, icon: AlertTriangle, color: 'bg-red-500', trend: '', trendUp: false },
    { title: 'Avg Triage Time', value: '8m', icon: Clock, color: 'bg-amber-500', trend: '-2m', trendUp: false },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nurseCards.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} index={index} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Triage Priority Queue */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🏥 Triage Priority Board</h2>
            <Link to="/assessment" className="btn-sm btn-primary">
              + New Triage
            </Link>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { priority: 'critical', label: 'Critical', color: 'bg-red-500', emoji: '🚨', bgColor: 'bg-red-50' },
                { priority: 'high', label: 'High', color: 'bg-orange-500', emoji: '⚠️', bgColor: 'bg-orange-50' },
                { priority: 'medium', label: 'Medium', color: 'bg-yellow-500', emoji: '📋', bgColor: 'bg-yellow-50' },
                { priority: 'low', label: 'Low', color: 'bg-green-500', emoji: '✅', bgColor: 'bg-green-50' }
              ].map((item) => {
                const count = queueStatus?.priorityBreakdown?.[item.priority] || 0;
                return (
                  <motion.div 
                    key={item.priority} 
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl ${item.bgColor} dark:bg-opacity-20 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">{count}</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Recent Triaged */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Recently Triaged</h3>
              <div className="space-y-2">
                {(queueStatus?.queue || []).slice(0, 3).map((patient, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-700 border dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        patient.priority === 'critical' ? 'bg-red-500' :
                        patient.priority === 'high' ? 'bg-orange-500' :
                        patient.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="font-medium dark:text-white">{patient.patientName}</span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{patient.token}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Entry Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📊 Today's Stats</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="text-4xl mb-2">💉</div>
              <p className="text-4xl font-bold text-primary-900">{stats?.overview?.assessmentsToday || 0}</p>
              <p className="text-sm text-primary-700 mt-1">Patients Triaged</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-green-50 text-center">
                <p className="text-2xl font-bold text-green-700">{queueStatus?.servedToday || 0}</p>
                <p className="text-xs text-green-600">Sent to Doctor</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 text-center">
                <p className="text-2xl font-bold text-amber-700">8m</p>
                <p className="text-xs text-amber-600">Avg Triage Time</p>
              </div>
            </div>
            
            <Link to="/assessment" className="btn-primary w-full">
              Start Triage <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      <QuickActions role="nurse" />
    </>
  );
}

// ========================
// STAFF DASHBOARD (Reception)
// ========================
function StaffDashboard({ stats, queueStatus, loading }) {
  const staffCards = [
    { title: "In Queue", value: queueStatus?.totalWaiting || 0, icon: Users, color: 'bg-blue-500', trend: '+5', trendUp: true },
    { title: 'Served Today', value: queueStatus?.servedToday || 0, icon: CheckCircle, color: 'bg-green-500', trend: '+15', trendUp: true },
    { title: 'Avg Wait Time', value: `${queueStatus?.averageWaitTime || 12}m`, icon: Clock, color: 'bg-amber-500', trend: '-5m', trendUp: false },
    { title: 'Registered Today', value: stats?.overview?.patientsToday || 0, icon: User, color: 'bg-purple-500', trend: '+8', trendUp: true },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffCards.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} index={index} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Display */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">📺 Queue Display</h2>
            <div className="flex gap-2">
              <Link to="/queue" className="btn-sm btn-secondary">View All</Link>
              <Link to="/queue" className="btn-sm btn-primary">+ Add Patient</Link>
            </div>
          </div>
          <div className="card-body">
            {/* Now Serving Display */}
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-6 p-8 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center"
            >
              <p className="text-lg opacity-90">🔔 Now Serving</p>
              <p className="text-6xl font-bold mt-2 font-mono">{queueStatus?.nowServing?.[0] || '---'}</p>
              <p className="text-sm mt-3 opacity-80">Please proceed to counter</p>
            </motion.div>

            {/* Next Up */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">📋 Next in Line</p>
              {(queueStatus?.queue || []).slice(0, 4).map((patient, idx) => (
                <motion.div 
                  key={patient._id || idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400">{patient.token}</span>
                    <div>
                      <span className="font-medium text-slate-900 dark:text-white">{patient.patientName}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{patient.symptoms}</p>
                    </div>
                  </div>
                  <span className={`badge badge-${patient.priority}`}>{patient.priority}</span>
                </motion.div>
              ))}
              {(!queueStatus?.queue || queueStatus.queue.length === 0) && (
                <div className="text-center py-8">
                  <span className="text-4xl">🎉</span>
                  <p className="text-slate-500 mt-2">Queue is empty!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">⚡ Quick Actions</h2>
          </div>
          <div className="card-body space-y-3">
            <Link to="/queue" className="block p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Manage Queue</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Call & serve patients</p>
                </div>
              </div>
            </Link>
            <Link to="/queue" className="block p-4 rounded-xl bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-3xl">➕</span>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Add to Queue</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Register new patient</p>
                </div>
              </div>
            </Link>
            <Link to="/patient-portal" className="block p-4 rounded-xl bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔍</span>
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Token Lookup</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Check patient status</p>
                </div>
              </div>
            </Link>
            <Link to="/chatbot" className="block p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">AI Assistant</p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">Get help & info</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ========================
// SHARED COMPONENTS
// ========================
function StatCard({ stat, index, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
            <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
          </div>
          {stat.trend && (
            <span className={`flex items-center gap-1 text-sm font-medium ${
              stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {stat.trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            {loading ? '...' : stat.value}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{stat.title}</p>
        </div>
      </div>
    </motion.div>
  );
}

function QuickActions({ role }) {
  const actions = {
    admin: [
      { label: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'primary', emoji: '📈' },
      { label: 'Staff Mgmt', href: '/staff', icon: Users, color: 'blue', emoji: '👥' },
      { label: 'Settings', href: '/settings', icon: Activity, color: 'green', emoji: '⚙️' },
      { label: 'AI Assistant', href: '/chatbot', icon: AlertTriangle, color: 'purple', emoji: '🤖' }
    ],
    doctor: [
      { label: 'Assessment', href: '/assessment', icon: Stethoscope, color: 'primary', emoji: '🩺' },
      { label: 'Queue', href: '/queue', icon: Users, color: 'blue', emoji: '📋' },
      { label: 'Reports', href: '/analytics', icon: FileText, color: 'green', emoji: '📊' },
      { label: 'AI Assistant', href: '/chatbot', icon: AlertTriangle, color: 'purple', emoji: '🤖' }
    ],
    nurse: [
      { label: 'Triage', href: '/assessment', icon: Activity, color: 'primary', emoji: '💉' },
      { label: 'Queue', href: '/queue', icon: Users, color: 'blue', emoji: '📋' },
      { label: 'Vitals', href: '/assessment', icon: TrendingUp, color: 'green', emoji: '📊' },
      { label: 'AI Help', href: '/chatbot', icon: AlertTriangle, color: 'purple', emoji: '🤖' }
    ],
    staff: [
      { label: 'Add Patient', href: '/queue', icon: User, color: 'primary', emoji: '➕' },
      { label: 'Queue', href: '/queue', icon: Users, color: 'blue', emoji: '📋' },
      { label: 'Token Check', href: '/patient-portal', icon: Activity, color: 'green', emoji: '🔍' },
      { label: 'AI Help', href: '/chatbot', icon: AlertTriangle, color: 'purple', emoji: '🤖' }
    ],
  };

  const items = actions[role] || actions.staff;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">⚡ Quick Actions</h2>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200"
            >
              <span className="text-3xl">{action.emoji}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
