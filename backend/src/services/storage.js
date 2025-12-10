/**
 * Google Cloud Storage Service
 * Handles file uploads to GCS bucket
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

class StorageService {
    constructor() {
        this.storage = null;
        this.bucket = null;
        this.bucketName = process.env.GCS_BUCKET_NAME;
        this.isConfigured = false;

        this.init();
    }

    init() {
        if (!this.bucketName) {
            console.warn('[Storage] GCS_BUCKET_NAME not set. File uploads will fail.');
            return;
        }

        try {
            // When running on Cloud Run, authentication is automatic via service account
            // No credentials file needed - uses Application Default Credentials
            this.storage = new Storage();
            this.bucket = this.storage.bucket(this.bucketName);
            this.isConfigured = true;
            console.log(`[Storage] Connected to GCS bucket: ${this.bucketName}`);
        } catch (err) {
            console.error('[Storage] Failed to initialize GCS:', err.message);
        }
    }

    /**
     * Upload a file buffer to GCS
     * @param {Buffer} fileBuffer - The file data
     * @param {string} originalName - Original filename
     * @param {string} mimeType - File MIME type
     * @returns {Promise<{filename: string, url: string, size: number}>}
     */
    async uploadFile(fileBuffer, originalName, mimeType) {
        if (!this.isConfigured) {
            throw new Error('Storage not configured. Set GCS_BUCKET_NAME environment variable.');
        }

        // Generate unique filename
        const ext = path.extname(originalName);
        const safeName = originalName
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9-_. ]/g, '')
            .trim();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `content/${safeName}-${uniqueSuffix}${ext}`;

        const file = this.bucket.file(filename);

        // Upload to GCS
        await file.save(fileBuffer, {
            metadata: {
                contentType: mimeType,
            },
            resumable: false, // For files < 10MB, non-resumable is faster
        });

        // Make the file publicly readable
        await file.makePublic();

        // Get public URL
        const url = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

        return {
            filename,
            url,
            size: fileBuffer.length,
        };
    }

    /**
     * Delete a file from GCS
     * @param {string} filename - The filename/path in the bucket
     */
    async deleteFile(filename) {
        if (!this.isConfigured) {
            console.warn('[Storage] Cannot delete - storage not configured');
            return;
        }

        try {
            await this.bucket.file(filename).delete();
            console.log(`[Storage] Deleted: ${filename}`);
        } catch (err) {
            // File might not exist, log but don't throw
            console.warn(`[Storage] Failed to delete ${filename}:`, err.message);
        }
    }

    /**
     * Check if storage is properly configured
     */
    isReady() {
        return this.isConfigured;
    }
}

// Export singleton instance
module.exports = new StorageService();
