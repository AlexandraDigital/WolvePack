package com.wolvepack.app

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.LocalDate
import java.time.ZonedDateTime
import android.util.Log
import kotlinx.coroutines.*

/**
 * Samsung Health Manager - Handles integration with Samsung Health app
 * Uses Google Health Connect API for compatibility
 */
class SamsungHealthManager(private val context: Context) {

    private val healthConnectClient: HealthConnectClient by lazy {
        HealthConnectClient.getOrCreate(context)
    }

    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null

    /**
     * Request necessary health permissions from user
     */
    fun requestPermissions(
        permissionsNeeded: List<String>,
        onPermissionsGranted: () -> Unit,
        onPermissionsDenied: () -> Unit
    ) {
        val hcPermissions = setOf(
            HealthPermission.getReadPermission(StepsRecord::class)
        )

        CoroutineScope(Dispatchers.Default).launch {
            try {
                val grantedPermissions = healthConnectClient.permissionController.getGrantedPermissions(
                    hcPermissions
                )

                if (grantedPermissions.containsAll(hcPermissions)) {
                    withContext(Dispatchers.Main) {
                        onPermissionsGranted()
                    }
                } else {
                    // Request missing permissions
                    val missingPermissions = hcPermissions.minus(grantedPermissions)
                    withContext(Dispatchers.Main) {
                        requestMissingPermissions(missingPermissions, onPermissionsGranted, onPermissionsDenied)
                    }
                }
            } catch (e: Exception) {
                Log.e("SamsungHealthManager", "Permission check failed: ${e.message}")
                withContext(Dispatchers.Main) {
                    onPermissionsDenied()
                }
            }
        }
    }

    private fun requestMissingPermissions(
        permissions: Set<String>,
        onGranted: () -> Unit,
        onDenied: () -> Unit
    ) {
        // Implementation depends on your Activity structure
        // This would typically be handled through ActivityResult contract
        Log.d("SamsungHealthManager", "Requesting permissions: $permissions")
        onGranted() // Placeholder - implement actual permission request
    }

    /**
     * Read step count for a specific date
     */
    suspend fun readStepCount(date: LocalDate): Int {
        return withContext(Dispatchers.IO) {
            try {
                val startTime = ZonedDateTime.of(date.atStartOfDay(), java.time.ZoneId.systemDefault())
                val endTime = startTime.plusDays(1)

                val request = ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )

                val response = healthConnectClient.readRecords(request)
                val totalSteps = response.records.sumOf { it.count }

                Log.d("SamsungHealthManager", "Read $totalSteps steps for $date")
                totalSteps.toInt()
            } catch (e: Exception) {
                Log.e("SamsungHealthManager", "Error reading steps: ${e.message}")
                0
            }
        }
    }

    /**
     * Read step count for a date range
     */
    suspend fun readStepCountRange(startDate: LocalDate, endDate: LocalDate): Map<LocalDate, Int> {
        return withContext(Dispatchers.IO) {
            try {
                val startTime = ZonedDateTime.of(startDate.atStartOfDay(), java.time.ZoneId.systemDefault())
                val endTime = ZonedDateTime.of(endDate.atStartOfDay().plusDays(1), java.time.ZoneId.systemDefault())

                val request = ReadRecordsRequest(
                    recordType = StepsRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )

                val response = healthConnectClient.readRecords(request)
                
                val stepsMap = mutableMapOf<LocalDate, Int>()
                response.records.forEach { record ->
                    val recordDate = record.startTime.toLocalDate()
                    val currentSteps = stepsMap[recordDate] ?: 0
                    stepsMap[recordDate] = currentSteps + record.count.toInt()
                }

                Log.d("SamsungHealthManager", "Read steps for ${stepsMap.size} days")
                stepsMap
            } catch (e: Exception) {
                Log.e("SamsungHealthManager", "Error reading step range: ${e.message}")
                emptyMap()
            }
        }
    }

    /**
     * Check if Samsung Health / Health Connect is installed
     */
    fun isSamsungHealthAvailable(): Boolean {
        return try {
            HealthConnectClient.isAvailable(context)
        } catch (e: Exception) {
            Log.w("SamsungHealthManager", "Health Connect not available: ${e.message}")
            false
        }
    }

    /**
     * Open Samsung Health app
     */
    fun openSamsungHealth() {
        try {
            val intent = Intent("com.samsung.android.app.health.MAIN")
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e("SamsungHealthManager", "Could not open Samsung Health: ${e.message}")
        }
    }
}
