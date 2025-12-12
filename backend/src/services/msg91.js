/**
 * MSG91 SMS Service
 * Uses SMS Flow API to support DLT templates with ##var1##
 * OTP storage is handled externally (passed in)
 */

const axios = require('axios');

class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        this.OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Generate a 4-digit OTP
     */
    generateOTP() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Send OTP SMS via MSG91 Flow API
     * @param {string} phone - Phone number with country code
     * @param {string} otp - The OTP to send
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async sendSMS(phone, otp) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            
            console.log(`[MSG91] Sending OTP ${otp} to ${cleanPhone}`);
            
            const response = await axios.post(
                'https://control.msg91.com/api/v5/flow/',
                {
                    template_id: this.templateId,
                    short_url: '0',
                    recipients: [
                        {
                            mobiles: cleanPhone,
                            var1: otp,
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
}

module.exports = new MSG91Service();
