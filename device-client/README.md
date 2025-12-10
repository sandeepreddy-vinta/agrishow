# FranchiseOS Player - Android TV/Mobile App

Digital signage player app for FranchiseOS system. Works on both Android TV and Android phones.

## Features

- ✅ **Device Authentication** - Secure token-based authentication
- ✅ **Automatic Heartbeat** - Reports online status every 60 seconds
- ✅ **Playlist Playback** - Plays videos and images in rotation
- ✅ **Auto-refresh** - Fetches updated playlist every 5 minutes
- ✅ **Analytics Reporting** - Reports playback events to backend
- ✅ **Immersive Mode** - Fullscreen playback with hidden system UI
- ✅ **Keep Screen On** - Prevents screen from sleeping
- ✅ **ExoPlayer** - Professional video playback with HLS support
- ✅ **Glide** - Efficient image loading and caching

## Requirements

- Android 5.0 (API 21) or higher
- Internet connection
- Device token from FranchiseOS admin dashboard

## Setup Instructions

### 1. Build the App

```bash
# Open in Android Studio
# File -> Open -> Select device-client folder

# Or build from command line
cd device-client
./gradlew assembleDebug
```

### 2. Install on Device

**Option A: Android Studio**
- Connect your phone via USB
- Enable USB debugging on your phone
- Click "Run" in Android Studio

**Option B: APK Installation**
- Build APK: `./gradlew assembleDebug`
- Find APK at: `app/build/outputs/apk/debug/app-debug.apk`
- Transfer to phone and install

### 3. Configure the App

1. **Get Device Token**
   - Open admin dashboard
   - Go to "Franchise Management"
   - Click "Add Franchise"
   - Fill in details and register
   - **SAVE THE DEVICE TOKEN** (shown once!)

2. **Configure Player App**
   - Open the app on your device
   - Enter API URL (e.g., `http://192.168.1.100:3000/api`)
   - Enter the device token
   - Click "Save Configuration"
   - Click "Start Player"

### 4. Assign Content

1. Go to admin dashboard
2. Upload content (videos/images)
3. Go to "Assignment Manager"
4. Drag content to your device
5. Content will start playing automatically!

## API Configuration

The app needs to connect to your backend API. Format:

```
http://YOUR_SERVER_IP:3000/api
```

Examples:
- Local network: `http://192.168.1.100:3000/api`
- Production: `https://api.yourdomain.com/api`

## Testing on Android Phone

The app works perfectly on Android phones! Here's what to expect:

- **Setup screen** appears first for configuration
- **Player screen** shows content in fullscreen
- **Landscape mode** is enforced for better viewing
- **Tap screen** to see status messages
- **Back button** exits the player

## Architecture

```
device-client/
├── app/
│   ├── src/main/
│   │   ├── java/com/franchiseos/player/
│   │   │   ├── data/
│   │   │   │   ├── api/          # Retrofit API service
│   │   │   │   ├── models/       # Data models
│   │   │   │   └── repository/   # Data repository
│   │   │   ├── service/          # Background services
│   │   │   ├── ui/               # Activities
│   │   │   ├── utils/            # Utilities
│   │   │   └── PlayerApplication.kt
│   │   ├── res/                  # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## Key Components

### SetupActivity
- Configuration screen
- Saves API URL and device token
- Validates input

### PlayerActivity
- Fullscreen media playback
- Video player (ExoPlayer)
- Image viewer (Glide)
- Automatic rotation through playlist
- Status overlay

### HeartbeatService
- Background service
- Sends heartbeat every 60 seconds
- Keeps device status updated

### PlayerRepository
- API communication
- Playlist fetching
- Analytics reporting
- Error handling

## Troubleshooting

### App won't connect to backend
- Check if backend is running
- Verify API URL format (include `/api`)
- Ensure phone and server are on same network
- Check firewall settings

### No content playing
- Verify device token is correct
- Check if content is assigned in admin dashboard
- Look at status messages in the app

### Video won't play
- Check video format (MP4, WebM supported)
- Verify video URL is accessible
- Check network connection

### Images not loading
- Verify image format (JPEG, PNG supported)
- Check image URL is accessible
- Clear app data and retry

## Development

### Dependencies
- **Kotlin** - Modern Android development
- **Retrofit** - REST API client
- **ExoPlayer** - Video playback
- **Glide** - Image loading
- **Coroutines** - Async operations
- **Material Design** - UI components

### Building Release APK

```bash
# Generate signed APK
./gradlew assembleRelease

# Or create AAB for Play Store
./gradlew bundleRelease
```

## License

Part of FranchiseOS system. See main project for license.

## Support

For issues or questions, check the main FranchiseOS documentation.
