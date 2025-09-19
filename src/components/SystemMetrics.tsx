import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Cpu, MemoryStick, Activity, Zap, Clock, AlertTriangle } from 'lucide-react';

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

const SystemMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24');

  const { data: metrics, isLoading } = useQuery<SystemMetrics[]>({
    queryKey: ['system-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/metrics?hours=${timeRange}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  const latestMetrics = metrics?.[0];

  const metricCards = [
    {
      title: 'CPU Usage',
      value: `${latestMetrics?.cpu_usage?.toFixed(1) || 0}%`,
      icon: Cpu,
      color: 'bg-blue-500',
      status: (latestMetrics?.cpu_usage || 0) > 80 ? 'high' : 'normal',
    },
    {
      title: 'Memory Usage',
      value: `${latestMetrics?.memory_usage?.toFixed(1) || 0}%`,
      icon: MemoryStick,
      color: 'bg-green-500',
      status: (latestMetrics?.memory_usage || 0) > 85 ? 'high' : 'normal',
    },
    {
      title: 'GPU Usage',
      value: `${latestMetrics?.gpu_usage?.toFixed(1) || 0}%`,
      icon: Zap,
      color: 'bg-yellow-500',
      status: (latestMetrics?.gpu_usage || 0) > 90 ? 'high' : 'normal',
    },
    {
      title: 'Response Time',
      value: `${latestMetrics?.response_time?.toFixed(2) || 0}s`,
      icon: Clock,
      color: 'bg-purple-500',
      status: (latestMetrics?.response_time || 0) > 2 ? 'high' : 'normal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">System Metrics</h1>
          <p className="text-gray-400 mt-1">Monitor system performance and health</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="1">Last Hour</option>
          <option value="6">Last 6 Hours</option>
          <option value="24">Last 24 Hours</option>
          <option value="168">Last Week</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.status === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 mr-1" />
                  ) : (
                    <Activity className="w-4 h-4 text-green-400 mr-1" />
                  )}
                  <span className={`text-sm ${metric.status === 'high' ? 'text-red-400' : 'text-green-400'}`}>
                    {metric.status === 'high' ? 'High Usage' : 'Normal'}
                  </span>
                </div>
              </div>
              <div className={`${metric.color} p-3 rounded-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
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
          <h3 className="text-lg font-semibold text-gray-100 mb-4">CPU & Memory Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.slice(-50) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis domain={[0, 100]} stroke="#9CA3AF" />
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

        {/* GPU Usage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">GPU Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics?.slice(-50) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis domain={[0, 100]} stroke="#9CA3AF" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'GPU Usage']}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Area 
                type="monotone" 
                dataKey="gpu_usage" 
                stroke="#FBBF24" 
                fill="#FBBF24" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Response Time */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Response Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics?.slice(-50) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value.toFixed(3)}s`, 'Response Time']}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line 
                type="monotone" 
                dataKey="response_time" 
                stroke="#A78BFA" 
                strokeWidth={2}
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
            <BarChart data={metrics?.slice(-20) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [value, 'Connections']}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar 
                dataKey="active_connections" 
                fill="#22D3EE"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* System Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4">System Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Overall Status</h4>
            <p className="text-green-400 font-medium">Healthy</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Performance</h4>
            <p className="text-blue-400 font-medium">Optimal</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Uptime</h4>
            <p className="text-purple-400 font-medium">99.9%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemMetrics;