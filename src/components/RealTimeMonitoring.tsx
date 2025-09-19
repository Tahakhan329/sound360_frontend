import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Monitor, 
  Mic, 
  Volume2, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Eye,
  EyeOff,
  Settings,
  Download,
  Filter,
  Search
} from 'lucide-react';

interface LiveSession {
  session_id: string;
  customer_info: {
    name?: string;
    tier: string;
    language: string;
  };
  status: string;
  duration: number;
  transcription_count: number;
  current_sentiment: string;
  urgency_level: string;
  last_activity: string;
  live_analytics: {
    sentiment_trend: Array<{ timestamp: string; sentiment: string; score: number }>;
    keyword_frequency: Record<string, number>;
    urgency_alerts: Array<{ timestamp: string; triggers: string[] }>;
    compliance_score: number;
  };
}

const RealTimeMonitoring: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch active sessions
  const { data: liveSessions, isLoading } = useQuery<LiveSession[]>({
    queryKey: ['live-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/call-center/live-sessions');
      return response.json();
    },
    refetchInterval: 2000, // Refresh every 2 seconds for real-time monitoring
    enabled: isMonitoring
  });

  // Fetch detailed session data for selected session
  const { data: sessionDetails } = useQuery({
    queryKey: ['session-details', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return null;
      const response = await fetch(`/api/call-center/session/${selectedSession}`);
      return response.json();
    },
    refetchInterval: 1000,
    enabled: !!selectedSession && isMonitoring
  });

  const filteredSessions = liveSessions?.filter(session => {
    const matchesSearch = !searchTerm || 
      session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.customer_info.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'urgent' && session.urgency_level === 'high') ||
      (filterBy === 'negative' && session.current_sentiment === 'NEGATIVE') ||
      (filterBy === 'vip' && session.customer_info.tier === 'vip');
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-400 bg-green-400/20';
      case 'NEGATIVE': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-green-400 bg-green-400/20';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'text-purple-400 bg-purple-400/20';
      case 'premium': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-600 text-red-100';
      case 'Manager':
        return 'bg-blue-600 text-blue-100';
      case 'User':
        return 'bg-green-600 text-green-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Real-Time Monitoring</h1>
          <p className="text-gray-400 mt-1">Monitor live Genesys calls with Sound360 AI analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isMonitoring ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isMonitoring ? 'Pause' : 'Resume'} Genesys Monitoring</span>
          </button>
        </div>
      </div>

      {/* Monitoring Status */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-gray-100 font-medium">
              {isMonitoring ? 'Genesys Monitoring Active' : 'Monitoring Paused'}
            </span>
            <span className="text-gray-400">
              {filteredSessions.length} active Genesys calls
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Sessions</option>
              <option value="urgent">High Urgency</option>
              <option value="negative">Negative Sentiment</option>
              <option value="vip">VIP Customers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading live sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No active call sessions</p>
          </div>
        ) : (
          filteredSessions.map((session, index) => (
            <motion.div
              key={session.session_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-800 rounded-xl border p-6 cursor-pointer transition-all ${
                selectedSession === session.session_id 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedSession(session.session_id)}
            >
              {/* Session Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-100">
                    Session {session.session_id.slice(-8)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(session.customer_info.tier)}`}>
                  {session.customer_info.tier.toUpperCase()}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-4">
                {session.customer_info.name && (
                  <p className="text-gray-300">
                    <span className="text-gray-400">Customer:</span> {session.customer_info.name}
                  </p>
                )}
                <p className="text-gray-300">
                  <span className="text-gray-400">Language:</span> {session.customer_info.language}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Duration:</span> {Math.floor(session.duration / 60)}:{(session.duration % 60).toFixed(0).padStart(2, '0')}
                </p>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(session.current_sentiment)}`}>
                  {session.current_sentiment}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(session.urgency_level)}`}>
                  {session.urgency_level.toUpperCase()}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Transcriptions:</span>
                  <span className="text-gray-200 ml-2">{session.transcription_count}</span>
                </div>
                <div>
                  <span className="text-gray-400">Compliance:</span>
                  <span className="text-gray-200 ml-2">{(session.live_analytics.compliance_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Alerts */}
              {session.live_analytics.urgency_alerts.length > 0 && (
                <div className="mt-4 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">
                    {session.live_analytics.urgency_alerts.length} urgency alert(s)
                  </span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Detailed Session View */}
      {selectedSession && sessionDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-blue-500 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-100">
              Session Details: {selectedSession.slice(-8)}
            </h3>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setSelectedSession('')}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <EyeOff className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Transcription */}
            <div>
              <h4 className="text-md font-semibold text-gray-100 mb-4">Live Transcription</h4>
              <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
                {sessionDetails.transcription_history?.map((entry: any, index: number) => (
                  <div key={index} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(entry.analytics?.analytics?.sentiment?.label || 'NEUTRAL')}`}>
                        {entry.analytics?.analytics?.sentiment?.label || 'NEUTRAL'}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">{entry.transcription.text}</p>
                  </div>
                )) || (
                  <p className="text-gray-400 text-center">No transcription data yet</p>
                )}
              </div>
            </div>

            {/* Analytics Panel */}
            <div>
              <h4 className="text-md font-semibold text-gray-100 mb-4">Live Analytics</h4>
              <div className="space-y-4">
                {/* Sentiment Trend */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Sentiment Trend</h5>
                  <div className="flex items-center space-x-2">
                    {sessionDetails.live_analytics?.sentiment_trend?.slice(-5).map((point: any, index: number) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${getSentimentColor(point.sentiment).split(' ')[1]}`}
                        title={`${point.sentiment} (${point.score.toFixed(2)})`}
                      ></div>
                    )) || <span className="text-gray-400 text-sm">No data</span>}
                  </div>
                </div>

                {/* Top Keywords */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Top Keywords</h5>
                  <div className="space-y-1">
                    {Object.entries(sessionDetails.live_analytics?.keyword_frequency || {})
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([keyword, count]) => (
                        <div key={keyword} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{keyword}</span>
                          <span className="text-gray-400 text-xs">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Compliance Score */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Compliance Score</h5>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(sessionDetails.live_analytics?.compliance_score || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-200 text-sm">
                      {((sessionDetails.live_analytics?.compliance_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Urgency Alerts */}
                {sessionDetails.live_analytics?.urgency_alerts?.length > 0 && (
                  <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Urgency Alerts
                    </h5>
                    <div className="space-y-1">
                      {sessionDetails.live_analytics.urgency_alerts.map((alert: any, index: number) => (
                        <div key={index} className="text-red-300 text-sm">
                          {new Date(alert.timestamp).toLocaleTimeString()}: {alert.triggers.join(', ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{filteredSessions.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Session Duration</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {filteredSessions.length > 0 
                  ? Math.floor(filteredSessions.reduce((acc, s) => acc + s.duration, 0) / filteredSessions.length / 60)
                  : 0}m
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">High Urgency</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {filteredSessions.filter(s => s.urgency_level === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">VIP Customers</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {filteredSessions.filter(s => s.customer_info.tier === 'vip').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitoring;