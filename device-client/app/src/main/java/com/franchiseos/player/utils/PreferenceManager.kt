package com.franchiseos.player.utils

import android.content.Context
import android.content.SharedPreferences

class PreferenceManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    companion object {
        private const val PREFS_NAME = "franchiseos_player_prefs"
        private const val KEY_API_URL = "api_url"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_IS_CONFIGURED = "is_configured"
        private const val KEY_PHONE_NUMBER = "phone_number"
        private const val KEY_PARTNER_NAME = "partner_name"
        private const val KEY_PARTNER_ID = "partner_id"
        
        // Production API URL - Update this with your Cloud Run URL
        const val PRODUCTION_API_URL = "https://agrishow1-206842770360.asia-south1.run.app/api"
    }
    
    fun saveApiUrl(url: String) {
        prefs.edit().putString(KEY_API_URL, url).apply()
    }
    
    fun getApiUrl(): String {
        return prefs.getString(KEY_API_URL, PRODUCTION_API_URL) ?: PRODUCTION_API_URL
    }
    
    fun saveDeviceToken(token: String) {
        prefs.edit().putString(KEY_DEVICE_TOKEN, token).apply()
    }
    
    fun getDeviceToken(): String {
        return prefs.getString(KEY_DEVICE_TOKEN, "") ?: ""
    }
    
    fun saveDeviceId(deviceId: String) {
        prefs.edit().putString(KEY_DEVICE_ID, deviceId).apply()
    }
    
    fun getDeviceId(): String {
        return prefs.getString(KEY_DEVICE_ID, "") ?: ""
    }
    
    fun setConfigured(configured: Boolean) {
        prefs.edit().putBoolean(KEY_IS_CONFIGURED, configured).apply()
    }
    
    fun isConfigured(): Boolean {
        return prefs.getBoolean(KEY_IS_CONFIGURED, false)
    }
    
    fun savePhoneNumber(phone: String) {
        prefs.edit().putString(KEY_PHONE_NUMBER, phone).apply()
    }
    
    fun getPhoneNumber(): String {
        return prefs.getString(KEY_PHONE_NUMBER, "") ?: ""
    }
    
    fun savePartnerName(name: String) {
        prefs.edit().putString(KEY_PARTNER_NAME, name).apply()
    }
    
    fun getPartnerName(): String {
        return prefs.getString(KEY_PARTNER_NAME, "") ?: ""
    }
    
    fun savePartnerId(id: String) {
        prefs.edit().putString(KEY_PARTNER_ID, id).apply()
    }
    
    fun getPartnerId(): String {
        return prefs.getString(KEY_PARTNER_ID, "") ?: ""
    }
    
    fun saveAllCredentials(
        deviceToken: String,
        deviceId: String,
        partnerId: String,
        partnerName: String,
        phone: String,
        apiUrl: String
    ) {
        prefs.edit().apply {
            putString(KEY_DEVICE_TOKEN, deviceToken)
            putString(KEY_DEVICE_ID, deviceId)
            putString(KEY_PARTNER_ID, partnerId)
            putString(KEY_PARTNER_NAME, partnerName)
            putString(KEY_PHONE_NUMBER, phone)
            putString(KEY_API_URL, apiUrl)
            putBoolean(KEY_IS_CONFIGURED, true)
            apply()
        }
    }
    
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
