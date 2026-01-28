const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  try {
    console.log('1. Register/Login...');
    const email = `mail_user_${Math.floor(Math.random() * 10000)}@example.com`;
    // We use a real-ish email format, but Ethereal will intercept it.
    
    // Create User
    const userRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Mail User',
      email,
      password: 'password123'
    });
    
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    const token = loginRes.data.access_token;
    console.log('   Logged in.');

    console.log('2. Create Project...');
    const projectRes = await axios.post(`${BASE_URL}/projects`, {
      name: 'Mail Project'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projectId = projectRes.data.id;
    console.log(`   Project created: ${projectId}`);

    console.log('3. Create Task (Triggers Email)...');
    const taskRes = await axios.post(`${BASE_URL}/tasks`, {
      title: 'Email Task',
      project_id: projectId,
      assignee_id: userRes.data.id // Assign to self
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   Task created. Email job should be queued.');
    console.log('   Please check backend logs for "Preview URL".');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTest();
