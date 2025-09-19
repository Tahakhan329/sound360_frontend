import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  Settings, 
  Headphones,
  Phone,
  Mic,
  Shield,
  Cloud,
  Users,
  Monitor
} from 'lucide-react';

const TopNavigation: React.FC = () => {
  const { user } = useAuth();
  
  // Define navigation based on user role
  const getNavigationForRole = (role: string) => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Administrator', 'Manager'] },
      { name: 'Call Center', href: '/call-center', icon: Phone, roles: ['Administrator', 'Manager', 'Agent'] },
      { name: 'Real-Time Monitor', href: '/real-time', icon: Activity, roles: ['Administrator', 'Manager', 'Agent'] },
      { name: 'Audio Sessions', href: '/sessions', icon: Headphones, roles: ['Administrator', 'Manager', 'Agent'] },
      { name: 'Content Filter', href: '/content-filter', icon: Shield, roles: ['Administrator', 'Manager', 'Agent'] },
      { name: 'Conversations', href: '/conversations', icon: MessageSquare, roles: ['Administrator', 'Manager'] },
      { name: 'Voice Chat', href: '/voice-chat', icon: Mic, roles: ['Administrator'] }
    ];
    return baseNavigation.filter(item => item.roles.includes(role));
  };
  
  const navigation = user ? getNavigationForRole(user.role) : [];

  return (
    <nav className="bg-gray-800 shadow-xl border-b border-gray-700">
      <div className="px-6 py-4">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden p-1">
              <img 
                src="/Inseyab logo copy.png" 
                alt="Inseyab Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Sound360</h1>
              <p className="text-xs text-gray-400">Genesys AI Voice Assistant</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-6 h-6" />
                  <span className="hidden lg:inline">{item.name}</span>
                </NavLink>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;