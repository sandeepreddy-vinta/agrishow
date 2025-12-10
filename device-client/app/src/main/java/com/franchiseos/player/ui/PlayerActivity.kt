package com.franchiseos.player.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.bumptech.glide.Glide
import com.franchiseos.player.R
import com.franchiseos.player.data.models.ContentItem
import com.franchiseos.player.data.repository.PlayerRepository
import com.franchiseos.player.service.HeartbeatService
import kotlinx.coroutines.launch

class PlayerActivity : AppCompatActivity() {
    
    private lateinit var playerView: PlayerView
    private lateinit var imageView: android.widget.ImageView
    private lateinit var tvStatus: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var repository: PlayerRepository
    
    private var exoPlayer: ExoPlayer? = null
    private var playlist: List<ContentItem> = emptyList()
    private var currentIndex = 0
    private val handler = Handler(Looper.getMainLooper())
    
    private val TAG = "PlayerActivity"
    
    companion object {
        private const val PLAYLIST_REFRESH_INTERVAL = 300_000L // 5 minutes
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Keep screen on
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Hide system UI for immersive experience
        hideSystemUI()
        
        setContentView(R.layout.activity_player)
        
        initViews()
        repository = PlayerRepository(this)
        
        // Start heartbeat service
        startService(Intent(this, HeartbeatService::class.java))
        
        // Initialize player
        initializePlayer()
        
        // Fetch playlist
        fetchPlaylist()
        
        // Schedule periodic playlist refresh
        schedulePlaylistRefresh()
    }
    
    private fun initViews() {
        playerView = findViewById(R.id.playerView)
        imageView = findViewById(R.id.imageView)
        tvStatus = findViewById(R.id.tvStatus)
        progressBar = findViewById(R.id.progressBar)
    }
    
    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_FULLSCREEN
        )
    }
    
    private fun initializePlayer() {
        exoPlayer = ExoPlayer.Builder(this).build().also { player ->
            playerView.player = player
            player.addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_ENDED -> {
                            playNextItem()
                        }
                        Player.STATE_READY -> {
                            Log.d(TAG, "Player ready")
                        }
                    }
                }
            })
        }
    }
    
    private fun fetchPlaylist() {
        showStatus("Fetching playlist...")
        progressBar.visibility = View.VISIBLE
        
        lifecycleScope.launch {
            val result = repository.fetchPlaylist()
            
            if (result.isSuccess) {
                val items = result.getOrNull() ?: emptyList()
                if (items.isEmpty()) {
                    showStatus("No content assigned to this device")
                    progressBar.visibility = View.GONE
                } else {
                    playlist = items
                    currentIndex = 0
                    showStatus("Playing ${playlist.size} items")
                    progressBar.visibility = View.GONE
                    playCurrentItem()
                }
            } else {
                val error = result.exceptionOrNull()?.message ?: "Unknown error"
                showStatus("Error: $error")
                progressBar.visibility = View.GONE
                Toast.makeText(this@PlayerActivity, "Failed to fetch playlist: $error", Toast.LENGTH_LONG).show()
            }
        }
    }
    
    private fun playCurrentItem() {
        if (playlist.isEmpty()) return
        
        val item = playlist[currentIndex]
        Log.d(TAG, "Playing item ${currentIndex + 1}/${playlist.size}: ${item.name}")
        
        when (item.type) {
            "video" -> playVideo(item)
            "image" -> showImage(item)
            else -> {
                Log.w(TAG, "Unknown content type: ${item.type}")
                playNextItem()
            }
        }
        
        // Report analytics
        lifecycleScope.launch {
            repository.reportAnalytics(item.id, "play")
        }
    }
    
    private fun playVideo(item: ContentItem) {
        imageView.visibility = View.GONE
        playerView.visibility = View.VISIBLE
        
        val mediaItem = MediaItem.fromUri(item.url)
        exoPlayer?.setMediaItem(mediaItem)
        exoPlayer?.prepare()
        exoPlayer?.play()
    }
    
    private fun showImage(item: ContentItem) {
        playerView.visibility = View.GONE
        imageView.visibility = View.VISIBLE
        
        // Stop video player
        exoPlayer?.stop()
        
        // Load image with Glide
        Glide.with(this)
            .load(item.url)
            .centerCrop()
            .into(imageView)
        
        // Schedule next item after duration
        val duration = (item.duration * 1000).toLong()
        handler.postDelayed({
            playNextItem()
        }, duration)
    }
    
    private fun playNextItem() {
        if (playlist.isEmpty()) return
        
        currentIndex = (currentIndex + 1) % playlist.size
        playCurrentItem()
    }
    
    private fun schedulePlaylistRefresh() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                Log.d(TAG, "Refreshing playlist...")
                fetchPlaylist()
                handler.postDelayed(this, PLAYLIST_REFRESH_INTERVAL)
            }
        }, PLAYLIST_REFRESH_INTERVAL)
    }
    
    private fun showStatus(message: String) {
        tvStatus.text = message
        tvStatus.visibility = View.VISIBLE
        
        // Hide status after 3 seconds
        handler.postDelayed({
            tvStatus.visibility = View.GONE
        }, 3000)
    }
    
    override fun onResume() {
        super.onResume()
        hideSystemUI()
        exoPlayer?.play()
    }
    
    override fun onPause() {
        super.onPause()
        exoPlayer?.pause()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null)
        exoPlayer?.release()
        exoPlayer = null
        
        // Stop heartbeat service
        stopService(Intent(this, HeartbeatService::class.java))
    }
}
