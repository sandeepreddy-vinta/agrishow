package com.franchiseos.player.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.franchiseos.player.R
import com.franchiseos.player.utils.PreferenceManager

class SetupActivity : AppCompatActivity() {
    
    private lateinit var prefs: PreferenceManager
    private lateinit var etApiUrl: EditText
    private lateinit var etDeviceToken: EditText
    private lateinit var btnSave: Button
    private lateinit var btnStartPlayer: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)
        
        prefs = PreferenceManager(this)
        
        initViews()
        loadSavedConfig()
        setupListeners()
        
        // If already configured, show option to go to player
        if (prefs.isConfigured()) {
            btnStartPlayer.isEnabled = true
        }
    }
    
    private fun initViews() {
        etApiUrl = findViewById(R.id.etApiUrl)
        etDeviceToken = findViewById(R.id.etDeviceToken)
        btnSave = findViewById(R.id.btnSave)
        btnStartPlayer = findViewById(R.id.btnStartPlayer)
    }
    
    private fun loadSavedConfig() {
        etApiUrl.setText(prefs.getApiUrl())
        etDeviceToken.setText(prefs.getDeviceToken())
    }
    
    private fun setupListeners() {
        btnSave.setOnClickListener {
            saveConfiguration()
        }
        
        btnStartPlayer.setOnClickListener {
            if (prefs.isConfigured()) {
                startPlayer()
            } else {
                Toast.makeText(this, "Please save configuration first", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun saveConfiguration() {
        val apiUrl = etApiUrl.text.toString().trim()
        val deviceToken = etDeviceToken.text.toString().trim()
        
        if (apiUrl.isEmpty()) {
            Toast.makeText(this, "Please enter API URL", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (deviceToken.isEmpty()) {
            Toast.makeText(this, "Please enter Device Token", Toast.LENGTH_SHORT).show()
            return
        }
        
        // Ensure API URL ends with /api
        val formattedUrl = if (apiUrl.endsWith("/api")) {
            apiUrl
        } else if (apiUrl.endsWith("/")) {
            "${apiUrl}api"
        } else {
            "$apiUrl/api"
        }
        
        // Ensure URL has protocol
        val finalUrl = if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            "http://$formattedUrl"
        } else {
            formattedUrl
        }
        
        prefs.saveApiUrl(finalUrl)
        prefs.saveDeviceToken(deviceToken)
        prefs.setConfigured(true)
        
        Toast.makeText(this, "Configuration saved!", Toast.LENGTH_SHORT).show()
        btnStartPlayer.isEnabled = true
    }
    
    private fun startPlayer() {
        val intent = Intent(this, PlayerActivity::class.java)
        startActivity(intent)
    }
}
