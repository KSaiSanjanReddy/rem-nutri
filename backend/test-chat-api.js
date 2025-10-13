const axios = require('axios');

const API_BASE = 'https://chat.consultare.io/api';

async function testChatAPI() {
  try {
    console.log('🧪 Testing Chat API...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test 2: Test registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      fullName: 'Test User',
      email: `test${Date.now()}@example.com`,
      mobile: `+123456789${Math.floor(Math.random() * 1000)}`,
      password: 'testpassword123',
      userType: 'user',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.message);
      
      // Test 3: Test login
      console.log('\n3. Testing user login...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        identifier: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful');
      
      const token = loginResponse.data.token;
      
      // Test 4: Test chat creation
      console.log('\n4. Testing chat creation...');
      const chatData = {
        participantIds: ['test-user-id'], // This will fail but we can see the error
        chatType: 'direct'
      };
      
      try {
        const chatResponse = await axios.post(`${API_BASE}/chat/create`, chatData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Chat creation successful');
      } catch (chatError) {
        if (chatError.response?.data?.message?.includes('column') || 
            chatError.response?.data?.message?.includes('does not exist')) {
          console.log('❌ Chat creation failed due to column name issue:', chatError.response.data.message);
        } else {
          console.log('⚠️ Chat creation failed (expected):', chatError.response?.data?.message || chatError.message);
        }
      }
      
    } catch (registerError) {
      console.log('❌ Registration failed:', registerError.response?.data?.message || registerError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testChatAPI();
