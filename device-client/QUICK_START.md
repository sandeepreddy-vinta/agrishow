# 🚀 Quick Start Guide - Android Player App

## Step 1: Open in Android Studio

1. **Install Android Studio** (if not already installed)
   - Download from: https://developer.android.com/studio
   - Install with default settings

2. **Open the Project**
   ```
   File -> Open -> Navigate to: d:\TV App\Jyothir Centre app\device-client
   ```

3. **Wait for Gradle Sync**
   - Android Studio will automatically download dependencies
   - This may take 5-10 minutes on first run
   - Look for "Gradle sync finished" in the bottom status bar

## Step 2: Connect Your Android Phone

### Enable Developer Mode:
1. Go to **Settings** on your phone
2. Scroll to **About Phone**
3. Tap **Build Number** 7 times
4. You'll see "You are now a developer!"

### Enable USB Debugging:
1. Go to **Settings** -> **System** -> **Developer Options**
2. Enable **USB Debugging**
3. Connect phone to PC via USB cable
4. Allow USB debugging when prompted on phone

## Step 3: Run the App

1. **In Android Studio:**
   - Click the green "Run" button (▶️) at the top
   - Or press `Shift + F10`

2. **Select Your Device:**
   - Your phone should appear in the device list
   - Click "OK"

3. **App will install and launch automatically!**

## Step 4: Configure the App

### A. Start Your Backend (if not running)
```bash
cd "d:\TV App\Jyothir Centre app\backend"
npm start
```

### B. Register Device in Admin Dashboard
1. Open admin dashboard: http://localhost:5173
2. Login with: `admin@franchiseos.com` / `Admin@123`
3. Go to **Franchise Management**
4. Click **Add Franchise**
5. Fill in:
   - Name: "Test Device"
   - Location: "Your Location"
   - Device ID: "test-phone-001"
6. Click **Register**
7. **COPY THE DEVICE TOKEN** (shown once!)

### C. Configure the Player App
1. On your phone, the app should be open
2. Enter **API URL**: 
   - Find your PC's IP address:
     ```bash
     # Windows
     ipconfig
     # Look for IPv4 Address (e.g., 192.168.1.100)
     ```
   - Format: `http://YOUR_IP:3000/api`
   - Example: `http://192.168.1.100:3000/api`

3. Enter **Device Token**: (paste the token you copied)

4. Click **Save Configuration**

5. Click **Start Player**

## Step 5: Assign Content

1. **Upload Content** (in admin dashboard)
   - Go to **Content Library**
   - Click **Upload Content**
   - Select a video or image
   - Wait for upload to complete

2. **Assign to Device**
   - Go to **Assignment Manager**
   - Drag content from left panel to your device
   - Content will start playing on your phone immediately!

## 🎉 Success!

Your phone should now be playing content in fullscreen mode!

## 📱 Testing Tips

- **Rotate phone to landscape** for best experience
- **Tap screen** to see status messages
- **Press back button** to exit player
- **Check logs** in Android Studio's Logcat for debugging

## ⚠️ Common Issues

### "Cannot connect to backend"
- ✅ Ensure backend is running (`npm start`)
- ✅ Check if phone and PC are on same WiFi network
- ✅ Verify IP address is correct
- ✅ Try `http://` instead of `https://`

### "Invalid device token"
- ✅ Make sure you copied the full token
- ✅ Token is case-sensitive
- ✅ Re-register device if needed

### "No content playing"
- ✅ Assign content in admin dashboard
- ✅ Check Assignment Manager shows content for your device
- ✅ Wait a few seconds for playlist to refresh

### Gradle Errors
- ✅ Use the Gradle wrapper included (don't install Gradle separately)
- ✅ Check internet connection (downloads dependencies)
- ✅ Try: File -> Invalidate Caches -> Restart

## 🔧 Build APK (Optional)

To create an APK file for sharing:

```bash
cd "d:\TV App\Jyothir Centre app\device-client"
gradlew.bat assembleDebug
```

APK will be at: `app\build\outputs\apk\debug\app-debug.apk`

## 📚 Next Steps

- Test with multiple content items
- Try both videos and images
- Monitor heartbeat in backend logs
- Check analytics reporting
- Test on Android TV (if available)

## 🆘 Need Help?

Check the full README.md for detailed documentation and troubleshooting.
