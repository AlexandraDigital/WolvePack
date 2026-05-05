# 📱 WolvePack Android App - Complete Setup Guide

## 🎯 Overview

The WolvePack Android app reads **real step data directly from Samsung Health** on your Pixel phone and syncs it to the WolvePack cloud backend automatically.

### What You'll Get
- Real-time step count from your watch/phone sensors
- Automatic daily sync to cloud
- Background sync without user interaction
- Offline support with automatic retry

## ⚙️ Prerequisites

- **Device**: Pixel 3 or newer with Android 13+
- **Software**: Android Studio Flamingo or newer
- **Samsung Health**: Latest version installed on your phone
- **Node.js**: 16+ (for backend)

## 📋 Installation Steps

### Step 1: Set Up Backend (5 minutes)

```bash
# Clone/download WolvePack repo
cd WolvePack

# Install dependencies
npm install

# Start backend server
npm start

# Server should now be running on http://localhost:3000
# You should see: "🐺 WolvePack backend running on http://localhost:3000"
```

### Step 2: Prepare Android Project

1. **Open Android Studio**
2. **File → New → Project from Version Control**
3. **Paste**: `https://github.com/AlexandraDigital/WolvePack.git`
4. **Click Clone**

### Step 3: Update Configuration

#### 3a. Configure Backend URL

Edit `app/src/main/java/com/wolvepack/app/MainActivity.kt`:

```kotlin
// Line ~20, change this:
private lateinit var wolvepackApiClient: WolvepackApiClient = 
    WolvepackApiClient("http://your-local-ip:3000/api")

// For local testing on same machine use your computer's IP:
// Example: WolvepackApiClient("http://192.168.1.100:3000/api")

// For production/cloud backend:
// Example: WolvepackApiClient("https://api.yourdomain.com/api")
```

**Get your local IP:**
```bash
# On Mac/Linux
ifconfig | grep "inet "

# On Windows
ipconfig | grep IPv4
```

#### 3b. Update Sync Worker

Edit `app/src/main/java/com/wolvepack/app/BackgroundSyncWorker.kt`:

```kotlin
// Line ~25, update URL to match:
val wolvepackApiClient = WolvepackApiClient("http://192.168.1.100:3000/api")
```

### Step 4: Grant Permissions

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. **Install on device**: 
   - Connect Pixel phone via USB
   - Enable USB Debugging: Settings → Developer Options → USB Debugging
   - Android Studio will install the APK

3. **Grant Permissions**:
   - Open WolvePack app
   - Tap "Grant Permission" when asked
   - Select Samsung Health app and grant access
   - Allow all requested permissions

### Step 5: Verify Samsung Health Connection

1. **Open Samsung Health** on your Pixel
2. **Go to Step Count** and take a few steps
3. **Open WolvePack** app
4. **Verify steps are displayed** in the main UI

## 🔄 How Sync Works

### Manual Sync
```
User taps "Sync Now" button
    ↓
App reads Samsung Health data
    ↓
App sends to backend API
    ↓
Backend stores in database
    ↓
Web app shows updated stats
```

### Automatic Daily Sync
```
Every 24 hours at 11:59 PM
    ↓
BackgroundSyncWorker runs
    ↓
Reads Samsung Health data
    ↓
Sends to backend
    ↓
Updates cloud
    ↓
All your devices sync
```

## 📲 Testing the Integration

### Test 1: Manual Steps
```
1. Open WolvePack app
2. Take 10-20 steps with your phone
3. Tap "Sync Now" button
4. Steps should appear in the app
5. Open web app (index_updated.html)
6. Your steps should be synced!
```

### Test 2: Offline Sync
```
1. Turn off internet on phone
2. Take more steps
3. Open WolvePack (should work offline)
4. Steps saved locally
5. Turn internet back on
6. Tap "Sync Now"
7. Steps sync to cloud
```

### Test 3: Background Sync
```
1. Open WolvePack
2. Tap "Allow notifications"
3. Close app completely
4. Leave phone on overnight
5. Check next morning
6. Steps should auto-synced
```

## 🔧 Debugging

