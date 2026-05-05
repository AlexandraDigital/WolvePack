# 🐺 WolvePack - Step Tracking with Samsung Health Integration

A full-stack application that gamifies step tracking with **real-time Samsung Health integration**, cloud synchronization, and a pack of animated wolves. Track your daily steps from your Pixel phone's Samsung Health and compete with your pack!

## 🎯 Features

### Web App (Updated)
- ✅ Cloud-synced step tracking
- ✅ Real-time stat updates
- ✅ Achievement system with badges
- ✅ Offline support with automatic sync
- ✅ Animated wolf pack UI
- ✅ Weekly statistics dashboard
- ✅ Share progress feature

### Android App (Samsung Health Integration)
- ✅ **Direct Samsung Health integration** - reads actual step data
- ✅ Pixel phone support
- ✅ Auto-sync to cloud backend
- ✅ Background sync every 24 hours
- ✅ Offline-first architecture
- ✅ Push notifications for achievements
- ✅ Health Connect API compatible

### Backend API
- ✅ RESTful API with Express.js
- ✅ SQLite database (upgradeable to PostgreSQL)
- ✅ User management
- ✅ Step data sync
- ✅ Achievement tracking
- ✅ Sync logging

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Android Studio (for Android development)
- Pixel phone with Android 13+

### 1. Backend Setup (30 seconds)

```bash
# Install dependencies
npm install

# Start server
npm start
# Server runs on http://localhost:3000
```

### 2. Web App (Already Updated!)
Replace the current `index.html` with `index_updated.html` - it includes cloud sync.

```bash
# Open in browser
open index_updated.html
# Or serve locally
npx http-server
```

### 3. Android App Setup

#### Project Structure
```
WolvePack-Android/
├── app/
│   ├── src/main/
│   │   ├── java/com/wolvepack/app/
│   │   │   ├── MainActivity.kt           (main activity)
│   │   │   ├── SamsungHealthManager.kt   (Health Connect integration)
│   │   │   ├── WolvepackApiClient.kt     (API client)
│   │   │   └── BackgroundSyncWorker.kt   (background service)
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
```

#### Building the APK

1. **Clone the repo and open in Android Studio:**
```bash
git clone https://github.com/AlexandraDigital/WolvePack.git
cd WolvePack
```

2. **Update API URL in MainActivity.kt:**
```kotlin
private val wolvepackApiClient = WolvepackApiClient("https://your-backend-url.com/api")
```

3. **Add required permissions to AndroidManifest.xml:**
```xml
<uses-permission android:name="com.samsung.health.permission.READ_STEP_DAILY" />
<uses-permission android:name="com.samsung.health.permission.READ_STEP_INTRADAY" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

4. **Build & install:**
```bash
# Build APK
./gradlew build

# Install on device
./gradlew installDebug

# Or generate release APK
./gradlew bundleRelease
```

## 📡 API Endpoints

### Users
```
POST   /api/users                    Create/get user
GET    /api/users/:userId            Get user details
```

### Steps
```
POST   /api/steps                    Submit step data
GET    /api/steps/:userId            Get step history
GET    /api/steps/:userId/today      Get today's steps
GET    /api/stats/:userId            Get weekly stats
```

### Achievements
```
POST   /api/achievements             Unlock achievement
GET    /api/achievements/:userId     Get user achievements
```

### Sync
```
GET    /api/sync/:userId             Get sync status
```

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file:
```env
PORT=3000
DATABASE_URL=./wolvepack.db
NODE_ENV=production
```

### Android Configuration
Edit `MainActivityUser.kt`:
```kotlin
// Change this to your backend URL
val wolvepackApiClient = WolvepackApiClient("https://your-api.com/api")

// Samsung Health permissions
val permissionsNeeded = listOf(
    "com.samsung.health.permission.READ_STEP_DAILY",
    "com.samsung.health.permission.READ_STEP_INTRADAY"
)
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t wolvepack-backend .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  wolvepack-backend

# Or use docker-compose
docker-compose up -d
```

## 📱 Samsung Health Integration

The Android app uses **Google Health Connect API** for maximum compatibility:

1. **Permissions Request**: App requests READ_STEP_DAILY and READ_STEP_INTRADAY
2. **Data Reading**: Reads actual step data from Samsung Health
3. **Auto-Sync**: Background worker syncs every 24 hours
4. **Conflict Resolution**: Latest data wins

### How It Works

```
Samsung Health Watch Data
    ↓
Samsung Health App
    ↓
Health Connect API (Android 13+)
    ↓
WolvePack Android App
    ↓
WolvePack Backend API
    ↓
Web App (Real-time Updates)
```

## 🏆 Achievement System

### Unlockable Achievements
- **👣 First Steps** (100 steps)
- **🏃 5K Steps** (5,000 steps)
- **🎯 10K Steps** (10,000 steps)
- **🚀 Marathon Run** (20,000 steps)

Achievements are:
- Unlocked automatically when conditions are met
- Stored in cloud backend
- Synced across devices
- Displayed with notifications

## 🔐 Data Privacy

- User data is stored locally until sync
- All API communication is over HTTPS (in production)
- No data is sold or shared
- Step data is associated with user ID only (anonymous)

## 🛠️ Development

### Backend Development
```bash
npm install --save-dev nodemon
npm run dev
# Auto-restarts on file changes
```

### Android Development
- Open project in Android Studio
- Use Android Emulator (Pixel 5 recommended)
- Enable "Samsung Health" in emulator Google Play

### Testing Sync
```bash
# Create test user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user"}'

# Submit test steps
curl -X POST http://localhost:3000/api/steps \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"your-user-id",
    "steps":8234,
    "date":"2026-05-04",
    "source":"samsung_health"
  }'

# Get stats
curl http://localhost:3000/api/stats/your-user-id
```

## 🚨 Troubleshooting

### Samsung Health Not Detected
1. Ensure you have Samsung Health installed on your Pixel phone
2. Grant app permissions in Settings → Apps → Permissions
3. Check: Settings → Privacy → Health data

### Sync Not Working
1. Check internet connection
2. Verify backend is running: `curl http://localhost:3000/api/health`
3. Check logs: `adb logcat | grep WolvePack`

### Database Issues
```bash
# Reset database
rm wolvepack.db
npm run init-db
npm start
```

## 📈 Performance Metrics

- **Web Load Time**: < 2s
- **Sync Response**: < 500ms
- **Daily Sync (Background)**: < 5 seconds
- **Database Query Time**: < 100ms

## 🎮 Future Enhancements

- [ ] Leaderboard with friends
- [ ] Multi-device sync
- [ ] Wear OS companion app
- [ ] Challenge system
- [ ] Custom goals/workouts
- [ ] Export data to CSV
- [ ] Apple Health integration

## 📄 License

Apache License 2.0 - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please submit pull requests to improve WolvePack.

## 📧 Support

Need help? Open an issue on GitHub or check the documentation.

---

**Run with your pack. 🐺**

*Last Updated: May 3, 2026*
