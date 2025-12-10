package com.franchiseos.player

import android.app.Application
import android.util.Log

class PlayerApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        Log.d("PlayerApplication", "Application started")
    }
}
