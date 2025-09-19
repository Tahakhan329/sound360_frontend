import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Users,
  LogOut, 
  Mail, 
  Shield, 
  Building2, 
  Phone,
  Edit,
  Settings,
  Monitor,
  Database,
  Info,
  Contact
} from 'lucide-react';

interface UserProfileDropdownProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    callCenterId?: string;
    department?: string;
  };
  onClose: () => void;
  onLogout: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ currentUser, onClose, onLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const isAdmin = currentUser.role === 'Administrator';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
    >
      {/* User Info Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-600">
            {currentUser.profilePicture ? (
              <img
                src={currentUser.profilePicture}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100">{currentUser.name}</h3>
            <p className="text-sm text-gray-400">{currentUser.email}</p>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="p-4 border-b border-gray-700">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-sm text-gray-400">Role:</span>
              <span className="text-sm text-gray-200 ml-2 font-medium">{currentUser.role}</span>
            </div>
          </div>
          
          {currentUser.department && (
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-green-400" />
              <div>
                <span className="text-sm text-gray-400">Department:</span>
                <span className="text-sm text-gray-200 ml-2">{currentUser.department}</span>
              </div>
            </div>
          )}
          
          {currentUser.callCenterId && (
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-sm text-gray-400">Call Center ID:</span>
                <span className="text-sm text-gray-200 ml-2 font-mono">{currentUser.callCenterId}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <div className="space-y-1">
          {/* Edit Profile */}
          <button
            onClick={() => handleNavigation('/profile')}
            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          {/* User Management (Admin & Manager) */}
          {(currentUser.role === 'Administrator' || currentUser.role === 'Manager') && (
            <button
              onClick={() => handleNavigation('/users')}
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>
                {currentUser.role === 'Administrator' ? 'User Management' : 'Team Management'}
              </span>
            </button>
          )}

          {/* System Metrics - Admin Only */}
          {currentUser.role === 'Administrator' && (
            <button
              onClick={() => handleNavigation('/metrics')}
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Monitor className="w-4 h-4" />
              <span>System Metrics</span>
            </button>
          )}

          {/* Database Admin - Admin Only */}
          {currentUser.role === 'Administrator' && (
            <button
              onClick={() => handleNavigation('/database')}
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Database Admin</span>
            </button>
          )}

          {/* About */}
          <button
            onClick={() => handleNavigation('/about')}
            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>

          {/* Contact */}
          <button
            onClick={() => handleNavigation('/contact')}
            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Phone className="w-4 h-4" />
            <span>Contact</span>
          </button>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* User Info Summary */}
        <div className="p-4 border-t border-gray-700 bg-gray-750">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Account Info</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Access Level: {currentUser.role}</p>
            <p>Department: {currentUser.department || 'Not assigned'}</p>
            {currentUser.callCenterId && (
              <p>Genesys Queue ID: {currentUser.callCenterId}</p>
            )}
          </div>
        </div>
    </motion.div>
  );
};

export default UserProfileDropdown;