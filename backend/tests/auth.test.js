/**
 * Authentication API Tests
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Setup test environment
require('./setup');

const createApp = require('../src/app');
const DatabaseManager = require('../src/services/database');

describe('Authentication API', () => {
    let app;
    let db;
    const testDbFile = path.join(__dirname, 'test-db.json');
    const testAuditLog = path.join(__dirname, 'test-audit.log');
    const testContentDir = path.join(__dirname, 'test-content');
    const testBackupDir = path.join(__dirname, 'test-backups');

    beforeAll(() => {
        // Create test directories
        [testContentDir, testBackupDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Initialize test database
        db = new DatabaseManager(testDbFile, testAuditLog, null, null).init();
        app = createApp(db, testContentDir, testBackupDir);
    });

    afterAll(() => {
        // Cleanup test files
        [testDbFile, testAuditLog].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        [testContentDir, testBackupDir].forEach(dir => {
            if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@franchiseos.com',
                    password: 'Admin@123',
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user).toHaveProperty('email', 'admin@franchiseos.com');
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@franchiseos.com',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject invalid email format', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject missing fields', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@franchiseos.com',
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@franchiseos.com',
                    password: 'Admin@123',
                });
            authToken = res.body.data.token;
        });

        it('should return user info with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('email', 'admin@franchiseos.com');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});

describe('Health Check API', () => {
    let app;
    let db;
    const testDbFile = path.join(__dirname, 'test-db-health.json');
    const testAuditLog = path.join(__dirname, 'test-audit-health.log');
    const testContentDir = path.join(__dirname, 'test-content-health');
    const testBackupDir = path.join(__dirname, 'test-backups-health');

    beforeAll(() => {
        [testContentDir, testBackupDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        db = new DatabaseManager(testDbFile, testAuditLog, null, null).init();
        app = createApp(db, testContentDir, testBackupDir);
    });

    afterAll(() => {
        [testDbFile, testAuditLog].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        [testContentDir, testBackupDir].forEach(dir => {
            if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
        });
    });

    describe('GET /api/health', () => {
        it('should return healthy status', async () => {
            const res = await request(app).get('/api/health');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('healthy');
            expect(res.body.data).toHaveProperty('uptime');
            expect(res.body.data).toHaveProperty('database', 'connected');
        });
    });
});
