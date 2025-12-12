/**
 * MSG91 SMS Service with Custom OTP Management
 * Uses SMS API (not OTP API) to support DLT templates with ##var1##
 */

const axios = require('axios');

class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        this.senderId = process.env.MSG91_SENDER_ID || 'AGRIML';
        
        // In-memory OTP storage with expiry (for Cloud Run stateless, consider Redis/Firestore for production)
        this.otpStore = new Map();
        this.OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
        
        // Cleanup expired OTPs every 5 minutes
        setInterval(() => this.cleanupExpiredOTPs(), 5 * 60 * 1000);
    }

    /**
     * Generate a 4-digit OTP
     */
    generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Store OTP with expiry
     */
    storeOTP(phone, otp) {
        this.otpStore.set(phone, {
            otp,
            expiresAt: Date.now() + this.OTP_EXPIRY_MS,
            attempts: 0,
        });
    }

    /**
     * Clean up expired OTPs
     */
    cleanupExpiredOTPs() {
        const now = Date.now();
        for (const [phone, data] of this.otpStore.entries()) {
            if (data.expiresAt < now) {
                this.otpStore.delete(phone);
            }
        }
    }

    /**
     * Send OTP to a phone number using SMS API
     * @param {string} phone - Phone number with country code (e.g., 919876543210)
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async sendOTP(phone) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            
            // Generate and store OTP
            const otp = this.generateOTP();
            this.storeOTP(cleanPhone, otp);
            
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
            this.otpStore.delete(cleanPhone);
            
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
     * Verify OTP against stored value
     * @param {string} phone - Phone number with country code
     * @param {string} otp - OTP entered by user
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOTP(phone, otp) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const stored = this.otpStore.get(cleanPhone);

            if (!stored) {
                return {
                    success: false,
                    message: 'OTP expired or not found. Please request a new OTP.',
                };
            }

            // Check if expired
            if (Date.now() > stored.expiresAt) {
                this.otpStore.delete(cleanPhone);
                return {
                    success: false,
                    message: 'OTP has expired. Please request a new OTP.',
                };
            }

            // Check attempts (max 3)
            if (stored.attempts >= 3) {
                this.otpStore.delete(cleanPhone);
                return {
                    success: false,
                    message: 'Too many failed attempts. Please request a new OTP.',
                };
            }

            // Verify OTP
            if (stored.otp === otp) {
                this.otpStore.delete(cleanPhone); // Clear after successful verification
                console.log(`[MSG91] OTP verified successfully for ${cleanPhone}`);
                return {
                    success: true,
                    message: 'OTP verified successfully',
                };
            }

            // Increment attempts on failure
            stored.attempts++;
            console.log(`[MSG91] Invalid OTP attempt ${stored.attempts}/3 for ${cleanPhone}`);
            
            return {
                success: false,
                message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.`,
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
