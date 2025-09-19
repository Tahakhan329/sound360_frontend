import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Activity, 
  Settings, 
  Headphones,
  Mic, 
  Info,
  Phone,
  Users,
  User
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Conversations', href: '/conversations', icon: MessageSquare },
    { name: 'System Metrics', href: '/metrics', icon: Activity },
    { name: 'Audio Sessions', href: '/sessions', icon: Headphones },
    { name: 'Configuration', href: '/configuration', icon: Settings },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Phone },
  ];

  return (
    <div className="w-64 bg-gray-800 shadow-xl border-r border-gray-700 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
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
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

    </div>
  );
};

export default Sidebar;