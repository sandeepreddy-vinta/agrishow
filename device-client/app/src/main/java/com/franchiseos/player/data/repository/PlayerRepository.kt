package com.franchiseos.player.data.repository

import android.content.Context
import android.util.Log
import com.franchiseos.player.data.api.RetrofitClient
import com.franchiseos.player.data.models.ContentItem
import com.franchiseos.player.utils.PreferenceManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class PlayerRepository(private val context: Context) {
    
    private val prefs = PreferenceManager(context)
    private val TAG = "PlayerRepository"
    private val gson = Gson()
    private val contentDir = context.getExternalFilesDir("content")
    
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
        var playlist: List<ContentItem> = emptyList()
        
        // Try network first
        try {
            val apiUrl = prefs.getApiUrl()
            val deviceToken = prefs.getDeviceToken()
            
            if (apiUrl.isNotEmpty() && deviceToken.isNotEmpty()) {
                val api = RetrofitClient.getClient(apiUrl)
                val response = api.getPlaylist(deviceToken)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    playlist = response.body()?.data?.playlist ?: emptyList()
                    Log.d(TAG, "Playlist fetched from network: ${playlist.size} items")
                    
                    // Save to local storage
                    savePlaylistToLocal(playlist)
                } else {
                    Log.w(TAG, "Playlist fetch failed: ${response.errorBody()?.string()}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Playlist fetch network error: ${e.message}")
        }
        
        // If playlist is empty (network failed or empty), try local
        if (playlist.isEmpty()) {
            playlist = getPlaylistFromLocal()
            Log.d(TAG, "Playlist loaded from local: ${playlist.size} items")
        }
        
        // Verify local files for all items
        playlist.forEach { item ->
            val file = File(contentDir, item.filename)
            if (file.exists() && file.length() > 0) {
                item.localPath = file.absolutePath
            }
        }
        
        if (playlist.isNotEmpty()) {
            Result.success(playlist)
        } else {
            Result.failure(Exception("No playlist available (network or local)"))
        }
    }

    suspend fun downloadMissingContent(playlist: List<ContentItem>) = withContext(Dispatchers.IO) {
        if (contentDir == null) return@withContext
        if (!contentDir.exists()) contentDir.mkdirs()
        
        // 1. Download missing files
        playlist.forEach { item ->
            val file = File(contentDir, item.filename)
            // Check if file exists and has content (ignoring exact size check for now to avoid redownloads if size mismatch)
            if (!file.exists() || file.length() == 0L) {
                Log.d(TAG, "Downloading content: ${item.name} (${item.filename})")
                val success = downloadFile(item, file)
                if (success) {
                    item.localPath = file.absolutePath
                    Log.d(TAG, "Download complete: ${item.filename}")
                } else {
                    Log.e(TAG, "Download failed: ${item.filename}")
                }
            } else {
                // Already exists
                if (item.localPath == null) {
                    item.localPath = file.absolutePath
                }
            }
        }
        
        // 2. Cleanup obsolete files
        cleanupCache(playlist)
    }
    
    private suspend fun downloadFile(item: ContentItem, destFile: File): Boolean {
        try {
            val apiUrl = prefs.getApiUrl()
            if (apiUrl.isEmpty()) return false
            
            val api = RetrofitClient.getClient(apiUrl)
            val response = api.downloadFile(item.url)
            
            if (response.isSuccessful && response.body() != null) {
                val inputStream = response.body()!!.byteStream()
                val outputStream = FileOutputStream(destFile)
                
                inputStream.use { input ->
                    outputStream.use { output ->
                        input.copyTo(output)
                    }
                }
                return true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Download exception for ${item.filename}: ${e.message}")
            // Delete partial file
            if (destFile.exists()) destFile.delete()
        }
        return false
    }
    
    private fun cleanupCache(currentPlaylist: List<ContentItem>) {
        if (contentDir == null || !contentDir.exists()) return
        
        val validFilenames = currentPlaylist.map { it.filename }.toSet()
        val files = contentDir.listFiles() ?: return
        
        var deletedCount = 0
        files.forEach { file ->
            if (file.isFile && !validFilenames.contains(file.name)) {
                if (file.delete()) {
                    deletedCount++
                    Log.d(TAG, "Deleted obsolete file: ${file.name}")
                }
            }
        }
        if (deletedCount > 0) {
            Log.d(TAG, "Cache cleanup: Removed $deletedCount files")
        }
    }
    
    private fun savePlaylistToLocal(playlist: List<ContentItem>) {
        try {
            val json = gson.toJson(playlist)
            val file = File(context.filesDir, "playlist.json")
            file.writeText(json)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save playlist locally", e)
        }
    }
    
    private fun getPlaylistFromLocal(): List<ContentItem> {
        try {
            val file = File(context.filesDir, "playlist.json")
            if (file.exists()) {
                val json = file.readText()
                val type = object : TypeToken<List<ContentItem>>() {}.type
                return gson.fromJson(json, type) ?: emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load playlist locally", e)
        }
        return emptyList()
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
