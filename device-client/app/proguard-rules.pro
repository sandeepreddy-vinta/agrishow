# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep Retrofit and Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class retrofit2.** { *; }

# Keep ExoPlayer
-keep class androidx.media3.** { *; }

# Keep data classes
-keep class com.franchiseos.player.data.** { *; }
