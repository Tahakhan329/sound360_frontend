import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Edit, Trash2, Settings, CheckCircle } from 'lucide-react';

interface Configuration {
  id: string;
  config_data: Record<string, any>;
  is_active: boolean;
  description?: string;
}

const Configuration: React.FC = () => {
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    description: '',
    config_data: '{}',
    is_active: false,
  });

  const queryClient = useQueryClient();

  const { data: configurations, isLoading } = useQuery<Configuration[]>({
    queryKey: ['configurations'],
    queryFn: async () => {
      const response = await fetch('/api/configurations');
      return response.json();
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async (config: Configuration) => {
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
      setShowCreateForm(false);
      setFormData({ id: '', description: '', config_data: '{}', is_active: false });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config: Configuration = {
        id: formData.id,
        description: formData.description,
        config_data: JSON.parse(formData.config_data),
        is_active: formData.is_active,
      };
      createConfigMutation.mutate(config);
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  const defaultConfigs = {
    vad: {
      model_path: "models/silero_vad.onnx",
      threshold: 0.5,
      min_speech_duration_ms: 250,
      max_speech_duration_s: 30,
      min_silence_duration_ms: 100,
      speech_pad_ms: 30,
      no_voice_wait_sec: 2.0,
    },
    stt: {
      model_name: "openai/whisper-large-v3",
      device: "cuda",
      compute_type: "float16",
      language: "auto",
      task: "transcribe",
    },
    llm: {
      model_path: "models/Qwen2.5-32B-AGI-Q6_K_L.gguf",
      n_ctx: 32768,
      n_gpu_layers: -1,
      temperature: 0.7,
      max_tokens: 2048,
      streaming_output: true,
    },
    tts: {
      tts_type: "coqui",
      model_name: "tts_models/multilingual/multi-dataset/xtts_v2",
      device: "cuda",
      speaker_wav: "assets/speaker.wav",
      language: "en",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Configuration</h1>
          <p className="text-gray-400 mt-1">Manage system configurations and settings</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Configuration</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingConfig) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Configuration ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., production-config"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Configuration description"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Configuration Data (JSON)
              </label>
              <textarea
                value={formData.config_data}
                onChange={(e) => setFormData({ ...formData, config_data: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={15}
                placeholder="Enter JSON configuration..."
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                Set as active configuration
              </label>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={createConfigMutation.isPending}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{createConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingConfig(null);
                  setFormData({ id: '', description: '', config_data: '{}', is_active: false });
                }}
                className="bg-gray-600 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Quick Templates */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(defaultConfigs).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setFormData({
                  id: `${key}-config`,
                  description: `Default ${key.toUpperCase()} configuration`,
                  config_data: JSON.stringify({ [key]: { params: config } }, null, 2),
                  is_active: false,
                });
                setShowCreateForm(true);
              }}
              className="p-4 border border-gray-600 rounded-lg hover:border-blue-400 hover:bg-gray-700 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-100 capitalize">{key}</h4>
              <p className="text-sm text-gray-400 mt-1">Default {key} settings</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configurations List */}
      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">Saved Configurations</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading configurations...</p>
            </div>
          ) : configurations?.length === 0 ? (
            <div className="p-6 text-center">
              <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No configurations found</p>
            </div>
          ) : (
            configurations?.map((config, index) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-100">{config.id}</h4>
                      {config.is_active && (
                        <span className="bg-green-600 text-green-100 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>
                    {config.description && (
                      <p className="text-gray-400 mt-1">{config.description}</p>
                    )}
                    <div className="mt-3">
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                          View Configuration
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-700 rounded-lg text-xs overflow-x-auto text-gray-300">
                          {JSON.stringify(config.config_data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingConfig(config);
                        setFormData({
                          id: config.id,
                          description: config.description || '',
                          config_data: JSON.stringify(config.config_data, null, 2),
                          is_active: config.is_active,
                        });
                      }}
                      className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
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

export default Configuration;