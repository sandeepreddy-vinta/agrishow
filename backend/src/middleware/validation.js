/**
 * Request Validation Middleware using Zod
 */

const { z } = require('zod');
const response = require('../utils/response');

// Validation Schemas
const schemas = {
    // Franchise schemas
    createFranchise: z.object({
        name: z.string().min(1, 'Name is required').max(100).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Name contains invalid characters'),
        location: z.string().min(1, 'Location is required').max(200).regex(/^[a-zA-Z0-9\s\-_.,]+$/, 'Location contains invalid characters'),
        deviceId: z.string().min(1, 'Device ID is required').max(50).regex(/^[a-zA-Z0-9\-_]+$/, 'Device ID contains invalid characters'),
    }),

    // Content schemas
    uploadContent: z.object({
        name: z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.]*$/, 'Name contains invalid characters').optional(),
        duration: z.coerce.number().int().min(1).max(3600).optional().default(10),
    }),

    // Assignment schemas
    createAssignment: z.object({
        deviceId: z.string().min(1, 'Device ID is required').regex(/^[a-zA-Z0-9\-_]+$/, 'Device ID contains invalid characters'),
        contentIds: z.array(z.string().uuid()).min(0),
    }),

    // Auth schemas
    login: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),

    // User management schemas
    createUser: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name: z.string().min(1, 'Name is required').max(100),
        role: z.enum(['admin', 'manager', 'viewer']),
    }),

    // ID parameter
    idParam: z.object({
        id: z.string().uuid('Invalid ID format'),
    }),

    deviceIdParam: z.object({
        deviceId: z.string().min(1).regex(/^[a-zA-Z0-9\-_]+$/),
    }),
};

/**
 * Validate request body against a schema
 */
const validateBody = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
        console.error(`Validation schema '${schemaName}' not found`);
        return response.error(res, 'Internal validation error', 500);
    }

    const result = schema.safeParse(req.body);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return response.badRequest(res, 'Validation failed', errors);
    }

    req.validatedBody = result.data;
    next();
};

/**
 * Validate request params against a schema
 */
const validateParams = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
        console.error(`Validation schema '${schemaName}' not found`);
        return response.error(res, 'Internal validation error', 500);
    }

    const result = schema.safeParse(req.params);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return response.badRequest(res, 'Invalid parameters', errors);
    }

    req.validatedParams = result.data;
    next();
};

/**
 * Validate request query against a schema
 */
const validateQuery = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
        console.error(`Validation schema '${schemaName}' not found`);
        return response.error(res, 'Internal validation error', 500);
    }

    const result = schema.safeParse(req.query);
    
    if (!result.success) {
        const errors = result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return response.badRequest(res, 'Invalid query parameters', errors);
    }

    req.validatedQuery = result.data;
    next();
};

module.exports = {
    schemas,
    validateBody,
    validateParams,
    validateQuery,
};
