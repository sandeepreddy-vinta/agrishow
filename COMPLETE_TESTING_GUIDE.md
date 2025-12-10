# 🧪 Complete Testing Guide - FranchiseOS System

## Overview

This guide will help you test the complete FranchiseOS digital signage system:
- ✅ Backend API
- ✅ Admin Dashboard
- ✅ Android Player App

## Prerequisites

- Windows PC
- Android phone (Android 5.0+)
- Same WiFi network for PC and phone
- Android Studio installed
- Node.js installed

---

## Part 1: Backend Setup (5 minutes)

### 1. Start the Backend

```bash
cd "d:\TV App\Jyothir Centre app\backend"
npm install  # First time only
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║            FranchiseOS Backend API v2.0                ║
╠════════════════════════════════════════════════════════╣
║  Server running on port: 3000                          ║
║  Environment: development                              ║
║  Database version: 1                                   ║
╚════════════════════════════════════════════════════════╝
```

### 2. Test Backend Health

Open browser: http://localhost:3000/api/health

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "..."
  }
}
```

✅ **Backend is running!**

---

## Part 2: Admin Dashboard Setup (5 minutes)

### 1. Start the Dashboard

```bash
cd "d:\TV App\Jyothir Centre app\admin-dashboard"
npm install  # First time only
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. Login to Dashboard

1. Open: http://localhost:5173
2. Login with:
   - Email: `admin@franchiseos.com`
   - Password: `Admin@123`

✅ **Dashboard is accessible!**

### 3. Verify Dashboard Features

- [ ] Dashboard shows stats (all zeros initially)
- [ ] Content Library is empty
- [ ] Franchise Manager is empty
- [ ] Assignment Manager loads

---

## Part 3: Upload Test Content (10 minutes)

### 1. Prepare Test Files

Create or download:
- **1 video file** (MP4, max 500MB)
- **1 image file** (JPG or PNG)

### 2. Upload to Content Library

1. Go to **Content Library**
2. Click **Upload Content**
3. Select your video file
4. Wait for upload (progress bar)
5. Repeat for image file

**Verify:**
- [ ] Both files appear in Content Library
- [ ] File sizes are shown
- [ ] Preview button works (opens in new tab)

✅ **Content uploaded successfully!**

---

## Part 4: Register Device (5 minutes)

### 1. Get Your PC's IP Address

```bash
# Windows Command Prompt
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100
```

**Write down your IP:** `_________________`

### 2. Register Device in Dashboard

1. Go to **Franchise Management**
2. Click **Add Franchise**
3. Fill in:
   - **Name:** Test Phone
   - **Location:** Your Location
   - **Device ID:** test-phone-001
4. Click **Register**

**IMPORTANT:** A toast notification will appear with the device token!

5. **COPY THE DEVICE TOKEN** immediately
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - You can only see this once!

**Write down your token:** `_________________`

✅ **Device registered!**

---

## Part 5: Build & Install Android App (15 minutes)

### 1. Open Project in Android Studio

1. Launch **Android Studio**
2. Click **Open**
3. Navigate to: `d:\TV App\Jyothir Centre app\device-client`
4. Click **OK**
5. Wait for Gradle sync (5-10 minutes first time)

**Look for:** "Gradle sync finished" in bottom status bar

### 2. Connect Your Phone

1. **Enable Developer Mode:**
   - Settings → About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings → System → Developer Options
   - Enable "USB Debugging"

3. **Connect via USB:**
   - Plug phone into PC
   - Allow USB debugging on phone

4. **Verify Connection:**
   - In Android Studio, check device dropdown (top toolbar)
   - Your phone should appear

### 3. Run the App

1. Click green **Run** button (▶️)
2. Select your phone
3. Click **OK**
4. App will install and launch

✅ **App installed on phone!**

---

## Part 6: Configure Player App (5 minutes)

### On Your Phone:

1. **Enter API URL:**
   ```
   http://YOUR_IP:3000/api
   ```
   Replace `YOUR_IP` with the IP you noted earlier
   
   Example: `http://192.168.1.100:3000/api`

2. **Enter Device Token:**
   - Paste the token you copied earlier

3. **Click "Save Configuration"**
   - Should see "Configuration saved!" toast

4. **Click "Start Player"**
   - App switches to fullscreen player

**Expected:** Status shows "Fetching playlist..."

---

## Part 7: Assign Content (2 minutes)

### In Admin Dashboard:

1. Go to **Assignment Manager**
2. You should see:
   - **Left panel:** Your uploaded content
   - **Right panel:** Your device (Test Phone)

