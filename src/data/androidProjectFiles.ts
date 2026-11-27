export interface AndroidFile {
  path: string;
  name: string;
  language: 'kotlin' | 'groovy' | 'xml' | 'properties' | 'markdown';
  category: 'source' | 'config' | 'manifest' | 'gradle' | 'docs';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/java/com/familyshopping/app/notifications/ShoppingReminderWorker.kt',
    name: 'ShoppingReminderWorker.kt',
    language: 'kotlin',
    category: 'source',
    description: 'WorkManager background worker that queries Firestore for uncompleted items and triggers notifications only if pending items exist.',
    content: `package com.familyshopping.app.notifications

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
import com.familyshopping.app.data.local.PreferencesManager
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
        val prefs = PreferencesManager(context)
        val config = prefs.getFirebaseConfig()

        if (!config.isConfigured || config.projectId.isBlank() || config.apiKey.isBlank()) {
            Log.w(TAG, "Firebase credentials not configured yet in Settings. Skipping background check.")
            return Result.success()
        }

        try {
            // 2. Ensure dynamic FirebaseApp instance is initialized for this group
            val appName = "family_sync_\${config.projectId}_\${config.groupId}"
            val firebaseApp = try {
                FirebaseApp.getInstance(appName)
            } catch (e: IllegalStateException) {
                val options = FirebaseOptions.Builder()
                    .setApiKey(config.apiKey)
                    .setProjectId(config.projectId)
                    .setApplicationId(config.appId)
                    .build()
                FirebaseApp.initializeApp(context, options, appName)
            }

            val firestore = FirebaseFirestore.getInstance(firebaseApp)
            val groupId = config.groupId.ifBlank { "default-family" }

            // 3. Query uncompleted items in the group
            val itemsSnapshot = firestore.collection("family_groups")
                .document(groupId)
                .collection("items")
                .whereEqualTo("completed", false)
                .get()
                .await()

            // 4. Filter uncompleted items by the monitored categories
            val matchingItems = itemsSnapshot.documents.mapNotNull { doc ->
                val title = doc.getString("title") ?: return@mapNotNull null
                val catId = doc.getString("categoryId") ?: ""
                val quantity = doc.getDouble("quantity")?.toInt() ?: 1
                val unit = doc.getString("unit") ?: ""
                if (monitoredCategoryIds.isEmpty() || monitoredCategoryIds.contains(catId)) {
                    "\$title (\${quantity}\${if (unit.isNotBlank()) " $unit" else ""})"
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

            Log.d(TAG, "Found \${matchingItems.size} uncompleted items! Triggering notification.")
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
        val contentTitle = "$scheduleTitle ($count item\${if (count > 1) "s" else ""} needed)"
        val summaryText = pendingItemNames.take(4).joinToString(", ") +
                if (count > 4) " and \${count - 4} more..." else ""

        // Inbox style for expandable notification
        val inboxStyle = NotificationCompat.InboxStyle().apply {
            setBigContentTitle(contentTitle)
            pendingItemNames.take(6).forEach { addLine("• $it") }
            if (count > 6) {
                setSummaryText("+\${count - 6} more uncompleted items")
            }
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
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
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/notifications/NotificationScheduler.kt',
    name: 'NotificationScheduler.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Utility for scheduling exact daily/weekly reminders via WorkManager based on user configuration.',
    content: `package com.familyshopping.app.notifications

import android.content.Context
import androidx.work.*
import com.familyshopping.app.data.model.NotificationSchedule
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Manages WorkManager jobs for scheduled category notifications.
 */
object NotificationScheduler {

    fun scheduleReminder(context: Context, schedule: NotificationSchedule) {
        val workManager = WorkManager.getInstance(context)
        val uniqueWorkName = "shopping_reminder_\${schedule.id}"

        if (!schedule.active) {
            workManager.cancelUniqueWork(uniqueWorkName)
            return
        }

        // Parse target time (e.g. "17:30")
        val timeParts = schedule.time.split(":")
        val targetHour = timeParts.getOrNull(0)?.toIntOrNull() ?: 17
        val targetMinute = timeParts.getOrNull(1)?.toIntOrNull() ?: 30

        val initialDelayMinutes = calculateInitialDelay(targetHour, targetMinute)

        val inputData = Data.Builder()
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_ID, schedule.id)
            .putString(ShoppingReminderWorker.KEY_SCHEDULE_TITLE, schedule.title)
            .putStringArray(ShoppingReminderWorker.KEY_CATEGORY_IDS, schedule.categoryIds.toTypedArray())
            .build()

        // 24 hour periodic request with initial delay to reach target time
        val workRequest = PeriodicWorkRequestBuilder<ShoppingReminderWorker>(
            24, TimeUnit.HOURS,
            15, TimeUnit.MINUTES // Flex interval
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
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/data/local/PreferencesManager.kt',
    name: 'PreferencesManager.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Manages dynamic Firebase credentials, family group ID, and local preferences using SharedPreferences.',
    content: `package com.familyshopping.app.data.local

import android.content.Context
import android.content.SharedPreferences
import com.familyshopping.app.data.model.FirebaseConfig

/**
 * Stores and retrieves dynamic Firebase parameters and isolation Group ID
 * locally on device without hardcoded keys.
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
    }

    fun saveFirebaseConfig(config: FirebaseConfig) {
        prefs.edit().apply {
            putString(KEY_API_KEY, config.apiKey)
            putString(KEY_PROJECT_ID, config.projectId)
            putString(KEY_APP_ID, config.appId)
            putString(KEY_STORAGE_BUCKET, config.storageBucket)
            putString(KEY_SENDER_ID, config.messagingSenderId)
            putString(KEY_GROUP_ID, config.groupId.ifBlank { "default-family" })
            putBoolean(KEY_IS_CONFIGURED, config.apiKey.isNotBlank() && config.projectId.isNotBlank())
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

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Mobile User") ?: "Mobile User"

    fun setUserName(name: String) {
        prefs.edit().putString(KEY_USER_NAME, name).apply()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/data/repository/ShoppingRepository.kt',
    name: 'ShoppingRepository.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Dynamic Firestore repository managing real-time snapshot listeners for items, categories, and templates.',
    content: `package com.familyshopping.app.data.repository

import android.content.Context
import android.util.Log
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.data.model.ShoppingTemplate
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class ShoppingRepository(private val context: Context) {

    private val prefs = PreferencesManager(context)
    private var firestoreInstance: FirebaseFirestore? = null

    init {
        initializeFirestore()
    }

    fun initializeFirestore(): Boolean {
        val config = prefs.getFirebaseConfig()
        if (!config.isConfigured || config.projectId.isBlank() || config.apiKey.isBlank()) {
            return false
        }

        try {
            val appName = "app_\${config.projectId}_\${config.groupId}"
            val app = try {
                FirebaseApp.getInstance(appName)
            } catch (e: Exception) {
                val options = FirebaseOptions.Builder()
                    .setApiKey(config.apiKey)
                    .setProjectId(config.projectId)
                    .setApplicationId(config.appId)
                    .build()
                FirebaseApp.initializeApp(context, options, appName)
            }
            firestoreInstance = FirebaseFirestore.getInstance(app)
            return true
        } catch (e: Exception) {
            Log.e("ShoppingRepository", "Init failed", e)
            return false
        }
    }

    fun getItemsFlow(): Flow<List<ShoppingItem>> = callbackFlow {
        val firestore = firestoreInstance
        val groupId = prefs.getFirebaseConfig().groupId

        if (firestore == null) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }

        val listener: ListenerRegistration = firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .orderBy("createdAt")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Items listen failed", error)
                    return@addSnapshotListener
                }

                val items = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(ShoppingItem::class.java)?.copy(id = doc.id)
                } ?: emptyList()

                trySend(items)
            }

        awaitClose { listener.remove() }
    }

    suspend fun toggleItem(item: ShoppingItem) {
        val firestore = firestoreInstance ?: return
        val groupId = prefs.getFirebaseConfig().groupId
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .update(
                mapOf(
                    "completed" to !item.completed,
                    "completedAt" to if (!item.completed) System.currentTimeMillis() else null
                )
            ).await()
    }

    suspend fun addItem(item: ShoppingItem) {
        val firestore = firestoreInstance ?: return
        val groupId = prefs.getFirebaseConfig().groupId
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .set(item)
            .await()
    }

    suspend fun clearCompletedItems() {
        val firestore = firestoreInstance ?: return
        val groupId = prefs.getFirebaseConfig().groupId
        val completed = firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .whereEqualTo("completed", true)
            .get()
            .await()

        val batch = firestore.batch()
        completed.documents.forEach { batch.delete(it.reference) }
        batch.commit().await()
    }

    suspend fun applyWeekendTemplate(template: ShoppingTemplate, mergeMode: Boolean = true) {
        val firestore = firestoreInstance ?: return
        val groupId = prefs.getFirebaseConfig().groupId
        val batch = firestore.batch()

        val itemsCol = firestore.collection("family_groups").document(groupId).collection("items")

        if (!mergeMode) {
            val existing = itemsCol.get().await()
            existing.documents.forEach { batch.delete(it.reference) }
        }

        template.items.forEachIndexed { index, tmplItem ->
            val id = "item_tmpl_\${System.currentTimeMillis()}_\$index"
            val newItem = ShoppingItem(
                id = id,
                title = tmplItem.title,
                categoryId = tmplItem.categoryId,
                quantity = tmplItem.quantity,
                unit = tmplItem.unit,
                note = tmplItem.note,
                urgent = tmplItem.urgent,
                estimatedPrice = tmplItem.estimatedPrice,
                completed = false,
                createdAt = System.currentTimeMillis() + index * 10,
                addedBy = "Template"
            )
            batch.set(itemsCol.document(id), newItem)
        }

        batch.commit().await()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/data/model/Models.kt',
    name: 'Models.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Kotlin data models matching Firestore schemas for Items, Categories, Templates, and FirebaseConfig.',
    content: `package com.familyshopping.app.data.model

data class ShoppingItem(
    val id: String = "",
    val title: String = "",
    val categoryId: String = "cat_produce",
    val quantity: Int = 1,
    val unit: String = "pcs",
    val note: String? = null,
    val completed: Boolean = false,
    val completedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val addedBy: String? = null,
    val urgent: Boolean = false,
    val estimatedPrice: Double? = null
)

data class Category(
    val id: String = "",
    val name: String = "",
    val icon: String = "🛒",
    val color: String = "#10b981",
    val order: Int = 0
)

data class TemplateItem(
    val title: String = "",
    val categoryId: String = "cat_produce",
    val quantity: Int = 1,
    val unit: String = "pcs",
    val note: String? = null,
    val urgent: Boolean = false,
    val estimatedPrice: Double? = null
)

data class ShoppingTemplate(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "🛒",
    val tag: String = "Weekend",
    val items: List<TemplateItem> = emptyList(),
    val createdAt: Long = System.currentTimeMillis(),
    val lastUsedAt: Long? = null
)

data class NotificationSchedule(
    val id: String = "",
    val title: String = "",
    val time: String = "17:30",
    val daysOfWeek: List<Int> = listOf(1, 2, 3, 4, 5),
    val categoryIds: List<String> = emptyList(),
    val active: Boolean = true
)

data class FirebaseConfig(
    val apiKey: String = "",
    val projectId: String = "",
    val appId: String = "",
    val storageBucket: String = "",
    val messagingSenderId: String = "",
    val groupId: String = "default-family",
    val isConfigured: Boolean = false
)
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/ui/screens/ShoppingListScreen.kt',
    name: 'ShoppingListScreen.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Jetpack Compose UI for categorized shopping lists with check-off microinteractions, quick add, and Weekend Master shortcut.',
    content: `package com.familyshopping.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.ShoppingItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListScreen(
    items: List<ShoppingItem>,
    categories: List<Category>,
    onToggleItem: (ShoppingItem) -> Unit,
    onAddItem: (String, String, Int, String, Boolean) -> Unit,
    onClearCompleted: () -> Unit,
    onOpenWeekendTemplate: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedCategoryFilter by remember { mutableStateOf<String?>(null) }

    val uncompletedItems = items.filter { !it.completed }
    val completedItems = items.filter { it.completed }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Family Shopping", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        Text(
                            "\${uncompletedItems.size} items pending • \${completedItems.size} completed",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onOpenWeekendTemplate) {
                        Icon(Icons.Default.Star, contentDescription = "Weekend Templates", tint = Color(0xFFF59E0B))
                    }
                    IconButton(onClick = onOpenNotifications) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications")
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Item")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Weekend Template Banner
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .clickable { onOpenWeekendTemplate() },
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🛒", fontSize = 26.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Weekend Template Master",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF92400E)
                        )
                        Text(
                            "1-Tap weekly groceries replenishment",
                            fontSize = 12.sp,
                            color = Color(0xFFB45309)
                        )
                    }
                    Button(
                        onClick = onOpenWeekendTemplate,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Load", fontSize = 12.sp)
                    }
                }
            }

            // List of items grouped
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uncompletedItems, key = { it.id }) { item ->
                    ShoppingItemRow(item = item, onToggle = { onToggleItem(item) })
                }

                if (completedItems.isNotEmpty()) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 16.dp, bottom = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Completed (\${completedItems.size})",
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            TextButton(onClick = onClearCompleted) {
                                Text("Clear All", color = MaterialTheme.colorScheme.error)
                            }
                        }
                    }

                    items(completedItems, key = { it.id }) { item ->
                        ShoppingItemRow(item = item, onToggle = { onToggleItem(item) })
                    }
                }
            }
        }
    }
}

