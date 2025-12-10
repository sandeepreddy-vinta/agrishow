/**
 * Global Error Handler Middleware
 */

const response = require('../utils/response');

// Custom Error Classes
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400);
        this.details = details;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return response.badRequest(res, 'File too large');
    }

    // Multer file type error
    if (err.message && err.message.includes('Invalid file type')) {
        return response.badRequest(res, err.message);
    }

    // Database lock error
    if (err.message === 'Database is locked. Try again later.') {
        return response.error(res, 'Server busy, please try again', 503);
    }

    // Operational errors (expected)
    if (err.isOperational) {
        return response.error(res, err.message, err.statusCode, err.details);
    }

    // Programming or unknown errors
    return response.error(res, 'Internal server error', 500);
};

// 404 Handler
const notFoundHandler = (req, res) => {
    return response.notFound(res, `Route ${req.method} ${req.path} not found`);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
    ConflictError,
};
