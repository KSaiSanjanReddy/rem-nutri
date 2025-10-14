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

    // Check if direct chat already exists using raw SQL
    if (chatType === 'direct') {
      const existingChats = await sequelize.query(`
        SELECT DISTINCT c.* 
        FROM chats c 
        INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id 
        INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id 
        WHERE c.chat_type = 'direct' 
        AND c.is_active = true
        AND cp1.user_id = :currentUserId 
        AND cp2.user_id = :participantId
        AND cp1.user_id != cp2.user_id
      `, {
        replacements: { 
          currentUserId: currentUserId, 
          participantId: participantId 
        },
        type: sequelize.QueryTypes.SELECT
      });

      if (existingChats.length > 0) {
        const existingChat = existingChats[0];
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
      attributes: ['id', 'full_name', 'profile_picture', 'user_type']
    });

    // Add participants to chat using raw SQL
    for (const participant of participants) {
      await sequelize.query(`
        INSERT INTO chat_participants (id, chat_id, user_id, joined_at, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), :chatId, :userId, NOW(), true, NOW(), NOW())
        ON CONFLICT (chat_id, user_id) DO NOTHING
      `, {
        replacements: { 
          chatId: chat.id, 
          userId: participant.id 
        },
        type: sequelize.QueryTypes.INSERT
      });
    }
    
    console.log('Chat created with participants:', participants.map(p => ({ id: p.id, name: p.full_name })));

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

module.exports = router;
