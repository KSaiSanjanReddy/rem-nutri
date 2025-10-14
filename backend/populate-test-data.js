require('dotenv').config({ path: './production.env' });
const { sequelize } = require('./config/database');
const { User, Chat, Message, ChatParticipant } = require('./models');
const bcrypt = require('bcryptjs');

async function populateTestData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Message.destroy({ where: {} });
    await ChatParticipant.destroy({ where: {} });
    await Chat.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    // Create test users
    console.log('👥 Creating test users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user1 = await User.create({
      full_name: 'nello',
      email: 'nello@test.com',
      mobile: '+1234567890',
      password: hashedPassword,
      user_type: 'user',
      is_email_verified: true,
      is_mobile_verified: true,
      date_of_birth: '1990-01-01',
      gender: 'male'
    });
    
    const user2 = await User.create({
      full_name: 'mello',
      email: 'mello@test.com',
      mobile: '+1234567891',
      password: hashedPassword,
      user_type: 'user',
      is_email_verified: true,
      is_mobile_verified: true,
      date_of_birth: '1992-05-15',
      gender: 'female'
    });
    
    console.log('✅ Users created:', user1.full_name, user2.full_name);
    
    // Create test chat
    console.log('💬 Creating test chat...');
    const chat = await Chat.create({
      chat_type: 'direct',
      is_active: true
    });
    
    // Add participants using raw SQL
    await sequelize.query(`
      INSERT INTO chat_participants (id, chat_id, user_id, joined_at, is_active)
      VALUES (gen_random_uuid(), :chatId, :userId1, NOW(), true)
    `, {
      replacements: { chatId: chat.id, userId1: user1.id },
      type: sequelize.QueryTypes.INSERT
    });
    
    await sequelize.query(`
      INSERT INTO chat_participants (id, chat_id, user_id, joined_at, is_active)
      VALUES (gen_random_uuid(), :chatId, :userId2, NOW(), true)
    `, {
      replacements: { chatId: chat.id, userId2: user2.id },
      type: sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ Chat created with participants');
    
    // Create test messages
    console.log('📨 Creating test messages...');
    const messages = [
      { content: 'Hello! How are you?', sender_id: user1.id },
      { content: 'Hi! I am doing great, thanks for asking!', sender_id: user2.id },
      { content: 'That is wonderful to hear!', sender_id: user1.id },
      { content: 'Yes, everything is going well on my end too.', sender_id: user2.id },
      { content: 'Great! Let us keep in touch.', sender_id: user1.id }
    ];
    
    for (const msgData of messages) {
      await Message.create({
        chat_id: chat.id,
        sender_id: msgData.sender_id,
        content: msgData.content,
        message_type: 'text',
        attachments: [],
        is_read: true,
        read_by: [{ user: user1.id, readAt: new Date() }, { user: user2.id, readAt: new Date() }]
      });
    }
    
    console.log('✅ Test messages created');
    
    // Verify data
    const userCount = await User.count();
    const chatCount = await Chat.count();
    const messageCount = await Message.count();
    
    console.log('\n📊 Database populated successfully:');
    console.log(`  Users: ${userCount}`);
    console.log(`  Chats: ${chatCount}`);
    console.log(`  Messages: ${messageCount}`);
    console.log(`\n🎯 Chat ID: ${chat.id}`);
    console.log('🔑 Login credentials:');
    console.log('  User 1: nello@test.com / password123');
    console.log('  User 2: mello@test.com / password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

populateTestData();
