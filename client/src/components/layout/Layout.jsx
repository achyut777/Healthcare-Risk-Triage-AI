import {
    Activity,
    BarChart3,
    Calendar,
    ClipboardList,
    CreditCard,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageCircle,
    Receipt,
    Settings,
    Shield,
    Stethoscope,
    User,
    UserCog,
    Users,
    X
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import NotificationDropdown from './NotificationDropdown';

// Role-based navigation configuration
const roleNavigations = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assessment', href: '/assessment', icon: ClipboardList },
    { name: 'Queue', href: '/queue', icon: Users },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Staff Management', href: '/staff-management', icon: UserCog },
    { name: 'AI Assistant', href: '/chatbot', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  doctor: [
    { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Patient Assessment', href: '/assessment', icon: Stethoscope },
    { name: 'Patient Queue', href: '/queue', icon: Users },
    { name: 'My Consultations', href: '/consultations', icon: Calendar },
    { name: 'Medical Reports', href: '/reports', icon: FileText },
    { name: 'AI Assistant', href: '/chatbot', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  nurse: [
    { name: 'Nurse Station', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Triage Assessment', href: '/assessment', icon: ClipboardList },
    { name: 'Patient Queue', href: '/queue', icon: Users },
    { name: 'Vitals Entry', href: '/vitals', icon: Activity },
    { name: 'AI Assistant', href: '/chatbot', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  staff: [
    { name: 'Reception', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Queue Management', href: '/queue', icon: Users },
    { name: 'Patient Registration', href: '/registration', icon: User },
    { name: 'Billing & Payments', href: '/billing', icon: CreditCard },
    { name: 'AI Assistant', href: '/chatbot', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
};

// Role badges and colors
const roleBadges = {
  admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-700', icon: Shield },
  doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700', icon: Stethoscope },
  nurse: { label: 'Nurse', color: 'bg-green-100 text-green-700', icon: Activity },
  staff: { label: 'Staff', color: 'bg-amber-100 text-amber-700', icon: User },
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get role-specific navigation
  const userRole = user?.role || 'staff';
  const navigation = roleNavigations[userRole] || roleNavigations.staff;
  const roleBadge = roleBadges[userRole] || roleBadges.staff;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">HealthTriage</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Triage</p>
            </div>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            {/* Role Badge */}
            <div className={`flex items-center gap-2 px-3 py-2 mb-3 rounded-lg ${roleBadge.color}`}>
              <roleBadge.icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{roleBadge.label}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.facilityName || 'Primary Health Centre'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 px-4 py-3 lg:px-8">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-300"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1" />

            {/* Notifications */}
            <NotificationDropdown />

            {/* Date/Time */}
            <div className="hidden sm:block text-sm text-slate-600 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
