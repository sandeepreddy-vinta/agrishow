/**
 * Franchises API Tests
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

require('./setup');

const createApp = require('../src/app');
const DatabaseManager = require('../src/services/database');

describe('Franchises API', () => {
    let app;
    let db;
    let authToken;
    const testDbFile = path.join(__dirname, 'test-db-franchises.json');
    const testAuditLog = path.join(__dirname, 'test-audit-franchises.log');
    const testContentDir = path.join(__dirname, 'test-content-franchises');
    const testBackupDir = path.join(__dirname, 'test-backups-franchises');

    beforeAll(async () => {
        [testContentDir, testBackupDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        db = new DatabaseManager(testDbFile, testAuditLog, null, null).init();
        app = createApp(db, testContentDir, testBackupDir);

        // Get auth token
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@franchiseos.com',
                password: 'Admin@123',
            });
        authToken = res.body.data.token;
    });

    afterAll(() => {
        [testDbFile, testAuditLog].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        [testContentDir, testBackupDir].forEach(dir => {
            if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
        });
    });

    describe('POST /api/franchises', () => {
        it('should create a new franchise with valid data', async () => {
            const res = await request(app)
                .post('/api/franchises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Franchise',
                    location: 'Test Location',
                    deviceId: 'test-device-001',
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('id');
        });

        it('should reject duplicate deviceId', async () => {
            const res = await request(app)
                .post('/api/franchises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Another Franchise',
                    location: 'Another Location',
                    deviceId: 'test-device-001', // Same as above
                });

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should reject missing required fields', async () => {
            const res = await request(app)
                .post('/api/franchises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Franchise',
                    // Missing location and deviceId
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject unauthorized requests', async () => {
            const res = await request(app)
                .post('/api/franchises')
                .send({
                    name: 'Test Franchise',
                    location: 'Test Location',
                    deviceId: 'test-device-002',
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/franchises', () => {
        it('should return list of franchises with masked tokens', async () => {
            const res = await request(app)
                .get('/api/franchises')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            
            if (res.body.data.length > 0) {
                expect(res.body.data[0].token).toBe('***MASKED***');
            }
        });

        it('should reject unauthorized requests', async () => {
            const res = await request(app)
                .get('/api/franchises');

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/franchises/:id', () => {
        let franchiseId;

        beforeAll(async () => {
            // Create a franchise to delete
            const res = await request(app)
                .post('/api/franchises')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'To Delete',
                    location: 'Delete Location',
                    deviceId: 'delete-device-001',
                });
            franchiseId = res.body.data.id;
        });

        it('should delete an existing franchise', async () => {
            const res = await request(app)
                .delete(`/api/franchises/${franchiseId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 for non-existent franchise', async () => {
            const res = await request(app)
                .delete('/api/franchises/non-existent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
});
