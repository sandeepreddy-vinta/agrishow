package com.franchiseos.player.data.repository

import android.content.Context
import android.util.Log
import com.franchiseos.player.data.api.RetrofitClient
import com.franchiseos.player.data.models.ContentItem
import com.franchiseos.player.utils.PreferenceManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PlayerRepository(private val context: Context) {
    
    private val prefs = PreferenceManager(context)
    private val TAG = "PlayerRepository"
    
    suspend fun sendHeartbeat(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = prefs.getApiUrl()
            val deviceToken = prefs.getDeviceToken()
            
            if (apiUrl.isEmpty() || deviceToken.isEmpty()) {
                return@withContext Result.failure(Exception("API URL or Device Token not configured"))
            }
            
            val api = RetrofitClient.getClient(apiUrl)
            val response = api.sendHeartbeat(deviceToken)
            
            if (response.isSuccessful && response.body()?.success == true) {
                val lastSync = response.body()?.data?.lastSync ?: ""
                Log.d(TAG, "Heartbeat sent successfully: $lastSync")
                Result.success(lastSync)
            } else {
                val error = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Heartbeat failed: $error")
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Heartbeat exception: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    suspend fun fetchPlaylist(): Result<List<ContentItem>> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = prefs.getApiUrl()
            val deviceToken = prefs.getDeviceToken()
            
            if (apiUrl.isEmpty() || deviceToken.isEmpty()) {
                return@withContext Result.failure(Exception("API URL or Device Token not configured"))
            }
            
            val api = RetrofitClient.getClient(apiUrl)
            val response = api.getPlaylist(deviceToken)
            
            if (response.isSuccessful && response.body()?.success == true) {
                val playlist = response.body()?.data?.playlist ?: emptyList()
                Log.d(TAG, "Playlist fetched: ${playlist.size} items")
                Result.success(playlist)
            } else {
                val error = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "Playlist fetch failed: $error")
                Result.failure(Exception(error))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Playlist fetch exception: ${e.message}", e)
            Result.failure(e)
        }
    }
    
    suspend fun reportAnalytics(contentId: String, action: String, duration: Long? = null): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val apiUrl = prefs.getApiUrl()
            val deviceToken = prefs.getDeviceToken()
            
            if (apiUrl.isEmpty() || deviceToken.isEmpty()) {
                return@withContext Result.success(Unit) // Silent fail for analytics
            }
            
            val report = mutableMapOf<String, Any>(
                "contentId" to contentId,
                "action" to action,
                "timestamp" to System.currentTimeMillis()
            )
            
            duration?.let { report["duration"] = it }
            
            val api = RetrofitClient.getClient(apiUrl)
            val response = api.reportAnalytics(deviceToken, report)
            
            if (response.isSuccessful) {
                Log.d(TAG, "Analytics reported: $action for $contentId")
                Result.success(Unit)
            } else {
                Log.w(TAG, "Analytics report failed (non-critical)")
                Result.success(Unit) // Don't fail on analytics errors
            }
        } catch (e: Exception) {
            Log.w(TAG, "Analytics exception (non-critical): ${e.message}")
            Result.success(Unit) // Don't fail on analytics errors
        }
    }
}
