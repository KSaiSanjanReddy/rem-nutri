const { sequelize } = require('./database');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { Chat, Message } = require('../models/Chat');
const ChatParticipant = require('../models/ChatParticipant');

const initDatabase = async () => {
  try {
    // Define model associations
    const { Chat, Message, ChatParticipant } = require('../models/Chat');
    
    // Chat associations
    Chat.belongsToMany(User, {
      through: ChatParticipant,
      foreignKey: 'chatId',
      otherKey: 'userId',
      as: 'participants'
    });

    User.belongsToMany(Chat, {
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

    Message.belongsTo(User, {
      foreignKey: 'senderId',
      as: 'sender'
    });

    User.hasMany(Message, {
      foreignKey: 'senderId',
      as: 'sentMessages'
    });

    console.log('✅ Model associations defined successfully');

    // Sync all models - use force: false to avoid permission issues with enums
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database tables created/updated successfully');
    
    // Create indexes - using snake_case column names since underscored: true
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
      CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
      CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps(identifier);
      CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
      CREATE INDEX IF NOT EXISTS idx_chats_last_activity ON chats(last_activity);
      CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    `);
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = initDatabase;
