package com.franchiseos.player.data.models

data class SendOtpResponse(
    val success: Boolean,
    val message: String?,
    val data: SendOtpData?
)

data class SendOtpData(
    val phone: String?,
    val message: String?
)

data class VerifyOtpResponse(
    val success: Boolean,
    val message: String?,
    val data: VerifyOtpData?
)

data class VerifyOtpData(
    val deviceToken: String,
    val deviceId: String,
    val partnerId: String,
    val partnerName: String,
    val location: String?,
    val isNewPartner: Boolean
)

data class CheckStatusResponse(
    val success: Boolean,
    val data: CheckStatusData?
)

data class CheckStatusData(
    val isRegistered: Boolean,
    val partnerName: String?
)
