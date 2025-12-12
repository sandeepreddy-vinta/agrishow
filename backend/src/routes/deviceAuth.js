/**
 * Device Authentication Routes
 * Handles phone-based OTP authentication for TV devices
 */

const express = require('express');
const crypto = require('crypto');
const response = require('../utils/response');
const msg91 = require('../services/msg91');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const createRouter = (db) => {
    const router = express.Router();

    /**
     * POST /api/auth/device/send-otp
     * Send OTP to partner's phone number
     */
    router.post('/send-otp', async (req, res, next) => {
        try {
            const { phone } = req.body;
            console.log('[DeviceAuth] Send OTP request received for:', phone);

            if (!phone) {
                return response.badRequest(res, 'Phone number is required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const phoneRegex = /^(91)?[6-9]\d{9}$/;
            
            if (!phoneRegex.test(cleanPhone)) {
                return response.badRequest(res, 'Invalid phone number format. Use 10 digit Indian mobile number.');
            }

            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
            console.log('[DeviceAuth] Normalized phone:', fullPhone);

            // Generate OTP
            const otp = msg91.generateOTP();
            console.log('[DeviceAuth] Generated OTP:', otp);
            
            // Store OTP in database
            try {
                await db.transact((data) => {
                    if (!data.otpTokens) data.otpTokens = {};
                    data.otpTokens[fullPhone] = {
                        otp,
                        expiresAt: Date.now() + OTP_EXPIRY_MS,
                        attempts: 0,
                        createdAt: new Date().toISOString(),
                    };
                    return { data: { stored: true } };
                });
                console.log('[DeviceAuth] OTP stored in database');
            } catch (dbErr) {
                console.error('[DeviceAuth] Database error:', dbErr.message, dbErr.stack);
                // Don't fail - try to send OTP anyway, verification might still work
                console.log('[DeviceAuth] Continuing despite DB error...');
            }

            // Send SMS
            console.log('[DeviceAuth] Calling MSG91 sendSMS...');
            const result = await msg91.sendSMS(fullPhone, otp);
            console.log('[DeviceAuth] MSG91 result:', JSON.stringify(result));

            if (!result.success) {
                return response.error(res, result.message, 400);
            }

            console.log(`[DeviceAuth] OTP sent successfully to ${fullPhone}`);

            return response.success(res, {
                phone: fullPhone,
                message: 'OTP sent successfully',
            }, 'OTP sent to your phone');

        } catch (err) {
            console.error('[DeviceAuth] Send OTP error:', err.message, err.stack);
            return response.error(res, `Server error: ${err.message}`, 500);
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

            // Verify OTP from database
            const currentData = await db.load();
            const stored = currentData.otpTokens?.[fullPhone];

            if (!stored) {
                return response.unauthorized(res, 'OTP expired or not found. Please request a new OTP.');
            }

            if (Date.now() > stored.expiresAt) {
                // Clean up expired OTP
                await db.transact((data) => {
                    if (data.otpTokens) delete data.otpTokens[fullPhone];
                    return { data: null };
                });
                return response.unauthorized(res, 'OTP has expired. Please request a new OTP.');
            }

            if (stored.attempts >= 3) {
                await db.transact((data) => {
                    if (data.otpTokens) delete data.otpTokens[fullPhone];
                    return { data: null };
                });
                return response.unauthorized(res, 'Too many failed attempts. Please request a new OTP.');
            }

            if (stored.otp !== otp) {
                // Increment attempts
                await db.transact((data) => {
                    if (data.otpTokens?.[fullPhone]) {
                        data.otpTokens[fullPhone].attempts = (data.otpTokens[fullPhone].attempts || 0) + 1;
                    }
                    return { data: null };
                });
                const remaining = 3 - (stored.attempts + 1);
                return response.unauthorized(res, `Invalid OTP. ${remaining} attempts remaining.`);
            }

            // OTP verified - delete it and proceed with registration/login
            const result = await db.transact((data) => {
                // Delete used OTP
                if (data.otpTokens) delete data.otpTokens[fullPhone];
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
            const { phone } = req.body;

            if (!phone) {
                return response.badRequest(res, 'Phone number is required');
            }

            const cleanPhone = phone.replace(/[\s+\-]/g, '');
            const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

            // Generate new OTP
            const otp = msg91.generateOTP();
            
            // Store OTP in database
            await db.transact((data) => {
                if (!data.otpTokens) data.otpTokens = {};
                data.otpTokens[fullPhone] = {
                    otp,
                    expiresAt: Date.now() + OTP_EXPIRY_MS,
                    attempts: 0,
                    createdAt: new Date().toISOString(),
                };
                return { data: null };
            });

            // Send SMS
            const result = await msg91.sendSMS(fullPhone, otp);

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
