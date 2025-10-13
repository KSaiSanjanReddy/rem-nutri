const axios = require('axios');

const API_BASE = 'https://chat.consultare.io/api';

async function testSimple() {
  try {
    console.log('🧪 Testing Simple API Call...\n');
    
    // Test with old field names to see what happens
    const testUserOld = {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      mobile: `+123456789${Math.floor(Math.random() * 1000)}`,
      password: 'testpassword123',
      userType: 'user',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    };
    
    console.log('Testing with OLD field names (camelCase):');
    console.log('Data:', testUserOld);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, testUserOld);
      console.log('✅ Registration with OLD field names successful:', response.data);
    } catch (error) {
      console.log('❌ Registration with OLD field names failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test with new field names
    const testUserNew = {
      full_name: 'Test User',
      email: `test${Date.now()}@example.com`,
      mobile: `+123456789${Math.floor(Math.random() * 1000)}`,
      password: 'testpassword123',
      user_type: 'user',
      date_of_birth: '1990-01-01',
      gender: 'male'
    };
    
    console.log('Testing with NEW field names (snake_case):');
    console.log('Data:', testUserNew);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, testUserNew);
      console.log('✅ Registration with NEW field names successful:', response.data);
    } catch (error) {
      console.log('❌ Registration with NEW field names failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimple();
