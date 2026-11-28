package com.familyshopping.app.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.familyshopping.app.MainActivity
import com.familyshopping.app.R
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.ui.AppStrings

object ShoppingNotifier {
    const val CHANNEL_ID = "shopping_updates_channel"
    private const val CHANNEL_NAME = "FamilyCart Updates"

    fun showNewItemsNotification(context: Context, newItems: List<ShoppingItem>) {
        if (newItems.isEmpty()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Instant notifications when family members add shopping items"
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val lang = PreferencesManager(context).getLanguage()

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            2001,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val formattedLines = newItems.map { item ->
            val qtyPart = if (item.quantity > 1 || (item.unit.isNotBlank() && item.unit != "pcs")) {
                " (${item.quantity} ${item.unit})".trimEnd()
            } else {
                ""
            }
            val urgentMark = if (item.urgent) "!" else ""
            val addedByPart = item.addedBy?.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""
            "$urgentMark${if (urgentMark.isNotEmpty()) " " else ""}${item.title}$qtyPart$addedByPart"
        }

        val title = if (newItems.size == 1) {
            AppStrings.newItemNotificationTitleSingle(lang, newItems.first().title)
        } else {
            AppStrings.newItemNotificationTitleMultiple(lang, newItems.size)
        }

        val summaryText = formattedLines.take(3).joinToString(", ") +
            if (formattedLines.size > 3) " " + AppStrings.newItemNotificationMore(lang, formattedLines.size - 3) else ""

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_shopping)
            .setContentTitle(title)
            .setContentText(summaryText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)

        if (formattedLines.size > 1) {
            val inbox = NotificationCompat.InboxStyle().setBigContentTitle(title)
            formattedLines.take(6).forEach { inbox.addLine("• $it") }
            if (formattedLines.size > 6) {
                inbox.setSummaryText(AppStrings.newItemNotificationMore(lang, formattedLines.size - 6))
            }
            builder.setStyle(inbox)
        }

        val notificationId = 4000 + ((System.currentTimeMillis() % 5000).toInt())
        notificationManager.notify(notificationId, builder.build())
    }
}
