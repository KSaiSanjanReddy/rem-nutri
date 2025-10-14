const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chat_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'direct',
    validate: {
      isIn: [['direct', 'group']]
    }
  },
  chat_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // Health-specific fields
  consultation_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  symptoms: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  follow_up_date: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'chats'
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  message_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'text',
    validate: {
      isIn: [['text', 'image', 'document', 'file', 'audio']]
    }
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  read_by: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: 'messages'
});

// Define ChatParticipant model for the many-to-many relationship
const ChatParticipant = sequelize.define('ChatParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'chat_participants'
});

// Define associations - these will be set up after all models are loaded
// The associations are defined in the initDatabase.js file

// Instance methods
Chat.prototype.getParticipantsInfo = async function() {
  return await this.getParticipants({
    attributes: ['id', 'full_name', 'profile_picture', 'is_active', 'last_login']
  });
};

Chat.prototype.markAsRead = async function(userId) {
  await Message.update(
    { 
      isRead: true,
      readBy: sequelize.fn('jsonb_set', 
        sequelize.col('read_by'), 
        '{0}', 
        JSON.stringify({ user: userId, readAt: new Date() })
      )
    },
    { 
      where: { 
        chatId: this.id,
        senderId: { [sequelize.Sequelize.Op.ne]: userId },
        isRead: false
      }
    }
  );
};

module.exports = { Chat, Message, ChatParticipant };