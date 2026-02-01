#!/usr/bin/env node

/**
 * LOCAL TESTING SCRIPT
 * Tests student login without deployment
 * 
 * Usage:
 *   1. Run this script: node test-local-login.js
 *   2. Server will start automatically
 *   3. Tests will run
 *   4. Server will shutdown
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const PORT = 5000;

// Test credentials
const testCases = [
  {
    name: 'Demo User',
    registration_no: '2024SGTU00000',
    password: '20001231000000'
  },
  {
    name: 'Rahul Sharma',
    registration_no: '2024SGTU10001',
    password: '20050315110001'
  },
  {
    name: 'Nikhil Iyer (Your student)',
    registration_no: '20250044',
    password: '20060309451671'
  }
];

console.log('\n🧪 STARTING LOCAL BACKEND TEST');
console.log('='.repeat(80));

// Start server
console.log('\n📦 Starting backend server...');
const serverProcess = spawn('node', ['src/index.js'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverReady = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Server running on port')) {
    serverReady = true;
    console.log('✅ Server started on port 5000\n');
  }
});

serverProcess.stderr.on('data', (data) => {
  // Ignore Redis errors
  const output = data.toString();
  if (!output.includes('Redis')) {
    console.error('Server error:', output);
  }
});

// Wait for server to start
async function waitForServer() {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (serverReady) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!serverReady) {
        console.error('❌ Server failed to start within 10 seconds');
        serverProcess.kill();
        process.exit(1);
      }
    }, 10000);
  });
}

// Test login function
async function testLogin(testCase) {
  try {
    console.log(`\n🔐 Testing: ${testCase.name}`);
    console.log(`   Registration: ${testCase.registration_no}`);
    console.log(`   Password: ${testCase.password}`);
    
    const response = await fetch(`${BASE_URL}/api/student/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        registration_no: testCase.registration_no,
        password: testCase.password
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
      
      if (data.data?.requires_password_reset) {
        console.log(`   ⚠️  Password Reset Required`);
        console.log(`   Message: ${data.data.message}`);
      } else if (data.data?.token) {
        console.log(`   ✅ Login Successful!`);
        console.log(`   Token: ${data.data.token.substring(0, 50)}...`);
        console.log(`   Student: ${data.data.student.full_name}`);
      }
      return true;
    } else {
      console.log(`   ❌ Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  await waitForServer();
  
  console.log('\n' + '='.repeat(80));
  console.log('🧪 RUNNING LOGIN TESTS');
  console.log('='.repeat(80));

  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    const passed = await testLogin(testCase);
    if (passed) {
      passCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passCount}/${testCases.length}`);
  console.log(`❌ Failed: ${failCount}/${testCases.length}`);
  console.log('='.repeat(80) + '\n');

  // Shutdown server
  console.log('🛑 Shutting down server...');
  serverProcess.kill();
  
  setTimeout(() => {
    process.exit(failCount > 0 ? 1 : 0);
  }, 1000);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error.message);
  serverProcess.kill();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  serverProcess.kill();
  process.exit(0);
});

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test execution failed:', error.message);
  serverProcess.kill();
  process.exit(1);
});
