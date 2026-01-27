import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Check,
    Edit,
    Loader2,
    Mail,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    User,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { staffAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function StaffManagement() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: ''
  });

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll();
      if (response.data.success) {
        setStaff(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch staff members');
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff based on search, role, and status
  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && member.isActive !== false) ||
      (statusFilter === 'inactive' && member.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open modal for adding new staff
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: ''
    });
    setSelectedStaff(null);
    setModalMode('add');
    setShowModal(true);
  };

  // Open modal for editing staff
  const openEditModal = (member) => {
    setFormData({
      name: member.name || '',
      email: member.email || '',
      password: '',
      role: member.role || 'staff',
      phone: member.phone || ''
    });
    setSelectedStaff(member);
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (modalMode === 'add' && !formData.password) {
      toast.error('Password is required for new staff');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'add') {
        const response = await staffAPI.create(formData);
        if (response.data.success) {
          toast.success('Staff member added successfully');
          setShowModal(false);
          fetchStaff();
        }
      } else {
        const updateData = { 
          name: formData.name, 
          role: formData.role, 
          phone: formData.phone 
        };
        const response = await staffAPI.update(selectedStaff._id, updateData);
        if (response.data.success) {
          toast.success('Staff member updated successfully');
          setShowModal(false);
          fetchStaff();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (member) => {
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(member._id);
    try {
      const response = await staffAPI.delete(member._id);
      if (response.data.success) {
        toast.success('Staff member deleted');
        fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  // Toggle active status
  const toggleStatus = async (member) => {
    try {
      const isCurrentlyActive = member.isActive !== false;
      const response = isCurrentlyActive 
        ? await staffAPI.deactivate(member._id)
        : await staffAPI.activate(member._id);
      
      if (response.data.success) {
        toast.success(isCurrentlyActive ? 'Staff member deactivated' : 'Staff member activated');
        fetchStaff();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Role configuration
  const roleConfig = {
    admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', icon: Shield },
    doctor: { label: 'Doctor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', icon: User },
    nurse: { label: 'Nurse', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', icon: UserCheck },
    staff: { label: 'Staff', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', icon: Users },
  };

  // Stats
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.isActive !== false).length,
    inactive: staff.filter(s => s.isActive === false).length,
    byRole: {
      admin: staff.filter(s => s.role === 'admin').length,
      doctor: staff.filter(s => s.role === 'doctor').length,
      nurse: staff.filter(s => s.role === 'nurse').length,
      staff: staff.filter(s => s.role === 'staff').length,
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto animate-in">
        <div className="card p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Only administrators can access the staff management page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            👥 Staff Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your healthcare team members
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Staff</p>
        </div>
        <div className="card p-4 text-center">
          <UserCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
        </div>
        <div className="card p-4 text-center">
          <UserMinus className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Inactive</p>
        </div>
        <div className="card p-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-purple-600">{stats.byRole.doctor}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">Doctors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input md:w-40"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="staff">Staff</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchStaff}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading staff members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No staff members found</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-primary-600 dark:text-primary-400 hover:underline mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStaff.map((member) => {
                  const role = roleConfig[member.role] || roleConfig.staff;
                  const RoleIcon = role.icon;
                  const isActive = member.isActive !== false;
                  const isCurrentUser = member._id === user?._id || member.email === user?.email;

                  return (
                    <motion.tr
                      key={member._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold">
                            {member.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              {member.name}
                              {isCurrentUser && (
                                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                          <RoleIcon className="w-3.5 h-3.5" />
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {member.phone ? (
                          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => !isCurrentUser && toggleStatus(member)}
                          disabled={isCurrentUser}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70'
                          } ${isCurrentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDelete(member)}
                              disabled={deleting === member._id}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === member._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {modalMode === 'add' ? (
                      <>
                        <UserPlus className="w-5 h-5 text-primary-600" />
                        Add Staff Member
                      </>
                    ) : (
                      <>
                        <Edit className="w-5 h-5 text-primary-600" />
                        Edit Staff Member
                      </>
                    )}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="Enter email"
                    required
                    disabled={modalMode === 'edit'}
                  />
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="label">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      placeholder="Enter password"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Minimum 6 characters
                    </p>
                  </div>
                )}

                <div>
                  <label className="label">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {modalMode === 'add' ? <Plus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {modalMode === 'add' ? 'Add Staff' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
