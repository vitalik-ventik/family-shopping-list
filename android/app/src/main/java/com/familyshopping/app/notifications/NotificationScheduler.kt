package com.familyshopping.app.notifications

import android.content.Context
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.familyshopping.app.data.model.NotificationSchedule
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Manages WorkManager jobs for scheduled category notifications.
 */
object NotificationScheduler {

    fun scheduleReminder(context: Context, schedule: NotificationSchedule) {
        val workManager = WorkManager.getInstance(context)
        val uniqueWorkName = "shopping_reminder_${schedule.id}"

        if (!schedule.active) {
            workManager.cancelUniqueWork(uniqueWorkName)
            return
        }

        val timeParts = schedule.time.split(":")
        val targetHour = timeParts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 17
        val targetMinute = timeParts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 30

        val initialDelayMinutes = calculateInitialDelay(targetHour, targetMinute)

        val inputData = Data.Builder()
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_ID, schedule.id)
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_TITLE, schedule.title)
            .putStringArray(ShoppingReminderWorker.KEY_CATEGORY_IDS, schedule.categoryIds.toTypedArray())
            .build()

        val workRequest = PeriodicWorkRequestBuilder<ShoppingReminderWorker>(
            24, TimeUnit.HOURS,
            15, TimeUnit.MINUTES
        )
            .setInitialDelay(initialDelayMinutes, TimeUnit.MINUTES)
            .setInputData(inputData)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        workManager.enqueueUniquePeriodicWork(
            uniqueWorkName,
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }

    fun runImmediateCheck(context: Context, schedule: NotificationSchedule) {
        val inputData = Data.Builder()
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_ID, schedule.id)
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_TITLE, schedule.title)
            .putStringArray(ShoppingReminderWorker.KEY_CATEGORY_IDS, schedule.categoryIds.toTypedArray())
            .build()

        val request = OneTimeWorkRequestBuilder<ShoppingReminderWorker>()
            .setInputData(inputData)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }

    fun cancelReminder(context: Context, scheduleId: String) {
        WorkManager.getInstance(context).cancelUniqueWork("shopping_reminder_$scheduleId")
    }

    private fun calculateInitialDelay(targetHour: Int, targetMinute: Int): Long {
        val now = Calendar.getInstance()
        val target = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, targetHour)
            set(Calendar.MINUTE, targetMinute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        if (target.before(now)) {
            target.add(Calendar.DAY_OF_YEAR, 1)
        }

        val diffMillis = target.timeInMillis - now.timeInMillis
        return TimeUnit.MILLISECONDS.toMinutes(diffMillis).coerceAtLeast(1)
    }
}
