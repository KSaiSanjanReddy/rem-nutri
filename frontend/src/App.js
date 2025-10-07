import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth } from './store/slices/authSlice';
import { setOnlineUsers, updateUserStatus } from './store/slices/chatSlice';
import { socketService } from './services/api';
import { useSessionTimeout } from './hooks/useSessionTimeout';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Chat from './pages/Chat/Chat';
import Profile from './pages/Profile/Profile';
import Doctors from './pages/Doctors/Doctors';
import NotFound from './pages/NotFound/NotFound';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
  
  // Initialize session timeout management (disabled for chat app)
  const { showWarning } = useSessionTimeout();

  useEffect(() => {
    // Initialize auth state from localStorage on app load
    dispatch(initializeAuth());
  }, [dispatch]);

  // Handle session storage for new tab detection
  useEffect(() => {
    // Check if this is a new tab/window (not a refresh)
    const sessionKey = 'healthchat_session';
    const currentSession = sessionStorage.getItem(sessionKey);
    
    if (!currentSession) {
      // This is a new tab/window - set session marker
      sessionStorage.setItem(sessionKey, 'active');
      
      // Check if user was logged in from another tab
      const hasTokens = localStorage.getItem('accessToken');
      if (hasTokens) {
        console.log('🆕 New tab detected - user must login again for security');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Don't redirect immediately, let the auth flow handle it
      }
    }
  }, []);

         useEffect(() => {
           // Initialize socket connection if user is authenticated
           if (isAuthenticated && user) {
             const token = localStorage.getItem('accessToken');
             const userId = user.id || user._id;
             
             console.log('🔌 Initializing Socket.io connection for user:', userId);
             console.log('🔌 Token available:', !!token);
             
             // Connect to socket with retry logic
             const connectSocket = () => {
               try {
                 socketService.connect(token);
                 socketService.joinUserRoom(userId);
                 socketService.setUserOnline(userId);

                 // Set up socket event listeners
                 socketService.onConnect(() => {
                   console.log('✅ Connected to chat server');
                 });

                 socketService.onDisconnect(() => {
                   console.log('❌ Disconnected from chat server');
                 });

                 // Handle presence updates
                 socketService.onOnlineUsers((onlineUserIds) => {
                   console.log('👥 Received online users:', onlineUserIds);
                   dispatch(setOnlineUsers(onlineUserIds));
                 });

                 socketService.onUserStatus((data) => {
                   console.log('🔄 User status update:', data);
                   dispatch(updateUserStatus(data));
                 });

                 // Start heartbeat to keep connection alive
                 socketService.startHeartbeat();
               } catch (error) {
                 console.error('🚨 Socket initialization error:', error);
               }
             };

             // Try to connect immediately
             connectSocket();

             // Also try to reconnect after a short delay
             const reconnectTimer = setTimeout(() => {
               if (!socketService.isConnected) {
                 console.log('🔄 Retrying socket connection...');
                 connectSocket();
               }
             }, 2000);

             // More aggressive retry mechanism
             const aggressiveRetryInterval = setInterval(() => {
               if (!socketService.isConnected) {
                 console.log('🔄 Aggressive retry: Reconnecting socket...');
                 connectSocket();
               } else {
                 clearInterval(aggressiveRetryInterval);
                 console.log('✅ Socket connected, stopping aggressive retry');
               }
             }, 5000); // Retry every 5 seconds

             return () => {
               clearTimeout(reconnectTimer);
               clearInterval(aggressiveRetryInterval);
               console.log('🔌 Disconnecting Socket.io...');
               socketService.stopHeartbeat();
               socketService.disconnect();
             };
           }
         }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Session timeout warning component
  const SessionWarning = () => {
    if (!showWarning || !isAuthenticated) return null;
    
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-3 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">
            Your session will expire in 5 minutes due to inactivity. 
            <span className="ml-2">Click anywhere to extend your session.</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <SessionWarning />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
          } 
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:chatId" element={<Chat />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
