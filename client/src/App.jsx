import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Analytics from './pages/Analytics';
import Assessment from './pages/Assessment';
import Billing from './pages/Billing';
import Chatbot from './pages/Chatbot';
import Consultations from './pages/Consultations';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PatientPortal from './pages/PatientPortal';
import Queue from './pages/Queue';
import Registration from './pages/Registration';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import StaffManagement from './pages/StaffManagement';
import Vitals from './pages/Vitals';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/patient-portal" element={<PatientPortal />} />
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assessment" element={<Assessment />} />
        <Route path="queue" element={<Queue />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Role-specific routes */}
        <Route path="billing" element={<Billing />} />
        <Route path="staff" element={<Staff />} />
        <Route path="staff-management" element={<StaffManagement />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="registration" element={<Registration />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
