package com.franchiseos.player.data.models

import com.google.gson.annotations.SerializedName

data class PlaylistResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("data")
    val data: PlaylistData
)

data class PlaylistData(
    @SerializedName("deviceId")
    val deviceId: String,
    
    @SerializedName("franchiseName")
    val franchiseName: String,
    
    @SerializedName("location")
    val location: String,
    
    @SerializedName("playlist")
    val playlist: List<ContentItem>,
    
    @SerializedName("playlistCount")
    val playlistCount: Int,
    
    @SerializedName("lastUpdated")
    val lastUpdated: String
)
