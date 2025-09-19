import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';

interface ContentFilterStats {
  total_checks: number;
  flagged_content: number;
  false_positives: number;
  escalations: number;
  flagged_percentage: number;
  escalation_rate: number;
  false_positive_rate: number;
}

interface CategoryInfo {
  word_count: number;
  severity: string;
  action: string;
  pattern_count: number;
}

interface FlaggedContent {
  timestamp: string;
  source: string;
  text: string;
  severity: string;
  categories: string[];
  confidence: number;
  escalation_required: boolean;
}

const ContentFilter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddWords, setShowAddWords] = useState(false);
  const [newWords, setNewWords] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [testText, setTestText] = useState('');
  const [showTestResults, setShowTestResults] = useState(false);

  const queryClient = useQueryClient();

  // Fetch content filter statistics
  const { data: filterStats, isLoading: statsLoading } = useQuery<{
    detection_stats: ContentFilterStats;
    category_info: Record<string, CategoryInfo>;
    recent_flags: FlaggedContent[];
  }>({
    queryKey: ['content-filter-stats'],
    queryFn: async () => {
      const response = await fetch('/api/content-filter/stats');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Add custom words mutation
  const addWordsMutation = useMutation({
    mutationFn: async ({ category, words, severity }: { category: string; words: string[]; severity: string }) => {
      const response = await fetch('/api/content-filter/custom-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, words, severity }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-filter-stats'] });
      setShowAddWords(false);
      setNewWords('');
      setNewCategory('');
    },
  });

  // Test content mutation
  const testContentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/content-filter/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return response.json();
    },
    onSuccess: () => {
      setShowTestResults(true);
    },
  });

  // Mark false positive mutation
  const falsePositiveMutation = useMutation({
    mutationFn: async ({ text, categories }: { text: string; categories: string[] }) => {
      const response = await fetch('/api/content-filter/false-positive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-filter-stats'] });
    },
  });

  const handleAddWords = () => {
    if (!newWords.trim() || !newCategory.trim()) return;
    
    const words = newWords.split(',').map(word => word.trim()).filter(word => word.length > 0);
    addWordsMutation.mutate({ category: newCategory, words, severity: newSeverity });
  };

  const handleTestContent = () => {
    if (!testText.trim()) return;
    testContentMutation.mutate(testText);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const stats = filterStats?.detection_stats;
  const categories = filterStats?.category_info || {};
  const recentFlags = filterStats?.recent_flags || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Genesys Content Filtering</h1>
          <p className="text-gray-400 mt-1">Monitor and manage flagged content in Genesys calls</p>
        </div>
        <button
          onClick={() => setShowAddWords(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Custom Words</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Checks</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.total_checks || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Flagged Content</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.flagged_content || 0}</p>
              <p className="text-sm text-yellow-400 mt-1">{stats?.flagged_percentage?.toFixed(1) || 0}% of total</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Escalations</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.escalations || 0}</p>
              <p className="text-sm text-red-400 mt-1">{stats?.escalation_rate?.toFixed(1) || 0}% rate</p>
            </div>
            <Shield className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">False Positives</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{stats?.false_positives || 0}</p>
              <p className="text-sm text-green-400 mt-1">{stats?.false_positive_rate?.toFixed(1) || 0}% rate</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Content Test Tool */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Test Content Filter</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Text
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter text to test for flagged content..."
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestContent}
              disabled={testContentMutation.isPending || !testText.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {testContentMutation.isPending ? 'Testing...' : 'Test Content'}
            </button>
            {showTestResults && testContentMutation.data && (
              <div className="flex-1">
                {testContentMutation.data.is_flagged ? (
                  <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-3">
                    <p className="text-red-400 font-medium">Content Flagged!</p>
                    <p className="text-sm text-gray-300">
                      Severity: {testContentMutation.data.severity} | 
                      Categories: {testContentMutation.data.categories.join(', ')} |
                      Confidence: {(testContentMutation.data.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-3">
                    <p className="text-green-400 font-medium">Content Clean</p>
                    <p className="text-sm text-gray-300">No flagged content detected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Filter Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categories).map(([category, info]) => (
            <div key={category} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-100 capitalize">{category.replace('_', ' ')}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(info.severity)}`}>
                  {info.severity}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p>{info.word_count} words</p>
                <p>{info.pattern_count} patterns</p>
                <p>Action: {info.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Flagged Content */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Recent Flagged Content</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {recentFlags.length === 0 ? (
            <div className="p-6 text-center">
              <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No recent flagged content</p>
            </div>
          ) : (
            recentFlags.map((flag, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(flag.severity)}`}>
                        {flag.severity}
                      </span>
                      <span className="text-sm text-gray-400">{flag.source}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(flag.timestamp).toLocaleString()}
                      </span>
                      {flag.escalation_required && (
                        <span className="bg-red-600 text-red-100 px-2 py-1 rounded-full text-xs">
                          Escalated
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mb-2">{flag.text}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        Categories: {flag.categories.join(', ')}
                      </span>
                      <span className="text-gray-400">
                        Confidence: {(flag.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => falsePositiveMutation.mutate({ 
                        text: flag.text, 
                        categories: flag.categories 
                      })}
                      className="p-2 text-gray-500 hover:text-green-400 transition-colors"
                      title="Mark as false positive"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Custom Words Modal */}
      {showAddWords && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Add Custom Flagged Words</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., company_specific"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Words (comma-separated)
                </label>
                <textarea
                  value={newWords}
                  onChange={(e) => setNewWords(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="word1, word2, word3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Severity Level
                </label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleAddWords}
                disabled={addWordsMutation.isPending || !newWords.trim() || !newCategory.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {addWordsMutation.isPending ? 'Adding...' : 'Add Words'}
              </button>
              <button
                onClick={() => setShowAddWords(false)}
                className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContentFilter;