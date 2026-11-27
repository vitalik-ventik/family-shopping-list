package com.familyshopping.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.content.ContextCompat
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.data.repository.ShoppingRepository
import com.familyshopping.app.notifications.NotificationScheduler
import com.familyshopping.app.ui.screens.NotificationScheduleScreen
import com.familyshopping.app.ui.screens.SettingsScreen
import com.familyshopping.app.ui.screens.ShoppingListScreen
import com.familyshopping.app.ui.screens.WeekendTemplateScreen
import kotlinx.coroutines.launch

private val MinimalLightColorScheme = lightColorScheme(
    primary = Color(0xFF18181B),
    onPrimary = Color.White,
    background = Color(0xFFFAFAFA),
    surface = Color.White,
    onBackground = Color(0xFF18181B),
    onSurface = Color(0xFF18181B),
    onSurfaceVariant = Color(0xFF71717A)
)

class MainActivity : ComponentActivity() {

    private lateinit var repository: ShoppingRepository
    private lateinit var prefs: PreferencesManager

    private val requestNotificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { _ -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = ShoppingRepository(this)
        prefs = PreferencesManager(this)
        ensureNotificationPermission()

        setContent {
            MaterialTheme(colorScheme = MinimalLightColorScheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var currentScreen by remember { mutableStateOf("list") }
                    val items by repository.items.collectAsState()
                    val categories by repository.categories.collectAsState()
                    val templates by repository.templates.collectAsState()
                    val recentItems by repository.recentItems.collectAsState()
                    val isConnected by repository.isConnected.collectAsState()

                    var schedules by remember { mutableStateOf(prefs.getSchedules()) }
                    var config by remember { mutableStateOf(prefs.getFirebaseConfig()) }
                    var appLanguage by remember { mutableStateOf(prefs.getLanguage()) }
                    val scope = rememberCoroutineScope()

                    BackHandler(enabled = currentScreen != "list") {
                        currentScreen = "list"
                    }

                    when (currentScreen) {
                        "list" -> ShoppingListScreen(
                            items = items,
                            categories = categories,
                            recentItems = recentItems,
                            isConnected = isConnected,
                            lang = appLanguage,
                            onChangeLanguage = { newLang ->
                                prefs.setLanguage(newLang)
                                appLanguage = newLang
                            },
                            onToggleItem = { item -> scope.launch { repository.toggleItem(item) } },
                            onCancelItem = { item -> scope.launch { repository.cancelItem(item) } },
                            onRestoreItem = { item -> scope.launch { repository.restoreItem(item) } },
                            onAddItem = { title, catId, qty, unit, urgent ->
                                val newItem = ShoppingItem(
                                    id = "item_${System.currentTimeMillis()}",
                                    title = title,
                                    categoryId = catId,
                                    quantity = qty,
                                    unit = unit,
                                    urgent = urgent,
                                    addedBy = prefs.getUserName()
                                )
                                scope.launch { repository.addItem(newItem) }
                            },
                            onDeleteItem = { id -> scope.launch { repository.deleteItem(id) } },
                            onClearCompleted = { scope.launch { repository.clearCompletedItems() } },
                            onClearCancelled = { scope.launch { repository.clearCancelledItems() } },
                            onOpenWeekendTemplate = { currentScreen = "templates" },
                            onOpenNotifications = { currentScreen = "notifications" },
                            onOpenSettings = { currentScreen = "settings" }
                        )

                        "templates" -> WeekendTemplateScreen(
                            templates = templates,
                            lang = appLanguage,
                            onApplyTemplate = { tmpl, merge ->
                                scope.launch {
                                    repository.applyWeekendTemplate(tmpl, merge)
                                    currentScreen = "list"
                                }
                            },
                            onBack = { currentScreen = "list" }
                        )

                        "notifications" -> NotificationScheduleScreen(
                            schedules = schedules,
                            categories = categories,
                            lang = appLanguage,
                            onToggleSchedule = { sched ->
                                ensureNotificationPermission()
                                val updated = sched.copy(active = !sched.active)
                                schedules = schedules.map { if (it.id == sched.id) updated else it }
                                prefs.saveSchedules(schedules)
                                NotificationScheduler.scheduleReminder(this@MainActivity, updated)
                            },
                            onSaveSchedule = { sched ->
                                ensureNotificationPermission()
                                schedules = schedules + sched
                                prefs.saveSchedules(schedules)
                                NotificationScheduler.scheduleReminder(this@MainActivity, sched)
                            },
                            onTestScheduleNow = { sched ->
                                ensureNotificationPermission()
                                NotificationScheduler.runImmediateCheck(this@MainActivity, sched)
                            },
                            onBack = { currentScreen = "list" }
                        )

                        "settings" -> SettingsScreen(
                            currentConfig = config,
                            currentLanguage = appLanguage,
                            onChangeLanguage = { newLang ->
                                prefs.setLanguage(newLang)
                                appLanguage = newLang
                            },
                            onTestConfig = { testCfg -> repository.testConnection(testCfg) },
                            onSaveConfig = { newConfig ->
                                prefs.saveFirebaseConfig(newConfig)
                                config = newConfig
                                repository.initializeFirestore()
                            },
                            onBack = { currentScreen = "list" }
                        )
                    }
                }
            }
        }
    }

    private fun ensureNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}
