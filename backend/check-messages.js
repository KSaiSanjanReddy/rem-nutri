require('dotenv').config({ path: './production.env' });
const { sequelize } = require('./config/database');
const { Message } = require('./models/Chat');

async function checkMessages() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get all messages from the specific chat
    const chatId = '6aa16adf-ffe4-45a7-a299-b0657931c4fb';
    const messages = await Message.findAll({
      where: { chat_id: chatId },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    console.log(`\n📊 Found ${messages.length} messages in chat ${chatId}:`);
    console.log('='.repeat(80));
    
    messages.forEach((msg, index) => {
      console.log(`\nMessage ${index + 1}:`);
      console.log(`  ID: ${msg.id}`);
      console.log(`  Content: "${msg.content}"`);
      console.log(`  Content Type: ${typeof msg.content}`);
      console.log(`  Content Length: ${msg.content ? msg.content.length : 'null'}`);
      console.log(`  Message Type: ${msg.message_type}`);
      console.log(`  Sender ID: ${msg.sender_id}`);
      console.log(`  Created At: ${msg.created_at}`);
      console.log(`  Raw Data:`, JSON.stringify(msg.toJSON(), null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkMessages();
