package com.familyshopping.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.familyshopping.app.MainActivity
import com.familyshopping.app.R
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * Background worker triggered by Android WorkManager at scheduled times (e.g. 17:30).
 * Checks the dynamic Firestore database for uncompleted items in specific monitored categories.
 *
 * CRITICAL RULE:
 * Only shows a notification if there are uncompleted items in the selected categories.
 * If all items are checked off or the categories are empty, NO notification is sent.
 */
class ShoppingReminderWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        const val TAG = "ShoppingReminderWorker"
        const val CHANNEL_ID = "shopping_reminders_channel"
        const val CHANNEL_NAME = "Shopping List Reminders"
        const val KEY_SCHEDULE_ID = "schedule_id"
        const val KEY_SCHEDULE_TITLE = "schedule_title"
        const val KEY_CATEGORY_IDS = "category_ids"
    }

    override suspend fun doWork(): Result {
        val scheduleId = inputData.getString(KEY_SCHEDULE_ID) ?: "default_schedule"
        val scheduleTitle = inputData.getString(KEY_SCHEDULE_TITLE) ?: "Shopping Reminder"
        val categoryIdsArray = inputData.getStringArray(KEY_CATEGORY_IDS) ?: emptyArray()
        val monitoredCategoryIds = categoryIdsArray.toSet()

        Log.d(TAG, "Executing WorkManager reminder for: $scheduleTitle. Monitored categories: $monitoredCategoryIds")

        // 1. Retrieve dynamic Firebase configuration from SharedPreferences
        val prefs = context.getSharedPreferences("family_shopping_prefs", Context.MODE_PRIVATE)
        val apiKey = prefs.getString("firebase_api_key", "") ?: ""
        val projectId = prefs.getString("firebase_project_id", "") ?: ""
        val appId = prefs.getString("firebase_app_id", "") ?: ""
        val groupId = prefs.getString("firebase_group_id", "default-family") ?: "default-family"

        if (apiKey.isBlank() || projectId.isBlank() || appId.isBlank()) {
            Log.w(TAG, "Firebase credentials not configured yet in Settings. Skipping background check.")
            return Result.success()
        }

        try {
            // 2. Ensure dynamic FirebaseApp instance is initialized for this group
            val appName = "family_sync_${projectId}_${groupId}"
            val firebaseApp = try {
                FirebaseApp.getInstance(appName)
            } catch (e: IllegalStateException) {
                val options = FirebaseOptions.Builder()
                    .setApiKey(apiKey)
                    .setProjectId(projectId)
                    .setApplicationId(appId)
                    .build()
                FirebaseApp.initializeApp(context, options, appName)
            }

            val firestore = FirebaseFirestore.getInstance(firebaseApp)

            // 3. Query uncompleted items in the group
            val itemsSnapshot = firestore.collection("family_groups")
                .document(groupId)
                .collection("items")
                .whereEqualTo("completed", false)
                .get()
                .await()

            // 4. Filter uncompleted (and non-cancelled) items by the monitored categories
            val matchingItems = itemsSnapshot.documents.mapNotNull { doc ->
                if (doc.getBoolean("cancelled") == true) return@mapNotNull null
                val title = doc.getString("title") ?: return@mapNotNull null
                val catId = doc.getString("categoryId") ?: ""
                val quantity = doc.getDouble("quantity")?.toInt() ?: 1
                val unit = doc.getString("unit") ?: ""
                if (monitoredCategoryIds.isEmpty() || monitoredCategoryIds.contains(catId)) {
                    "$title (${quantity}${if (unit.isNotBlank()) " $unit" else ""})"
                } else {
                    null
                }
            }

            // 5. SMART RULE ENFORCEMENT:
            // "Only shows a notification if there are uncompleted items in the selected categories.
            // If those categories are empty, no notification should be sent."
            if (matchingItems.isEmpty()) {
                Log.d(TAG, "Rule Check Passed: No uncompleted items found in monitored categories. Notification suppressed.")
                return Result.success()
            }

            Log.d(TAG, "Found ${matchingItems.size} uncompleted items! Triggering notification.")
            showNotification(scheduleTitle, matchingItems)

            return Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error executing background shopping check", e)
            return Result.retry()
        }
    }

    private fun showNotification(scheduleTitle: String, pendingItemNames: List<String>) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create Notification Channel for Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Smart reminders for pending family shopping items"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Tap action opens MainActivity
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val count = pendingItemNames.size
        val contentTitle = "$scheduleTitle ($count item${if (count > 1) "s" else ""} needed)"
        val summaryText = pendingItemNames.take(4).joinToString(", ") +
                if (count > 4) " and ${count - 4} more..." else ""

        // Inbox style for expandable notification
        val inboxStyle = NotificationCompat.InboxStyle()
            .setBigContentTitle(contentTitle)
        pendingItemNames.take(6).forEach { inboxStyle.addLine("• $it") }
        if (count > 6) {
            inboxStyle.setSummaryText("+${count - 6} more uncompleted items")
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_shopping)
            .setContentTitle(contentTitle)
            .setContentText(summaryText)
            .setStyle(inboxStyle)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val notificationId = (System.currentTimeMillis() % 10000).toInt()
        notificationManager.notify(notificationId, notification)
    }
}
