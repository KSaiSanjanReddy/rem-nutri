require('dotenv').config({ path: './production.env' });
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function testDirectRegistration() {
  try {
    console.log('🔍 Testing direct user creation...');
    
    // Test user data
    const testUserData = {
      full_name: 'Test Direct User',
      email: 'testdirect@example.com',
      mobile: '+1234567898',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'male',
      user_type: 'user'
    };
    
    console.log('📝 Creating user with data:', testUserData);
    
    // Create user directly
    const user = await User.create(testUserData);
    
    console.log('✅ User created successfully!');
    console.log('User ID:', user.id);
    console.log('User Name:', user.full_name);
    console.log('User Email:', user.email);
    
    // Verify user exists in database
    const foundUser = await User.findByPk(user.id);
    console.log('✅ User found in database:', foundUser ? 'YES' : 'NO');
    
    // Count total users
    const totalUsers = await User.count();
    console.log('📊 Total users in database:', totalUsers);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

testDirectRegistration();
