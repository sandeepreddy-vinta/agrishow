package com.franchiseos.player.service

import android.app.Service
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import com.franchiseos.player.data.repository.PlayerRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class HeartbeatService : Service() {
    
    private val TAG = "HeartbeatService"
    private val handler = Handler(Looper.getMainLooper())
    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)
    private lateinit var repository: PlayerRepository
    
    companion object {
        private const val HEARTBEAT_INTERVAL = 60_000L // 60 seconds
    }
    
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            sendHeartbeat()
            handler.postDelayed(this, HEARTBEAT_INTERVAL)
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        repository = PlayerRepository(applicationContext)
        Log.d(TAG, "HeartbeatService created")
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "HeartbeatService started")
        handler.post(heartbeatRunnable)
        return START_STICKY
    }
    
    private fun sendHeartbeat() {
        serviceScope.launch {
            try {
                val result = repository.sendHeartbeat()
                if (result.isSuccess) {
                    Log.d(TAG, "Heartbeat successful: ${result.getOrNull()}")
                } else {
                    Log.e(TAG, "Heartbeat failed: ${result.exceptionOrNull()?.message}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Heartbeat error: ${e.message}", e)
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(heartbeatRunnable)
        serviceJob.cancel()
        Log.d(TAG, "HeartbeatService destroyed")
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
