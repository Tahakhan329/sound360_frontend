import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Phone, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Headphones,
  MessageSquare,
  Star,
  Target,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
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
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface CallCenterMetrics {
  overview: {
    total_calls: number;
    avg_call_duration: number;
    avg_satisfaction: number;
    resolution_rate: number;
  };
  sentiment_distribution: Record<string, { count: number; avg_satisfaction: number }>;
  peak_hours: Array<{ hour: number; calls: number }>;
  performance_metrics: {
    first_call_resolution: number;
    average_handle_time: number;
    customer_effort_score: number;
    net_promoter_score: number;
    agent_utilization: number;
    call_abandonment_rate: number;
    service_level: number;
    quality_score: number;
  };
}

const CallCenterDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('24');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch call center analytics
  const { data: metrics, isLoading } = useQuery<CallCenterMetrics>({
    queryKey: ['call-center-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/call-center/analytics?hours=${timeRange}`);
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch real-time active sessions
  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/call-center/active-sessions');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const kpiCards = [
    {
      title: 'Total Calls',
      value: metrics?.overview.total_calls || 0,
      icon: Phone,
      color: 'bg-blue-500',
      change: '+12%',
      target: 1000
    },
    {
      title: 'Resolution Rate',
      value: `${metrics?.overview.resolution_rate?.toFixed(1) || 0}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+5%',
      target: 90
    },
    {
      title: 'Avg Handle Time',
      value: `${metrics?.performance_metrics.average_handle_time?.toFixed(1) || 0}m`,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-8%',
      target: 5
    },
    {
      title: 'Customer Satisfaction',
      value: `${metrics?.overview.avg_satisfaction?.toFixed(1) || 0}/5`,
      icon: Star,
      color: 'bg-purple-500',
      change: '+3%',
      target: 4.5
    },
    {
      title: 'First Call Resolution',
      value: `${metrics?.performance_metrics.first_call_resolution?.toFixed(1) || 0}%`,
      icon: Target,
      color: 'bg-indigo-500',
      change: '+7%',
      target: 85
    },
    {
      title: 'Service Level',
      value: `${metrics?.performance_metrics.service_level?.toFixed(1) || 0}%`,
      icon: Zap,
      color: 'bg-pink-500',
      change: '+2%',
      target: 95
    }
  ];

  const sentimentData = metrics?.sentiment_distribution ? Object.entries(metrics.sentiment_distribution).map(([sentiment, data]) => ({
    name: sentiment,
    value: data.count,
    satisfaction: data.avg_satisfaction
  })) : [];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Call Center Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time call analytics powered by Sound360 AI</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Last Hour</option>
            <option value="24">Last 24 Hours</option>
            <option value="168">Last Week</option>
            <option value="720">Last Month</option>
          </select>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Genesys Live</span>
          </div>
        </div>
      </div>

      {/* Active Sessions Alert */}
      {activeSessions && activeSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-600 bg-opacity-20 border border-green-500 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Phone className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-green-400 font-semibold">Active Genesys Calls</h3>
              <p className="text-green-300 text-sm">
                {activeSessions.length} customers currently being assisted by Sound360 AI
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.color} p-3 rounded-lg`}>
                <kpi.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium">{kpi.change}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-gray-100">{kpi.value}</p>
              <div className="mt-2 bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${kpi.color}`}
                  style={{ width: `${(parseFloat(kpi.value.toString()) / kpi.target) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: {kpi.target}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Volume Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Call Volume Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics?.peak_hours || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="hour" 
                stroke="#9CA3AF"
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                formatter={(value: number) => [value, 'Calls']}
                labelFormatter={(value) => `${value}:00`}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Area 
                type="monotone" 
                dataKey="calls" 
                stroke="#60A5FA" 
                fill="#60A5FA" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sentiment Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Customer Sentiment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [value, `${name} Calls`]}
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-100">NPS Score</h4>
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-2">
            {metrics?.performance_metrics.net_promoter_score?.toFixed(1) || 0}
          </div>
          <div className="text-sm text-green-400">+0.5 from last week</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-100">Agent Utilization</h4>
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-2">
            {metrics?.performance_metrics.agent_utilization?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-blue-400">Optimal range: 70-85%</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-100">Quality Score</h4>
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-2">
            {metrics?.performance_metrics.quality_score?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-purple-400">Above target (85%)</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-100">Abandonment Rate</h4>
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-2">
            {metrics?.performance_metrics.call_abandonment_rate?.toFixed(1) || 0}%
          </div>
          <div className="text-sm text-red-400">Target: &lt;3%</div>
        </div>
      </div>

      {/* Real-time Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Call Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Activity className="w-6 h-6 text-green-400 mr-2" />
            Live Call Analytics
          </h3>
          
          {activeSessions && activeSessions.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activeSessions.map((session: any, index: number) => (
                <div key={session.session_id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium text-gray-100">
                        Session {session.session_id.slice(-8)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {Math.floor(session.duration / 60)}:{(session.duration % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Transcriptions:</span>
                      <span className="text-gray-200 ml-2">{session.transcription_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Language:</span>
                      <span className="text-gray-200 ml-2">
                        {session.live_analytics?.dominant_language || 'Auto'}
                      </span>
                    </div>
                  </div>
                  
                  {session.live_analytics?.urgency_alerts > 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">High urgency detected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No active call sessions</p>
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active Agents</span>
              <span className="text-gray-100 font-semibold">
                {activeSessions?.length || 0} AI / 5 Human
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Queue Length</span>
              <span className="text-gray-100 font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Avg Wait Time</span>
              <span className="text-gray-100 font-semibold">0s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Languages Supported</span>
              <span className="text-gray-100 font-semibold">30+</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Compliance Score</span>
              <span className="text-green-400 font-semibold">98.5%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Globe className="w-6 h-6 text-blue-400 mr-2" />
            Language Distribution
          </h3>
          <div className="space-y-4">
            {[
              { language: 'English', percentage: 65, calls: 1250 },
              { language: 'Arabic', percentage: 25, calls: 480 },
              { language: 'Spanish', percentage: 7, calls: 135 },
              { language: 'French', percentage: 3, calls: 58 }
            ].map((lang, index) => (
              <div key={lang.language} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" style={{ 
                    backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                  }}></div>
                  <span className="text-gray-300">{lang.language}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 text-sm">{lang.calls} calls</span>
                  <span className="text-gray-100 font-semibold">{lang.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Issue Categories */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Top Issue Categories</h3>
          <div className="space-y-4">
            {[
              { category: 'Technical Support', count: 450, percentage: 35, trend: '+5%' },
              { category: 'Billing Inquiries', count: 320, percentage: 25, trend: '-2%' },
              { category: 'Account Management', count: 280, percentage: 22, trend: '+8%' },
              { category: 'Product Information', count: 180, percentage: 14, trend: '+12%' },
              { category: 'Complaints', count: 50, percentage: 4, trend: '-15%' }
            ].map((issue, index) => (
              <div key={issue.category} className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 font-medium">{issue.category}</p>
                  <p className="text-gray-500 text-sm">{issue.count} calls</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-100 font-semibold">{issue.percentage}%</p>
                  <p className={`text-sm ${issue.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {issue.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-6">AI Assistant Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Transcription Accuracy</h4>
            <p className="text-2xl font-bold text-blue-400 mt-1">96.8%</p>
            <p className="text-sm text-gray-400">+2.1% this week</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Response Speed</h4>
            <p className="text-2xl font-bold text-green-400 mt-1">1.2s</p>
            <p className="text-sm text-gray-400">-0.3s improvement</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Language Detection</h4>
            <p className="text-2xl font-bold text-purple-400 mt-1">99.2%</p>
            <p className="text-sm text-gray-400">30+ languages</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="font-semibold text-gray-100">Compliance Rate</h4>
            <p className="text-2xl font-bold text-yellow-400 mt-1">98.5%</p>
            <p className="text-sm text-gray-400">Industry leading</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CallCenterDashboard;