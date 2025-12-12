/**
 * MSG91 SMS Service with Firestore OTP Storage
 * Uses SMS API (not OTP API) to support DLT templates with ##var1##
 * Stores OTPs in Firestore for Cloud Run stateless compatibility
 */

const axios = require('axios');
const { Firestore } = require('@google-cloud/firestore');

class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        this.firestore = new Firestore();
        this.otpCollection = this.firestore.collection('otp_tokens');
        this.OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Generate a 4-digit OTP
     */
    generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Store OTP in Firestore
     */
    async storeOTP(phone, otp) {
        await this.otpCollection.doc(phone).set({
            otp,
            expiresAt: Date.now() + this.OTP_EXPIRY_MS,
            attempts: 0,
            createdAt: new Date().toISOString(),
        });
    }

    /**
     * Get OTP from Firestore
     */
    async getOTP(phone) {
        const doc = await this.otpCollection.doc(phone).get();
        if (!doc.exists) return null;
        return doc.data();
    }

    /**
     * Update OTP attempts in Firestore
     */
    async updateAttempts(phone, attempts) {
        await this.otpCollection.doc(phone).update({ attempts });
    }

    /**
     * Delete OTP from Firestore
     */
    async deleteOTP(phone) {
        await this.otpCollection.doc(phone).delete();
    }

    /**
     * Send OTP to a phone number using SMS API
     * @param {string} phone - Phone number with country code (e.g., 919876543210)
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async sendOTP(phone) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            
            // Generate and store OTP in Firestore
            const otp = this.generateOTP();
            await this.storeOTP(cleanPhone, otp);
            
            console.log(`[MSG91] Generated OTP ${otp} for ${cleanPhone}`);
            
            // Use MSG91 Flow API to send SMS with template
            const response = await axios.post(
                'https://control.msg91.com/api/v5/flow/',
                {
                    template_id: this.templateId,
                    short_url: '0',
                    recipients: [
                        {
                            mobiles: cleanPhone,
                            var1: otp,  // Maps to ##var1## in your DLT template
                        }
                    ]
                },
                {
                    headers: {
                        'authkey': this.authKey,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('[MSG91] Send SMS response:', response.data);

            if (response.data.type === 'success' || response.data.message === 'success') {
                return {
                    success: true,
                    message: 'OTP sent successfully',
                    requestId: response.data.request_id,
                };
            }

            // Remove stored OTP if send failed
            await this.deleteOTP(cleanPhone);
            
            return {
                success: false,
                message: response.data.message || 'Failed to send OTP',
            };
        } catch (error) {
            console.error('[MSG91] Send SMS error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    }

    /**
     * Verify OTP against Firestore stored value
     * @param {string} phone - Phone number with country code
     * @param {string} otp - OTP entered by user
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOTP(phone, otp) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const stored = await this.getOTP(cleanPhone);

            console.log(`[MSG91] Verifying OTP for ${cleanPhone}, stored:`, stored ? 'found' : 'not found');

            if (!stored) {
                return {
                    success: false,
                    message: 'OTP expired or not found. Please request a new OTP.',
                };
            }

            // Check if expired
            if (Date.now() > stored.expiresAt) {
                await this.deleteOTP(cleanPhone);
                return {
                    success: false,
                    message: 'OTP has expired. Please request a new OTP.',
                };
            }

            // Check attempts (max 3)
            if (stored.attempts >= 3) {
                await this.deleteOTP(cleanPhone);
                return {
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.',
                };
            }

            // Verify OTP
            if (stored.otp === otp) {
                await this.deleteOTP(cleanPhone); // Clear after successful verification
                console.log(`[MSG91] OTP verified successfully for ${cleanPhone}`);
                return {
                    success: true,
                    message: 'OTP verified successfully',
                };
            }

            // Increment attempts on failure
            const newAttempts = (stored.attempts || 0) + 1;
            await this.updateAttempts(cleanPhone, newAttempts);
            console.log(`[MSG91] Invalid OTP attempt ${newAttempts}/3 for ${cleanPhone}`);
            
            return {
                success: false,
                message: `Invalid OTP. ${3 - newAttempts} attempts remaining.`,
            };
        } catch (error) {
            console.error('[MSG91] Verify OTP error:', error.message);
            return {
                success: false,
                message: 'OTP verification failed',
            };
        }
    }

    /**
     * Resend OTP - generates new OTP and sends again
     * @param {string} phone - Phone number with country code
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async resendOTP(phone) {
        // Simply send a new OTP
        return this.sendOTP(phone);
    }
}

module.exports = new MSG91Service();
