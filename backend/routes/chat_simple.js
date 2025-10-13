const express = require('express');
const { body, validationResult } = require('express-validator');
const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');
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
      const existingChat = await Chat.findOne({
        where: {
          chatType: 'direct',
          participants: {
            [Chat.sequelize.Op.contains]: [currentUserId, participantId]
          }
        },
        include: [{
          model: User,
          as: 'participants',
          attributes: ['id', 'full_name', 'profile_picture']
        }]
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
      participants: [currentUserId, participantId],
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
          [User.sequelize.Op.in]: [currentUserId, participantId]
        }
      },
      attributes: ['id', 'full_name', 'profile_picture', 'user_type']
    });

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

    const chats = await Chat.findAll({
      where: {
        participants: {
          [Chat.sequelize.Op.contains]: [req.user.id]
        },
        isActive: true
      },
      order: [['lastActivity', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });

    // Get participants for each chat
    const chatsWithParticipants = await Promise.all(
      chats.map(async (chat) => {
        const participants = await User.findAll({
          where: {
            id: {
              [User.sequelize.Op.in]: chat.participants
            }
          },
          attributes: ['id', 'full_name', 'profile_picture', 'user_type']
        });
        return {
          ...chat.toJSON(),
          participants
        };
      })
    );

    const total = await Chat.count({
      where: {
        participants: {
          [Chat.sequelize.Op.contains]: [req.user.id]
        },
        isActive: true
      }
    });

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

    const chat = await Chat.findOne({
      where: {
        id: chatId,
        participants: {
          [Chat.sequelize.Op.contains]: [req.user.id]
        },
        isActive: true
      }
    });

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
      });
    }

    // Get participants
    const participants = await User.findAll({
      where: {
        id: {
          [User.sequelize.Op.in]: chat.participants
        }
      },
      attributes: ['id', 'full_name', 'profile_picture', 'user_type']
    });

    // Get messages
    const messages = await Message.findAll({
      where: {
        chatId: chatId,
        isDeleted: false
      },
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit),
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'full_name', 'profile_picture', 'user_type']
      }]
    });

    const totalMessages = await Message.count({
      where: {
        chatId: chatId,
        isDeleted: false
      }
    });

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
  body('messageType').optional().isIn(['text', 'image', 'document', 'file']).withMessage('Invalid message type')
], checkValidation, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.user.id;

    // Check if chat exists and user is participant
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        participants: {
          [Chat.sequelize.Op.contains]: [senderId]
        },
        isActive: true
      }
    });

    if (!chat) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat not found'
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
      attributes: ['id', 'full_name', 'profile_picture', 'user_type']
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

module.exports = router;