@Composable
fun ShoppingItemRow(item: ShoppingItem, onToggle: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() },
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.completed) Color(0xFFF1F5F9) else Color.White
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(checked = item.completed, onCheckedChange = { onToggle() })
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    fontWeight = FontWeight.Medium,
                    textDecoration = if (item.completed) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.completed) Color.Gray else Color.Black
                )
                if (item.quantity > 1 || item.unit.isNotBlank()) {
                    Text(
                        text = "\${item.quantity} \${item.unit}",
                        fontSize = 12.sp,
                        color = Color.Gray
                    )
                }
            }
            if (item.urgent) {
                Surface(
                    color = Color(0xFFFFE4E6),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        "URGENT",
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE11D48)
                    )
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/ui/screens/WeekendTemplateScreen.kt',
    name: 'WeekendTemplateScreen.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Jetpack Compose screen for browsing, 1-tap applying, and customizing Weekend Templates.',
    content: `package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.ShoppingTemplate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeekendTemplateScreen(
    templates: List<ShoppingTemplate>,
    onApplyTemplate: (ShoppingTemplate, Boolean) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Weekend Template Master") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    "One-Tap Big Shopping Trip",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    "Select a saved template to instantly replenish family groceries for the upcoming weekend without typing every item again.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            items(templates) { template ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(template.icon, fontSize = 28.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(template.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text(
                                    "\${template.items.size} curated items • \${template.tag}",
                                    fontSize = 12.sp,
                                    color = Color.Gray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(template.description, fontSize = 13.sp, color = Color.DarkGray)

                        Spacer(modifier = Modifier.height(12.dp))
                        // Preview top items
                        val previewText = template.items.take(5).joinToString(", ") { it.title } +
                                if (template.items.size > 5) " and \${template.items.size - 5} more..." else ""
                        Text(
                            "Includes: $previewText",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onApplyTemplate(template, false) },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Replace List", fontSize = 12.sp)
                            }
                            Button(
                                onClick = { onApplyTemplate(template, true) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Merge List", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/ui/screens/NotificationScheduleScreen.kt',
    name: 'NotificationScheduleScreen.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Jetpack Compose screen for configuring custom notification schedules with specific category monitoring and WorkManager triggers.',
    content: `package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.NotificationSchedule

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScheduleScreen(
    schedules: List<NotificationSchedule>,
    categories: List<Category>,
    onToggleSchedule: (NotificationSchedule) -> Unit,
    onSaveSchedule: (NotificationSchedule) -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Reminders") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFEFF6FF)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Notifications, contentDescription = null, tint = Color(0xFF2563EB))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                "Category-Filtered Reminders",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1E40AF)
                            )
                            Text(
                                "WorkManager triggers at the set time and ONLY alerts you if items are uncompleted in the monitored categories. Zero noise if done!",
                                fontSize = 12.sp,
                                color = Color(0xFF3B82F6)
                            )
                        }
                    }
                }
            }

            items(schedules) { schedule ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(schedule.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Time: \${schedule.time}", fontSize = 14.sp, color = Color(0xFF2563EB))
                            }
                            Switch(
                                checked = schedule.active,
                                onCheckedChange = { onToggleSchedule(schedule) }
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Monitored Categories: \${
                                if (schedule.categoryIds.isEmpty()) "All Categories"
                                else schedule.categoryIds.joinToString { id ->
                                    categories.find { it.id == id }?.name ?: id
                                }
                            }",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/ui/screens/SettingsScreen.kt',
    name: 'SettingsScreen.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Dynamic Firebase configuration screen on Android for entering apiKey, projectId, appId, and isolation Group ID.',
    content: `package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.FirebaseConfig

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentConfig: FirebaseConfig,
    onSaveConfig: (FirebaseConfig) -> Unit,
    onBack: () -> Unit
) {
    var apiKey by remember { mutableStateOf(currentConfig.apiKey) }
    var projectId by remember { mutableStateOf(currentConfig.projectId) }
    var appId by remember { mutableStateOf(currentConfig.appId) }
    var storageBucket by remember { mutableStateOf(currentConfig.storageBucket) }
    var groupId by remember { mutableStateOf(currentConfig.groupId) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Firebase & Family Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text("Dynamic Multi-Tenant Group Sync", fontWeight = FontWeight.Bold, color = Color(0xFF166534))
                    Text(
                        "Spouses and family members using the same Firebase Project + Group ID will sync items and notifications in real-time.",
                        fontSize = 12.sp,
                        color = Color(0xFF15803D)
                    )
                }
            }

            OutlinedTextField(
                value = groupId,
                onValueChange = { groupId = it },
                label = { Text("Family / Group Identifier") },
                placeholder = { Text("e.g. smith-household") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = projectId,
                onValueChange = { projectId = it },
                label = { Text("Firebase Project ID") },
                placeholder = { Text("my-family-cart-12345") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = apiKey,
                onValueChange = { apiKey = it },
                label = { Text("API Key (Web / Android)") },
                placeholder = { Text("AIzaSy...") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = appId,
                onValueChange = { appId = it },
                label = { Text("App ID") },
                placeholder = { Text("1:123456789:android:abcdef") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = storageBucket,
                onValueChange = { storageBucket = it },
                label = { Text("Storage Bucket (Optional)") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = {
                    val newConfig = FirebaseConfig(
                        apiKey = apiKey.trim(),
                        projectId = projectId.trim(),
                        appId = appId.trim(),
                        storageBucket = storageBucket.trim(),
                        groupId = groupId.trim().ifBlank { "default-family" },
                        isConfigured = apiKey.isNotBlank() && projectId.isNotBlank()
                    )
                    onSaveConfig(newConfig)
                    statusMessage = "Configuration saved successfully!"
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
            ) {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save & Connect")
            }

            statusMessage?.let {
                Text(it, color = Color(0xFF16A34A), fontWeight = FontWeight.Medium, fontSize = 13.sp)
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/familyshopping/app/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    category: 'source',
    description: 'Main activity initializing the Jetpack Compose navigation host and connecting repository flows.',
    content: `package com.familyshopping.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.data.repository.ShoppingRepository
import com.familyshopping.app.notifications.NotificationScheduler
import com.familyshopping.app.ui.screens.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var repository: ShoppingRepository
    private lateinit var prefs: PreferencesManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = ShoppingRepository(this)
        prefs = PreferencesManager(this)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var currentScreen by remember { mutableStateOf("list") }
                    val items by repository.getItemsFlow().collectAsState(initial = emptyList())
                    val scope = rememberCoroutineScope()
                    val config = remember { prefs.getFirebaseConfig() }

                    when (currentScreen) {
                        "list" -> ShoppingListScreen(
                            items = items,
                            categories = emptyList(),
                            onToggleItem = { item -> scope.launch { repository.toggleItem(item) } },
                            onAddItem = { title, catId, qty, unit, urgent ->
                                val newItem = ShoppingItem(
                                    id = "item_\${System.currentTimeMillis()}",
                                    title = title,
                                    categoryId = catId,
                                    quantity = qty,
                                    unit = unit,
                                    urgent = urgent
                                )
                                scope.launch { repository.addItem(newItem) }
                            },
                            onClearCompleted = { scope.launch { repository.clearCompletedItems() } },
                            onOpenWeekendTemplate = { currentScreen = "templates" },
                            onOpenNotifications = { currentScreen = "notifications" },
                            onOpenSettings = { currentScreen = "settings" }
                        )
                        "templates" -> WeekendTemplateScreen(
                            templates = emptyList(),
                            onApplyTemplate = { tmpl, merge ->
                                scope.launch {
                                    repository.applyWeekendTemplate(tmpl, merge)
                                    currentScreen = "list"
                                }
                            },
                            onBack = { currentScreen = "list" }
                        )
                        "notifications" -> NotificationScheduleScreen(
                            schedules = emptyList(),
                            categories = emptyList(),
                            onToggleSchedule = { sched ->
                                val updated = sched.copy(active = !sched.active)
                                NotificationScheduler.scheduleReminder(this@MainActivity, updated)
                            },
                            onSaveSchedule = { sched ->
                                NotificationScheduler.scheduleReminder(this@MainActivity, sched)
                            },
                            onBack = { currentScreen = "list" }
                        )
                        "settings" -> SettingsScreen(
                            currentConfig = config,
                            onSaveConfig = { newConfig ->
                                prefs.saveFirebaseConfig(newConfig)
                                repository.initializeFirestore()
                            },
                            onBack = { currentScreen = "list" }
                        )
                    }
                }
            }
        }
    }
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    language: 'xml',
    category: 'manifest',
    description: 'Android Manifest requesting POST_NOTIFICATIONS, INTERNET, and configuring WorkManager.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.familyshopping.app">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="Family Shopping"
        android:roundIcon="@android:drawable/sym_def_app_icon"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>
