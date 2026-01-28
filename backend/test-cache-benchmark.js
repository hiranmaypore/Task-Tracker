const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';

async function runBenchmark() {
  try {
    // 1. Auth and Setup
    const email = `benchmark_${Math.floor(Math.random() * 10000)}@example.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Bench User',
      email,
      password: 'password123'
    });
    
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password: 'password123'
    });
    const token = loginRes.data.access_token;
    
    // Create Data to fetch
    const projectRes = await axios.post(`${BASE_URL}/projects`, { name: 'Bench Project' }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Create 10 tasks to make payload meaningful
    const promises = [];
    for (let i = 0; i < 10; i++) {
        promises.push(axios.post(`${BASE_URL}/tasks`, {
            title: `Task ${i}`,
            project_id: projectRes.data.id
        }, { headers: { Authorization: `Bearer ${token}` } }));
    }
    await Promise.all(promises);
    
    console.log(`\n--- 🚀 REDIS CACHE BENCHMARK ---`);
    console.log(`Testing Fetch Time for 10 Tasks (Remote DB vs Remote Redis)\n`);

    // First Request (Invalidate first to ensure clean state? No, new user = clean state)
    // Actually, create sends invalidation. So cache is EMPTY now.

    const start1 = performance.now();
    await axios.get(`${BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    const end1 = performance.now();
    const dbTime = (end1 - start1).toFixed(2);
    
    console.log(`[attempt 1] Database Fetch (Cache MISS): ${dbTime} ms`);

    // Second Request
    const start2 = performance.now();
    await axios.get(`${BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
    const end2 = performance.now();
    const redisTime = (end2 - start2).toFixed(2);

    console.log(`[attempt 2] Redis Fetch    (Cache HIT ): ${redisTime} ms`);

    // Results
    console.log(`\n--- RESULT ---`);
    if (Number(redisTime) < Number(dbTime)) {
        const factor = (Number(dbTime) / Number(redisTime)).toFixed(2);
        console.log(`✅ Redis is ${factor}x faster than Database.`);
    } else {
        console.log(`⚠️ Redis was slower. (Common if network latency to Redis Cloud > Database Query time)`);
    }

  } catch (error) {
    console.error('Benchmark error:', error.message);
  }
}

runBenchmark();