### Check Logs
```bash
# Connect phone via USB
adb logcat | grep WolvePack

# You should see:
# D/WolvePack: User initialized: abc123...
# D/SamsungHealthManager: Read 8234 steps for 2026-05-04
# D/WolvepackApiClient: Steps submitted: 8234
```

### Verify Backend Connection
```bash
# On your computer
curl http://localhost:3000/api/health

# Should respond:
# {"status":"ok","timestamp":"2026-05-04T..."}
```

### Check Database
```bash
# Backend logs should show:
# Connected to SQLite database
# Database initialized

# If not working, reset:
rm wolvepack.db
npm start
```

## 🚀 Build for Release

### Generate Signed APK

1. **Build → Generate Signed Bundle / APK**
2. **Select APK**
3. **Choose keystore** (create new if needed)
   - Key store path: `release.jks`
   - Password: Create secure password
   - Key alias: `wolvepack`
   - Key password: Same as keystore
4. **Select release build variant**
5. **Finish**

APK will be saved to: `app/release/app-release.apk`

### Test Signed APK
```bash
# Uninstall debug version
adb uninstall com.wolvepack.app

# Install signed version
adb install app/release/app-release.apk
```

## 📊 Monitoring

### Web Dashboard
Open `index_updated.html` in browser:
- Real-time step count
- Weekly average
- Best day
- Days active
- Achievement badges

### Backend Monitoring
```bash
# Check sync logs
curl http://localhost:3000/api/sync/{user-id}

# Get user stats
curl http://localhost:3000/api/stats/{user-id}
```

## 🛟 Troubleshooting

### Samsung Health Not Detected

**Problem**: App says "Samsung Health not found"

**Solution**:
1. Ensure Samsung Health is installed
2. Ensure app has permission to read Health data
3. Settings → Apps → WolvePack → Permissions → Health
4. Toggle: "Step Count" permission ON

### Sync Failing

**Problem**: Steps not syncing

**Solution**:
1. Check internet connection: `adb shell ping 8.8.8.8`
2. Check backend is running: `curl http://localhost:3000/api/health`
3. Check firewall allows port 3000
4. Check app logs: `adb logcat | grep WolvepackApiClient`

### Steps Not Appearing

**Problem**: App won't read steps from Samsung Health

**Solution**:
1. Take steps while holding phone
2. Wait 10-15 seconds for Samsung Health to register
3. Force close WolvePack and reopen
4. Check Samsung Health app directly - do steps show there?

### Backend Connection Issues

**Problem**: "Cannot connect to backend"

**Solution**:
1. Get your computer IP: `ifconfig` or `ipconfig`
2. Update MainActivity.kt with correct IP
3. Make sure port 3000 is not blocked by firewall
4. Test: `telnet 192.168.1.100 3000`

## 🔐 Security Notes

- Store API URLs securely (consider using BuildConfig)
- Use HTTPS in production
- Never hardcode user credentials
- Implement token-based auth for production
- Use ProGuard/R8 for code obfuscation in release builds

## 📈 Performance Tips

- Limit background sync frequency (currently daily)
- Compress data before sending
- Cache responses locally
- Use WorkManager for efficient scheduling
- Monitor battery usage

## 🐛 Known Issues

- Samsung Health API delay: 10-15 seconds to register steps
- Background sync may skip if device is in deep sleep
- First sync may take longer if loading large step history

## 📚 Additional Resources

- [Android Health Connect Docs](https://developer.android.com/guide/health-and-fitness/health-connect)
- [Samsung Health API](https://developer.samsung.com/health)
- [WorkManager Guide](https://developer.android.com/topic/libraries/architecture/workmanager)

## 🎉 Success Checklist

- [ ] Backend running on localhost:3000
- [ ] Android Studio project opens without errors
- [ ] Configuration updated with backend URL
- [ ] APK built and installed on device
- [ ] Samsung Health permissions granted
- [ ] Manual sync test successful
- [ ] Steps appear in web dashboard
- [ ] Background sync enabled
- [ ] Offline sync tested

---

**You're all set! 🐺 Your steps are now syncing with the pack!**

For help, check the main README.md or open an issue on GitHub.
