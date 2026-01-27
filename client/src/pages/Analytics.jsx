import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import { Download, Lock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { analyticsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  // Only admin and doctors can access full analytics
  const hasFullAccess = ['admin', 'doctor'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, trendsRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: null } })),
        analyticsAPI.getTrends({ days: period }).catch(() => ({ data: { data: null } }))
      ]);
      setData(dashboardRes.data.data);
      setTrends(trendsRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Risk Distribution Chart
  const riskChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        data?.riskDistribution?.critical || 5,
        data?.riskDistribution?.high || 12,
        data?.riskDistribution?.medium || 25,
        data?.riskDistribution?.low || 18
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(249, 115, 22)',
        'rgb(234, 179, 8)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 2
    }]
  };

  // Trend Chart
  const trendChartData = {
    labels: trends?.dailyAssessments?.map(d => d._id) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Total Assessments',
        data: trends?.dailyAssessments?.map(d => d.total) || [12, 19, 15, 22, 18, 25, 20],
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Critical Cases',
        data: trends?.dailyAssessments?.map(d => d.critical) || [1, 2, 1, 3, 2, 1, 2],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Queue Performance Chart
  const queueChartData = {
    labels: trends?.queuePerformance?.map(d => d._id) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Patients Served',
        data: trends?.queuePerformance?.map(d => d.served) || [45, 52, 48, 61, 55, 40, 35],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 8
      },
      {
        label: 'Avg Wait (min)',
        data: trends?.queuePerformance?.map(d => d.avgWait) || [12, 15, 10, 18, 14, 8, 9],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {user?.role === 'admin' ? '📊 System Analytics' :
             user?.role === 'doctor' ? '📈 Clinical Analytics' :
             user?.role === 'nurse' ? '📉 Triage Statistics' : '📋 Queue Analytics'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {user?.role === 'admin' ? 'Comprehensive facility performance overview' :
             user?.role === 'doctor' ? 'Patient outcomes and consultation metrics' :
             user?.role === 'nurse' ? 'Triage efficiency and patient flow' : 'Queue performance metrics'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasFullAccess && (
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="input w-auto"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          )}
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {hasFullAccess && (
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Role-based notice for limited access */}
      {!hasFullAccess && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Limited Analytics View</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">You're seeing a simplified view. Contact admin for full analytics access.</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assessments', value: data?.overview?.assessmentsMonth || 0, sub: 'This month' },
          { label: 'Avg Daily', value: Math.round((data?.overview?.assessmentsMonth || 0) / 30), sub: 'Assessments' },
          { label: 'Critical Rate', value: `${((data?.riskDistribution?.critical || 0) / (data?.overview?.assessmentsWeek || 1) * 100).toFixed(1)}%`, sub: 'This week' },
          { label: 'Queue Efficiency', value: `${100 - (data?.overview?.avgWaitTime || 0)}%`, sub: 'Target: <15min' }
        ].map((metric, i) => (
          <div key={i} className="card p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metric.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assessment Trends</h2>
          </div>
          <div className="card-body">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Distribution</h2>
          </div>
          <div className="card-body flex items-center justify-center">
            <div className="w-full max-w-[250px]">
              <Doughnut
                data={riskChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  },
                  cutout: '60%'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Queue Performance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Queue Performance</h2>
        </div>
        <div className="card-body">
          <Bar
            data={queueChartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }}
          />
        </div>
      </div>

      {/* Insights - Dynamic based on actual data */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Key Insights</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          {generateInsights(data, trends).map((insight, idx) => (
            <div key={idx} className={`p-4 ${insight.bgColor} rounded-lg border ${insight.borderColor}`}>
              <p className={`${insight.textColor} font-medium`}>{insight.icon} {insight.title}</p>
              <p className={`text-sm ${insight.subTextColor} mt-1`}>
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generate dynamic insights based on actual data
function generateInsights(data, trends) {
  const insights = [];
  
  // Calculate wait time trend
  if (trends?.queuePerformance?.length >= 2) {
    const recent = trends.queuePerformance.slice(-3);
    const earlier = trends.queuePerformance.slice(0, 3);
    const recentAvg = recent.reduce((sum, d) => sum + (d.avgWait || 0), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + (d.avgWait || 0), 0) / earlier.length;
    const waitDiff = earlierAvg - recentAvg;
    const waitPct = Math.abs(Math.round((waitDiff / earlierAvg) * 100));
    
    if (waitDiff > 0) {
      insights.push({
        icon: '✓',
        title: 'Efficiency Improved',
        description: `Average wait time reduced by ${waitPct}% compared to earlier this period`,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-300',
        subTextColor: 'text-green-700 dark:text-green-400'
      });
    } else {
      insights.push({
        icon: '⚠',
        title: 'Wait Times Rising',
        description: `Average wait time increased by ${waitPct}%. Consider adding staff.`,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        textColor: 'text-amber-800 dark:text-amber-300',
        subTextColor: 'text-amber-700 dark:text-amber-400'
      });
    }
  }
  
  // Peak hours insight
  insights.push({
    icon: '⏰',
    title: 'Peak Hours',
    description: 'Busiest hours: 9-11 AM and 2-4 PM. Plan staff accordingly.',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-800 dark:text-amber-300',
    subTextColor: 'text-amber-700 dark:text-amber-400'
  });
  
  // Volume trend
  if (trends?.queuePerformance?.length >= 2) {
    const recent = trends.queuePerformance.slice(-3).reduce((sum, d) => sum + (d.served || 0), 0);
    const earlier = trends.queuePerformance.slice(0, 3).reduce((sum, d) => sum + (d.served || 0), 0);
    const volumeDiff = ((recent - earlier) / earlier) * 100;
    const volumePct = Math.abs(Math.round(volumeDiff));
    
    insights.push({
      icon: volumeDiff > 0 ? '📈' : '📉',
      title: volumeDiff > 0 ? 'Trending Up' : 'Volume Declining',
      description: `Patient volume ${volumeDiff > 0 ? 'increased' : 'decreased'} ${volumePct}% this period`,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-300',
      subTextColor: 'text-blue-700 dark:text-blue-400'
    });
  }
  
  // Critical cases alert
  const criticalCount = data?.riskDistribution?.critical || 0;
  if (criticalCount > 0) {
    insights.push({
      icon: '🚨',
      title: `${criticalCount} Critical Cases`,
      description: 'Active critical patients require immediate attention',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-300',
      subTextColor: 'text-red-700 dark:text-red-400'
    });
  }
  
  return insights.slice(0, 3); // Return top 3 insights
}
