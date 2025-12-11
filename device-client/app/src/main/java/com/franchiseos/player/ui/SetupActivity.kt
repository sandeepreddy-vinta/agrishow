package com.franchiseos.player.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.lifecycle.lifecycleScope
import com.franchiseos.player.R
import com.franchiseos.player.data.api.RetrofitClient
import com.franchiseos.player.utils.PreferenceManager
import kotlinx.coroutines.launch

class SetupActivity : AppCompatActivity() {
    
    private lateinit var prefs: PreferenceManager
    
    private lateinit var tvSubtitle: TextView
    private lateinit var cardPhone: CardView
    private lateinit var cardOtp: CardView
    private lateinit var etPhone: EditText
    private lateinit var etOtp: EditText
    private lateinit var btnSendOtp: Button
    private lateinit var btnVerifyOtp: Button
    private lateinit var btnStartPlayer: Button
    private lateinit var tvOtpSentTo: TextView
    private lateinit var tvResendOtp: TextView
    private lateinit var tvChangeNumber: TextView
    private lateinit var tvStatus: TextView
    private lateinit var progressBar: ProgressBar
    
    private var currentPhone: String = ""
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)
        
        prefs = PreferenceManager(this)
        
        initViews()
        setupListeners()
        
        if (prefs.isConfigured()) {
            startPlayer()
            return
        }
    }
    
    private fun initViews() {
        tvSubtitle = findViewById(R.id.tvSubtitle)
        cardPhone = findViewById(R.id.cardPhone)
        cardOtp = findViewById(R.id.cardOtp)
        etPhone = findViewById(R.id.etPhone)
        etOtp = findViewById(R.id.etOtp)
        btnSendOtp = findViewById(R.id.btnSendOtp)
        btnVerifyOtp = findViewById(R.id.btnVerifyOtp)
        btnStartPlayer = findViewById(R.id.btnStartPlayer)
        tvOtpSentTo = findViewById(R.id.tvOtpSentTo)
        tvResendOtp = findViewById(R.id.tvResendOtp)
        tvChangeNumber = findViewById(R.id.tvChangeNumber)
        tvStatus = findViewById(R.id.tvStatus)
        progressBar = findViewById(R.id.progressBar)
    }
    
    private fun setupListeners() {
        btnSendOtp.setOnClickListener { sendOtp() }
        btnVerifyOtp.setOnClickListener { verifyOtp() }
        tvResendOtp.setOnClickListener { resendOtp() }
        tvChangeNumber.setOnClickListener { showPhoneStep() }
        btnStartPlayer.setOnClickListener { startPlayer() }
    }
    
    private fun sendOtp() {
        val phone = etPhone.text.toString().trim()
        
        if (phone.length != 10) {
            showError("Please enter a valid 10-digit phone number")
            return
        }
        
        if (!phone.matches(Regex("^[6-9]\\d{9}$"))) {
            showError("Please enter a valid Indian mobile number")
            return
        }
        
        currentPhone = phone
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                val apiUrl = prefs.getApiUrl()
                val api = RetrofitClient.getClient(apiUrl)
                
                val response = api.sendOtp(mapOf("phone" to phone))
                
                if (response.isSuccessful && response.body()?.success == true) {
                    showOtpStep()
                    showSuccess("OTP sent to +91 $phone")
                } else {
                    val errorMsg = response.body()?.message ?: "Failed to send OTP"
                    showError(errorMsg)
                }
            } catch (e: Exception) {
                showError("Network error: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }
    
    private fun verifyOtp() {
        val otp = etOtp.text.toString().trim()
        
        if (otp.length < 4) {
            showError("Please enter a valid OTP")
            return
        }
        
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                val apiUrl = prefs.getApiUrl()
                val api = RetrofitClient.getClient(apiUrl)
                
                val response = api.verifyOtp(mapOf(
                    "phone" to currentPhone,
                    "otp" to otp
                ))
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()?.data
                    
                    if (data != null) {
                        prefs.saveAllCredentials(
                            deviceToken = data.deviceToken,
                            deviceId = data.deviceId,
                            partnerId = data.partnerId,
                            partnerName = data.partnerName,
                            phone = currentPhone,
                            apiUrl = apiUrl
                        )
                        
                        val welcomeMsg = if (data.isNewPartner) {
                            "Welcome ${data.partnerName}! Registration successful."
                        } else {
                            "Welcome back, ${data.partnerName}!"
                        }
                        
                        showSuccess(welcomeMsg)
                        showSuccessState()
                    } else {
                        showError("Invalid response from server")
                    }
                } else {
                    val errorMsg = response.body()?.message ?: "Invalid OTP"
                    showError(errorMsg)
                }
            } catch (e: Exception) {
                showError("Network error: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }
    
    private fun resendOtp() {
        setLoading(true)
        
        lifecycleScope.launch {
            try {
                val apiUrl = prefs.getApiUrl()
                val api = RetrofitClient.getClient(apiUrl)
                
                val response = api.resendOtp(mapOf("phone" to currentPhone))
                
                if (response.isSuccessful && response.body()?.success == true) {
                    showSuccess("OTP resent to +91 $currentPhone")
                } else {
                    val errorMsg = response.body()?.message ?: "Failed to resend OTP"
                    showError(errorMsg)
                }
            } catch (e: Exception) {
                showError("Network error: ${e.message}")
            } finally {
                setLoading(false)
            }
        }
    }
    
    private fun showPhoneStep() {
        cardPhone.visibility = View.VISIBLE
        cardOtp.visibility = View.GONE
        btnStartPlayer.visibility = View.GONE
        tvSubtitle.text = "Partner Login"
        etOtp.setText("")
        hideStatus()
    }
    
    private fun showOtpStep() {
        cardPhone.visibility = View.GONE
        cardOtp.visibility = View.VISIBLE
        btnStartPlayer.visibility = View.GONE
        tvSubtitle.text = "Verify OTP"
        tvOtpSentTo.text = "OTP sent to +91 $currentPhone"
        etOtp.requestFocus()
    }
    
    private fun showSuccessState() {
        cardPhone.visibility = View.GONE
        cardOtp.visibility = View.GONE
        btnStartPlayer.visibility = View.VISIBLE
        tvSubtitle.text = "Setup Complete!"
        
        btnStartPlayer.postDelayed({ startPlayer() }, 2000)
    }
    
    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        btnSendOtp.isEnabled = !loading
        btnVerifyOtp.isEnabled = !loading
        tvResendOtp.isEnabled = !loading
    }
    
    private fun showError(message: String) {
        tvStatus.text = message
        tvStatus.setTextColor(resources.getColor(android.R.color.holo_red_light, null))
        tvStatus.visibility = View.VISIBLE
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    private fun showSuccess(message: String) {
        tvStatus.text = message
        tvStatus.setTextColor(resources.getColor(android.R.color.holo_green_light, null))
        tvStatus.visibility = View.VISIBLE
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    private fun hideStatus() {
        tvStatus.visibility = View.GONE
    }
    
    private fun startPlayer() {
        val intent = Intent(this, PlayerActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
