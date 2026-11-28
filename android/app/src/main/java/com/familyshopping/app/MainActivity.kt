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
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.data.repository.ShoppingRepository
import com.familyshopping.app.notifications.NotificationScheduler
import com.familyshopping.app.ui.screens.NotificationScheduleScreen
import com.familyshopping.app.ui.screens.SettingsScreen
import com.familyshopping.app.ui.screens.ShoppingListScreen
import com.familyshopping.app.ui.screens.WeekendTemplateScreen
import com.familyshopping.app.ui.theme.FamilyShoppingTheme
import kotlinx.coroutines.launch

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
            var themeMode by remember { mutableStateOf(prefs.getThemeMode()) }
            var colorSchemeId by remember { mutableStateOf(prefs.getColorSchemeId()) }
            var showAddedBy by remember { mutableStateOf(prefs.getShowAddedBy()) }
            var showTimestamps by remember { mutableStateOf(prefs.getShowTimestamps()) }
            var categoryBackgroundsEnabled by remember { mutableStateOf(prefs.getCategoryBackgroundsEnabled()) }
            var userName by remember { mutableStateOf(prefs.getUserName()) }

            FamilyShoppingTheme(
                themeModeId = themeMode,
                colorSchemeId = colorSchemeId
            ) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var currentScreen by remember { mutableStateOf("list") }
                    val items by repository.items.collectAsState()
                    val categories by repository.categories.collectAsState()
                    val templates by repository.templates.collectAsState()
                    val recentItems by repository.recentItems.collectAsState()
                    val isConnected by repository.isConnected.collectAsState()
                    val isRefreshing by repository.isRefreshing.collectAsState()
                    val syncError by repository.syncError.collectAsState()

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
                            isRefreshing = isRefreshing,
                            syncError = syncError,
                            lang = appLanguage,
                            showAddedBy = showAddedBy,
                            showTimestamps = showTimestamps,
                            categoryBackgroundsEnabled = categoryBackgroundsEnabled,
                            onRefresh = { scope.launch { repository.refreshFromServer() } },
                            onChangeLanguage = { newLang ->
                                prefs.setLanguage(newLang)
                                appLanguage = newLang
                            },
                            onToggleItem = { item -> scope.launch { repository.toggleItem(item) } },
                            onCancelItem = { item -> scope.launch { repository.cancelItem(item) } },
                            onRestoreItem = { item -> scope.launch { repository.restoreItem(item) } },
                            onAddItem = { title, catId, qty, unit, urgent, note ->
                                val newItem = ShoppingItem(
                                    id = "item_${System.currentTimeMillis()}",
                                    title = title,
                                    categoryId = catId,
                                    quantity = qty,
                                    unit = unit,
                                    note = note?.trim()?.takeIf { it.isNotEmpty() },
                                    urgent = urgent,
                                    addedBy = userName
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
                            currentThemeMode = themeMode,
                            currentColorSchemeId = colorSchemeId,
                            showAddedBy = showAddedBy,
                            showTimestamps = showTimestamps,
                            categoryBackgroundsEnabled = categoryBackgroundsEnabled,
                            currentUserName = userName,
                            onChangeLanguage = { newLang ->
                                prefs.setLanguage(newLang)
                                appLanguage = newLang
                            },
                            onChangeThemeMode = { newMode ->
                                prefs.setThemeMode(newMode)
                                themeMode = newMode
                            },
                            onChangeColorScheme = { newScheme ->
                                prefs.setColorSchemeId(newScheme)
                                colorSchemeId = newScheme
                            },
                            onChangeShowAddedBy = { enabled ->
                                prefs.setShowAddedBy(enabled)
                                showAddedBy = enabled
                            },
                            onChangeShowTimestamps = { enabled ->
                                prefs.setShowTimestamps(enabled)
                                showTimestamps = enabled
                            },
                            onChangeCategoryBackgrounds = { enabled ->
                                prefs.setCategoryBackgroundsEnabled(enabled)
                                categoryBackgroundsEnabled = enabled
                            },
                            onChangeUserName = { name ->
                                val clean = name.trim().ifBlank { "Android" }
                                prefs.setUserName(clean)
                                userName = clean
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
