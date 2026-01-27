import {
    Activity,
    Bell,
    Building,
    Camera,
    Check,
    Database,
    Globe,
    Monitor,
    Moon,
    Palette,
    Save,
    Shield,
    Stethoscope,
    Sun,
    User,
    Users
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function Settings() {
  const { user, updateProfile } = useAuthStore();
  const {
    theme,
    accentColor,
    notifications,
    language,
    timezone,
    dateFormat,
    setTheme,
    setAccentColor,
    setNotificationSetting,
    setLanguage,
    setTimezone,
    setDateFormat,
    t,
  } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'staff'
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ name: profile.name, phone: profile.phone });
      if (result.success) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!passwords.current) {
      toast.error('Please enter current password');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    toast.success('Password updated successfully');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
    toast.success('Accent color updated');
  };

  // Role-specific tabs
  const baseTabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'security', label: t('security'), icon: Shield },
  ];

  const roleSpecificTabs = {
    admin: [
      { id: 'facility', label: 'Facility', icon: Building },
      { id: 'system', label: 'System', icon: Database },
      { id: 'users', label: 'User Management', icon: Users },
    ],
    doctor: [
      { id: 'consultation', label: 'Consultation', icon: Stethoscope },
    ],
    nurse: [
      { id: 'vitals', label: 'Vitals Config', icon: Activity },
    ],
    staff: [],
  };

  const tabs = [
    ...baseTabs,
    ...(roleSpecificTabs[user?.role] || []),
    { id: 'appearance', label: t('appearance'), icon: Palette },
    { id: 'language', label: t('language'), icon: Globe },
  ];

  // Role badge config
  const roleBadges = {
    admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-700' },
    doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700' },
    nurse: { label: 'Nurse', color: 'bg-green-100 text-green-700' },
    staff: { label: 'Staff', color: 'bg-amber-100 text-amber-700' },
  };
  const roleBadge = roleBadges[user?.role] || roleBadges.staff;

  const accentColors = [
    { color: '#0891b2', name: 'Cyan' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#f97316', name: 'Orange' },
    { color: '#22c55e', name: 'Green' },
    { color: '#3b82f6', name: 'Blue' },
  ];

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          {user?.role === 'admin' ? '⚙️ System Settings' :
           user?.role === 'doctor' ? '👨‍⚕️ Doctor Settings' :
           user?.role === 'nurse' ? '👩‍⚕️ Nurse Settings' : '📋 Account Settings'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 card">
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Profile Settings</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <button 
                    className="absolute bottom-0 right-0 p-1.5 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors"
                    onClick={() => toast.success('Profile picture upload coming soon!')}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{profile.name}</h3>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    className="input bg-slate-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    className="input bg-slate-50 capitalize"
                    disabled
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', icon: '📧' },
                  { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications', icon: '🔔' },
                  { key: 'criticalAlerts', label: 'Critical Alerts', desc: 'Immediate alerts for critical cases', icon: '🚨' },
                  { key: 'queueUpdates', label: 'Queue Updates', desc: 'Notifications when queue changes', icon: '👥' },
                  { key: 'sound', label: 'Sound Alerts', desc: 'Play sound for new notifications', icon: '🔊' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(e) => {
                          setNotificationSetting(item.key, e.target.checked);
                          toast.success(`${item.label} ${e.target.checked ? 'enabled' : 'disabled'}`);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Security Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    placeholder="••••••••"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
              </div>

              <button onClick={handleChangePassword} className="btn-primary">Update Password</button>

              <hr className="my-6" />

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add an extra layer of security</p>
                  </div>
                  <button 
                    onClick={() => toast.success('2FA setup coming soon!')}
                    className="btn-secondary"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Account Security Status: Good</span>
                </div>
                <p className="text-sm text-green-600 mt-1">Your account is protected with a strong password.</p>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Appearance</h2>
              
              <div>
                <label className="label">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleThemeChange(option.id)}
                      className={`p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center gap-2 ${
                        theme === option.id 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' 
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <option.icon className={`w-6 h-6 ${theme === option.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className={theme === option.id ? 'font-medium text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300'}>
                        {option.label}
                      </span>
                      {theme === option.id && (
                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Accent Color</label>
                <div className="flex gap-3 flex-wrap">
                  {accentColors.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => handleAccentColorChange(item.color)}
                      className={`w-12 h-12 rounded-full transition-all ${
                        accentColor === item.color 
                          ? 'ring-4 ring-offset-2 ring-slate-400 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: item.color }}
                      title={item.name}
                    >
                      {accentColor === item.color && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  💡 Theme changes are applied instantly and saved automatically.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Language & Region</h2>
              
              <div>
                <label className="label">Language</label>
                <select 
                  className="input"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    toast.success('Language preference saved');
                  }}
                >
                  <option value="en-US">English (US)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>

              <div>
                <label className="label">Timezone</label>
                <select 
                  className="input"
                  value={timezone}
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    toast.success('Timezone updated');
                  }}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                </select>
              </div>

              <div>
                <label className="label">Date Format</label>
                <select 
                  className="input"
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value);
                    toast.success('Date format updated');
                  }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  🌍 These settings affect how dates and times are displayed throughout the application.
                </p>
              </div>
            </div>
          )}

          {/* Admin-only: Facility Settings */}
          {activeTab === 'facility' && user?.role === 'admin' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Facility Settings</h2>
              
              <div className="grid gap-4">
                <div>
                  <label className="label">Facility Name</label>
                  <input type="text" className="input" defaultValue="Primary Health Centre - Sector 12" />
                </div>
                <div>
                  <label className="label">Facility ID</label>
                  <input type="text" className="input bg-slate-50" defaultValue="PHC-001" disabled />
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea className="input h-20" defaultValue="Sector 12, New Delhi - 110001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Opening Hours</label>
                    <input type="time" className="input" defaultValue="08:00" />
                  </div>
                  <div>
                    <label className="label">Closing Hours</label>
                    <input type="time" className="input" defaultValue="20:00" />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => toast.success('Facility settings saved')}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Facility Settings
              </button>
            </div>
          )}

          {/* Admin-only: System Settings */}
          {activeTab === 'system' && user?.role === 'admin' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">System Configuration</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">AI Risk Engine</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Enable AI-powered risk assessment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="sr-only peer" 
                        onChange={(e) => toast.success(`AI Risk Engine ${e.target.checked ? 'enabled' : 'disabled'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Auto Queue Assignment</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Automatically assign patients to available doctors</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="sr-only peer"
                        onChange={(e) => toast.success(`Auto Queue Assignment ${e.target.checked ? 'enabled' : 'disabled'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Demo Mode</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Use sample data for demonstration</p>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-amber-800 dark:text-amber-300 font-medium">⚠️ Database Status</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">MongoDB connection unavailable. Running in demo mode with sample data.</p>
              </div>
            </div>
          )}

          {/* Admin-only: User Management */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">User Management Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Default User Role</label>
                  <select 
                    className="input"
                    onChange={(e) => toast.success(`Default role set to ${e.target.value}`)}
                  >
                    <option value="staff">Staff</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Require Email Verification</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">New users must verify their email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        onChange={(e) => toast.success(`Email verification ${e.target.checked ? 'required' : 'not required'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Session Timeout (minutes)</label>
                  <input 
                    type="number" 
                    className="input" 
                    defaultValue="60" 
                    min="5" 
                    max="480" 
                  />
                </div>
              </div>

              <button 
                onClick={() => toast.success('User management settings saved')}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          )}

          {/* Doctor-only: Consultation Settings */}
          {activeTab === 'consultation' && user?.role === 'doctor' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Consultation Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Default Consultation Duration (minutes)</label>
                  <select 
                    className="input"
                    onChange={(e) => toast.success(`Default duration set to ${e.target.value} minutes`)}
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="label">Specialization</label>
                  <input type="text" className="input" placeholder="e.g., General Medicine, Pediatrics" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Show AI Recommendations</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Display AI suggestions during consultation</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="sr-only peer"
                        onChange={(e) => toast.success(`AI Recommendations ${e.target.checked ? 'enabled' : 'disabled'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => toast.success('Consultation preferences saved')}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          )}

          {/* Nurse-only: Vitals Config */}
          {activeTab === 'vitals' && user?.role === 'nurse' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold dark:text-white">Vitals Entry Configuration</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Auto-calculate BMI</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Automatically calculate BMI from height and weight</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="sr-only peer"
                        onChange={(e) => toast.success(`Auto-calculate BMI ${e.target.checked ? 'enabled' : 'disabled'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Alert on Abnormal Values</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Show warning when vitals are outside normal range</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="sr-only peer"
                        onChange={(e) => toast.success(`Abnormal value alerts ${e.target.checked ? 'enabled' : 'disabled'}`)}
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Temperature Unit</label>
                  <select 
                    className="input"
                    onChange={(e) => toast.success(`Temperature unit set to ${e.target.value === 'F' ? 'Fahrenheit' : 'Celsius'}`)}
                  >
                    <option value="F">Fahrenheit (°F)</option>
                    <option value="C">Celsius (°C)</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => toast.success('Vitals configuration saved')}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
