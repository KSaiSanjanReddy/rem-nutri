import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://chat.consultare.io/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !originalRequest.url?.includes('/auth/refresh-token')) {
        try {
          console.log('Token expired, attempting refresh...');
          const response = await api.post('/auth/refresh-token', { refreshToken });
          
          if (response.data.status === 'success') {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    console.error('API Error:', error.response?.status, error.response?.data, error.config?.url);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  sendOTP: (otpData) => api.post('/auth/send-otp', otpData),
  verifyOTP: (otpData) => api.post('/auth/verify-otp', otpData),
  refreshToken: (tokenData) => api.post('/auth/refresh-token', tokenData),
  logout: (tokenData) => api.post('/auth/logout', tokenData),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  changePassword: (passwordData) => api.put('/user/change-password', passwordData),
  getDoctors: (params) => api.get('/user/doctors', { params }),
  getDoctor: (id) => api.get(`/user/doctors/${id}`),
  searchByPhone: (phone) => api.get('/user/search-by-phone', { params: { phone } }),
  deactivateAccount: () => api.delete('/user/account'),
  getStats: () => api.get('/user/stats'),
};

// Chat API
export const chatAPI = {
  createChat: (chatData) => api.post('/chat/create', chatData),
  getChatList: (params) => api.get('/chat/list', { params }),
  getChatDetails: (chatId, params) => api.get(`/chat/${chatId}`, { params }),
  sendMessage: (chatId, messageData) => api.post(`/chat/${chatId}/message`, messageData),
  uploadFile: (chatId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/chat/${chatId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  editMessage: (chatId, messageId, content) => 
    api.put(`/chat/${chatId}/message/${messageId}`, { content }),
  deleteMessage: (chatId, messageId) => 
    api.delete(`/chat/${chatId}/message/${messageId}`),
  markAsRead: (chatId) => api.put(`/chat/${chatId}/read`),
};

// File upload utility
export const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('File upload failed');
  }

  return response.json();
};

// Socket service
export class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const io = require('socket.io-client');
    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'https://chat.consultare.io', {
      transports: ['websocket', 'polling'],
      forceNew: true, // Force new connection
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected with ID:', this.socket.id);
      console.log('✅ Socket transport:', this.socket.io.engine.transport.name);
      
      // Authenticate with token after connection
      if (token) {
        this.socket.emit('authenticate', { token });
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Socket reconnected');
      this.isConnected = true;
      // Re-authenticate on reconnect
      if (token) {
        this.socket.emit('authenticate', { token });
      }
    });

    // Handle authentication responses
    this.socket.on('auth-error', (error) => {
      console.error('🚨 Socket authentication error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinUserRoom(userId) {
    if (this.socket) {
      this.socket.emit('join-user-room', userId);
    }
  }

  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId, message, senderId) {
    if (this.socket) {
      console.log('📤 Socket: Emitting send-message event:', { chatId, message, senderId });
      this.socket.emit('send-message', { chatId, message, senderId });
    } else {
      console.error('🚨 Socket not available for sending message');
    }
  }

  startTyping(chatId, userId) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, userId, isTyping: true });
    }
  }

  stopTyping(chatId, userId) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, userId, isTyping: false });
    }
  }

  setUserOnline(userId) {
    if (this.socket) {
      this.socket.emit('user-online', userId);
    }
  }

  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
    }
  }

  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('user-status', callback);
    }
  }

  onOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on('online-users', callback);
    }
  }

  onConnect(callback) {
    if (this.socket) {
      this.socket.on('connect', callback);
    }
  }

  onDisconnect(callback) {
    if (this.socket) {
      this.socket.on('disconnect', callback);
    }
  }

  // Heartbeat to keep connection alive
  startHeartbeat() {
    if (this.socket) {
      this.heartbeatInterval = setInterval(() => {
        if (this.socket && this.isConnected) {
          this.socket.emit('ping');
        }
      }, 30000); // Ping every 30 seconds
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();

export default api;
