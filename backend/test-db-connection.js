require('dotenv').config({ path: './production.env' });
const { sequelize } = require('./config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📊 Environment variables:');
    console.log('  DB_HOST:', process.env.DB_HOST);
    console.log('  DB_PORT:', process.env.DB_PORT);
    console.log('  DB_NAME:', process.env.DB_NAME);
    console.log('  DB_USER:', process.env.DB_USER);
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test query
    const [results] = await sequelize.query('SELECT current_database(), current_user, version()');
    console.log('📊 Database info:', results[0]);
    
    // Check if tables exist
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Tables in database:', tables.map(t => t.table_name));
    
    // Check users table
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log('📊 Users count:', users[0].count);
    
    // Check chats table
    const [chats] = await sequelize.query('SELECT COUNT(*) as count FROM chats');
    console.log('📊 Chats count:', chats[0].count);
    
    // Check messages table
    const [messages] = await sequelize.query('SELECT COUNT(*) as count FROM messages');
    console.log('📊 Messages count:', messages[0].count);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
