import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, User, Lock, Building2 } from 'lucide-react';

interface LoginProps {
  onLogin?: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // For demo purposes, use mock authentication
      if (formData.email === 'admin@sound360.local' && formData.password === 'admin123') {
        onLogin({
          id: '1',
          name: 'System Administrator',
          email: 'admin@sound360.local',
          role: 'Administrator',
          department: 'IT',
          callCenterId: 'CC001'
        });
      } else if (formData.email === 'john@sound360.local' && formData.password === 'john123') {
        onLogin({
          id: '2',
          name: 'John Manager',
          email: 'john@sound360.local',
          role: 'Manager',
          department: 'Customer Service',
          callCenterId: 'CC002'
        });
      } else if (formData.email === 'mike@sound360.local' && formData.password === 'mike123') {
        onLogin({
          id: '3',
          name: 'Mike Agent',
          email: 'mike@sound360.local',
          role: 'Agent',
          department: 'Customer Service',
          callCenterId: 'CC004'
        });
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full mx-auto mb-6 p-2 bg-gray-800 border border-gray-700">
            <img 
              src="/Inseyab logo copy.png" 
              alt="Inseyab Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-100">Sound360</h2>
          <p className="text-gray-400 mt-2">AI Voice Assistant Platform</p>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-3"
              >
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Demo Credentials</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Administrator:</span>
                <span>admin@sound360.local / admin123</span>
              </div>
              <div className="flex justify-between">
                <span>Manager:</span>
                <span>john@sound360.local / john123</span>
              </div>
              <div className="flex justify-between">
                <span>Agent:</span>
                <span>mike@sound360.local / mike123</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <Building2 className="w-4 h-4" />
            <span>Powered by Inseyab</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            © 2024 Inseyab. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;