3. **Drag and drop:**
   - Drag video from left to your device on right
   - Drag image from left to your device on right

**Expected on Phone:**
- Status changes to "Playing 2 items"
- Video starts playing immediately!
- After video ends, image shows for 10 seconds
- Then loops back to video

✅ **COMPLETE SYSTEM WORKING!** 🎉

---

## Part 8: Verify Features (10 minutes)

### Test Heartbeat

**In Backend Terminal:**
- Look for log messages every 60 seconds:
  ```
  [Heartbeat] test-phone-001 - Test Phone
  ```

✅ **Heartbeat working!**

### Test Playlist Updates

1. **In Dashboard:** Upload another video
2. **In Assignment Manager:** Drag it to your device
3. **On Phone:** Wait up to 5 minutes
4. New video should start playing in rotation

✅ **Playlist updates working!**

### Test Content Removal

1. **In Assignment Manager:** Click × to remove content
2. **On Phone:** Content stops playing after current item

✅ **Content removal working!**

### Test Device Status

1. **In Franchise Manager:** Check device status
2. Should show "Online" with recent timestamp

✅ **Status tracking working!**

---

## Troubleshooting

### Phone Can't Connect to Backend

**Symptoms:** "Failed to fetch playlist" error

**Solutions:**
1. ✅ Verify backend is running (`npm start`)
2. ✅ Check phone and PC on same WiFi
3. ✅ Verify IP address is correct
4. ✅ Try pinging PC from phone (use Ping app)
5. ✅ Disable Windows Firewall temporarily
6. ✅ Use `http://` not `https://`

### No Content Playing

**Symptoms:** Black screen or "No content assigned"

**Solutions:**
1. ✅ Check Assignment Manager shows content for device
2. ✅ Verify content uploaded successfully
3. ✅ Try removing and re-adding content
4. ✅ Check backend logs for errors
5. ✅ Restart player app

### Gradle Build Errors

**Symptoms:** Red errors in Android Studio

**Solutions:**
1. ✅ File → Invalidate Caches → Restart
2. ✅ Check internet connection
3. ✅ Delete `.gradle` folder and sync again
4. ✅ Ensure Android Studio is updated

### Video Won't Play

**Symptoms:** Image works but video doesn't

**Solutions:**
1. ✅ Check video format (MP4 recommended)
2. ✅ Try a different video file
3. ✅ Check video URL in browser
4. ✅ Look at Logcat in Android Studio for errors

---

## Success Checklist

- [ ] Backend running on port 3000
- [ ] Dashboard accessible at localhost:5173
- [ ] Logged into dashboard
- [ ] Content uploaded (video + image)
- [ ] Device registered with token
- [ ] Android app installed on phone
- [ ] App configured with API URL and token
- [ ] Content assigned to device
- [ ] Content playing on phone
- [ ] Heartbeat logs appearing
- [ ] Playlist updates working
- [ ] Device shows "Online" status

---

## Performance Metrics

### Expected Behavior:

| Feature | Expected Time |
|---------|--------------|
| Heartbeat interval | 60 seconds |
| Playlist refresh | 5 minutes |
| Video playback | Smooth, no buffering |
| Image display | 10 seconds (default) |
| Content switch | Instant |
| Status update | Real-time |

---

## Next Steps

Once everything is working:

1. **Test with more content** (10+ items)
2. **Test on Android TV** (if available)
3. **Test multiple devices** (register more phones)
4. **Test network interruption** (disconnect WiFi)
5. **Test long-running** (leave overnight)
6. **Deploy to production** (VPS + domain)

---

## Production Deployment

When ready for production:

1. **Backend:** Deploy to VPS (DigitalOcean, AWS, etc.)
2. **Dashboard:** Deploy to Netlify/Vercel
3. **Update API URL** in player app
4. **Build release APK** with production URL
5. **Distribute to devices**

See `DEPLOYMENT.md` for detailed production setup.

---

## 🎉 Congratulations!

You've successfully set up and tested the complete FranchiseOS digital signage system!

**What you've built:**
- ✅ Professional backend API
- ✅ Modern admin dashboard
- ✅ Android player app
- ✅ Complete content management system
- ✅ Real-time device monitoring
- ✅ Automated content distribution

**Total cost:** ~$0 (development) or ~$7-13/month (production VPS)

**No external services needed!** Everything runs on your own infrastructure.

---

## Support

For issues or questions:
- Check README files in each folder
- Review code comments
- Check backend logs
- Use Android Studio Logcat for app debugging

Happy digital signage! 📺✨
