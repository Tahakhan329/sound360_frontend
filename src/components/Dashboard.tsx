import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, MessageSquare, Cpu, MemoryStick, Zap, Shield, AlertTriangle, Phone, Clock, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import io from 'socket.io-client';

interface SystemMetrics {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  active_connections: number;
  requests_per_minute: number;
  response_time: number;
  error_rate: number;
}

interface DashboardStats {
  totalConversations: number;
  activeConnections: number;
  avgResponseTime: number;
  systemHealth: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [realtimeMetrics, setRealtimeMetrics] = useState<SystemMetrics | null>(null);
  const [socket, setSocket] = useState<any>(null);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Fetch system metrics
  const { data: metrics } = useQuery<SystemMetrics[]>({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics?hours=1');
      return response.json();
    },
    refetchInterval: 10000,
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    try {
      const newSocket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket.IO connected successfully');
      });

      newSocket.on('metrics_update', (data: SystemMetrics) => {
        setRealtimeMetrics(data);
      });

      newSocket.on('connect_error', (error) => {
        console.log('Socket.IO connection error:', error.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
      });

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error('Failed to initialize Socket.IO:', error);
    }
  }, []);

  const statCards = [
    {
      title: 'Active Genesys Calls',
      value: realtimeMetrics?.active_connections || stats?.active_connections || 0,
      icon: Phone,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Calls Processed Today',
      value: '1,234',
      icon: MessageSquare,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Avg Handle Time',
      value: '4.2m',
      icon: Clock,
      color: 'bg-purple-500',
      change: '-15%',
    },
    {
      title: 'First Call Resolution',
      value: '87.5%',
      icon: Target,
      color: 'bg-indigo-500',
      change: '+3%',
    },
    {
      title: 'AI Accuracy',
      value: '96.8%',
      icon: Zap,
      color: 'bg-yellow-500',
      change: '+2%',
    },
  ];

  // Add system metrics for Admin only
  if (user?.role === 'Administrator') {
    statCards.push({
      title: 'CPU Usage',
      value: `${realtimeMetrics?.cpu_usage?.toFixed(1) || 0}%`,
      icon: Cpu,
      color: 'bg-orange-500',
      change: '-2%',
    });
    statCards.push({
      title: 'Content Filtered',
      value: stats?.content_filtering?.flagged_content || 0,
      icon: Shield,
      color: 'bg-red-500',
      change: stats?.content_filtering?.flagged_percentage ? `${stats.content_filtering.flagged_percentage.toFixed(1)}%` : '0%',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            {user?.role === 'Administrator' ? 'Sound360 Admin Dashboard' : 
             user?.role === 'Manager' ? 'Call Center Management Dashboard' : 
             'Agent Dashboard'}
          </h1>
          <p className="text-gray-400 mt-1">
            {user?.role === 'Administrator' ? 'Complete system monitoring and analytics' :
             user?.role === 'Manager' ? 'Team performance and call center metrics' :
             'Your call center performance metrics'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{stat.value}</p>
                <p className="text-sm text-green-400 mt-1">{stat.change} from last hour</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Usage */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">System Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.slice(-20) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line 
                type="monotone" 
                dataKey="cpu_usage" 
                stroke="#60A5FA" 
                strokeWidth={2}
                name="CPU Usage"
              />
              <Line 
                type="monotone" 
                dataKey="memory_usage" 
                stroke="#34D399" 
                strokeWidth={2}
                name="Memory Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Active Connections */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Active Connections</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics?.slice(-20) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area 
                type="monotone" 
                dataKey="active_connections" 
                stroke="#A78BFA" 
                fill="#A78BFA" 
                fillOpacity={0.3}
                name="Connections"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { time: '2 minutes ago', event: 'New conversation started', user: 'User #1234' },
            { time: '5 minutes ago', event: 'Audio processing completed', user: 'User #5678' },
            { time: '7 minutes ago', event: 'Flagged content detected', user: 'User #9012', type: 'warning' },
            { time: '8 minutes ago', event: 'Configuration updated', user: 'Admin' },
            { time: '12 minutes ago', event: 'System health check passed', user: 'System' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'warning' ? 'bg-red-400' : 'bg-blue-400'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">{activity.event}</p>
                <p className="text-xs text-gray-400">{activity.user} • {activity.time}</p>
              </div>
              {activity.type === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Content Filtering Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
          <Shield className="w-6 h-6 text-blue-400 mr-2" />
          Content Filtering Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-300">Filter Status</p>
            <p className="text-lg font-bold text-green-400">Active</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-sm font-medium text-gray-300">Flagged Today</p>
            <p className="text-lg font-bold text-yellow-400">{stats?.content_filtering?.flagged_content || 0}</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-300">Escalations</p>
            <p className="text-lg font-bold text-red-400">{stats?.content_filtering?.escalations || 0}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;