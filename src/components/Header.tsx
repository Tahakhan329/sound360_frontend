import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, User, Settings, ChevronDown, MessageSquare, Headphones } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import SettingsDropdown from './SettingsDropdown';
import UserProfileDropdown from './UserProfileDropdown';

interface HeaderProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    callCenterId?: string;
    department?: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser = {
    id: '1',
    name: 'Admin User',
    email: 'admin@sound360.local',
    role: 'Administrator',
    department: 'IT',
    callCenterId: 'CC001'
  }
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Mock notifications data
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: '1',
          title: 'System Update',
          message: 'New AI model deployed successfully',
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'High CPU Usage',
          message: 'CPU usage is above 80%',
          type: 'warning',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          read: true
        }
      ];
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = [];
      
      // Search conversations
      const conversationsResponse = await fetch(`/api/conversations?limit=5`);
      if (conversationsResponse.ok) {
        const conversations = await conversationsResponse.json();
        const filteredConversations = conversations.filter((conv: any) =>
          conv.user_message.toLowerCase().includes(query.toLowerCase()) ||
          conv.ai_response.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3);
        
        filteredConversations.forEach((conv: any) => {
          results.push({
            type: 'conversation',
            title: `Conversation ${conv.session_id.slice(-8)}`,
            description: conv.user_message.substring(0, 60) + '...',
            url: `/conversations?session_id=${conv.session_id}`,
            timestamp: conv.timestamp
          });
        });
      }

      // Search sessions
      const sessionsResponse = await fetch('/api/sessions');
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        const filteredSessions = sessions.filter((session: any) =>
          session.session_id.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 2);
        
        filteredSessions.forEach((session: any) => {
          results.push({
            type: 'session',
            title: `Session ${session.session_id.slice(-8)}`,
            description: `${session.message_count} messages, ${Math.floor(session.total_duration / 60)}m duration`,
            url: `/sessions?session=${session.session_id}`,
            timestamp: session.start_time
          });
        });
      }

      // Add navigation shortcuts
      const navigationShortcuts = [
        { name: 'Dashboard', url: '/', keywords: ['dashboard', 'home', 'overview'] },
        { name: 'Call Center', url: '/call-center', keywords: ['call', 'center', 'analytics'] },
        { name: 'Real-Time Monitor', url: '/real-time', keywords: ['real', 'time', 'monitor', 'live'] },
        { name: 'Audio Sessions', url: '/sessions', keywords: ['audio', 'sessions', 'recordings'] },
        { name: 'Content Filter', url: '/content-filter', keywords: ['content', 'filter', 'flagged'] },
        { name: 'Conversations', url: '/conversations', keywords: ['conversations', 'chat', 'messages'] },
        { name: 'Voice Chat', url: '/voice-chat', keywords: ['voice', 'chat', 'speak'] },
        { name: 'System Metrics', url: '/metrics', keywords: ['metrics', 'system', 'performance'] },
        { name: 'User Management', url: '/users', keywords: ['users', 'team', 'agents'] },
        { name: 'About', url: '/about', keywords: ['about', 'company', 'inseyab'] },
        { name: 'Contact', url: '/contact', keywords: ['contact', 'support', 'help'] }
      ];

      const matchingPages = navigationShortcuts.filter(page =>
        page.name.toLowerCase().includes(query.toLowerCase()) ||
        page.keywords.some(keyword => keyword.includes(query.toLowerCase()))
      ).slice(0, 2);

      matchingPages.forEach(page => {
        results.push({
          type: 'page',
          title: page.name,
          description: `Navigate to ${page.name}`,
          url: page.url,
          timestamp: null
        });
      });

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout and set new one for debouncing
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search result click
  const handleSearchResultClick = (result: any) => {
    navigate(result.url);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      // Close search results when clicking outside
      if (!(event.target as Element).closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      // Refresh notifications
      window.location.reload();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative search-container">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search conversations, sessions, or navigate..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 px-2">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </div>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          result.type === 'conversation' ? 'bg-blue-600' :
                          result.type === 'session' ? 'bg-green-600' :
                          'bg-purple-600'
                        }`}>
                          {result.type === 'conversation' && <MessageSquare className="w-4 h-4 text-white" />}
                          {result.type === 'session' && <Headphones className="w-4 h-4 text-white" />}
                          {result.type === 'page' && <Search className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-100">{result.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{result.description}</p>
                          {result.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(result.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-400">{unreadCount} unread</p>
                  )}
                </div>
                <div className="divide-y divide-gray-700">
                  {notifications?.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications?.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-700 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-600 bg-opacity-10' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-100">{notification.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Dropdown (AI Configuration) */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              title="AI Configuration & System Settings"
            >
              <Settings className="w-6 h-6" />
            </button>

            {showSettingsDropdown && (
              <SettingsDropdown 
                onClose={() => setShowSettingsDropdown(false)} 
                currentUser={currentUser}
              />
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 rounded-lg p-2 transition-colors"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600">
                {currentUser?.profilePicture ? (
                  <img
                    src={currentUser?.profilePicture}
                    alt={currentUser?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-100">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{currentUser?.role || 'Role'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            {showUserDropdown && (
              <UserProfileDropdown 
                currentUser={currentUser || {
                  id: '1',
                  name: 'Admin User',
                  email: 'admin@sound360.local',
                  role: 'Administrator',
                  department: 'IT',
                  callCenterId: 'CC001'
                }}
                onClose={() => setShowUserDropdown(false)}
                onLogout={logout}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;