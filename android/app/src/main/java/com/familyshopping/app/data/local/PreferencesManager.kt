package com.familyshopping.app.data.local

import android.content.Context
import android.content.SharedPreferences
import com.familyshopping.app.data.model.FirebaseConfig
import com.familyshopping.app.data.model.NotificationSchedule
import org.json.JSONArray
import org.json.JSONObject

/**
 * Stores and retrieves dynamic Firebase parameters, isolation Group ID,
 * and local notification schedules using Android SharedPreferences.
 */
class PreferencesManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("family_shopping_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_API_KEY = "firebase_api_key"
        private const val KEY_PROJECT_ID = "firebase_project_id"
        private const val KEY_APP_ID = "firebase_app_id"
        private const val KEY_STORAGE_BUCKET = "firebase_storage_bucket"
        private const val KEY_SENDER_ID = "firebase_sender_id"
        private const val KEY_GROUP_ID = "firebase_group_id"
        private const val KEY_IS_CONFIGURED = "firebase_is_configured"
        private const val KEY_USER_NAME = "user_display_name"
        private const val KEY_SCHEDULES_JSON = "notification_schedules_json"
    }

    fun saveFirebaseConfig(config: FirebaseConfig) {
        prefs.edit().apply {
            putString(KEY_API_KEY, config.apiKey)
            putString(KEY_PROJECT_ID, config.projectId)
            putString(KEY_APP_ID, config.appId)
            putString(KEY_STORAGE_BUCKET, config.storageBucket)
            putString(KEY_SENDER_ID, config.messagingSenderId)
            putString(KEY_GROUP_ID, config.groupId.ifBlank { "default-family" })
            putBoolean(
                KEY_IS_CONFIGURED,
                config.apiKey.isNotBlank() && config.projectId.isNotBlank() && config.appId.isNotBlank()
            )
            apply()
        }
    }

    fun getFirebaseConfig(): FirebaseConfig {
        val apiKey = prefs.getString(KEY_API_KEY, "") ?: ""
        val projectId = prefs.getString(KEY_PROJECT_ID, "") ?: ""
        val appId = prefs.getString(KEY_APP_ID, "") ?: ""
        val storageBucket = prefs.getString(KEY_STORAGE_BUCKET, "") ?: ""
        val senderId = prefs.getString(KEY_SENDER_ID, "") ?: ""
        val groupId = prefs.getString(KEY_GROUP_ID, "default-family") ?: "default-family"
        val isConfigured = prefs.getBoolean(KEY_IS_CONFIGURED, false)

        return FirebaseConfig(
            apiKey = apiKey,
            projectId = projectId,
            appId = appId,
            storageBucket = storageBucket,
            messagingSenderId = senderId,
            groupId = groupId,
            isConfigured = isConfigured
        )
    }

    fun saveSchedules(schedules: List<NotificationSchedule>) {
        val array = JSONArray()
        schedules.forEach { schedule ->
            val obj = JSONObject().apply {
                put("id", schedule.id)
                put("title", schedule.title)
                put("time", schedule.time)
                put("active", schedule.active)
                put("daysOfWeek", JSONArray(schedule.daysOfWeek))
                put("categoryIds", JSONArray(schedule.categoryIds))
            }
            array.put(obj)
        }
        prefs.edit().putString(KEY_SCHEDULES_JSON, array.toString()).apply()
    }

    fun getSchedules(): List<NotificationSchedule> {
        val raw = prefs.getString(KEY_SCHEDULES_JSON, null)
        if (raw.isNullOrBlank()) {
            return defaultSchedules()
        }
        return try {
            val array = JSONArray(raw)
            val result = mutableListOf<NotificationSchedule>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val daysArr = obj.optJSONArray("daysOfWeek") ?: JSONArray()
                val days = (0 until daysArr.length()).map { daysArr.getInt(it) }
                val catsArr = obj.optJSONArray("categoryIds") ?: JSONArray()
                val cats = (0 until catsArr.length()).map { catsArr.getString(it) }

                result.add(
                    NotificationSchedule(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        time = obj.optString("time", "17:30"),
                        daysOfWeek = days,
                        categoryIds = cats,
                        active = obj.optBoolean("active", true)
                    )
                )
            }
            result
        } catch (e: Exception) {
            defaultSchedules()
        }
    }

    private fun defaultSchedules(): List<NotificationSchedule> = listOf(
        NotificationSchedule(
            id = "sched_evening",
            title = "Вечірня перевірка продуктів / Evening Groceries",
            time = "17:30",
            daysOfWeek = listOf(1, 2, 3, 4, 5),
            categoryIds = listOf("cat_produce", "cat_dairy", "cat_bakery"),
            active = false
        ),
        NotificationSchedule(
            id = "sched_friday_household",
            title = "Побутова хімія на вихідні / Weekend Household",
            time = "16:00",
            daysOfWeek = listOf(5),
            categoryIds = listOf("cat_household", "cat_personal"),
            active = false
        )
    )

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Android") ?: "Android"

    fun setUserName(name: String) {
        prefs.edit().putString(KEY_USER_NAME, name).apply()
    }
}