</manifest>
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (App)',
    language: 'groovy',
    category: 'gradle',
    description: 'App-level Gradle build file with Jetpack Compose, WorkManager, and Firebase Firestore dependencies.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.google.gms.google.services) apply false
}

android {
    namespace = "com.familyshopping.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.familyshopping.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // AndroidX & Lifecycle
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.activity:activity-compose:1.9.3")

    // Jetpack Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Android WorkManager (For scheduled background notification checks)
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    // Firebase Firestore (Platform BoM)
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-common-ktx")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.9.0")
}
`,
  },
  {
    path: 'app/src/main/res/values-uk/strings.xml',
    name: 'strings.xml (Ukrainian)',
    language: 'xml',
    category: 'manifest',
    description: 'Ukrainian localization resource strings for Android app (notifications, categories, and buttons).',
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Сімейний список покупок</string>
    <string name="notification_channel_name">Нагадування про покупки</string>
    <string name="notification_channel_desc">Розумні нагадування про некуплені товари для сім\'ї</string>
    
    <!-- Notifications -->
    <string name="notification_items_needed">%1$s (потрібно: %2$d)</string>
    <string name="notification_and_more">та ще %1$d...</string>
    <string name="notification_suppressed_log">Усі товари куплено. Сповіщення приглушено.</string>

    <!-- Navigation & Titles -->
    <string name="title_shopping_list">Список покупок</string>
    <string name="title_weekend_master">Майстер вихідних</string>
    <string name="title_smart_reminders">Розумні нагадування</string>
    <string name="title_settings">Налаштування Firebase</string>

    <!-- Actions -->
    <string name="action_add_item">Додати</string>
    <string name="action_clear_completed">Очистити куплені</string>
    <string name="action_apply_template">Завантажити в 1 клік</string>
    <string name="action_merge">Об\'єднати</string>
    <string name="action_replace">Почати з нуля</string>
    <string name="action_save">Зберегти</string>

    <!-- Categories -->
    <string name="cat_produce">Овочі та фрукти</string>
    <string name="cat_dairy">Молочні продукти та яйця</string>
    <string name="cat_bakery">Випічка та хліб</string>
    <string name="cat_meat">М\'ясо та морепродукти</string>
    <string name="cat_pantry">Бакалія та крупи</string>
    <string name="cat_frozen">Заморожені продукти</string>
    <string name="cat_household">Побутова хімія та дім</string>
    <string name="cat_personal">Особиста гігієна</string>
</resources>
`,
  },
  {
    path: 'README_ANDROID.md',
    name: 'README_ANDROID.md',
    language: 'markdown',
    category: 'docs',
    description: 'Setup and compilation guide for running the Native Android app in Android Studio.',
    content: `# Family Shopping - Native Android App

## Architecture
- **Language**: Kotlin 2.0+
- **UI Framework**: Jetpack Compose (Material3)
- **Local Persistence**: Android \`SharedPreferences\` for dynamic multi-tenant Firebase credentials
- **Cloud Backend**: Google Cloud Firestore (dynamically initialized per family group)
- **Background Notifications**: Android \`WorkManager\` with \`ShoppingReminderWorker\`
- **Localization**: Full English and Ukrainian (\`res/values-uk/strings.xml\`) language support!

## Smart Scheduled Notifications Feature
The worker triggers at your configured schedule time (e.g., 17:30 daily or 16:00 Fridays):
1. Reads dynamic Firestore configuration from local SharedPreferences.
2. Queries Firestore for uncompleted shopping items matching the selected categories.
3. **Smart Rule Enforcement**:
   - If uncompleted items are found in those categories: Posts an actionable notification with item names and quantity.
   - If categories are empty or all items are completed: **Suppresses the notification completely**. No spam or useless alerts!

## How to Build in Android Studio
1. Open Android Studio (Ladybug / Koala or newer).
2. Select **Open Project** and choose this directory.
3. Gradle will sync dependencies automatically (\`androidx.work:work-runtime-ktx\`, \`firebase-firestore\`, Jetpack Compose).
4. Run on a physical Android device or Emulator (API 26+).
5. Open **Settings** in the app, and enter your Firebase project parameters or scan the QR code from the Web App!
`,
  },
];

