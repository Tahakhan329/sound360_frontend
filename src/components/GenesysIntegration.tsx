import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Wifi,
  WifiOff,
  Database,
  BarChart3,
  Globe,
  Shield
} from 'lucide-react';

interface GenesysStatus {
  status: string;
  active_calls: number;
  websocket_connections: number;
  token_expires_at: number;
  environment: string;
  organization_id: string;
  monitored_queues: string[];
}

interface GenesysCall {
  conversation_id: string;
  session_id: string;
  customer_number: string;
  agent_id?: string;
  queue_name: string;
  start_time: string;
  status: string;
  direction: string;
  duration: number;
  current_sentiment?: string;
  sentiment_score?: number;
  detected_language?: string;
}

interface QueueStats {
  [queueId: string]: {
    waiting_calls: number;
    longest_wait: number;
    agents_available: number;
  };
}

const GenesysIntegration: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [configForm, setConfigForm] = useState({
    client_id: '',
    client_secret: '',
    environment: 'mypurecloud.com',
    organization_id: '',
    queue_ids: '',
    webhook_url: ''
  });

  const queryClient = useQueryClient();

  // Fetch Genesys integration status
  const { data: genesysStatus, isLoading: statusLoading } = useQuery<GenesysStatus>({
    queryKey: ['genesys-status'],
    queryFn: async () => {
      const response = await fetch('/api/genesys/status');
      if (response.status === 503) {
        setIsConfigured(false);
        return null;
      }
      const data = await response.json();
      setIsConfigured(data.status !== 'not_configured');
      return data;
    },
    refetchInterval: 10000,
    retry: false
  });

  // Fetch active Genesys calls
  const { data: activeCalls } = useQuery<GenesysCall[]>({
    queryKey: ['genesys-calls'],
    queryFn: async () => {
      const response = await fetch('/api/genesys/calls');
      return response.json();
    },
    refetchInterval: 5000,
    enabled: isConfigured
  });

  // Fetch queue statistics
  const { data: queueStats } = useQuery<QueueStats>({
    queryKey: ['genesys-queue-stats'],
    queryFn: async () => {
      const response = await fetch('/api/genesys/queues/stats');
      return response.json();
    },
    refetchInterval: 15000,
    enabled: isConfigured
  });

  // Configure Genesys integration
  const configureMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch('/api/genesys/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genesys-status'] });
      setIsConfigured(true);
    }
  });

  // Start/Stop integration
  const toggleMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      const response = await fetch(`/api/genesys/${action}`, { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genesys-status'] });
    }
  });

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      ...configForm,
      queue_ids: configForm.queue_ids.split(',').map(id => id.trim()).filter(id => id)
    };
    configureMutation.mutate(config);
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-400 bg-green-400/20';
      case 'NEGATIVE': return 'text-red-400 bg-red-400/20';
      default: return 'text-yellow-400 bg-yellow-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'healthy': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'token_expired': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Cloud Integration</h1>
          <p className="text-gray-400 mt-1">Connect Sound360 AI with Genesys Cloud call center</p>
        </div>
        {isConfigured && genesysStatus && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {genesysStatus.status === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className={`font-medium ${getStatusColor(genesysStatus.status)}`}>
                {genesysStatus.status.charAt(0).toUpperCase() + genesysStatus.status.slice(1)}
              </span>
            </div>
            <button
              onClick={() => toggleMutation.mutate(genesysStatus.status === 'connected' ? 'stop' : 'start')}
              disabled={toggleMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                genesysStatus.status === 'connected'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {genesysStatus.status === 'connected' ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Stop Integration</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Integration</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      {!isConfigured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Settings className="w-6 h-6 text-blue-400 mr-2" />
            Configure Genesys Cloud Integration
          </h3>
          
          <form onSubmit={handleConfigure} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client ID *
                </label>
                <input
                  type="text"
                  value={configForm.client_id}
                  onChange={(e) => setConfigForm({...configForm, client_id: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys OAuth Client ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client Secret *
                </label>
                <input
                  type="password"
                  value={configForm.client_secret}
                  onChange={(e) => setConfigForm({...configForm, client_secret: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys OAuth Client Secret"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Environment *
                </label>
                <select
                  value={configForm.environment}
                  onChange={(e) => setConfigForm({...configForm, environment: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="mypurecloud.com">US East (mypurecloud.com)</option>
                  <option value="mypurecloud.ie">EMEA (mypurecloud.ie)</option>
                  <option value="mypurecloud.com.au">APAC (mypurecloud.com.au)</option>
                  <option value="mypurecloud.jp">Japan (mypurecloud.jp)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization ID *
                </label>
                <input
                  type="text"
                  value={configForm.organization_id}
                  onChange={(e) => setConfigForm({...configForm, organization_id: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys Organization ID"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Queue IDs (comma-separated) *
              </label>
              <input
                type="text"
                value={configForm.queue_ids}
                onChange={(e) => setConfigForm({...configForm, queue_ids: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                placeholder="queue-id-1, queue-id-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Webhook URL *
              </label>
              <input
                type="url"
                value={configForm.webhook_url}
                onChange={(e) => setConfigForm({...configForm, webhook_url: e.target.value})}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-sound360-server.com/api/genesys/webhook"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={configureMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {configureMutation.isPending ? 'Configuring...' : 'Configure Genesys Integration'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Integration Status */}
      {isConfigured && genesysStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Connection Status</p>
                <p className={`text-lg font-bold mt-1 ${getStatusColor(genesysStatus.status)}`}>
                  {genesysStatus.status.charAt(0).toUpperCase() + genesysStatus.status.slice(1)}
                </p>
              </div>
              {genesysStatus.status === 'connected' ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Calls</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{genesysStatus.active_calls}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Audio Streams</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{genesysStatus.websocket_connections}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Monitored Queues</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{genesysStatus.monitored_queues?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Active Genesys Calls */}
      {isConfigured && activeCalls && activeCalls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700"
        >
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <Phone className="w-6 h-6 text-blue-400 mr-2" />
              Active Genesys Calls ({activeCalls.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {activeCalls.map((call, index) => (
              <motion.div
                key={call.conversation_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <h4 className="text-lg font-medium text-gray-100">
                        Call {call.conversation_id.slice(-8)}
                      </h4>
                      <span className="text-sm text-gray-400">
                        {call.customer_number}
                      </span>
                      {call.current_sentiment && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(call.current_sentiment)}`}>
                          {call.current_sentiment}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Queue:</span>
                        <p className="text-gray-200">{call.queue_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Direction:</span>
                        <p className="text-gray-200 capitalize">{call.direction}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <p className="text-gray-200">
                          {Math.floor(call.duration / 60)}:{(call.duration % 60).toFixed(0).padStart(2, '0')}
                        </p>
                      </div>
                      {call.detected_language && (
                        <div>
                          <span className="text-gray-400">Language:</span>
                          <p className="text-gray-200">{call.detected_language.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Queue Statistics */}
      {isConfigured && queueStats && Object.keys(queueStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <Users className="w-6 h-6 text-green-400 mr-2" />
            Genesys Queue Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(queueStats).map(([queueId, stats]) => (
              <div key={queueId} className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-100 mb-3">Queue {queueId.slice(-8)}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Waiting Calls:</span>
                    <span className="text-gray-200">{stats.waiting_calls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Longest Wait:</span>
                    <span className="text-gray-200">{Math.floor(stats.longest_wait / 60)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Agents:</span>
                    <span className="text-gray-200">{stats.agents_available}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Integration Info */}
      {isConfigured && genesysStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Integration Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-300 mb-3">Genesys Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Environment:</span>
                  <span className="text-gray-200">{genesysStatus.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Organization:</span>
                  <span className="text-gray-200 font-mono">{genesysStatus.organization_id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monitored Queues:</span>
                  <span className="text-gray-200">{genesysStatus.monitored_queues?.length || 0}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-300 mb-3">Sound360 Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-200">Real-time Transcription</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-200">Sentiment Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-200">Speaker Diarization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-200">Auto Escalation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-200">30+ Languages</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Setup Instructions */}
      {!isConfigured && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 bg-opacity-20 border border-blue-500 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-400 mb-4">Setup Instructions</h3>
          <div className="space-y-3 text-sm text-blue-100">
            <p><strong>1.</strong> Create OAuth Client in Genesys Cloud Admin</p>
            <p><strong>2.</strong> Grant required permissions (conversations, analytics, recordings)</p>
            <p><strong>3.</strong> Get your Organization ID and Queue IDs</p>
            <p><strong>4.</strong> Configure webhook URL (must be publicly accessible)</p>
            <p><strong>5.</strong> Fill in the configuration form above</p>
          </div>
          <div className="mt-4 p-3 bg-blue-700 bg-opacity-30 rounded-lg">
            <p className="text-xs text-blue-200">
              <strong>Note:</strong> For testing, you can use ngrok to expose your local server: 
              <code className="bg-blue-800 px-2 py-1 rounded ml-2">ngrok http 8000</code>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GenesysIntegration;