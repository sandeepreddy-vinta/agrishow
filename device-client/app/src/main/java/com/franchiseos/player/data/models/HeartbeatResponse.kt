package com.franchiseos.player.data.models

import com.google.gson.annotations.SerializedName

data class HeartbeatResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("data")
    val data: HeartbeatData?,
    
    @SerializedName("message")
    val message: String?
)

data class HeartbeatData(
    @SerializedName("lastSync")
    val lastSync: String,
    
    @SerializedName("deviceId")
    val deviceId: String
)
