module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    testTimeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
