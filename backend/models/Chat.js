const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatType: {
    type: DataTypes.ENUM('direct', 'group'),
    defaultValue: 'direct'
  },
  chatName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  lastActivity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Health-specific fields
  consultationId: {
    type: DataTypes.STRING(50),
    allowNull: true
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
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chats',
  indexes: [
    {
      fields: ['lastActivity']
    },
    {
      fields: ['consultation_id']
    }
  ]
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [1, 1000]
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'document', 'file', 'audio'),
    defaultValue: 'text'
  },
  attachments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readBy: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  indexes: [
    {
      fields: ['chatId', 'createdAt']
    },
    {
      fields: ['senderId']
    }
  ]
});

// Define ChatParticipant model for the many-to-many relationship
const ChatParticipant = sequelize.define('ChatParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chatId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'chat_participants',
  indexes: [
    {
      unique: true,
      fields: ['chatId', 'userId']
    }
  ]
});

// Define associations
Chat.belongsToMany(sequelize.models.User, {
  through: ChatParticipant,
  foreignKey: 'chatId',
  otherKey: 'userId',
  as: 'participants'
});

sequelize.models.User.belongsToMany(Chat, {
  through: ChatParticipant,
  foreignKey: 'userId',
  otherKey: 'chatId',
  as: 'chats'
});

Chat.hasMany(Message, {
  foreignKey: 'chatId',
  as: 'messages'
});

Message.belongsTo(Chat, {
  foreignKey: 'chatId',
  as: 'chat'
});

Message.belongsTo(sequelize.models.User, {
  foreignKey: 'senderId',
  as: 'sender'
});

sequelize.models.User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages'
});

// Instance methods
Chat.prototype.getParticipantsInfo = async function() {
  return await this.getParticipants({
    attributes: ['id', 'fullName', 'profilePicture', 'isActive', 'lastLogin']
  });
};

Chat.prototype.markAsRead = async function(userId) {
  await Message.update(
    { 
      isRead: true,
      readBy: sequelize.fn('jsonb_set', 
        sequelize.col('readBy'), 
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