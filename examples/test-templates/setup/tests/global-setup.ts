/**
 * Global Setup File for Vitest
 *
 * Purpose: Setup that runs once before all test suites
 *
 * Usage: Configure in vitest.config.ts under globalSetup
 */

import { beforeAll } from 'vitest';

export async function setup() {
  // This runs once before all test files

  console.log('\n═══════════════════════════════════════════════════');
  console.log('🧪 Starting Test Suite');
  console.log('═══════════════════════════════════════════════════\n');

  // Log test environment
  console.log('Environment:');
  console.log(`  - Node: ${process.version}`);
  console.log(`  - Platform: ${process.platform}`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - CI: ${process.env.CI ? 'true' : 'false'}`);
  console.log('');

  // Validate required environment variables
  const requiredVars = [
    'NODE_ENV',
    // Add provider API keys if running integration tests
    // 'OPENAI_API_KEY',
    // 'ANTHROPIC_API_KEY',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:');
    missingVars.forEach((varName) => console.warn(`    - ${varName}`));
    console.warn('');
  }

  // Setup test database/services if needed
  await setupTestServices();

  // Global mock configuration
  setupGlobalMocks();
}

export async function teardown() {
  // This runs once after all test files

  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ Test Suite Complete');
  console.log('═══════════════════════════════════════════════════\n');

  // Cleanup test services
  await teardownTestServices();
}

async function setupTestServices() {
  // Start any services needed for tests
  // Examples: test database, mock servers, etc.

  if (process.env.START_TEST_SERVER === 'true') {
    console.log('📡 Starting test server...');
    // await startTestServer();
  }

  if (process.env.START_TEST_DB === 'true') {
    console.log('🗄️  Starting test database...');
    // await startTestDatabase();
  }
}

async function teardownTestServices() {
  // Cleanup services after tests
  if (process.env.START_TEST_SERVER === 'true') {
    console.log('🛑 Stopping test server...');
    // await stopTestServer();
  }

  if (process.env.START_TEST_DB === 'true') {
    console.log('🗄️  Stopping test database...');
    // await stopTestDatabase();
  }
}

function setupGlobalMocks() {
  // Configure global mocks
  // Example: Mock console.log, console.error to reduce noise
  // Example: Mock fetch for API tests

  if (process.env.MOCK_FETCH === 'true') {
    console.log('🎭 Fetch mocking enabled');
    // setupFetchMock();
  }
}

/**
 * Customization Checklist:
 *
 * ✅ Add required environment variables for your project
 * ✅ Configure test services (database, server, etc.)
 * ✅ Setup global mocks
 * ✅ Add logging configuration
 * ✅ Configure cleanup tasks
 * ✅ Add test data seeding
 */
