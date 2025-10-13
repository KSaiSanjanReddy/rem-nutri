const axios = require('axios');

const API_BASE = 'https://chat.consultare.io/api';

async function testRegistration() {
  try {
    console.log('🧪 Testing User Registration...\n');
    
    const testUser = {
      full_name: 'Test User',
      email: `test${Date.now()}@example.com`,
      mobile: `+123456789${Math.floor(Math.random() * 1000)}`,
      password: 'testpassword123',
      user_type: 'user',
      date_of_birth: '1990-01-01',
      gender: 'male'
    };
    
    console.log('Registration data:', testUser);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log('✅ Registration successful:', response.data);
    } catch (error) {
      console.log('❌ Registration failed:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      if (error.response?.data?.errors) {
        console.log('Validation errors:');
        error.response.data.errors.forEach(err => {
          console.log(`- ${err.param}: ${err.msg}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();
