import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Conversations from './components/Conversations';
import SystemMetrics from './components/SystemMetrics';
import Configuration from './components/Configuration';
import AudioSessions from './components/AudioSessions';
import ContentFilter from './components/ContentFilter';
import VoiceChat from './components/VoiceChat';
import CallCenterDashboard from './components/CallCenterDashboard';
import RealTimeMonitoring from './components/RealTimeMonitoring';
import TopNavigation from './components/TopNavigation';
import Header from './components/Header';
import UserManagement from './components/UserManagement';
import About from './components/About';
import Contact from './components/Contact';
import UserProfile from './components/UserProfile';
import GenesysIntegration from './components/GenesysIntegration';
import DatabaseAdmin from './components/DatabaseAdmin';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, login } = useAuth();

  // Check system health status - must be called before any conditional returns
  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/health');
        return response.json();
      } catch (error) {
        return { status: 'offline' };
      }
    },
    refetchInterval: 5000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Sound360...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // Role-based route access control
  const hasAccess = (requiredRoles: string[]) => {
    return user && requiredRoles.includes(user.role);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <div className="flex flex-col">
          <TopNavigation />
          <div className="flex-1">
            <Header currentUser={user} />
            <main className="flex-1 p-6 bg-gray-900">
              <Routes>
                {/* Dashboard - Admin & Manager only */}
                {hasAccess(['Administrator', 'Manager']) && (
                  <Route path="/" element={<Dashboard />} />
                )}
                
                {/* Call Center - All roles */}
                {hasAccess(['Administrator', 'Manager', 'Agent']) && (
                  <Route path="/call-center" element={<CallCenterDashboard />} />
                )}
                
                {/* Real-Time Monitoring - All roles */}
                {hasAccess(['Administrator', 'Manager', 'Agent']) && (
                  <Route path="/real-time" element={<RealTimeMonitoring />} />
                )}
                
                {/* Audio Sessions - All roles */}
                {hasAccess(['Administrator', 'Manager', 'Agent']) && (
                  <Route path="/sessions" element={<AudioSessions />} />
                )}
                
                {/* Content Filter - All roles */}
                {hasAccess(['Administrator', 'Manager', 'Agent']) && (
                  <Route path="/content-filter" element={<ContentFilter />} />
                )}
                
                {/* Conversations - Admin & Manager only */}
                {hasAccess(['Administrator', 'Manager']) && (
                  <Route path="/conversations" element={<Conversations />} />
                )}
                
                {/* Voice Chat - Admin only */}
                {hasAccess(['Administrator']) && (
                  <Route path="/voice-chat" element={<VoiceChat />} />
                )}
                
                {/* System Metrics - Admin only */}
                {hasAccess(['Administrator']) && (
                  <Route path="/metrics" element={<SystemMetrics />} />
                )}
                
                {/* User Management - Admin & Manager */}
                {hasAccess(['Administrator', 'Manager']) && (
                  <Route path="/users" element={<UserManagement />} />
                )}
                
                {/* Genesys Integration - Admin only */}
                {hasAccess(['Administrator']) && (
                  <Route path="/genesys" element={<GenesysIntegration />} />
                )}
                
                {/* Database Admin - Admin only */}
                {hasAccess(['Administrator']) && (
                  <Route path="/database" element={<DatabaseAdmin />} />
                )}
                
                {/* Profile - All authenticated users */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/profile" element={<UserProfile user={user} />} />
                
                {/* Default redirect for unauthorized access */}
                <Route path="*" element={
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-100 mb-4">Access Denied</h2>
                    <p className="text-gray-400">You don't have permission to access this page.</p>
                  </div>
                } />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;