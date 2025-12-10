package com.franchiseos.player.data.models

import com.google.gson.annotations.SerializedName

data class ContentItem(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("filename")
    val filename: String,
    
    @SerializedName("type")
    val type: String, // "video" or "image"
    
    @SerializedName("mimeType")
    val mimeType: String,
    
    @SerializedName("size")
    val size: Long,
    
    @SerializedName("url")
    val url: String,
    
    @SerializedName("duration")
    val duration: Int = 10, // seconds
    
    @SerializedName("uploadDate")
    val uploadDate: String
)
