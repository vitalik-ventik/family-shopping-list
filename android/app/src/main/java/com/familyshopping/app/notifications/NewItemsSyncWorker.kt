package com.familyshopping.app.notifications

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.ShoppingItem
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Source
import kotlinx.coroutines.tasks.await

/**
 * Periodic WorkManager job that checks Firestore for newly added uncompleted items
 * while the app is closed or backgrounded and triggers an Android notification.
 */
class NewItemsSyncWorker(
    private val context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        const val TAG = "NewItemsSyncWorker"
        const val UNIQUE_WORK_NAME = "family_cart_new_items_sync"
    }

    override suspend fun doWork(): Result {
        val prefs = PreferencesManager(context)
        val config = prefs.getFirebaseConfig()

        val apiKey = config.apiKey.trim()
        val projectId = config.projectId.trim()
        val appId = config.appId.trim()
        val groupId = config.groupId.trim().ifBlank { "my-family" }

        if (!config.isConfigured || apiKey.isBlank() || projectId.isBlank() || appId.isBlank()) {
            return Result.success()
        }

        return try {
            val appName = "app_${projectId}_$groupId"
            val app = try {
                FirebaseApp.getInstance(appName)
            } catch (_: IllegalStateException) {
                val optionsBuilder = FirebaseOptions.Builder()
                    .setApiKey(apiKey)
                    .setProjectId(projectId)
                    .setApplicationId(appId)
                if (config.storageBucket.isNotBlank()) {
                    optionsBuilder.setStorageBucket(config.storageBucket.trim())
                }
                if (config.messagingSenderId.isNotBlank()) {
                    optionsBuilder.setGcmSenderId(config.messagingSenderId.trim())
                }
                FirebaseApp.initializeApp(context, optionsBuilder.build(), appName)
            }

            val firestore = FirebaseFirestore.getInstance(app)
            val snapshot = firestore.collection("family_groups")
                .document(groupId)
                .collection("items")
                .get(Source.SERVER)
                .await()

            val items = snapshot.documents.mapNotNull { it.toShoppingItemBasic() }
            val groupKey = "${projectId}_$groupId"
            val allIds = items.map { it.id }.toSet()

            if (!prefs.hasKnownItemsSeeded(groupKey)) {
                prefs.saveKnownItemIds(groupKey, allIds)
                prefs.markKnownItemsSeeded(groupKey)
                return Result.success()
            }

            val knownIds = prefs.getKnownItemIds(groupKey)
            val brandNewPending = items.filter {
                !it.completed && !it.cancelled && it.id !in knownIds
            }

            if (brandNewPending.isNotEmpty()) {
                Log.d(TAG, "Background sync found ${brandNewPending.size} new item(s)")
                ShoppingNotifier.showNewItemsNotification(context, brandNewPending)
            }

            prefs.addKnownItemIds(groupKey, allIds)
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Background new-items sync failed", e)
            Result.retry()
        }
    }

    private fun DocumentSnapshot.toShoppingItemBasic(): ShoppingItem? {
        val title = getString("title")?.trim()
        if (title.isNullOrEmpty()) return null
        return ShoppingItem(
            id = id,
            title = title,
            categoryId = getString("categoryId") ?: "cat_produce",
            quantity = (get("quantity") as? Number)?.toInt() ?: 1,
            unit = getString("unit") ?: "pcs",
            note = getString("note"),
            completed = getBoolean("completed") ?: false,
            completedAt = (get("completedAt") as? Number)?.toLong(),
            cancelled = getBoolean("cancelled") ?: false,
            cancelledAt = (get("cancelledAt") as? Number)?.toLong(),
            createdAt = (get("createdAt") as? Number)?.toLong() ?: 0L,
            addedBy = getString("addedBy"),
            urgent = getBoolean("urgent") ?: false,
            estimatedPrice = (get("estimatedPrice") as? Number)?.toDouble()
        )
    }
}
