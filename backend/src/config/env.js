/**
 * Environment Configuration & Validation
 * Ensures all required environment variables are present at startup
 */

const requiredEnvVars = [
    'API_KEY',
    'JWT_SECRET',
];

const optionalEnvVars = {
    PORT: '3000',
    MAX_FILE_SIZE: '524288000',
    ALLOWED_VIDEO_TYPES: 'video/mp4,video/quicktime,video/webm',
    ALLOWED_IMAGE_TYPES: 'image/jpeg,image/png',
    ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
    ADMIN_EMAIL: 'admin@franchiseos.com',
    ADMIN_PASSWORD: 'Admin@123',
    JWT_EXPIRES_IN: '24h',
};

function validateEnv() {
    const missing = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease check your .env file. See .env.example for reference.');
        process.exit(1);
    }

    // Set defaults for optional vars
    for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
        }
    }

    console.log('✅ Environment configuration validated');
}

const config = {
    port: parseInt(process.env.PORT) || 3000,
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024,
    allowedVideoTypes: (process.env.ALLOWED_VIDEO_TYPES || '').split(','),
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || '').split(','),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
};

module.exports = { validateEnv, config };
