import { motion } from 'framer-motion';
import {
    CheckCircle,
    Edit2,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Shield,
    Stethoscope,
    Trash2,
    User,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function Staff() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
          <p className="text-slate-600 mt-2">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleIcons = {
    admin: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Administrator' },
    doctor: { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Doctor' },
    nurse: { icon: Users, color: 'text-green-600', bg: 'bg-green-100', label: 'Nurse' },
    staff: { icon: User, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Staff' },
  };

  const stats = [
    { label: 'Total Staff', value: staff.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Doctors', value: staff.filter(s => s.role === 'doctor').length, icon: Stethoscope, color: 'bg-green-500' },
    { label: 'Nurses', value: staff.filter(s => s.role === 'nurse').length, icon: Users, color: 'bg-purple-500' },
    { label: 'Active Now', value: staff.filter(s => s.isActive !== false).length, icon: CheckCircle, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">👥 Staff Management</h1>
          <p className="text-slate-600 mt-1">Manage your healthcare facility staff</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="card">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>No staff members found</p>
            </div>
          ) : (
            filteredStaff.map((member, index) => {
              const roleInfo = roleIcons[member.role] || roleIcons.staff;
              return (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${roleInfo.bg} flex items-center justify-center`}>
                        <roleInfo.icon className={`w-6 h-6 ${roleInfo.color}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{member.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                        member.role === 'nurse' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {roleInfo.label}
                      </span>
                      <span className={`badge ${member.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                        {member.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                      <div className="relative group">
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => setSelectedStaff(member)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-red-600 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {member.assessmentsCount !== undefined && (
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500 ml-16">
                      <span>📊 {member.assessmentsCount} assessments</span>
                      <span>🏥 {member.facilityName || 'Primary Health Centre'}</span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal onClose={() => setShowAddModal(false)} onSuccess={fetchStaff} />
      )}
    </div>
  );
}

function AddStaffModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    facilityId: 'PHC-001',
    facilityName: 'Primary Health Centre - Sector 12',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('Staff member added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add New Staff Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              required
              className="input w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              required
              className="input w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@healthtriage.ai"
            />
          </div>
          <div>
            <label className="label">Password *</label>
            <input
              type="password"
              required
              className="input w-full"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <select
              className="input w-full"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="staff">Staff</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input w-full"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
