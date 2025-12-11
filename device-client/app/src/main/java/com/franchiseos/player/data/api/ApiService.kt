package com.franchiseos.player.data.api

import com.franchiseos.player.data.models.HeartbeatResponse
import com.franchiseos.player.data.models.PlaylistResponse
import com.franchiseos.player.data.models.SendOtpResponse
import com.franchiseos.player.data.models.VerifyOtpResponse
import com.franchiseos.player.data.models.CheckStatusResponse
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    @POST("heartbeat")
    suspend fun sendHeartbeat(
        @Header("X-Device-Token") deviceToken: String
    ): Response<HeartbeatResponse>
    
    @GET("playlist")
    suspend fun getPlaylist(
        @Header("X-Device-Token") deviceToken: String
    ): Response<PlaylistResponse>
    
    @POST("device/report")
    suspend fun reportAnalytics(
        @Header("X-Device-Token") deviceToken: String,
        @Body report: Map<String, Any>
    ): Response<Any>
    
    @GET
    @Streaming
    suspend fun downloadFile(@Url fileUrl: String): Response<okhttp3.ResponseBody>
    
    // OTP Authentication endpoints
    @POST("auth/device/send-otp")
    suspend fun sendOtp(
        @Body request: Map<String, String>
    ): Response<SendOtpResponse>
    
    @POST("auth/device/verify-otp")
    suspend fun verifyOtp(
        @Body request: Map<String, String>
    ): Response<VerifyOtpResponse>
    
    @POST("auth/device/resend-otp")
    suspend fun resendOtp(
        @Body request: Map<String, String>
    ): Response<SendOtpResponse>
    
    @POST("auth/device/check-status")
    suspend fun checkPhoneStatus(
        @Body request: Map<String, String>
    ): Response<CheckStatusResponse>
}
