const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  try {
    console.log('1. Register/Login...');
    const email = `ws_user_${Math.floor(Math.random() * 10000)}@example.com`;
    const userRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'WS User',
      email,
      password: 'password123'
    });
    
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    
    const token = loginRes.data.access_token;
    console.log('   Logged in. Token obtained.');

    console.log('2. Create Project...');
    const projectRes = await axios.post(`${BASE_URL}/projects`, {
      name: 'Realtime Project'
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
      
      // Join Room
      console.log(`4. Joining room project_${projectId}...`);
      socket.emit('joinProject', { projectId });
    });

    socket.on('connect_error', (err) => {
      console.error('   ❌ Socket connection error:', err.message);
      process.exit(1);
    });

    socket.on('joinedProject', (data) => {
      console.log('   ✅ Joined room:', data);
      
      // Trigger Event
      console.log('5. Creating Task via REST...');
      axios.post(`${BASE_URL}/tasks`, {
        title: 'Live Task',
        project_id: projectId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    socket.on('task_created', (task) => {
      console.log('   🎉 EVENT RECEIVED: task_created');
      console.log('   Data:', task);
      
      if (task.title === 'Live Task') {
        console.log('\n✅ TEST PASSED: Real-time update received!');
        process.exit(0);
      }
    });

    // Timeout
    setTimeout(() => {
      console.error('\n❌ TEST FAILED: Timeout waiting for event.');
      process.exit(1);
    }, 5000);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTest();
