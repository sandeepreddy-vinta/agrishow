/**
 * Standardized API Response Helpers
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
};

const created = (res, data = null, message = 'Created successfully') => {
    return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        error: details,
        timestamp: new Date().toISOString(),
    });
};

const badRequest = (res, message = 'Bad request', details = null) => {
    return error(res, message, 400, details);
};

const unauthorized = (res, message = 'Unauthorized') => {
    return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
    return error(res, message, 403);
};

const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};

const conflict = (res, message = 'Conflict') => {
    return error(res, message, 409);
};

module.exports = {
    success,
    created,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
};
