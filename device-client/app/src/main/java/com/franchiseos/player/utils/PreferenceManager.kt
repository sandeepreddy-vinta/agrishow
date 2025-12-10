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
    }
    
    fun saveApiUrl(url: String) {
        prefs.edit().putString(KEY_API_URL, url).apply()
    }
    
    fun getApiUrl(): String {
        return prefs.getString(KEY_API_URL, "") ?: ""
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
    
    fun clearAll() {
        prefs.edit().clear().apply()
    }
}
