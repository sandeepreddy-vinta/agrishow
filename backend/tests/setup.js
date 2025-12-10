/**
 * Jest Test Setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-api-key';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.ADMIN_EMAIL = 'admin@franchiseos.com';
process.env.ADMIN_PASSWORD = 'Admin@123';

// Suppress console logs during tests (optional)
// global.console = {
//     ...console,
//     log: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
// };
