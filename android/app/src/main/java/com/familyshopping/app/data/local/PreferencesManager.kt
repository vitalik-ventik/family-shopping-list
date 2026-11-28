package com.familyshopping.app.data.local

import android.content.Context
import android.content.SharedPreferences
import com.familyshopping.app.data.model.FirebaseConfig
import com.familyshopping.app.data.model.NotificationSchedule
import com.familyshopping.app.data.model.RecentItem
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

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
        private const val KEY_RECENT_ITEMS_JSON = "recent_items_json"
        private const val KEY_APP_LANGUAGE = "app_language"
        private const val KEY_KNOWN_ITEMS_PREFIX = "known_item_ids_"
        private const val KEY_KNOWN_SEEDED_PREFIX = "known_items_seeded_"
        private const val KEY_SHOW_ADDED_BY = "pref_show_added_by"
        private const val KEY_SHOW_TIMESTAMPS = "pref_show_timestamps"
        private const val KEY_THEME_MODE = "pref_theme_mode"
        private const val KEY_COLOR_SCHEME_ID = "pref_color_scheme_id"
        private const val KEY_CATEGORY_BG_ENABLED = "pref_category_bg_enabled"
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

    fun getLanguage(): String {
        val saved = prefs.getString(KEY_APP_LANGUAGE, null)
        if (saved == "uk" || saved == "ru" || saved == "en") return saved
        return when (Locale.getDefault().language) {
            "ru" -> "ru"
            "en" -> "en"
            else -> "uk"
        }
    }

    fun setLanguage(lang: String) {
        val normalized = if (lang == "uk" || lang == "ru" || lang == "en") lang else "uk"
        prefs.edit().putString(KEY_APP_LANGUAGE, normalized).apply()
    }

    fun getShowAddedBy(): Boolean = prefs.getBoolean(KEY_SHOW_ADDED_BY, true)

    fun setShowAddedBy(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SHOW_ADDED_BY, enabled).apply()
    }

    fun getShowTimestamps(): Boolean = prefs.getBoolean(KEY_SHOW_TIMESTAMPS, true)

    fun setShowTimestamps(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_SHOW_TIMESTAMPS, enabled).apply()
    }

    fun getThemeMode(): String {
        val saved = prefs.getString(KEY_THEME_MODE, "system")
        return if (saved == "light" || saved == "dark" || saved == "system") saved else "system"
    }

    fun setThemeMode(mode: String) {
        val normalized = if (mode == "light" || mode == "dark" || mode == "system") mode else "system"
        prefs.edit().putString(KEY_THEME_MODE, normalized).apply()
    }

    fun getColorSchemeId(): String {
        val saved = prefs.getString(KEY_COLOR_SCHEME_ID, "graphite")
        return when (saved) {
            "graphite", "sage", "ocean", "sand", "lavender" -> saved
            else -> "graphite"
        }
    }

    fun setColorSchemeId(schemeId: String) {
        val normalized = when (schemeId) {
            "graphite", "sage", "ocean", "sand", "lavender" -> schemeId
            else -> "graphite"
        }
        prefs.edit().putString(KEY_COLOR_SCHEME_ID, normalized).apply()
    }

    fun getCategoryBackgroundsEnabled(): Boolean = prefs.getBoolean(KEY_CATEGORY_BG_ENABLED, true)

    fun setCategoryBackgroundsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_CATEGORY_BG_ENABLED, enabled).apply()
    }

    fun getKnownItemIds(groupKey: String): Set<String> {
        return prefs.getStringSet("$KEY_KNOWN_ITEMS_PREFIX$groupKey", emptySet())?.toSet() ?: emptySet()
    }

    fun saveKnownItemIds(groupKey: String, ids: Set<String>) {
        // Cap persisted set size while keeping recent IDs safely
        val bounded = if (ids.size > 2000) ids.toList().takeLast(2000).toSet() else ids
        prefs.edit().putStringSet("$KEY_KNOWN_ITEMS_PREFIX$groupKey", bounded).apply()
    }

    fun addKnownItemIds(groupKey: String, ids: Collection<String>) {
        if (ids.isEmpty()) return
        val merged = getKnownItemIds(groupKey).toMutableSet()
        merged.addAll(ids)
        saveKnownItemIds(groupKey, merged)
    }

    fun hasKnownItemsSeeded(groupKey: String): Boolean {
        return prefs.getBoolean("$KEY_KNOWN_SEEDED_PREFIX$groupKey", false)
    }

    fun markKnownItemsSeeded(groupKey: String) {
        prefs.edit().putBoolean("$KEY_KNOWN_SEEDED_PREFIX$groupKey", true).apply()
    }

    fun getRecentItems(): List<RecentItem> {
        val raw = prefs.getString(KEY_RECENT_ITEMS_JSON, null)
        if (raw.isNullOrBlank()) {
            return defaultRecentItems()
        }
        return try {
            val array = JSONArray(raw)
            val result = mutableListOf<RecentItem>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val title = obj.optString("title", "").trim()
                if (title.isNotEmpty()) {
                    result.add(
                        RecentItem(
                            title = title,
                            categoryId = obj.optString("categoryId", "cat_produce"),
                            quantity = obj.optInt("quantity", 1),
                            unit = obj.optString("unit", "pcs"),
                            lastUsedAt = obj.optLong("lastUsedAt", System.currentTimeMillis())
                        )
                    )
                }
            }
            result.sortedByDescending { it.lastUsedAt }
        } catch (e: Exception) {
            defaultRecentItems()
        }
    }

    fun saveRecentItems(items: List<RecentItem>) {
        val array = JSONArray()
        items.sortedByDescending { it.lastUsedAt }.take(500).forEach { item ->
            val obj = JSONObject().apply {
                put("title", item.title)
                put("categoryId", item.categoryId)
                put("quantity", item.quantity)
                put("unit", item.unit)
                put("lastUsedAt", item.lastUsedAt)
            }
            array.put(obj)
        }
        prefs.edit().putString(KEY_RECENT_ITEMS_JSON, array.toString()).apply()
    }

    fun recordRecentItem(entry: RecentItem): List<RecentItem> {
        val cleanTitle = entry.title.trim()
        if (cleanTitle.isEmpty()) return getRecentItems()
        val key = cleanTitle.lowercase(Locale.getDefault())
        val updated = (listOf(entry.copy(title = cleanTitle)) +
            getRecentItems().filter { it.title.trim().lowercase(Locale.getDefault()) != key })
            .sortedByDescending { it.lastUsedAt }
            .take(500)
        saveRecentItems(updated)
        return updated
    }

    private fun defaultRecentItems(): List<RecentItem> {
        return when (getLanguage()) {
            "en" -> listOf(
                RecentItem("Whole Milk", "cat_dairy", 1, "L"),
                RecentItem("Bread", "cat_bakery", 1, "loaf"),
                RecentItem("Eggs", "cat_dairy", 12, "pcs"),
                RecentItem("Bananas", "cat_produce", 1, "bunch"),
                RecentItem("Tomatoes", "cat_produce", 1, "kg")
            )
            "ru" -> listOf(
                RecentItem("Молоко 2.5%", "cat_dairy", 1, "л"),
                RecentItem("Хлеб", "cat_bakery", 1, "шт"),
                RecentItem("Яйца", "cat_dairy", 1, "дес"),
                RecentItem("Бананы", "cat_produce", 1, "кг"),
                RecentItem("Помидоры", "cat_produce", 1, "кг")
            )
            else -> listOf(
                RecentItem("Молоко 2.5%", "cat_dairy", 1, "л"),
                RecentItem("Хліб", "cat_bakery", 1, "шт"),
                RecentItem("Яйця", "cat_dairy", 1, "дес"),
                RecentItem("Банани", "cat_produce", 1, "кг"),
                RecentItem("Помідори", "cat_produce", 1, "кг")
            )
        }
    }
}
