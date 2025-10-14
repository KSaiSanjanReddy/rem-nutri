require('dotenv').config({ path: './production.env' });
const { sequelize } = require('./config/database');
const { Message, Chat } = require('./models/Chat');

async function checkAllMessages() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get all chats
    const chats = await Chat.findAll({
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`\n📊 Found ${chats.length} chats:`);
    chats.forEach((chat, index) => {
      console.log(`\nChat ${index + 1}:`);
      console.log(`  ID: ${chat.id}`);
      console.log(`  Type: ${chat.chat_type}`);
      console.log(`  Active: ${chat.is_active}`);
      console.log(`  Created: ${chat.created_at}`);
    });
    
    // Get all messages
    const allMessages = await Message.findAll({
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`\n📊 Found ${allMessages.length} total messages:`);
    allMessages.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log(`  ID: ${msg.id}`);
      console.log(`  Chat ID: ${msg.chat_id}`);
      console.log(`  Content: "${msg.content}"`);
      console.log(`  Content Type: ${typeof msg.content}`);
      console.log(`  Sender ID: ${msg.sender_id}`);
      console.log(`  Created At: ${msg.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAllMessages();
