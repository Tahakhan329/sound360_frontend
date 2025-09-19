import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Clock, User, Bot, Search, Filter } from 'lucide-react';

interface Conversation {
  id: string;
  user_message: string;
  ai_response: string;
  timestamp: string;
  processing_time: number;
  audio_duration: number;
  session_id: string;
  language: string;
  confidence_score?: number;
}

const Conversations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('');

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', selectedSession],
    queryFn: async () => {
      const url = selectedSession 
        ? `/api/conversations?session_id=${selectedSession}`
        : '/api/conversations';
      const response = await fetch(url);
      return response.json();
    },
  });

  const filteredConversations = conversations?.filter(conv =>
    conv.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.ai_response.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const uniqueSessions = [...new Set(conversations?.map(c => c.session_id) || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Conversations</h1>
          <p className="text-gray-400 mt-1">View and analyze all user interactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sessions</option>
            {uniqueSessions.map(session => (
              <option key={session} value={session}>
                Session {session.slice(-8)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{conversations?.length || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {conversations?.length 
                  ? (conversations.reduce((acc, c) => acc + c.processing_time, 0) / conversations.length).toFixed(2)
                  : 0}s
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{uniqueSessions.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {conversations?.length 
                  ? ((conversations.reduce((acc, c) => acc + (c.confidence_score || 0), 0) / conversations.length) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <Bot className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Recent Conversations</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-100">
                        Session {conversation.session_id.slice(-8)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{conversation.processing_time.toFixed(2)}s</span>
                        <span>{new Date(conversation.timestamp).toLocaleString()}</span>
                        {conversation.confidence_score && (
                          <span className="bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs">
                            {(conversation.confidence_score * 100).toFixed(1)}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-blue-600 bg-opacity-20 rounded-lg p-3">
                        <p className="text-sm text-gray-100">
                          <span className="font-medium text-blue-400">User:</span> {conversation.user_message}
                        </p>
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-100">
                          <span className="font-medium text-gray-400">AI:</span> {conversation.ai_response}
                        </p>
                      </div>
                    </div>
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

export default Conversations;