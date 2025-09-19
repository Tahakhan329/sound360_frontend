import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  User,
  Mail,
  Shield,
  Camera,
  Upload,
  X,
  Phone,
  Building2
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  department?: string;
  callCenterId?: string;
  phone?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    profilePicture: '',
    department: '',
    callCenterId: '',
    phone: '',
  });

  const queryClient = useQueryClient();

  // Fetch users with role-based filtering
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users/');
      return response.json();
    },
  });

  // Filter users based on current user role
  const getFilteredUsers = () => {
    if (!users) return [];
    
    // Admin can see all users
    if (currentUser?.role === 'Administrator') {
      return [
        {
          id: '1',
          name: 'System Administrator',
          email: 'admin@inseyab.com',
          role: 'Administrator',
          createdAt: '2024-01-15',
          lastLogin: '2024-01-20',
          status: 'active' as const,
          department: 'IT',
          callCenterId: 'CC001',
          phone: '+971 56 176 4597'
        },
        {
          id: '2',
          name: 'John Manager',
          email: 'john@sound360.local',
          role: 'Manager',
          createdAt: '2024-01-10',
          lastLogin: '2024-01-19',
          status: 'active' as const,
          department: 'Customer Service',
          callCenterId: 'CC002',
          phone: '+971 50 123 4567'
        },
        {
          id: '3',
          name: 'Mike Agent',
          email: 'mike@sound360.local',
          role: 'Agent',
          createdAt: '2024-01-05',
          lastLogin: '2024-01-18',
          status: 'active' as const,
          department: 'Customer Service',
          callCenterId: 'CC004',
          phone: '+971 55 987 6543'
        },
        {
          id: '4',
          name: 'Sarah Analyst',
          email: 'sarah@sound360.local',
          role: 'Analyst',
          createdAt: '2024-01-03',
          lastLogin: '2024-01-17',
          status: 'active' as const,
          department: 'Analytics',
          callCenterId: 'CC005',
          phone: '+971 52 456 7890'
        },
      ];
    }
    
    // Manager can see agents and analysts only
    if (currentUser?.role === 'Manager') {
      return users.filter(user => ['Agent', 'Analyst'].includes(user.role));
    }
    
    // Agents can only see their own profile (handled in profile page)
    return [];
  };

  const filteredUsers = getFilteredUsers();

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateForm(false);
      setFormData({ 
        name: '', 
        email: '', 
        role: 'Agent', 
        profilePicture: '',
        department: '',
        callCenterId: '',
        phone: ''
      });
      setPreviewImage(null);
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, profilePicture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const searchFilteredUsers = filteredUsers?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  }) || [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-600 text-red-100';
      case 'Manager':
        return 'bg-blue-600 text-blue-100';
      case 'Agent':
        return 'bg-green-600 text-green-100';
      case 'Analyst':
        return 'bg-purple-600 text-purple-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Check if current user can manage users
  const canManageUsers = currentUser?.role === 'Administrator' || currentUser?.role === 'Manager';
  
  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Access Denied</h2>
        <p className="text-gray-400">You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Call Center Users</h1>
          <p className="text-gray-400 mt-1">Manage call center agents and their assignments</p>
        </div>
        {currentUser?.role === 'Administrator' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Agent</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Roles</option>
          {currentUser?.role === 'Administrator' && (
            <>
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
            </>
          )}
          <option value="Agent">Agent</option>
          <option value="Analyst">Analyst</option>
        </select>
      </div>

      {/* Create/Edit User Form */}
      {(showCreateForm || editingUser) && currentUser?.role === 'Administrator' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-6">
            {editingUser ? 'Edit Agent' : 'Create New Agent'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-600 bg-gray-700">
                  {previewImage || formData.profilePicture ? (
                    <img
                      src={previewImage || formData.profilePicture}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-gray-800"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="profile-upload"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo (Optional)</span>
                </label>
                
                {(previewImage || formData.profilePicture) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData(prev => ({ ...prev, profilePicture: '' }));
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Agent">Agent</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Analytics">Analytics</option>
                  <option value="IT">IT</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Call Center ID *
                </label>
                <input
                  type="text"
                  value={formData.callCenterId}
                  onChange={(e) => setFormData({ ...formData, callCenterId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CC001"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {createUserMutation.isPending ? 'Creating...' : 'Create Agent'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                  setFormData({ 
                    name: '', 
                    email: '', 
                    role: 'Agent', 
                    profilePicture: '',
                    department: '',
                    callCenterId: '',
                    phone: ''
                  });
                  setPreviewImage(null);
                }}
                className="bg-gray-600 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users List */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            {currentUser?.role === 'Administrator' ? 'All Users' : 'Team Members'} ({searchFilteredUsers.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading team members...</p>
            </div>
          ) : searchFilteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No team members found</p>
            </div>
          ) : (
            searchFilteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-100">{user.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-400 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-xs text-gray-500">
                        {user.department && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-3 h-3" />
                            <span>{user.department}</span>
                          </div>
                        )}
                        {user.callCenterId && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{user.callCenterId}</span>
                          </div>
                        )}
                        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                        {user.lastLogin && (
                          <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {currentUser?.role === 'Administrator' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Edit user"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Deactivate user"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;