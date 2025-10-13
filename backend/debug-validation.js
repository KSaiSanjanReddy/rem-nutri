const axios = require('axios');

const API_BASE = 'https://chat.consultare.io/api';

async function debugValidation() {
  try {
    console.log('🔍 Debugging Validation...\n');
    
    // Test with minimal data to see what validation rules are active
    const testData = {
      full_name: 'Test User',
      email: 'test@example.com',
      mobile: '+1234567890',
      password: 'password123',
      date_of_birth: '1990-01-01',
      gender: 'male'
    };
    
    console.log('Sending data:', testData);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, testData);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error details:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.data?.errors) {
        console.log('\nValidation errors breakdown:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. Field: "${err.path}"`);
          console.log(`   Value: "${err.value}"`);
          console.log(`   Message: "${err.msg}"`);
          console.log(`   Location: "${err.location}"`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugValidation();
