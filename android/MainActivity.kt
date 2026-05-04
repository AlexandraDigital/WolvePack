package com.wolvepack.app

import android.content.Context
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.work.*
import java.util.concurrent.TimeUnit
import java.time.LocalDate
import android.util.Log

/**
 * WolvePack Android App - Samsung Health Integration
 * Reads step data from Samsung Health and syncs to WolvePack backend
 */
class MainActivity : AppCompatActivity() {
    
    private lateinit var samsungHealthManager: SamsungHealthManager
    private lateinit var wolvepackApiClient: WolvepackApiClient
    private var userId: String? = null
    private var totalSteps: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize managers
        samsungHealthManager = SamsungHealthManager(this)
        wolvepackApiClient = WolvepackApiClient("https://your-backend-url.com/api")

        // Initialize user
        initializeUser()

        // Request Samsung Health permissions
        requestSamsungHealthPermissions()

        // Schedule daily sync with WolvePack backend
        scheduleBackgroundSync()

        // Manual sync button (optional)
        findViewById<android.widget.Button>(R.id.syncButton)?.setOnClickListener {
            syncStepsNow()
        }
    }

    private fun initializeUser() {
        lifecycleScope.launch {
            userId = getOrCreateUser()
            Log.d("WolvePack", "User initialized: $userId")
        }
    }

    private suspend fun getOrCreateUser(): String = withContext(Dispatchers.IO) {
        val sharedPref = getSharedPreferences("wolvepack", Context.MODE_PRIVATE)
        var storedUserId = sharedPref.getString("user_id", null)

        if (storedUserId == null) {
            // Create new user
            val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"
            storedUserId = wolvepackApiClient.createUser(
                username = "user_${System.currentTimeMillis()}",
                email = null
            )
            
            sharedPref.edit().apply {
                putString("user_id", storedUserId)
                apply()
            }
        }
        
        storedUserId ?: ""
    }

    private fun requestSamsungHealthPermissions() {
        // Samsung Health requires specific permissions
        samsungHealthManager.requestPermissions(
            permissionsNeeded = listOf(
                "com.samsung.health.permission.READ_STEP_DAILY",
                "com.samsung.health.permission.READ_STEP_INTRADAY"
            ),
            onPermissionsGranted = {
                Log.d("WolvePack", "Samsung Health permissions granted")
                readTodaySteps()
            },
            onPermissionsDenied = {
                Log.w("WolvePack", "Samsung Health permissions denied")
                showPermissionDeniedDialog()
            }
        )
    }

    private fun readTodaySteps() {
        lifecycleScope.launch {
            val today = LocalDate.now()
            val steps = samsungHealthManager.readStepCount(today)
            
            totalSteps = steps
            updateUI(steps)
            
            // Auto-sync if steps changed
            if (steps > 0) {
                syncStepsNow()
            }
        }
    }

    private fun syncStepsNow() {
        lifecycleScope.launch {
            userId?.let { userId ->
                val today = LocalDate.now().toString()
                
                withContext(Dispatchers.IO) {
                    try {
                        wolvepackApiClient.submitSteps(
                            user_id = userId,
                            steps = totalSteps,
                            date = today,
                            source = "samsung_health"
                        )
                        Log.d("WolvePack", "Steps synced: $totalSteps")
                    } catch (e: Exception) {
                        Log.e("WolvePack", "Sync failed: ${e.message}")
                    }
                }
            }
        }
    }

    private fun scheduleBackgroundSync() {
        // Schedule daily sync at 11:59 PM
        val syncWork = PeriodicWorkRequestBuilder<BackgroundSyncWorker>(
            1, TimeUnit.DAYS
        ).build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "wolvepack_daily_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncWork
        )

        Log.d("WolvePack", "Background sync scheduled")
    }

    private fun updateUI(steps: Int) {
        // Update UI with current step count
        findViewById<android.widget.TextView>(R.id.stepCountText)?.text = 
            steps.toString()
        
        // Update progress bar (10,000 step goal)
        val progress = (steps / 10000f * 100).toInt().coerceAtMost(100)
        findViewById<android.widget.ProgressBar>(R.id.stepProgress)?.progress = progress
    }

    private fun showPermissionDeniedDialog() {
        android.app.AlertDialog.Builder(this)
            .setTitle("Samsung Health Required")
            .setMessage("WolvePack needs access to Samsung Health to read your step data.")
            .setPositiveButton("Grant Permission") { _, _ ->
                requestSamsungHealthPermissions()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
    }
}

/**
 * Background sync worker - runs daily to sync steps from Samsung Health to WolvePack
 */
class BackgroundSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return withContext(Dispatchers.IO) {
            try {
                val samsungHealthManager = SamsungHealthManager(applicationContext)
                val wolvepackApiClient = WolvepackApiClient("https://your-backend-url.com/api")
                
                val sharedPref = applicationContext.getSharedPreferences("wolvepack", Context.MODE_PRIVATE)
                val userId = sharedPref.getString("user_id", null) ?: return@withContext Result.retry()
                
                // Read steps for today
                val today = LocalDate.now()
                val steps = samsungHealthManager.readStepCount(today)
                
                // Sync to backend
                if (steps > 0) {
                    wolvepackApiClient.submitSteps(
                        user_id = userId,
                        steps = steps,
                        date = today.toString(),
                        source = "samsung_health_background"
                    )
                }
                
                Log.d("BackgroundSync", "Synced $steps steps for $today")
                Result.success()
            } catch (e: Exception) {
                Log.e("BackgroundSync", "Sync failed: ${e.message}")
                Result.retry()
            }
        }
    }
}
