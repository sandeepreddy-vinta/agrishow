/**
 * Device Authentication Routes
 * Handles phone-based OTP authentication for TV devices
 */

const express = require('express');
const crypto = require('crypto');
const response = require('../utils/response');
const msg91 = require('../services/msg91');

const createRouter = (db) => {
    const router = express.Router();

    /**
     * POST /api/auth/device/send-otp
     * Send OTP to partner's phone number
     */
    router.post('/send-otp', async (req, res, next) => {
        try {
            const { phone } = req.body;

            if (!phone) {
                return response.badRequest(res, 'Phone number is required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const phoneRegex = /^(91)?[6-9]\d{9}$/;
            
            if (!phoneRegex.test(cleanPhone)) {
                return response.badRequest(res, 'Invalid phone number format. Use 10 digit Indian mobile number.');
            }

            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const result = await msg91.sendOTP(fullPhone);

            if (!result.success) {
                return response.error(res, result.message, 400);
            }

            console.log(`[DeviceAuth] OTP sent to ${fullPhone}`);

            return response.success(res, {
                phone: fullPhone,
                message: 'OTP sent successfully',
            }, 'OTP sent to your phone');

        } catch (err) {
            console.error('[DeviceAuth] Send OTP error:', err);
            next(err);
        }
    });

    /**
     * POST /api/auth/device/verify-otp
     * Verify OTP and return device credentials
     */
    router.post('/verify-otp', async (req, res, next) => {
        try {
            const { phone, otp, deviceName, location } = req.body;

            if (!phone || !otp) {
                return response.badRequest(res, 'Phone and OTP are required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const verifyResult = await msg91.verifyOTP(fullPhone, otp);

            if (!verifyResult.success) {
                return response.unauthorized(res, verifyResult.message || 'Invalid OTP');
            }

            const result = await db.transact((data) => {
                let partner = data.franchises.find(f => f.phone === fullPhone);

                if (partner) {
                    const idx = data.franchises.findIndex(f => f.id === partner.id);
                    data.franchises[idx].lastLogin = new Date().toISOString();
                    data.franchises[idx].status = 'online';
                    
                    if (deviceName) data.franchises[idx].name = deviceName;
                    if (location) data.franchises[idx].location = location;

                    return {
                        data: {
                            isNewPartner: false,
                            partner: data.franchises[idx],
                        },
                        audit: { action: 'DEVICE_LOGIN', details: { phone: fullPhone } },
                    };
                } else {
                    const deviceId = `DEV-${Date.now().toString(36).toUpperCase()}`;
                    const deviceToken = crypto.randomUUID();

                    const newPartner = {
                        id: crypto.randomUUID(),
                        phone: fullPhone,
                        name: deviceName || `Partner ${fullPhone.slice(-4)}`,
                        location: location || 'Not specified',
                        deviceId,
                        token: deviceToken,
                        status: 'online',
                        lastSync: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        authMethod: 'phone_otp',
                    };

                    data.franchises.push(newPartner);

                    return {
                        data: {
                            isNewPartner: true,
                            partner: newPartner,
                        },
                        audit: { action: 'DEVICE_REGISTER', details: { phone: fullPhone, deviceId } },
                    };
                }
            });

            console.log(`[DeviceAuth] ${result.isNewPartner ? 'New partner registered' : 'Partner logged in'}: ${fullPhone}`);

            return response.success(res, {
                deviceToken: result.partner.token,
                deviceId: result.partner.deviceId,
                partnerId: result.partner.id,
                partnerName: result.partner.name,
                location: result.partner.location,
                isNewPartner: result.isNewPartner,
            }, result.isNewPartner ? 'Registration successful' : 'Login successful');

        } catch (err) {
            console.error('[DeviceAuth] Verify OTP error:', err);
            next(err);
        }
    });

    /**
     * POST /api/auth/device/resend-otp
     */
    router.post('/resend-otp', async (req, res, next) => {
        try {
            const { phone, type } = req.body;

            if (!phone) {
                return response.badRequest(res, 'Phone number is required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const result = await msg91.resendOTP(fullPhone, type || 'text');

            if (!result.success) {
                return response.error(res, result.message, 400);
            }

            return response.success(res, {
                phone: fullPhone,
                message: 'OTP resent successfully',
            }, 'OTP resent to your phone');

        } catch (err) {
            console.error('[DeviceAuth] Resend OTP error:', err);
            next(err);
        }
    });

    /**
     * POST /api/auth/device/check-status
     */
    router.post('/check-status', async (req, res, next) => {
        try {
            const { phone } = req.body;

            if (!phone) {
                return response.badRequest(res, 'Phone number is required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            const data = await db.load();
            const partner = data.franchises.find(f => f.phone === fullPhone);

            return response.success(res, {
                isRegistered: !!partner,
                partnerName: partner?.name || null,
            });

        } catch (err) {
            console.error('[DeviceAuth] Check status error:', err);
            next(err);
        }
    });

    return router;
};

module.exports = createRouter;
