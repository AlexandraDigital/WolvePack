# ⚡ WolvePack Android App - Quick Start (TL;DR)

## 🎯 What You're Building
A step counter app that reads from Samsung Health and syncs to your WolvePack backend at `https://wolvepack.pages.dev`

---

## 📋 5-Minute Checklist

- [ ] Download & Install [Android Studio](https://developer.android.com/studio)
- [ ] Create new Android project named `WolvePack` (Kotlin)
- [ ] Copy 3 Kotlin files into your project:
  - `android_app_MainActivity.kt`
  - `android_app_SamsungHealthManager.kt`
  - `android_app_WolvepackApiClient.kt`
- [ ] Add dependencies from `android_app_build.gradle`
- [ ] Create UI layout `activity_main.xml` (see guide)
- [ ] Update `AndroidManifest.xml` with permissions
- [ ] Build APK: **Build → Generate Signed Bundle / APK**
- [ ] Install on phone: **Run → Select Device**
- [ ] Grant permissions on phone
- [ ] Tap "Sync Now" → Done! ✅

---

## 🚀 The Fast Path (If You Know Android)

1. Clone WolvePack repo
2. Add the 3 Kotlin files to `com.wolvepack.app` package
3. Copy gradle dependencies from `android_app_build.gradle`
4. Create `activity_main.xml` layout
5. Update `AndroidManifest.xml`
6. Build signed APK
7. Install on your Pixel phone
8. Grant Samsung Health permissions
9. Tap Sync Now

**Backend is already configured:** `https://wolvepack.pages.dev/api`

---

## 📦 What's Included

| File | What It Does |
|------|-------------|
| `android_app_MainActivity.kt` | Main app logic, permissions, UI |
| `android_app_SamsungHealthManager.kt` | Reads steps from Samsung Health |
| `android_app_WolvepackApiClient.kt` | Sends steps to your backend |
| `android_app_build.gradle` | Dependencies (copy to build.gradle) |
| `AndroidManifest.xml` | App permissions & configuration |
| `COMPLETE_APK_BUILD_GUIDE.md` | Detailed step-by-step guide |

---

## 🔧 Configuration Already Done

✅ Backend URL: `https://wolvepack.pages.dev/api`
✅ Samsung Health permissions: Configured
✅ Auto-sync: Every 24 hours
✅ Offline support: Enabled

---

## 📱 On Your Phone After Install

```
App opens
    ↓
Shows "🐺 WolvePack" title
    ↓
Shows your step count (reads from Samsung Health)
    ↓
Shows progress bar (goal: 10,000 steps)
    ↓
Tap "Sync Now" to send to backend
    ↓
Status shows "Synced" ✅
```

---

## 🎯 Success = 

- App installs without errors
- Opens and shows step count
- Tapping "Sync Now" works
- No permission errors
- Backend receives your steps

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Build fails | Click Build → Clean Project → Rebuild |
| APK won't install | Enable USB debugging on phone |
| No steps showing | Wear phone for 5+ minutes, take steps |
| Sync fails | Check phone internet, check backend at `https://wolvepack.pages.dev/api/health` |

---

## 📚 Need Details?
Read the full guide: `COMPLETE_APK_BUILD_GUIDE.md`

---

**That's it! You've got a working step sync app!** 🐺

Questions? Check Logcat in Android Studio for errors.
