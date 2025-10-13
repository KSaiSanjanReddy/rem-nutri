const axios = require('axios');

async function testRegistration() {
  try {
    const response = await axios.post('https://chat.consultare.io/api/auth/register', {
      full_name: 'Test User',
      email: 'test@example.com',
      mobile: '1234567890',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'male',
      user_type: 'user'
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testRegistration();
