import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Headphones, Clock, MessageSquare, Play, Pause, Download, Mic, Square } from 'lucide-react';

interface AudioSession {
  id: string;
  session_id: string;
  start_time: string;
  end_time?: string;
  total_duration: number;
  message_count: number;
  status: string;
}

const AudioSessions: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery<AudioSession[]>({
    queryKey: ['audio-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/sessions');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Mutation to start a new audio session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const sessionId = `session_${Date.now()}`;
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          start_time: new Date().toISOString(),
          status: 'active'
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-sessions'] });
      setIsRecording(true);
    },
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSessions = sessions?.length || 0;
  const activeSessions = sessions?.filter(s => s.status === 'active').length || 0;
  const totalDuration = sessions?.reduce((acc, s) => acc + s.total_duration, 0) || 0;
  const totalMessages = sessions?.reduce((acc, s) => acc + s.message_count, 0) || 0;

  const handleStartRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          startSessionMutation.mutate();
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
          alert('Unable to access microphone. Please check your permissions.');
        });
    } else {
      alert('Your browser does not support audio recording.');
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Here you would typically stop the actual recording and update the session
    queryClient.invalidateQueries({ queryKey: ['audio-sessions'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Call Sessions</h1>
          <p className="text-gray-400 mt-1">Monitor and manage Genesys call sessions with AI analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={startSessionMutation.isPending}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Mic className="w-5 h-5" />
              <span>{startSessionMutation.isPending ? 'Starting...' : 'Start Call Session'}</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <Square className="w-5 h-5" />
              <span>End Call Session</span>
            </button>
          )}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sessions</option>
            <option value="active">Active Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 bg-opacity-20 border border-red-500 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-medium">Genesys call session in progress...</span>
            <div className="flex-1"></div>
            <span className="text-red-400 text-sm">Click "End Call Session" to complete</span>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{totalSessions}</p>
            </div>
            <Headphones className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{activeSessions}</p>
            </div>
            <Play className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Duration</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{formatDuration(totalDuration)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Messages</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{totalMessages}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Recent Sessions</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading sessions...</p>
            </div>
          ) : sessions?.length === 0 ? (
            <div className="p-6 text-center">
              <Headphones className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No audio sessions found</p>
              <button
                onClick={handleStartRecording}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Mic className="w-5 h-5" />
                <span>Start Your First Session</span>
              </button>
            </div>
          ) : (
            sessions?.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <Headphones className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-100">
                          Session {session.session_id.slice(-8)}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatDuration(session.total_duration)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {session.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Started:</span>
                        <p className="font-medium text-gray-200">{new Date(session.start_time).toLocaleString()}</p>
                      </div>
                      {session.end_time && (
                        <div>
                          <span className="text-gray-400">Ended:</span>
                          <p className="font-medium text-gray-200">{new Date(session.end_time).toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Session ID:</span>
                        <p className="font-medium font-mono text-gray-200">{session.session_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.status === 'active' ? (
                      <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button className="p-2 text-gray-500 hover:text-green-400 transition-colors">
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 text-gray-500 hover:text-blue-400 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioSessions;