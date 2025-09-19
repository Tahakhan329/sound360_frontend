import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square,
  Settings,
  User,
  Bot,
  Loader,
  Wifi,
  WifiOff,
  Globe
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  language?: string;
}

interface VoiceChatState {
  isRecording: boolean;
  isConnected: boolean;
  isProcessing: boolean;
  volume: number;
  messages: Message[];
  selectedLanguage: string;
  detectedLanguage: string;
  uiLanguage: string;
}

const VoiceChat: React.FC = () => {
  const [state, setState] = useState<VoiceChatState>({
    isRecording: false,
    isConnected: false,
    isProcessing: false,
    volume: 0.8,
    messages: [],
    selectedLanguage: 'auto',
    detectedLanguage: 'en',
    uiLanguage: 'en'
  });

  const [sessionId] = useState(`session_${Date.now()}`);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Multilingual text content
  const getText = (key: string) => {
    const texts = {
      en: {
        title: 'Sound360 Voice Chat',
        connected: 'Connected',
        disconnected: 'Disconnected',
        language: 'Language',
        autoDetect: 'Auto Detect',
        english: 'English',
        arabic: 'العربية (Arabic)',
        detected: 'Detected',
        startConversation: 'Start Your Conversation',
        startDescription: 'Click the microphone button below to start talking with Sound360. Your voice will be transcribed and the AI will respond with both text and voice.',
        tips: '💡 Tips:',
        tip1: '• Speak clearly and at a normal pace in English or Arabic',
        tip2: '• The system will automatically detect your language',
        tip3: '• Wait for the AI to finish responding before speaking again',
        tip4: '• Check your microphone permissions if recording doesn\'t work',
        tip5: '• تحدث بوضوح وبوتيرة طبيعية باللغة الإنجليزية أو العربية',
        recording: 'Recording... Click to stop',
        processing: 'Processing your message...',
        connecting: 'Connecting to server...',
        clickToRecord: 'Click to start recording',
        aiThinking: 'AI is thinking...',
        play: 'Play',
        playing: 'Playing...',
        pause: 'Pause'
      },
      ar: {
        title: 'محادثة صوتية مع Sound360',
        connected: 'متصل',
        disconnected: 'غير متصل',
        language: 'اللغة',
        autoDetect: 'كشف تلقائي',
        english: 'English (الإنجليزية)',
        arabic: 'العربية',
        detected: 'تم اكتشاف',
        startConversation: 'ابدأ محادثتك',
        startDescription: 'اضغط على زر الميكروفون أدناه لبدء التحدث مع Sound360. سيتم تحويل صوتك إلى نص وسيرد الذكي الاصطناعي بالنص والصوت.',
        tips: '💡 نصائح:',
        tip1: '• تحدث بوضوح وبوتيرة طبيعية باللغة الإنجليزية أو العربية',
        tip2: '• سيكتشف النظام لغتك تلقائياً',
        tip3: '• انتظر حتى ينتهي الذكي الاصطناعي من الرد قبل التحدث مرة أخرى',
        tip4: '• تحقق من أذونات الميكروفون إذا لم يعمل التسجيل',
        tip5: '• Speak clearly and at a normal pace in English or Arabic',
        recording: 'جاري التسجيل... اضغط للتوقف',
        processing: 'جاري معالجة رسالتك...',
        connecting: 'جاري الاتصال بالخادم...',
        clickToRecord: 'اضغط لبدء التسجيل',
        aiThinking: 'الذكي الاصطناعي يفكر...',
        play: 'تشغيل',
        playing: 'جاري التشغيل...',
        pause: 'إيقاف مؤقت'
      }
    };
    return texts[state.uiLanguage as keyof typeof texts]?.[key as keyof typeof texts.en] || texts.en[key as keyof typeof texts.en];
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Update UI language based on detected language
  useEffect(() => {
    if (state.detectedLanguage === 'ar' && state.uiLanguage !== 'ar') {
      setState(prev => ({ ...prev, uiLanguage: 'ar' }));
    } else if (state.detectedLanguage === 'en' && state.uiLanguage !== 'en') {
      setState(prev => ({ ...prev, uiLanguage: 'en' }));
    }
  }, [state.detectedLanguage]);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://${window.location.hostname}:8000/ws/client/${sessionId}`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          setState(prev => ({ ...prev, isConnected: true }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket disconnected');
          setState(prev => ({ ...prev, isConnected: false }));
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setState(prev => ({ ...prev, isConnected: false }));
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, [sessionId]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'ai_response':
        // Add user message first if we have it
        if (data.data.user_message) {
          const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: data.data.user_message,
            timestamp: new Date(),
            language: data.data.detected_language || state.detectedLanguage
          };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage]
          }));
        }
        
        // Then add AI response
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: data.data.message,
          timestamp: new Date(data.data.timestamp),
          audioUrl: data.data.audioUrl,
          isPlaying: false,
          language: data.data.response_language || state.detectedLanguage
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          isProcessing: false,
          detectedLanguage: data.data.detected_language || prev.detectedLanguage
        }));
        
        // Auto-play TTS if available
        if (data.data.audioUrl) {
          setTimeout(() => {
            playAudio(data.data.audioUrl, aiMessage.id);
          }, 500);
        }
        break;
      case 'transcription_result':
        // Handle transcription-only results
        if (data.data.transcription) {
          // Update detected language if provided
          if (data.data.detected_language) {
            setState(prev => ({ ...prev, detectedLanguage: data.data.detected_language }));
          }
          
          const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: data.data.transcription,
            timestamp: new Date(),
            language: data.data.detected_language || state.detectedLanguage
          };
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, userMessage],
            isProcessing: true // Keep processing for AI response
          }));
        }
        break;
      case 'audio_processed':
        setState(prev => ({ ...prev, isProcessing: false }));
        break;
      case 'error':
        console.error('WebSocket error:', data.message);
        setState(prev => ({ ...prev, isProcessing: false }));
        break;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });

      // Set up audio context for visualization and processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      
      // Connect the audio processing graph
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Monitor audio levels to ensure we're getting input
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const sum = input.reduce((acc, val) => acc + Math.abs(val), 0);
        const avg = sum / input.length;
        
        // Log audio levels for debugging
        if (avg > 0.01) {
          console.log(`Audio level: ${avg.toFixed(4)}`);
        }
      };

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log(`Audio chunk received: ${event.data.size} bytes`);
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Disconnect audio processing
        processor.disconnect();
        source.disconnect();
        audioContext.close();
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length
        });
        sendAudioToServer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms for better quality
      setState(prev => ({ ...prev, isRecording: true }));

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isProcessing: true 
      }));
    }
  };

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      console.log('Processing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Check minimum size
      if (audioBlob.size < 1000) { // Less than 1KB
        console.warn('Audio blob small:', audioBlob.size);
        // Continue anyway - small audio might still contain speech
      }
      
      // Convert blob to base64 for WebSocket transmission
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64Audio = reader.result as string;
          
          if (!base64Audio || !base64Audio.includes(',')) {
            console.error('Invalid audio data format');
            setState(prev => ({ ...prev, isProcessing: false }));
            return;
          }
          
          const audioData = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix
          
          if (!audioData || audioData.length === 0) {
            console.error('No audio data after base64 conversion, length:', audioData?.length);
            setState(prev => ({ ...prev, isProcessing: false }));
            return;
          }
          
          console.log('Audio data prepared:', {
            originalSize: audioBlob.size,
            base64Length: audioData.length,
            estimatedDecodedSize: audioData.length * 0.75
          });
          
          const message = {
            type: 'audio_chunk',
            data: {
              audio: audioData,  // Base64 encoded audio
              session_id: sessionId,
              timestamp: new Date().toISOString(),
              language: state.selectedLanguage,
              audio_format: 'webm',
              sample_rate: 16000,
              customer_info: {
                id: 'demo_customer',
                name: 'Demo User',
                tier: 'premium',  // Use premium tier for better service
                preferred_language: state.selectedLanguage === 'auto' ? null : state.selectedLanguage
              }
            }
          };

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending audio data to server...', {
              audioDataLength: audioData.length,
              sessionId: sessionId,
              language: state.selectedLanguage
            });
            wsRef.current.send(JSON.stringify(message));
          } else {
            console.error('WebSocket not connected');
            setState(prev => ({ ...prev, isProcessing: false }));
          }
        } catch (error) {
          console.error('Error processing audio data:', error);
          setState(prev => ({ ...prev, isProcessing: false }));
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading audio blob');
        setState(prev => ({ ...prev, isProcessing: false }));
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const playAudio = async (audioUrl: string, messageId: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
        )
      }));

      // Create and play audio element
      const audio = new Audio(`http://${window.location.hostname}:8000${audioUrl}`);
      currentAudioRef.current = audio;
      console.log(`Playing audio from: ${audio.src}`);
      
      audio.volume = state.volume;
      
      // Add event listeners for debugging
      audio.onloadstart = () => console.log('Audio loading started');
      audio.oncanplay = () => console.log('Audio can play');
      audio.onplay = () => console.log('Audio playback started');
      
      audio.onended = () => {
        console.log('Audio playback ended');
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? { ...msg, isPlaying: false } : msg
          )
        }));
        currentAudioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Error playing audio:', error, audio.error);
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? { ...msg, isPlaying: false } : msg
          )
        }));
        currentAudioRef.current = null;
      };

      await audio.play();
      console.log('Audio playback started successfully');
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId ? { ...msg, isPlaying: false } : msg
        )
      }));
    }
  };

  const stopAudio = (messageId: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, isPlaying: false } : msg
      )
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLanguageChange = (language: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedLanguage: language,
      uiLanguage: language === 'ar' ? 'ar' : 'en'
    }));
  };

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${state.uiLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">{getText('title')}</h1>
              <div className="flex items-center space-x-2">
                {state.isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">{getText('connected')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{getText('disconnected')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <label className="text-sm text-gray-300">{getText('language')}:</label>
              <select
                value={state.selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">{getText('autoDetect')}</option>
                <option value="en">{getText('english')}</option>
                <option value="ar">{getText('arabic')}</option>
              </select>
            </div>
            
            {state.detectedLanguage !== 'en' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-blue-400">
                  {getText('detected')}: {state.detectedLanguage === 'ar' ? 'العربية' : state.detectedLanguage.toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={state.volume}
                onChange={(e) => setState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-20"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-200 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Mic className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">{getText('startConversation')}</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              {getText('startDescription')}
            </p>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-300 mb-2">{getText('tips')}</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>{getText('tip1')}</li>
                <li>{getText('tip2')}</li>
                <li>{getText('tip3')}</li>
                <li>{getText('tip4')}</li>
                <li>{getText('tip5')}</li>
              </ul>
            </div>
          </div>
        ) : (
          state.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className={`rounded-2xl p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 border border-gray-700 text-gray-100'
                }`}>
                  <p className={`text-sm leading-relaxed ${message.language === 'ar' ? 'text-right' : 'text-left'}`}>
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                    
                    {message.audioUrl && (
                      <button
                        onClick={() => message.isPlaying ? stopAudio(message.id) : playAudio(message.audioUrl!, message.id)}
                        disabled={!message.audioUrl}
                        className="flex items-center space-x-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
                      >
                        {message.isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>{getText('playing')}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>{getText('play')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        
        {state.isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-3xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-gray-300">{getText('aiThinking')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Recording Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="flex items-center justify-center">
          {!state.isRecording ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={!state.isConnected || state.isProcessing}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Mic className="w-8 h-8 text-white" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg animate-pulse"
            >
              <Square className="w-8 h-8 text-white" />
            </motion.button>
          )}
        </div>
        
        <div className="text-center mt-4">
          {state.isRecording ? (
            <p className="text-red-400 font-medium">
              {getText('recording')}
            </p>
          ) : state.isProcessing ? (
            <p className="text-blue-400 font-medium">
              {getText('processing')}
            </p>
          ) : !state.isConnected ? (
            <p className="text-red-400 font-medium">
              {getText('connecting')}
            </p>
          ) : (
            <p className="text-gray-400">
              {getText('clickToRecord')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;