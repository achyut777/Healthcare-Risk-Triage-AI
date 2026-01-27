import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    Bell,
    CheckCircle,
    Clock,
    RefreshCw,
    Search,
    Users,
    Volume2
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Create a public API instance (no auth required)
const publicAPI = {
  checkToken: async (token) => {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseURL}/queue/check/${token}`);
    return response.json();
  },
  getPublicStatus: async () => {
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseURL}/queue/public-status`);
    return response.json();
  }
};

export default function PatientPortal() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Fetch public queue status
  const fetchPublicStatus = async () => {
    try {
      const response = await publicAPI.getPublicStatus();
      if (response.success) {
        setQueueStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching public status:', err);
    }
  };

  // Auto-refresh queue status every 30 seconds
  useEffect(() => {
    fetchPublicStatus();
    const interval = setInterval(fetchPublicStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh token status when enabled
  useEffect(() => {
    if (autoRefresh && result && result.status === 'waiting') {
      const interval = setInterval(() => {
        checkStatus();
      }, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, result]);

  const checkStatus = async (e) => {
    if (e) e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await publicAPI.checkToken(token.trim().toUpperCase());
      setLastChecked(new Date());
      
      if (response.found) {
        setResult(response.data);
        setAutoRefresh(response.data.status === 'waiting');
      } else {
        setResult(null);
        setError(response.message || 'Token not found. Please check your token number.');
        setAutoRefresh(false);
      }
    } catch (err) {
      setError('Unable to check status. Please try again.');
      setAutoRefresh(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'waiting':
        return { 
          color: 'bg-primary-500', 
          icon: Clock, 
          label: 'Waiting', 
          desc: 'You are in the queue' 
        };
      case 'called':
        return { 
          color: 'bg-amber-500', 
          icon: Bell, 
          label: 'Called!', 
          desc: 'Please proceed to the counter' 
        };
      case 'serving':
      case 'in-consultation':
        return { 
          color: 'bg-green-500', 
          icon: CheckCircle, 
          label: 'Being Served', 
          desc: 'You are currently being attended to' 
        };
      case 'completed':
        return { 
          color: 'bg-slate-500', 
          icon: CheckCircle, 
          label: 'Completed', 
          desc: 'Your visit has been completed' 
        };
      default:
        return { 
          color: 'bg-slate-500', 
          icon: AlertCircle, 
          label: status, 
          desc: '' 
        };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return { color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300', emoji: '🔴' };
      case 'high':
        return { color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300', emoji: '🟠' };
      case 'medium':
        return { color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300', emoji: '🟡' };
      default:
        return { color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300', emoji: '🟢' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-slate-900 dark:text-white">HealthTriage AI</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Patient Queue Portal</p>
            </div>
          </div>
          <a href="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Staff Login →
          </a>
        </div>
      </header>

      {/* Live Queue Display Banner */}
      {queueStatus && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
              <div className="text-center">
                <p className="text-xs text-primary-200 uppercase tracking-wider">Now Serving</p>
                <p className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  {queueStatus.nowServing || '---'}
                </p>
              </div>
              <div className="h-10 w-px bg-primary-400/30 hidden md:block" />
              <div className="text-center">
                <p className="text-xs text-primary-200 uppercase tracking-wider">Total Waiting</p>
                <p className="text-2xl md:text-3xl font-display font-bold">{queueStatus.totalWaiting || 0}</p>
              </div>
              <div className="h-10 w-px bg-primary-400/30 hidden md:block" />
              <div className="text-center">
                <p className="text-xs text-primary-200 uppercase tracking-wider">Avg Wait Time</p>
                <p className="text-2xl md:text-3xl font-display font-bold">{queueStatus.averageWaitTime || 0}m</p>
              </div>
              <div className="h-10 w-px bg-primary-400/30 hidden md:block" />
              <div className="text-center">
                <p className="text-xs text-primary-200 uppercase tracking-wider">Served Today</p>
                <p className="text-2xl md:text-3xl font-display font-bold">{queueStatus.servedToday || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Token Search */}
          <div>
            <div className="text-center md:text-left mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white">
                Check Your Queue Status
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-3">
                Enter your queue token number to see your current position and estimated wait time
              </p>
            </div>

            {/* Search Form */}
            <div className="max-w-md mx-auto md:mx-0">
              <form onSubmit={checkStatus} className="relative">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="Enter token (e.g., Q-2026-0001)"
                  className="w-full px-6 py-4 text-lg text-center font-mono tracking-wider rounded-2xl border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Search className="w-6 h-6" />
                  )}
                </button>
              </form>

              {/* Sample tokens hint */}
              <div className="mt-4 text-center md:text-left">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sample tokens to try: <span className="font-mono text-primary-600 dark:text-primary-400">Q-2026-0001</span>, 
                  <span className="font-mono text-primary-600 dark:text-primary-400 ml-1">Q-2026-0002</span>, 
                  <span className="font-mono text-primary-600 dark:text-primary-400 ml-1">Q-2026-0004</span>
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-center"
                  >
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { icon: Clock, title: 'Real-time', desc: 'Live updates' },
                { icon: Users, title: 'Smart Queue', desc: 'AI-prioritized' },
                { icon: Activity, title: 'Triage', desc: 'Risk-based' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                  <item.icon className="w-6 h-6 mx-auto text-primary-500 mb-2" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Result Display */}
          <div>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
                >
                  {/* Status Header */}
                  {(() => {
                    const statusConfig = getStatusConfig(result.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div className={`p-6 ${statusConfig.color} text-white`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm opacity-80">Token Number</p>
                            <p className="text-4xl font-display font-bold mt-1">{result.token}</p>
                            {result.patientName && (
                              <p className="mt-2 opacity-90">{result.patientName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <StatusIcon className="w-12 h-12 opacity-50" />
                            <p className="text-sm font-medium mt-2">{statusConfig.label}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status Info */}
                  <div className="p-6 space-y-4">
                    {result.status === 'called' && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [0.9, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-300 dark:border-amber-600"
                      >
                        <Bell className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-bounce" />
                        <div>
                          <p className="font-bold text-amber-800 dark:text-amber-300 text-lg">Your Turn!</p>
                          <p className="text-sm text-amber-700 dark:text-amber-400">
                            Please proceed to {result.counter ? `Counter ${result.counter}` : 'the reception'}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {(result.status === 'serving' || result.status === 'in-consultation') && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-300">You're Being Served!</p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Currently in consultation
                          </p>
                        </div>
                      </div>
                    )}

                    {result.status === 'waiting' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl text-center">
                            <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                              {result.position || '—'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Position in Queue</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl text-center">
                            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                              {result.estimatedWait || '—'}m
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Est. Wait Time</p>
                          </div>
                        </div>

                        {result.priority && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Priority Level</span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getPriorityConfig(result.priority).color}`}>
                              {getPriorityConfig(result.priority).emoji} {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
                            </span>
                          </div>
                        )}

                        {/* Auto-refresh indicator */}
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                          <span>
                            {autoRefresh ? 'Auto-refreshing every 15s' : 'Manual refresh'}
                          </span>
                          <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {autoRefresh ? 'Stop' : 'Enable'}
                          </button>
                        </div>
                      </>
                    )}

                    {result.status === 'completed' && (
                      <div className="text-center p-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">
                          {result.message || 'Your visit has been completed. Thank you!'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer with last checked time */}
                  {lastChecked && (
                    <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 text-center text-xs text-slate-500 dark:text-slate-400 border-t dark:border-slate-700">
                      Last checked: {lastChecked.toLocaleTimeString()}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Enter Your Token
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
                    Your token number was provided when you registered at the reception desk
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Queue Display Section */}
        {queueStatus?.queue && queueStatus.queue.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-4 text-center">
              Current Queue
            </h2>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-4" style={{ minWidth: 'max-content' }}>
                {queueStatus.queue.slice(0, 10).map((patient, index) => (
                  <motion.div
                    key={patient.token}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex-shrink-0 w-32 p-4 rounded-xl text-center ${
                      index === 0 
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500' 
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p className={`text-xs mb-1 ${index === 0 ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {index === 0 ? 'NEXT UP' : `#${index + 1}`}
                    </p>
                    <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                      {patient.token}
                    </p>
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getPriorityConfig(patient.priority).color}`}>
                      {getPriorityConfig(patient.priority).emoji}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t dark:border-slate-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© 2026 HealthTriage AI. For emergencies, please call emergency services immediately.</p>
          <p className="mt-2 text-xs">
            ⚠️ This is a patient prioritization system only. It does not provide medical diagnoses.
          </p>
        </div>
      </footer>
    </div>
  );
}
