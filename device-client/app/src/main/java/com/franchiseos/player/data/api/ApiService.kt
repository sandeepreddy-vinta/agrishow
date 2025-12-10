package com.franchiseos.player.data.api

import com.franchiseos.player.data.models.HeartbeatResponse
import com.franchiseos.player.data.models.PlaylistResponse
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
}
