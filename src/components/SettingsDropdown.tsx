import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Activity, 
  Mic,
  MessageSquare,
  Volume2,
  Brain,
  Cloud,
  ChevronRight,
  Save,
  RotateCcw,
  Monitor
} from 'lucide-react';

interface SettingsDropdownProps {
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    callCenterId?: string;
    department?: string;
  };
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({ onClose, currentUser }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showSubMenu, setShowSubMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Configuration states
  const [vadConfig, setVadConfig] = useState({
    samplerate: 16000,
    threshold: 0.5,
    min_speech_duration_ms: 250,
    max_speech_duration_s: 30,
    no_voice_wait_sec: 1.0,
    use_onnx: true
  });

  const [sttConfig, setSttConfig] = useState({
    device: 'cpu',
    model_name: 'openai/whisper-large-v3',
    language: 'auto',
    temperature: 0.0,
    beam_size: 1,
    low_cpu_mem_usage: true
  });

  const [llmConfig, setLlmConfig] = useState({
    model_path: '',
    context_length: 4096,
    temperature: 0.7,
    max_tokens: 512,
    streaming_output: true,
    num_gpu_layers: -1
  });

  const [ttsConfig, setTtsConfig] = useState({
    device: 'cpu',
    tts_type: 'gtts',
    language: 'en',
    speed: 1.0,
    voice_id: ''
  });

  const [genesysConfig, setGenesysConfig] = useState({
    client_id: '',
    client_secret: '',
    environment: 'mypurecloud.com',
    organization_id: '',
    queue_ids: '',
    webhook_url: ''
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const saveConfiguration = async (configType: string, config: any) => {
    try {
      const response = await fetch(`/api/admin/config/${configType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        console.log(`${configType} configuration saved successfully`);
      }
    } catch (error) {
      console.error(`Error saving ${configType} configuration:`, error);
    }
  };

  const resetToDefaults = (configType: string) => {
    switch (configType) {
      case 'vad':
        setVadConfig({
          samplerate: 16000,
          threshold: 0.5,
          min_speech_duration_ms: 250,
          max_speech_duration_s: 30,
          no_voice_wait_sec: 1.0,
          use_onnx: true
        });
        break;
      case 'stt':
        setSttConfig({
          device: 'cpu',
          model_name: 'openai/whisper-large-v3',
          language: 'auto',
          temperature: 0.0,
          beam_size: 1,
          low_cpu_mem_usage: true
        });
        break;
      // Add other reset cases...
    }
  };

  const settingsMenuItems = [
    {
      id: 'vad',
      label: 'VAD Settings',
      icon: Mic,
      hasSubMenu: true
    },
    {
      id: 'stt',
      label: 'STT Settings',
      icon: MessageSquare,
      hasSubMenu: true
    },
    {
      id: 'llm',
      label: 'LLM Settings',
      icon: Brain,
      hasSubMenu: true
    },
    {
      id: 'tts',
      label: 'TTS Settings',
      icon: Volume2,
      hasSubMenu: true
    },
    {
      id: 'genesys',
      label: 'Genesys Integration',
      icon: Cloud,
      hasSubMenu: true
    }
  ];

  // Only show system metrics for admin users
  const systemItems = currentUser.role === 'Administrator' ? [
    { label: 'System Metrics', icon: Monitor, path: '/metrics' }
  ] : [];

  const renderConfigForm = (configType: string) => {
    switch (configType) {
      case 'vad':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-100 mb-4">Voice Activity Detection Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sample Rate (Hz) *</label>
                <input
                  type="number"
                  value={vadConfig.samplerate}
                  onChange={(e) => setVadConfig({...vadConfig, samplerate: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="8000"
                  max="48000"
                  step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Detection Threshold *</label>
                <input
                  type="number"
                  value={vadConfig.threshold}
                  onChange={(e) => setVadConfig({...vadConfig, threshold: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Speech Duration (ms) *</label>
                <input
                  type="number"
                  value={vadConfig.min_speech_duration_ms}
                  onChange={(e) => setVadConfig({...vadConfig, min_speech_duration_ms: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">No Voice Wait (seconds) *</label>
                <input
                  type="number"
                  value={vadConfig.no_voice_wait_sec}
                  onChange={(e) => setVadConfig({...vadConfig, no_voice_wait_sec: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use_onnx"
                  checked={vadConfig.use_onnx}
                  onChange={(e) => setVadConfig({...vadConfig, use_onnx: e.target.checked})}
                  className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="use_onnx" className="ml-2 text-sm text-gray-300">
                  Use ONNX Runtime (Recommended)
                </label>
              </div>
            </div>
          </div>
        );

      case 'stt':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-100 mb-4">Speech-to-Text Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Processing Device *</label>
                <select
                  value={sttConfig.device}
                  onChange={(e) => setSttConfig({...sttConfig, device: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cpu">CPU</option>
                  <option value="cuda">GPU (CUDA)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model Name *</label>
                <select
                  value={sttConfig.model_name}
                  onChange={(e) => setSttConfig({...sttConfig, model_name: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai/whisper-base">Whisper Base (Fast)</option>
                  <option value="openai/whisper-large-v2">Whisper Large v2 (Accurate)</option>
                  <option value="openai/whisper-large-v3">Whisper Large v3 (Best)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Language</label>
                <select
                  value={sttConfig.language}
                  onChange={(e) => setSttConfig({...sttConfig, language: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto Detect</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                <input
                  type="number"
                  value={sttConfig.temperature}
                  onChange={(e) => setSttConfig({...sttConfig, temperature: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="low_cpu_mem"
                  checked={sttConfig.low_cpu_mem_usage}
                  onChange={(e) => setSttConfig({...sttConfig, low_cpu_mem_usage: e.target.checked})}
                  className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="low_cpu_mem" className="ml-2 text-sm text-gray-300">
                  Low CPU Memory Usage
                </label>
              </div>
            </div>
          </div>
        );

      case 'llm':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-100 mb-4">Large Language Model Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Model Path *</label>
                <input
                  type="text"
                  value={llmConfig.model_path}
                  onChange={(e) => setLlmConfig({...llmConfig, model_path: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/Qwen2.5-32B-AGI-Q5_K_M.gguf"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Full path to your LLM model file</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Context Length *</label>
                <select
                  value={llmConfig.context_length}
                  onChange={(e) => setLlmConfig({...llmConfig, context_length: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2048">2048 tokens</option>
                  <option value="4096">4096 tokens</option>
                  <option value="8192">8192 tokens</option>
                  <option value="16384">16384 tokens</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Temperature</label>
                <input
                  type="number"
                  value={llmConfig.temperature}
                  onChange={(e) => setLlmConfig({...llmConfig, temperature: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="0.0"
                  max="2.0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={llmConfig.max_tokens}
                  onChange={(e) => setLlmConfig({...llmConfig, max_tokens: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="128"
                  max="2048"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GPU Layers</label>
                <input
                  type="number"
                  value={llmConfig.num_gpu_layers}
                  onChange={(e) => setLlmConfig({...llmConfig, num_gpu_layers: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="-1"
                  max="100"
                />
                <p className="text-xs text-gray-400 mt-1">-1 for all layers on GPU, 0 for CPU only</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="streaming"
                  checked={llmConfig.streaming_output}
                  onChange={(e) => setLlmConfig({...llmConfig, streaming_output: e.target.checked})}
                  className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="streaming" className="ml-2 text-sm text-gray-300">
                  Enable Streaming Output
                </label>
              </div>
            </div>
          </div>
        );

      case 'tts':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-100 mb-4">Text-to-Speech Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">TTS Engine *</label>
                <select
                  value={ttsConfig.tts_type}
                  onChange={(e) => setTtsConfig({...ttsConfig, tts_type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gtts">Google TTS (Recommended)</option>
                  <option value="pyttsx3">Pyttsx3 (Local)</option>
                  <option value="coqui">Coqui TTS (Advanced)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Default Language</label>
                <select
                  value={ttsConfig.language}
                  onChange={(e) => setTtsConfig({...ttsConfig, language: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Speech Speed</label>
                <input
                  type="number"
                  value={ttsConfig.speed}
                  onChange={(e) => setTtsConfig({...ttsConfig, speed: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Voice ID (Optional)</label>
                <input
                  type="text"
                  value={ttsConfig.voice_id}
                  onChange={(e) => setTtsConfig({...ttsConfig, voice_id: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for default voice"
                />
              </div>
            </div>
          </div>
        );

      case 'genesys':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-100 mb-4">Genesys Cloud Integration</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Client ID *</label>
                <input
                  type="text"
                  value={genesysConfig.client_id}
                  onChange={(e) => setGenesysConfig({...genesysConfig, client_id: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys OAuth Client ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Client Secret *</label>
                <input
                  type="password"
                  value={genesysConfig.client_secret}
                  onChange={(e) => setGenesysConfig({...genesysConfig, client_secret: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys OAuth Client Secret"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Environment *</label>
                <select
                  value={genesysConfig.environment}
                  onChange={(e) => setGenesysConfig({...genesysConfig, environment: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mypurecloud.com">US East (mypurecloud.com)</option>
                  <option value="mypurecloud.ie">EMEA (mypurecloud.ie)</option>
                  <option value="mypurecloud.com.au">APAC (mypurecloud.com.au)</option>
                  <option value="mypurecloud.jp">Japan (mypurecloud.jp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Organization ID *</label>
                <input
                  type="text"
                  value={genesysConfig.organization_id}
                  onChange={(e) => setGenesysConfig({...genesysConfig, organization_id: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Genesys Organization ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Queue IDs *</label>
                <input
                  type="text"
                  value={genesysConfig.queue_ids}
                  onChange={(e) => setGenesysConfig({...genesysConfig, queue_ids: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="queue-id-1, queue-id-2"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated queue IDs</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL *</label>
                <input
                  type="url"
                  value={genesysConfig.webhook_url}
                  onChange={(e) => setGenesysConfig({...genesysConfig, webhook_url: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-server.com/api/genesys/webhook"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={settingsRef} className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
      <AnimatePresence mode="wait">
        {!showSubMenu ? (
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            <h3 className="text-lg font-semibold text-gray-100 mb-4">System Settings</h3>
            
            {/* Settings Categories */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">AI Configuration</h4>
              {settingsMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setShowSubMenu(true);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* System Management - Admin Only */}
            {currentUser.role === 'Administrator' && (
              <div className="space-y-2 mb-4 border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">System Management</h4>
                <button
                  onClick={() => {
                    window.location.href = '/metrics';
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Monitor className="w-4 h-4" />
                  <span>System Metrics</span>
                </button>
              </div>
            )}

          </motion.div>
        ) : (
          <motion.div
            key="sub-menu"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowSubMenu(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => resetToDefaults(activeSection)}
                  className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => saveConfiguration(activeSection, 
                    activeSection === 'vad' ? vadConfig :
                    activeSection === 'stt' ? sttConfig :
                    activeSection === 'llm' ? llmConfig :
                    activeSection === 'tts' ? ttsConfig :
                    genesysConfig
                  )}
                  className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                  title="Save configuration"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {renderConfigForm(activeSection)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsDropdown;