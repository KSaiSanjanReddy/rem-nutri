const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Chat, Message, ChatParticipant } = require('../models/Chat');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const router = express.Router();

// Helper function to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, audio files, and common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// @route   POST /api/chat/create
// @desc    Create a new chat
// @access  Private
router.post('/create', [
  body('participantId').isUUID().withMessage('Valid participant ID required'),
  body('chatType').optional().isIn(['direct', 'group']).withMessage('Chat type must be direct or group')
], checkValidation, async (req, res) => {
  try {
    const { participantId, chatType = 'direct', chatName } = req.body;
    const currentUserId = req.user.id;

    // Check if participant exists
    const participant = await User.findByPk(participantId);
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Participant not found'
      });
    }

    // Check if direct chat already exists
    if (chatType === 'direct') {
      // First get all chats where both users are participants
      const userChats = await Chat.findAll({
        where: {
          chatType: 'direct',
          isActive: true
        },
        include: [{
          model: User,
          as: 'participants',
          attributes: ['id']
        }]
      });

      // Find chat with exactly these two participants
      const existingChat = userChats.find(chat => {
        const participantIds = chat.participants.map(p => p.id);
        return participantIds.length === 2 && 
               participantIds.includes(currentUserId) && 
               participantIds.includes(participantId);
      });

      if (existingChat) {
        return res.json({
          status: 'success',
          message: 'Chat already exists',
          data: { chat: existingChat }
        });
      }
    }

    // Create new chat
    const chatData = {
      chatType,
      lastActivity: new Date()
    };

    if (chatType === 'group' && chatName) {
      chatData.chatName = chatName;
    }

    const chat = await Chat.create(chatData);

    // Get participants with details
    const participants = await User.findAll({
      where: {
        id: {
          [Op.in]: [currentUserId, participantId]
        }
      },
      attributes: ['id', 'fullName', 'profilePicture', 'userType']
    });

    // Add participants to chat using many-to-many relationship
    await chat.addParticipants(participants);
    
    console.log('Chat created with participants:', participants.map(p => ({ id: p.id, name: p.fullName })));
    
    // Verify participants were added to chat_participants table
    const { sequelize } = require('../config/database');
    const chatParticipants = await sequelize.query(`
      SELECT cp.*, u.full_name as user_name
      FROM chat_participants cp 
      LEFT JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = :chatId
    `, {
      replacements: { chatId: chat.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Chat participants in database:', chatParticipants);

    res.status(201).json({
      status: 'success',
      message: 'Chat created successfully',
      data: {
        chat: {
          ...chat.toJSON(),
          participants
        }
      }
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create chat',
      error: error.message
    });
  }
});

// @route   GET /api/chat/list
// @desc    Get user's chat list
// @access  Private
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('Getting chat list for user:', req.user.id);

    // Get chats where user is a participant using raw query
    const { sequelize } = require('../config/database');
    
    // First, let's check what chat_participants exist for this user
    const userParticipations = await sequelize.query(`
      SELECT cp.*, c.id as chat_id, c.chat_type, c.is_active
      FROM chat_participants cp 
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = :userId
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('User participations:', userParticipations);

    const chats = await sequelize.query(`
      SELECT DISTINCT c.* 
      FROM chats c 
      INNER JOIN chat_participants cp ON c.id = cp.chat_id 
      WHERE cp.user_id = :userId AND c.is_active = true 
      ORDER BY c.last_activity DESC 
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { 
        userId: req.user.id, 
        limit: parseInt(limit), 
        offset: skip 
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Found chats:', chats);

    // Get participants for each chat
    const chatsWithParticipants = await Promise.all(
      chats.map(async (chat) => {
        const participants = await sequelize.query(`
          SELECT u.id, u.full_name as "fullName", u.profile_picture as "profilePicture", u.user_type as "userType"
          FROM users u 
          INNER JOIN chat_participants cp ON u.id = cp.user_id 
          WHERE cp.chat_id = :chatId
        `, {
          replacements: { chatId: chat.id },
          type: sequelize.QueryTypes.SELECT
        });
        return {
          ...chat,
          participants
        };
      })
    );

    const totalResult = await sequelize.query(`
      SELECT COUNT(DISTINCT c.id) as count
      FROM chats c 
      INNER JOIN chat_participants cp ON c.id = cp.chat_id 
      WHERE cp.user_id = :userId AND c.is_active = true
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    });
    const total = totalResult[0].count;

    res.json({
      status: 'success',
      data: {
        chats: chatsWithParticipants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chat list',
      error: error.message
    });
  }
});

// @route   GET /api/chat/:id
// @desc    Get chat details and messages
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const currentUserId = req.user.id;

    // First, check if the current user is a participant in this chat
    const isParticipant = await ChatParticipant.findOne({
      where: {
        chatId: chatId,
        userId: currentUserId,
        isActive: true
      }
    });

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this chat'
      });
    }

    // Get chat details
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isActive: true
      }
    });

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Get participants using the join table
    const participants = await sequelize.query(`
      SELECT u.id, u.full_name AS "fullName", u.profile_picture AS "profilePicture", u.user_type AS "userType", u.is_active AS "isActive", u.last_login AS "lastLogin"
      FROM users u
      INNER JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_id = :chatId AND cp.is_active = true
    `, {
      replacements: { chatId: chatId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get messages using raw query to handle column name mapping
    console.log('🔍 Fetching messages for chat:', chatId, 'for user:', currentUserId);
    const messages = await sequelize.query(`
      SELECT 
        m.id,
        m.chat_id as "chatId",
        m.sender_id as "senderId",
        m.content,
        m.message_type as "messageType",
        m.attachments,
        m.is_read as "isRead",
        m.read_by as "readBy",
        m.is_edited as "isEdited",
        m.edited_at as "editedAt",
        m.is_deleted as "isDeleted",
        m.deleted_at as "deletedAt",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt",
        u.id as "sender.id",
        u.full_name as "sender.fullName",
        u.profile_picture as "sender.profilePicture",
        u.user_type as "sender.userType"
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = :chatId AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { 
        chatId: chatId,
        limit: parseInt(limit),
        offset: skip 
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📨 Found', messages.length, 'messages for chat:', chatId);
    messages.forEach((msg, index) => {
      console.log(`📨 Message ${index + 1}: "${msg.content}" from sender ${msg['sender.id']} (${msg['sender.fullName']})`);
    });

    const totalMessagesResult = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM messages m
      WHERE m.chat_id = :chatId AND m.is_deleted = false
    `, {
      replacements: { chatId: chatId },
      type: sequelize.QueryTypes.SELECT
    });
    const totalMessages = totalMessagesResult[0].count;

    res.json({
      status: 'success',
      data: {
        chat: {
          ...chat.toJSON(),
          participants
        },
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get chat details',
      error: error.message
    });
  }
});

// @route   POST /api/chat/:id/message
// @desc    Send a message
// @access  Private
router.post('/:id/message', [
  body('content').optional().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'document', 'file', 'audio']).withMessage('Invalid message type')
], checkValidation, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.user.id;

    // Check if chat exists and user is participant
    const chat = await Chat.findByPk(chatId);
    
    if (!chat || !chat.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Check if user is participant in this chat
    const isParticipant = await ChatParticipant.findOne({
      where: {
        chatId: chatId,
        userId: senderId,
        isActive: true
      }
    });

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this chat'
      });
    }

    const messageData = {
      chatId,
      senderId,
      content,
      messageType,
      attachments
    };

    const message = await Message.create(messageData);

    // Update chat last activity
    await chat.update({
      lastActivity: new Date()
    });

    // Get sender info
    const sender = await User.findByPk(senderId, {
      attributes: ['id', 'fullName', 'profilePicture', 'userType']
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: {
        message: {
          ...message.toJSON(),
          sender
        }
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// @route   PUT /api/chat/:id/read
// @desc    Mark messages as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    // Check if user is participant in this chat
    const isParticipant = await ChatParticipant.findOne({
      where: {
        chatId: chatId,
        userId: userId,
        isActive: true
      }
    });

    if (!isParticipant) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not a participant in this chat'
      });
    }

    // Mark messages as read for this user using raw query
    await sequelize.query(`
      UPDATE messages 
      SET 
        is_read = true,
        read_by = COALESCE(read_by, '[]'::jsonb) || :readData::jsonb
      WHERE 
        chat_id = :chatId 
        AND sender_id != :userId 
        AND is_read = false
    `, {
      replacements: { 
        chatId: chatId,
        userId: userId,
        readData: JSON.stringify([{ user: userId, readAt: new Date() }])
      },
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

// @route   POST /api/chat/upload
// @desc    Upload a file for chat messages
// @access  Private
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      status: 'success',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'File upload failed',
      error: error.message
    });
  }
});

module.exports = router;

