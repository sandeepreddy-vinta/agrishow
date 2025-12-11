/**
 * MSG91 OTP Service
 * Handles sending and verifying OTP via MSG91 API
 */

const axios = require('axios');

class MSG91Service {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        this.baseUrl = 'https://control.msg91.com/api/v5';
    }

    /**
     * Send OTP to a phone number
     * @param {string} phone - Phone number with country code (e.g., 919876543210)
     * @returns {Promise<{success: boolean, message: string, requestId?: string}>}
     */
    async sendOTP(phone) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            
            const response = await axios.post(
                `${this.baseUrl}/otp`,
                null,
                {
                    params: {
                        template_id: this.templateId,
                        mobile: cleanPhone,
                        authkey: this.authKey,
                    },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('[MSG91] Send OTP response:', response.data);

            if (response.data.type === 'success') {
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
            console.error('[MSG91] Send OTP error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP',
            };
        }
    }

    /**
     * Verify OTP
     * @param {string} phone - Phone number with country code
     * @param {string} otp - OTP entered by user
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async verifyOTP(phone, otp) {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');

            const response = await axios.get(
                `${this.baseUrl}/otp/verify`,
                {
                    params: {
                        mobile: cleanPhone,
                        otp: otp,
                        authkey: this.authKey,
                    },
                }
            );

            console.log('[MSG91] Verify OTP response:', response.data);

            if (response.data.type === 'success') {
                return {
                    success: true,
                    message: 'OTP verified successfully',
                };
            }

            return {
                success: false,
                message: response.data.message || 'Invalid OTP',
            };
        } catch (error) {
            console.error('[MSG91] Verify OTP error:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || 'OTP verification failed';
            return {
                success: false,
                message: errorMessage,
            };
        }
    }

    /**
     * Resend OTP
     * @param {string} phone - Phone number with country code
     * @param {string} retryType - 'text' or 'voice'
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async resendOTP(phone, retryType = 'text') {
        try {
            const cleanPhone = phone.replace(/[\s+\-]/g, '');

            const response = await axios.get(
                `${this.baseUrl}/otp/retry`,
                {
                    params: {
                        mobile: cleanPhone,
                        authkey: this.authKey,
                        retrytype: retryType,
                    },
                }
            );

            console.log('[MSG91] Resend OTP response:', response.data);

            if (response.data.type === 'success') {
                return {
                    success: true,
                    message: 'OTP resent successfully',
                };
            }

            return {
                success: false,
                message: response.data.message || 'Failed to resend OTP',
            };
        } catch (error) {
            console.error('[MSG91] Resend OTP error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to resend OTP',
            };
        }
    }
}

module.exports = new MSG91Service();
