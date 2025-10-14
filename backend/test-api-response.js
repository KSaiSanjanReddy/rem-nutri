require('dotenv').config({ path: './production.env' });
const { sequelize } = require('./config/database');

async function testAPIResponse() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Simulate the exact query from getChatDetails
    const chatId = '6aa16adf-ffe4-45a7-a299-b0657931c4fb';
    
    console.log('\n🔍 Testing getChatDetails query...');
    
    // Check if chat exists
    const chat = await sequelize.query(`
      SELECT * FROM chats WHERE id = :chatId AND is_active = true
    `, {
      replacements: { chatId },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Chat found:', chat.length > 0 ? 'YES' : 'NO');
    if (chat.length > 0) {
      console.log('📊 Chat details:', chat[0]);
    }
    
    // Check participants
    const participants = await sequelize.query(`
      SELECT u.id, u.full_name, u.profile_picture, u.user_type, u.is_active, u.last_login
      FROM users u
      INNER JOIN chat_participants cp ON u.id = cp.user_id
      WHERE cp.chat_id = :chatId AND cp.is_active = true
    `, {
      replacements: { chatId },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Participants found:', participants.length);
    participants.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.full_name} (${p.id})`);
    });
    
    // Check messages
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
        u.full_name as "sender.full_name",
        u.profile_picture as "sender.profile_picture",
        u.user_type as "sender.user_type"
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = :chatId AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT 50
    `, {
      replacements: { chatId },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('📊 Messages found:', messages.length);
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. "${msg.content}" from ${msg['sender.full_name']} (${msg['sender.id']})`);
    });
    
    // Simulate the API response
    const apiResponse = {
      status: 'success',
      data: {
        chat: chat.length > 0 ? chat[0] : null,
        participants,
        messages: messages.reverse(),
        pagination: {
          page: 1,
          limit: 50,
          total: messages.length,
          pages: Math.ceil(messages.length / 50)
        }
      }
    };
    
    console.log('\n📤 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testAPIResponse();
