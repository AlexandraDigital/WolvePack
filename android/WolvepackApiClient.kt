package com.wolvepack.app

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * WolvePack API Client - Communicates with WolvePack backend
 * Handles all API requests for syncing step data
 */
class WolvepackApiClient(private val baseUrl: String) {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    /**
     * Health check - verify backend connectivity
     */
    suspend fun healthCheck(): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/health")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()
            return@withContext response.isSuccessful
        } catch (e: Exception) {
            Log.e("WolvepackApiClient", "Health check failed: ${e.message}")
            false
        }
    }

    /**
     * Create or get user
     */
    suspend fun createUser(username: String, email: String? = null): String = 
        withContext(Dispatchers.IO) {
            try {
                val jsonBody = JSONObject().apply {
                    put("username", username)
                    if (email != null) put("email", email)
                }.toString()

                val request = Request.Builder()
                    .url("$baseUrl/users")
                    .post(jsonBody.toRequestBody(jsonMediaType))
                    .build()

                val response = httpClient.newCall(request).execute()
                
                if (response.isSuccessful) {
                    val responseBody = response.body?.string() ?: ""
                    val json = JSONObject(responseBody)
                    val userId = json.optString("id", "")
                    Log.d("WolvepackApiClient", "User created: $userId")
                    userId
                } else {
                    Log.e("WolvepackApiClient", "Create user failed: ${response.code}")
                    ""
                }
            } catch (e: Exception) {
                Log.e("WolvepackApiClient", "Create user error: ${e.message}")
                ""
            }
        }

    /**
     * Submit step data
     */
    suspend fun submitSteps(
        user_id: String,
        steps: Int,
        date: String,
        source: String = "mobile"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val jsonBody = JSONObject().apply {
                put("user_id", user_id)
                put("steps", steps)
                put("date", date)
                put("source", source)
            }.toString()

            val request = Request.Builder()
                .url("$baseUrl/steps")
                .post(jsonBody.toRequestBody(jsonMediaType))
                .build()

            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful) {
                Log.d("WolvepackApiClient", "Steps submitted: $steps for $date")
                true
            } else {
                Log.e("WolvepackApiClient", "Submit steps failed: ${response.code}")
                false
            }
        } catch (e: Exception) {
            Log.e("WolvepackApiClient", "Submit steps error: ${e.message}")
            false
        }
    }

    /**
     * Get today's step count from backend
     */
    suspend fun getTodaySteps(userId: String): Int = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/steps/$userId/today")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: "{}"
                val json = JSONObject(responseBody)
                val steps = json.optInt("steps", 0)
                Log.d("WolvepackApiClient", "Retrieved today's steps: $steps")
                steps
            } else {
                Log.e("WolvepackApiClient", "Get today's steps failed: ${response.code}")
                0
            }
        } catch (e: Exception) {
            Log.e("WolvepackApiClient", "Get today's steps error: ${e.message}")
            0
        }
    }

    /**
     * Get user stats
     */
    suspend fun getUserStats(userId: String): UserStats = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/stats/$userId")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: "{}"
                val json = JSONObject(responseBody)
                
                UserStats(
                    totalSteps = json.optLong("total_steps", 0).toInt(),
                    daysTracked = json.optInt("days_tracked", 0),
                    avgSteps = json.optDouble("avg_steps", 0.0).toInt(),
                    maxSteps = json.optInt("max_steps", 0),
                    minSteps = json.optInt("min_steps", 0)
                )
            } else {
                Log.e("WolvepackApiClient", "Get stats failed: ${response.code}")
                UserStats()
            }
        } catch (e: Exception) {
            Log.e("WolvepackApiClient", "Get stats error: ${e.message}")
            UserStats()
        }
    }

    /**
     * Get sync status
     */
    suspend fun getSyncStatus(userId: String): SyncStatus = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/sync/$userId")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()
            
            if (response.isSuccessful) {
                val responseBody = response.body?.string() ?: "{}"
                val json = JSONObject(responseBody)
                
                SyncStatus(
                    isSynced = json.optBoolean("is_synced", false),
                    lastSync = json.optString("last_sync", "Never")
                )
            } else {
                SyncStatus(false, "Never")
            }
        } catch (e: Exception) {
            Log.e("WolvepackApiClient", "Get sync status error: ${e.message}")
            SyncStatus(false, "Error")
        }
    }
}

/**
 * Data classes for API responses
 */
data class UserStats(
    val totalSteps: Int = 0,
    val daysTracked: Int = 0,
    val avgSteps: Int = 0,
    val maxSteps: Int = 0,
    val minSteps: Int = 0
)

data class SyncStatus(
    val isSynced: Boolean = false,
    val lastSync: String = "Never"
)
