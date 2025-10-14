require('dotenv').config({ path: './production.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { sequelize, testConnection } = require('./config/database');
const initDatabase = require('./config/initDatabase');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { router: chatRoutes, handleSocketMessage } = require('./routes/chat');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store online users
const onlineUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection and initialization
const initializeApp = async () => {
  try {
    await testConnection();
    console.log('✅ Database connection successful');
    
    // Try to initialize database, but don't exit if it fails
    try {
      await initDatabase();
    } catch (dbError) {
      console.warn('⚠️ Database initialization failed, but continuing with existing tables:', dbError.message);
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

initializeApp();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Health Chat API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      if (!token) {
        socket.emit('auth-error', { message: 'No token provided' });
        return;
      }

      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Store user-socket mapping
      socket.userId = userId;
      userSockets.set(socket.id, userId);

      // Add to online users
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      console.log(`✅ User ${userId} authenticated on socket ${socket.id}`);
      console.log(`📊 Online users: ${onlineUsers.size}`);

      // Join user to their personal room
      socket.join(`user-${userId}`);

      // Notify others that this user is online
      socket.broadcast.emit('user-status', {
        userId,
        status: 'online',
        timestamp: new Date()
      });

      // Send current online users to the newly connected user
      socket.emit('online-users', Array.from(onlineUsers.keys()));

    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('auth-error', { message: 'Invalid token' });
    }
  });

  // Join user to their personal room (legacy support)
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`🚪 User joined chat: ${chatId}, socket: ${socket.id}`);
    
    // Debug: Check how many users are in this chat room
    const chatRoom = io.sockets.adapter.rooms.get(`chat-${chatId}`);
    const userCount = chatRoom ? chatRoom.size : 0;
    console.log(`📊 Chat room chat-${chatId} now has ${userCount} users`);
  });

  // Handle sending messages
  socket.on('send-message', (data) => {
    handleSocketMessage(socket, data);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', {
      userId,
      isTyping,
      timestamp: new Date()
    });
  });

  // Handle heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle online status (legacy)
  socket.on('user-online', (userId) => {
    socket.broadcast.emit('user-status', {
      userId,
      status: 'online',
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const userId = userSockets.get(socket.id);
    if (userId) {
      // Remove socket from user's socket set
      const userSocketSet = onlineUsers.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        
        // If no more sockets for this user, mark as offline
        if (userSocketSet.size === 0) {
          onlineUsers.delete(userId);
          console.log(`📴 User ${userId} went offline`);
          
          // Notify others that this user is offline
          socket.broadcast.emit('user-status', {
            userId,
            status: 'offline',
            timestamp: new Date()
          });
        }
      }
      
      // Clean up socket mapping
      userSockets.delete(socket.id);
      console.log(`📊 Online users: ${onlineUsers.size}`);
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };
