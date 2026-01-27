import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    Bell,
    CheckCheck,
    Info,
    Trash2,
    Users
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const {
    notificationsList,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useSettingsStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'queue':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  const getTimeAgo = (time) => {
    const now = new Date();
    const then = new Date(time);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                {notificationsList.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notificationsList.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications</p>
                </div>
              ) : (
                notificationsList.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex gap-3 p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 mt-1.5 bg-primary-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {getTimeAgo(notification.time)}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notificationsList.length > 0 && (
              <div className="p-2 border-t bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
