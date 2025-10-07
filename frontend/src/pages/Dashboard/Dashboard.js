import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageCircle, FiUsers, FiCalendar, FiTrendingUp, FiHeart, FiShield,
  FiPlus, FiSearch, FiBell, FiClock, FiStar, FiArrowRight, FiActivity,
  FiZap, FiTarget, FiAward, FiChevronRight, FiUser, FiMail, FiPhone
} from 'react-icons/fi';
import { getChatList, getChatDetails } from '../../store/slices/chatSlice';
import { getDoctors } from '../../store/slices/userSlice';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { chats = [], messages = [], isLoading: chatLoading } = useSelector((state) => state.chat || {});
  const { doctors = [], isLoading: doctorLoading } = useSelector((state) => state.user || {});
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    console.log('Dashboard: Loading chats and doctors...');
    // Load user's chats
    dispatch(getChatList({ page: 1, limit: 10 }));
    
    // Load recent doctors
    dispatch(getDoctors({ page: 1, limit: 6 }));
    
    // Generate mock recent activity (replace with real data later)
    setRecentActivity([
      { id: 1, type: 'message', message: 'New message from Dr. Smith', time: '2 minutes ago', icon: FiMessageCircle },
      { id: 2, type: 'appointment', message: 'Appointment reminder for tomorrow', time: '1 hour ago', icon: FiCalendar },
      { id: 3, type: 'file', message: 'Lab report uploaded', time: '3 hours ago', icon: FiShield },
    ]);
    
    // Start with empty notifications - only real message notifications will be added
    setNotifications([]);
  }, [dispatch]);

  // Create a simple notification system based on chat activity
  // This is a temporary solution until we have proper unread message tracking

  useEffect(() => {
    console.log('Dashboard: Chats updated:', chats);
    console.log('Dashboard: Chat loading state:', chatLoading);
    
    // Generate notifications (real messages or mock for testing)
    if (messages.length > 0) {
      console.log('🔔 Generating notifications from messages:', messages.length);
      
      // Get unread messages from others
      const unreadMessages = messages.filter(msg => 
        msg.senderId !== user?.id && !msg.isRead
      );
      
      console.log('🔍 Unread messages found:', unreadMessages.length);
      
      const messageNotifications = unreadMessages.map((message, index) => {
        console.log('✅ Creating notification for message:', message.content);
        
        // Find the chat this message belongs to
        const chat = chats.find(c => c.id === message.chatId || c._id === message.chatId);
        
        // Find the sender (other participant)
        const sender = chat?.participants?.find(p => {
          const participantId = p.id || p._id;
          return participantId === message.senderId;
        });
        
        const senderName = sender?.fullName || sender?.name || 'Unknown User';
        const messageTime = message.createdAt ? 
          new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
          'Just now';
        
        return {
          id: `message-${message.id || message._id}`,
          type: 'success',
          actionType: 'chat',
          title: 'New Message',
          message: `${senderName}: ${message.content}`,
          time: messageTime,
          unread: true,
          icon: FiMessageCircle,
          chatId: message.chatId
        };
      });
      
      console.log('📱 Final message notifications:', messageNotifications);
      setNotifications(messageNotifications);
    } else if (chats.length > 0) {
      // TEMPORARY: Create mock notification for testing
      console.log('🔔 Creating mock notification for testing');
      const mockChat = chats[0];
      const otherParticipant = mockChat.participants?.find(p => {
        const participantId = p.id || p._id;
        const currentUserId = user?.id || user?._id;
        return participantId !== currentUserId;
      });
      
      const mockNotifications = [{
        id: 'mock-notification-1',
        type: 'success',
        actionType: 'chat',
        title: 'New Message',
        message: `${otherParticipant?.fullName || 'Unknown User'}: Hello! How are you doing?`,
        time: 'Just now',
        unread: true,
        icon: FiMessageCircle,
        chatId: mockChat.id || mockChat._id
      }];
      
      console.log('📱 Mock notifications:', mockNotifications);
      setNotifications(mockNotifications);
    } else {
      console.log('🔔 No chats or messages found');
      setNotifications([]);
    }
  }, [chats, messages, chatLoading, user?.id]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleChatClick = (chat) => {
    console.log('Dashboard: Chat clicked:', chat);
    const chatId = chat.id || chat._id;
    navigate(`/chat/${chatId}`);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, unread: false } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, unread: false }))
    );
    // Note: In a real app, you'd also mark the actual chat messages as read in the backend
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    setShowNotifications(false);
    
    // Navigate based on notification type
    if (notification.actionType === 'chat') {
      if (notification.chatId) {
        // Navigate to specific chat
        navigate(`/chat/${notification.chatId}`);
      } else {
        // Navigate to chat list
        navigate('/chat');
      }
    } else if (notification.actionType === 'doctor') {
      navigate('/chat?view=doctors');
    } else if (notification.actionType === 'profile') {
      navigate('/profile');
    }
  };

  // Calculate real statistics
  const activeChats = chats.filter(chat => chat.lastMessage && new Date(chat.lastMessage.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
  const availableDoctors = doctors.filter(doctor => doctor.isActive !== false).length;
  const totalConsultations = chats.length; // Total chats as consultations
  const healthScore = Math.min(100, Math.max(60, 75 + (chats.length * 2) + (availableDoctors > 0 ? 10 : 0))); // Dynamic health score

  // Calculate real unread messages count using messages from Redux state
  const unreadMessagesCount = messages.filter(msg => 
    msg.senderId !== user?.id && !msg.isRead
  ).length;
  
  console.log('🔍 All messages from Redux:', messages.length);
  console.log('🔍 Unread messages from others:', unreadMessagesCount);
  console.log('🔍 User ID:', user?.id);

  // TEMPORARY: Create a mock notification for testing
  const mockNotificationCount = chats.length > 0 ? 1 : 0; // Show 1 notification if there are chats

  // Calculate total unread notifications (use mock for testing)
  const totalUnreadNotifications = unreadMessagesCount || mockNotificationCount;

  const stats = [
    {
      name: 'Active Chats',
      value: activeChats,
      total: chats.length,
      icon: FiMessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      gradient: 'from-blue-500 to-blue-600',
      description: `${chats.length} total conversations`
    },
    {
      name: 'Available Doctors',
      value: availableDoctors,
      icon: FiUsers,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      gradient: 'from-green-500 to-green-600',
      description: 'Ready to help you'
    },
    {
      name: 'Total Consultations',
      value: totalConsultations,
      icon: FiCalendar,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      gradient: 'from-purple-500 to-purple-600',
      description: 'Health sessions completed'
    },
    {
      name: 'Health Score',
      value: `${healthScore}%`,
      icon: FiTrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      gradient: 'from-orange-500 to-orange-600',
      description: 'Based on your activity'
    },
  ];

  const quickActions = [
    {
      title: 'Start New Chat',
      description: 'Connect with a doctor instantly',
      icon: FiPlus,
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-primary-500 to-health-500',
      action: () => navigate('/chat'),
      hover: 'hover:shadow-lg hover:scale-105'
    },
    {
      title: 'Find Doctors',
      description: 'Browse available specialists',
      icon: FiSearch,
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
      action: () => navigate('/chat?view=doctors'),
      hover: 'hover:shadow-lg hover:scale-105'
    },
    {
      title: 'View Profile',
      description: 'Manage your health profile',
      icon: FiUser,
      color: 'text-white',
      bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      action: () => navigate('/profile'),
      hover: 'hover:shadow-lg hover:scale-105'
    },
  ];

  const features = [
    {
      title: 'Instant Messaging',
      description: 'Chat with doctors and health professionals in real-time',
      icon: FiMessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      hover: 'hover:shadow-md hover:scale-105'
    },
    {
      title: 'Secure File Sharing',
      description: 'Share medical reports, images, and documents securely',
      icon: FiShield,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      hover: 'hover:shadow-md hover:scale-105'
    },
    {
      title: 'Health Tracking',
      description: 'Monitor your health journey and track progress',
      icon: FiHeart,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      hover: 'hover:shadow-md hover:scale-105'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative dashboard-container space-y-8 p-6">
        {/* Welcome Section with Notifications */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-health-600 rounded-3xl p-8 lg:p-12 text-white relative shadow-2xl">
            {/* Animated background pattern */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-500"></div>
            </div>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
                  >
                    Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-base lg:text-lg text-white/90 mb-6 max-w-2xl"
                  >
                    Your health journey continues here. Connect with specialists and manage your wellness with confidence.
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-wrap items-center gap-6 text-sm"
                  >
                    <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-medium">Online</span>
                    </div>
                    <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <FiClock className="w-4 h-4" />
                      <span>Last active: Just now</span>
                    </div>
                    <div className="flex items-center space-x-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                      <FiActivity className="w-4 h-4" />
                      <span>Account: Active</span>
                    </div>
                  </motion.div>
                </div>
                

              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2"
            >
              Quick Actions
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-600 text-base"
            >
              Get started with these essential features
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className={`${action.bgColor} ${action.hover} rounded-2xl p-6 text-left transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-sm group relative overflow-hidden`}
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="p-3 bg-white/30 rounded-xl backdrop-blur-sm shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Icon className={`w-8 h-8 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${action.color} mb-1 group-hover:opacity-80 transition-opacity`}>{action.title}</h3>
                        <p className={`text-sm ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`}>{action.description}</p>
                      </div>
                      <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                        <FiArrowRight className={`w-5 h-5 ${action.color} group-hover:translate-x-1 transition-transform`} />
                      </div>
                    </div>
                  </div>
                </motion.button>
          );
        })}
          </div>
      </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8"
        >
          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2"
            >
              Your Health Overview
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-gray-600 text-lg"
            >
              Track your health journey with real-time insights
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className={`${stat.bgColor} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/50 backdrop-blur-sm group relative overflow-hidden`}
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      {stat.total && (
                        <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                          <span className="text-sm font-medium text-gray-700">of {stat.total}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">{stat.value}</p>
                      <p className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-gray-600 transition-colors">{stat.name}</p>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{stat.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Chats & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Chats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <FiMessageCircle className="w-6 h-6" />
                  <span>Recent Chats</span>
                </h2>
                <button 
                  onClick={() => navigate('/chat')}
                  className="text-blue-100 hover:text-white transition-colors text-sm font-medium flex items-center space-x-1"
                >
                  <span>View All</span>
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
          </div>
          <div className="p-6">
            {chatLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-4">
                  {chats.slice(0, 4).map((chat, index) => {
                    const otherParticipant = chat?.participants?.find(p => {
                      const participantId = p.id || p._id;
                      const currentUserId = user?.id || user?._id;
                      return participantId !== currentUserId;
                    });
                    
                    return (
                      <motion.div 
                        key={chat._id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center space-x-4 p-4 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all duration-300 border border-transparent hover:border-blue-200"
                        onClick={() => handleChatClick(chat)}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-health-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {(otherParticipant?.fullName || otherParticipant?.name || otherParticipant?.displayName)?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                          </div>
                          {chat.lastMessage && new Date(chat.lastMessage.createdAt) > new Date(Date.now() - 5 * 60 * 1000) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                    </div>
                    <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {otherParticipant?.fullName || otherParticipant?.name || otherParticipant?.displayName || 'Unknown User'}
                      </p>
                          <p className="text-xs text-gray-600 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                      {chat.lastMessage?.createdAt ? 
                              new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                        'New'
                      }
                    </div>
                          {!chat.lastMessage?.isRead && chat.lastMessage?.senderId !== user?.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMessageCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">No chats yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start your first conversation with a doctor</p>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Start Chatting
                  </button>
              </div>
            )}
          </div>
        </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <FiActivity className="w-6 h-6" />
                  <span>Recent Activity</span>
                </h2>
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Available Doctors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <FiUsers className="w-6 h-6" />
                <span>Available Doctors</span>
              </h2>
              <button 
                onClick={() => navigate('/doctors')}
                className="text-green-100 hover:text-white transition-colors text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {doctorLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : doctors.length > 0 ? (
              <div className="space-y-4">
                {doctors.slice(0, 4).map((doctor, index) => (
                  <motion.div 
                    key={doctor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center space-x-4 p-4 rounded-xl hover:bg-green-50/50 cursor-pointer transition-all duration-300 border border-transparent hover:border-green-200"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                        {doctor.fullName?.charAt(0)?.toUpperCase() || 'D'}
                      </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        Dr. {doctor.fullName}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {doctor.specialization || 'General Practitioner'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <FiStar className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">4.8</span>
                        </div>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-green-600 font-medium">
                          ₹{doctor.consultationFee || '500'}/session
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium mb-1">Online</div>
                      <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors">
                        Chat
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">No doctors available</p>
                <p className="text-sm text-gray-500 mb-4">Check back later for available specialists</p>
                <button
                  onClick={() => navigate('/doctors')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Browse Doctors
                </button>
              </div>
            )}
          </div>
        </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 text-white">
            <h2 className="text-2xl font-bold text-center">Why Choose Rem Nutri?</h2>
            <p className="text-purple-100 text-center mt-2">Your trusted health companion for seamless communication and care</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`text-center p-6 rounded-2xl ${feature.bgColor} ${feature.hover} transition-all duration-300 border border-white/50`}
                  >
                    <div className={`w-20 h-20 ${feature.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <Icon className={`h-10 w-10 ${feature.color}`} />
                </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </motion.div>
            );
          })}
            </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
