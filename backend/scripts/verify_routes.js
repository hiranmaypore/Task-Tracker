const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:8080';

const log = (msg, type = 'INFO') => console.log(`[${type}] ${msg}`);
const step = (msg) => console.log(`\n🔹 ${msg}`);

async function runTest() {
    log('Starting Full Route Verification...');

    // 1. Check Backend Health
    step('Checking Backend Health');
    try {
        const res = await axios.get(`${BASE_URL}/`);
        log(`Backend Root: ${res.data}`, 'SUCCESS');
    } catch (e) {
        log(`Backend unavailable: ${e.message}`, 'ERROR');
        process.exit(1);
    }

    // 2. Check Frontend (Basic Reachability)
    step('Checking Frontend Reachability');
    try {
        const res = await axios.get(FRONTEND_URL);
        if (res.status === 200) log('Frontend Accessible', 'SUCCESS');
    } catch (e) {
        log(`Frontend unavailable: ${e.message}`, 'ERROR');
    }

    // 3. Auth: Register / Login
    step('Testing Authentication (Register/Login)');
    let token = '';
    const email = `test.route.${Date.now()}@example.com`;
    const password = 'password123';

    try {
        // Register
        log(`Registering user: ${email}`);
        await axios.post(`${BASE_URL}/auth/register`, {
            email,
            password,
            name: 'Route Tester'
        });
        
        // Login
        log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });
        token = loginRes.data.access_token;
        log('Token acquired', 'SUCCESS');
    } catch (e) {
        log(`Auth failed: ${e.response?.data?.message || e.message}`, 'ERROR');
        process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // 4. Test Protected API Routes
    const protectedRoutes = [
        { name: 'Get Projects', path: '/projects', method: 'get' },
        { name: 'Get Tasks', path: '/tasks', method: 'get' },
        { name: 'Get Notifications', path: '/notifications', method: 'get' },
        { name: 'Get Analytics DAU', path: '/analytics/dau', method: 'get' },
        { name: 'Check Calendar Status', path: '/calendar/status', method: 'get' },
    ];

    step('Testing Protected API Routes');
    for (const route of protectedRoutes) {
        try {
            const res = await axios[route.method](`${BASE_URL}${route.path}`, {...authHeaders, params: route.params });
            log(`${route.name} (${route.path}) -> ${res.status} OK`, 'SUCCESS');
        } catch (e) {
            log(`${route.name} failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'ERROR');
        }
    }

    // 5. Test Creation Flow (Project + Task)
    step('Testing Data Creation Flow');
    let projectId = '';
    
    // Create Project
    try {
        const pRes = await axios.post(`${BASE_URL}/projects`, { name: 'Route Test Project' }, authHeaders);
        projectId = pRes.data.id;
        log(`Created Project: ${projectId}`, 'SUCCESS');
    } catch (e) {
        log(`Create Project failed: ${e.message}`, 'ERROR');
    }

    // Create Task (with valid Project ID)
    if (projectId) {
        try {
            const tRes = await axios.post(`${BASE_URL}/tasks`, {
                title: 'Test Route Task',
                priority: 'MEDIUM',
                project_id: projectId
            }, authHeaders);
            log(`Created Task: ${tRes.data.id}`, 'SUCCESS');
        } catch (e) {
            log(`Create Task failed: ${e.message}`, 'ERROR');
            if (e.response?.status === 500) log('>>> This is likely the "Invalid ID" error if still persisting.', 'WARN');
        }
    }

    log('\n✅ Verification Complete');
}

runTest();
