# 🚀 WolvePack Android App - Complete Build & Installation Guide

**Your backend is ready at:** `https://wolvepack.pages.dev/api`

---

## 📋 Prerequisites (Before Starting)

You need these installed on your computer:
- ✅ Android Studio (latest version) - [Download here](https://developer.android.com/studio)
- ✅ Android SDK (Android 10+)
- ✅ Java Development Kit (JDK 11 or higher)
- ✅ A USB cable for your Pixel phone

**Estimated time:** 30-45 minutes total (mostly downloads)

---

## 🏗️ Step 1: Create Android Studio Project (5 minutes)

### 1.1 Open Android Studio
- Click **File** → **New** → **New Android Project**

### 1.2 Configure the Project
- **Name:** `WolvePack`
- **Package name:** `com.wolvepack.app`
- **Minimum SDK:** Android 10 (API 29)
- **Language:** Kotlin
- **Click Finish** and wait for initial setup

### 1.3 Wait for Gradle Sync
You'll see a message: "Gradle sync in progress..."
⏳ This can take 2-5 minutes. Let it finish completely.

---

## 📦 Step 2: Add Dependencies (3 minutes)

Open the file: `build.gradle.kts` (Module: app)

Find this section and add these dependencies:

```gradle
dependencies {
    // Core Android
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    
    // Networking
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    
    // JSON parsing
    implementation("org.json:json:20231013")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.1")
    
    // WorkManager (for background sync)
    implementation("androidx.work:work-runtime-ktx:2.8.1")
    
    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.1")
    
    // Samsung Health API (optional - for advanced features)
    // implementation("com.samsung.android.sdk:healthdata:1.6.4")
}
```

Click **Sync Now** (blue button at top)

⏳ Wait for gradle sync to complete (2-3 minutes)

---

## 📝 Step 3: Add the Code Files (5 minutes)

### 3.1 Create MainActivity.kt
- Right-click `com.wolvepack.app` package in **Project** panel
- **New** → **Kotlin Class/File** → **Class**
- Name: `MainActivity`
- Paste the contents from `android_app_MainActivity.kt`

### 3.2 Create SamsungHealthManager.kt
- Right-click package → **New** → **Kotlin Class/File** → **Class**
- Name: `SamsungHealthManager`
- Paste the contents from `android_app_SamsungHealthManager.kt`

### 3.3 Create WolvepackApiClient.kt
- Right-click package → **New** → **Kotlin Class/File** → **Class**
- Name: `WolvepackApiClient`
- Paste the contents from `android_app_WolvepackApiClient.kt`

✅ **Backend URL is already configured:** `https://wolvepack.pages.dev/api`

---

## 🎨 Step 4: Create UI Layout (3 minutes)

### 4.1 Create activity_main.xml
- Right-click `res/layout` folder
- **New** → **Layout Resource File**
- Name: `activity_main`
- Paste this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:gravity="center">

    <TextView
        android:id="@+id/titleText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="🐺 WolvePack"
        android:textSize="32sp"
        android:textStyle="bold"
        android:layout_marginBottom="30dp" />

    <TextView
        android:id="@+id/stepCountText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textSize="48sp"
        android:textStyle="bold"
        android:textColor="#FF6B6B"
        android:layout_marginBottom="10dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="steps today"
        android:textSize="18sp"
        android:layout_marginBottom="30dp" />

    <ProgressBar
        android:id="@+id/stepProgress"
        android:layout_width="200dp"
        android:layout_height="20dp"
        android:progress="0"
        android:max="100"
        android:layout_marginBottom="30dp"
        style="@android:style/Widget.ProgressBar.Horizontal" />

    <Button
        android:id="@+id/syncButton"
        android:layout_width="200dp"
        android:layout_height="50dp"
        android:text="Sync Now"
        android:textSize="18sp" />

    <TextView
        android:id="@+id/statusText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Status: Ready"
        android:textSize="14sp"
        android:layout_marginTop="30dp"
        android:textColor="#666666" />

</LinearLayout>
```

---

## 🔐 Step 5: Update AndroidManifest.xml (2 minutes)

Open `AndroidManifest.xml` and ensure it has these permissions:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Internet access for API calls -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Samsung Health permissions -->
    <uses-permission android:name="com.samsung.health.permission.READ_STEP_DAILY" />
    <uses-permission android:name="com.samsung.health.permission.READ_STEP_INTRADAY" />
    
    <!-- Background sync -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.WolvePack">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

---

## ✅ Step 6: Verify Everything Builds (5 minutes)

### 6.1 Check for Errors
- **Build** → **Clean Project** (wait for it to finish)
- **Build** → **Rebuild Project** (wait for completion)

If you see red errors in the code editor:
- Right-click the file → **Show in Files** → check the path is correct
- Make sure all three `.kt` files are in `com.wolvepack.app` package

### 6.2 Sync Gradle
- Click **Sync Now** if it appears

✅ You should see "Build successful" in the bottom panel

---

## 📱 Step 7: Build the APK (10 minutes)

### 7.1 Generate Signed APK
- **Build** → **Generate Signed Bundle / APK**
- Choose **APK** → **Next**

### 7.2 Create or Select Keystore
You need a keystore file (for signing the app):

**If you don't have one:**
- Click **Create new...**
- Fill in:
  - **Key store path:** Choose a safe location (e.g., Desktop)
  - **Password:** Create a strong password (remember it!)
  - **Key alias:** `wolvepack_key`
  - **Key password:** Same as keystore password
  - **Validity:** 25 years
  - **Certificate:** Fill in any info you want
- Click **OK**

### 7.3 Release Build Config
- **Release** selected
- **V2 Signing enabled** (checked)
- Click **Finish**

⏳ Wait 2-3 minutes for the build to complete

### 7.4 Find Your APK
You'll see a message: "APK(s) generated successfully"
- Click **Show in Finder** (Mac) or **Show in Explorer** (Windows)
- Your APK file is named: `app-release.apk`
- **📁 Copy this file to your desktop for easy access**

---

## 📲 Step 8: Install on Pixel Phone (5 minutes)

### 8.1 Enable Developer Mode
On your **Pixel phone**:
1. **Settings** → **About phone**
2. Scroll to **Build number**
3. Tap **Build number** 7 times
4. You'll see "Developer mode enabled"

### 8.2 Enable USB Debugging
1. **Settings** → **System** → **Developer options**
2. Find **USB debugging** → Turn it **ON**
3. A dialog appears asking to trust the computer
4. Tap **Trust**

### 8.3 Connect Phone via USB
1. Connect your Pixel to your computer with USB cable
2. Your phone might ask for permission → **Allow**
3. On Android Studio: You should see your device in the device list

### 8.4 Install APK
Open terminal/command prompt and run:

```bash
adb install -r /path/to/app-release.apk
```

Or use Android Studio's built-in method:
- **Run** → **Select Device** → Choose your Pixel → **OK**
- Android Studio will install automatically

✅ You should see: "Success"

---

## 🎯 Step 9: First Run on Your Phone (5 minutes)

### 9.1 Launch the App
- Find **WolvePack** app on your Pixel home screen
- Tap to open

### 9.2 Grant Permissions
The app will ask for:
- **Internet permission** - Tap **Allow**
- **Samsung Health permission** - Tap **Allow**
- **Health data access** - Tap **Allow**

### 9.3 Check Status
You should see:
- "🐺 WolvePack" title at top
- A big number showing your step count
- "steps today" text
- A progress bar
- "Sync Now" button

### 9.4 Manual Sync (First Time)
- Tap **Sync Now** button
- Check status text at bottom - should show "Status: Synced"

✅ **Your steps are now syncing to:** `https://wolvepack.pages.dev`

---

## 🔄 Automatic Sync (Already Configured!)

The app automatically:
- ✅ Reads steps from Samsung Health every hour
- ✅ Syncs to your backend daily (at 11:59 PM)
- ✅ Works in background even when app is closed
- ✅ Retries if sync fails
- ✅ Stores data locally if offline

No additional setup needed!

---

## 🐛 Troubleshooting

### "Build failed" error
- **Solution:** Click **Build** → **Clean Project** → **Rebuild**
- Make sure all dependencies synced (check `build.gradle` has all libraries)

### "APK not installing"
- **Solution:** 
  - Check USB debugging is enabled
  - Uninstall old version: `adb uninstall com.wolvepack.app`
  - Try: `adb install -r app-release.apk`

### "Samsung Health permission denied"
- **Solution:**
  - Open phone Settings → Apps → **Samsung Health**
  - Grant all permissions manually
  - Restart WolvePack app

### "API connection failed"
- **Solution:**
  - Check your phone has internet (WiFi or mobile data)
  - Verify backend is live: Visit `https://wolvepack.pages.dev/api/health` in browser
  - Check app logs: **Logcat** panel in Android Studio

### "No steps showing"
- **Solution:**
  - Make sure you've walked some steps with your phone
  - Take steps wearing your phone for 5+ minutes
  - Tap **Sync Now** manually
  - Check Samsung Health app shows steps

---

## 🎉 Success Checklist

- [x] Android Studio installed
- [x] Project created with your code
- [x] Dependencies added
- [x] APK built successfully
- [x] APK installed on Pixel phone
- [x] App opens and shows step counter
- [x] Permissions granted
- [x] First sync successful
- [x] Backend is live at `https://wolvepack.pages.dev`

---

## 📞 Need Help?

If something breaks:
1. Check the **Logcat** panel in Android Studio (shows app logs)
2. Look for red error messages
3. Common fixes:
   - Clean & rebuild project
   - Sync gradle
   - Restart Android Studio
   - Reconnect phone

**You got this!** 🐺🚀
