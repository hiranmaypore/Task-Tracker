const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  try {
    console.log('1. Register/Login...');
    const email = `remind_user_${Math.floor(Math.random() * 10000)}@example.com`;
    const userRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Remind User',
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
      name: 'Reminder Project'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projectId = projectRes.data.id;
    console.log(`   Project created: ${projectId}`);

    console.log('3. Connect WebSocket...');
    const socket = io(BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('   ✅ Socket connected!');
      socket.emit('joinProject', { projectId });
    });

    socket.on('joinedProject', () => {
      console.log('   ✅ Joined room.');
      
      // Create Task due in 5 seconds
      const dueTime = new Date(Date.now() + 5000).toISOString();
      console.log(`4. Creating Task due at ${dueTime}...`);
      
      axios.post(`${BASE_URL}/tasks`, {
        title: 'Urgent Task',
        project_id: projectId,
        due_date: dueTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    socket.on('reminder', (data) => {
      console.log('   ⏰ REMINDER RECEIVED!');
      console.log('   ', data);
      
      if (data.message === 'Task due now!') {
        console.log('\n✅ TEST PASSED: Reminder received correctly!');
        process.exit(0);
      }
    });

    // Timeout (10s)
    setTimeout(() => {
      console.error('\n❌ TEST FAILED: Timeout waiting for reminder (Redis might be down).');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runTest();
