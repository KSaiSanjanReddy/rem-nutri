const { sequelize } = require('./database');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { Chat, Message } = require('../models/Chat');
const ChatParticipant = require('../models/ChatParticipant');

const initDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables created/updated successfully');
    
    // Create indexes
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
