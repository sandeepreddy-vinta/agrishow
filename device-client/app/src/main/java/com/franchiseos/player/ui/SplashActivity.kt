package com.franchiseos.player.ui

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.franchiseos.player.R

class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Wait for 2 seconds then transition to SetupActivity
        Handler(Looper.getMainLooper()).postDelayed({
            val intent = Intent(this, SetupActivity::class.java)
            startActivity(intent)
            finish()
        }, 2000)
    }
}
