package com.familyshopping.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.RecentItem
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.ui.AppStrings
import com.familyshopping.app.ui.theme.LocalAppExtendedColors
import com.familyshopping.app.ui.theme.borderColor
import com.familyshopping.app.ui.theme.drawTelegramCategoryBackground
import com.familyshopping.app.ui.theme.resolveIconVisual

private enum class AndroidStatusFilter {
    PENDING,
    URGENT,
    COMPLETED,
    CANCELLED,
    ALL
}

private sealed class PendingConfirmAction {
    data class CancelItem(val item: ShoppingItem) : PendingConfirmAction()
    data class DeleteItem(val item: ShoppingItem) : PendingConfirmAction()
    data object ClearCompleted : PendingConfirmAction()
    data object ClearCancelled : PendingConfirmAction()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListScreen(
    items: List<ShoppingItem>,
    categories: List<Category>,
    recentItems: List<RecentItem>,
    isConnected: Boolean,
    isRefreshing: Boolean,
    syncError: String?,
    lang: String,
    showAddedBy: Boolean,
    showTimestamps: Boolean,
    categoryBackgroundsEnabled: Boolean,
    onRefresh: () -> Unit,
    onChangeLanguage: (String) -> Unit,
    onToggleItem: (ShoppingItem) -> Unit,
    onCancelItem: (ShoppingItem) -> Unit,
    onRestoreItem: (ShoppingItem) -> Unit,
    onAddItem: (String, String, Int, String, Boolean, String?) -> Unit,
    onDeleteItem: (String) -> Unit,
    onClearCompleted: () -> Unit,
    onClearCancelled: () -> Unit,
    onOpenWeekendTemplate: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val extended = LocalAppExtendedColors.current
    var showAddDialog by remember { mutableStateOf(false) }
    var showLangMenu by remember { mutableStateOf(false) }
    var statusFilter by remember { mutableStateOf(AndroidStatusFilter.PENDING) }
    var selectedCategoryFilter by remember { mutableStateOf<String?>(null) }
    var pendingConfirmAction by remember { mutableStateOf<PendingConfirmAction?>(null) }
    var weeksLoaded by remember { mutableIntStateOf(0) }
    var showAllHistory by remember { mutableStateOf(false) }

    val pendingCount = items.count { !it.completed && !it.cancelled }
    val urgentCount = items.count { !it.completed && !it.cancelled && it.urgent }
    val completedCount = items.count { it.completed && !it.cancelled }
    val cancelledCount = items.count { it.cancelled }
    val allTotalCount = items.size

    LaunchedEffect(urgentCount, statusFilter) {
        if (statusFilter == AndroidStatusFilter.URGENT && urgentCount == 0) {
            statusFilter = AndroidStatusFilter.PENDING
        }
    }

    LaunchedEffect(statusFilter) {
        weeksLoaded = 0
        showAllHistory = false
    }

    val isDatePaginatedSection =
        statusFilter == AndroidStatusFilter.ALL ||
            statusFilter == AndroidStatusFilter.COMPLETED ||
            statusFilter == AndroidStatusFilter.CANCELLED

    val todayStart = remember(items) { startOfTodayMillis() }
    val windowStart = remember(todayStart, weeksLoaded) {
        if (weeksLoaded <= 0) todayStart else subtractDaysFromStartOfDay(todayStart, weeksLoaded * 7)
    }

    val sectionPool = remember(items, statusFilter) {
        when (statusFilter) {
            AndroidStatusFilter.PENDING -> items.filter { !it.completed && !it.cancelled }
            AndroidStatusFilter.URGENT -> items.filter { !it.completed && !it.cancelled && it.urgent }
            AndroidStatusFilter.COMPLETED -> items.filter { it.completed && !it.cancelled }
            AndroidStatusFilter.CANCELLED -> items.filter { it.cancelled }
            AndroidStatusFilter.ALL -> items
        }
    }

    val itemsInStatus = remember(sectionPool, statusFilter, isDatePaginatedSection, showAllHistory, windowStart) {
        if (!isDatePaginatedSection) {
            sectionPool
        } else if (showAllHistory) {
            sectionPool.sortedByDescending { itemActionTimestamp(it) }
        } else if (statusFilter == AndroidStatusFilter.ALL) {
            sectionPool
                .filter { (!it.completed && !it.cancelled) || itemActionTimestamp(it) >= windowStart }
                .sortedByDescending { itemActionTimestamp(it) }
        } else {
            sectionPool
                .filter { itemActionTimestamp(it) >= windowStart }
                .sortedByDescending { itemActionTimestamp(it) }
        }
    }

    val categoryCountsInStatus = remember(itemsInStatus) {
        itemsInStatus.groupingBy { it.categoryId }.eachCount()
    }

    val visibleCategories = remember(categories, categoryCountsInStatus) {
        categories.filter { (categoryCountsInStatus[it.id] ?: 0) > 0 }
    }

    LaunchedEffect(selectedCategoryFilter, visibleCategories) {
        if (selectedCategoryFilter != null && visibleCategories.none { it.id == selectedCategoryFilter }) {
            selectedCategoryFilter = null
        }
    }

    val displayedItems = if (selectedCategoryFilter == null) {
        itemsInStatus
    } else {
        itemsInStatus.filter { it.categoryId == selectedCategoryFilter }
    }

    val olderHiddenCount = remember(sectionPool, selectedCategoryFilter, isDatePaginatedSection, showAllHistory, statusFilter, windowStart) {
        if (!isDatePaginatedSection || showAllHistory) {
            0
        } else {
            val catFilteredPool = if (selectedCategoryFilter == null) {
                sectionPool
            } else {
                sectionPool.filter { it.categoryId == selectedCategoryFilter }
            }
            catFilteredPool.count { item ->
                val isHistoricalStatus = if (statusFilter == AndroidStatusFilter.ALL) {
                    item.completed || item.cancelled
                } else {
                    true
                }
                isHistoricalStatus && itemActionTimestamp(item) < windowStart
            }
        }
    }

    val groupedByDay = remember(displayedItems, isDatePaginatedSection, todayStart) {
        if (!isDatePaginatedSection) {
            emptyList()
        } else {
            displayedItems
                .groupBy { item ->
                    val ts = itemActionTimestamp(item)
                    if (ts > 0L) startOfDayMillis(ts) else todayStart
                }
                .entries
                .sortedByDescending { it.key }
                .map { it.key to it.value }
        }
    }
    val categoryMap = remember(categories) { categories.associateBy { it.id } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = AppStrings.appName(lang),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = AppStrings.subtitleStatus(lang, pendingCount, isConnected),
                            fontSize = 12.sp,
                            color = if (isConnected) extended.accentSuccess else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    Box {
                        TextButton(
                            onClick = { showLangMenu = true },
                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = AppStrings.langCodeLabel(lang),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = extended.titleText
                            )
                        }
                        DropdownMenu(
                            expanded = showLangMenu,
                            onDismissRequest = { showLangMenu = false }
                        ) {
                            listOf(
                                "uk" to "Українська (UA)",
                                "ru" to "Русский (RU)",
                                "en" to "English (EN)"
                            ).forEach { (code, label) ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = label,
                                            fontWeight = if (lang == code) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    onClick = {
                                        onChangeLanguage(code)
                                        showLangMenu = false
                                    }
                                )
                            }
                        }
                    }
                    IconButton(onClick = onOpenWeekendTemplate) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = AppStrings.weekendMasterTitle(lang),
                            tint = Color(0xFFD97706)
                        )
                    }
                    IconButton(onClick = onOpenNotifications) {
                        Icon(
                            Icons.Default.Notifications,
                            contentDescription = AppStrings.remindersTitle(lang)
                        )
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = AppStrings.settingsTitle(lang)
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = extended.fabContainer,
                contentColor = extended.fabContent
            ) {
                Icon(Icons.Default.Add, contentDescription = AppStrings.addItemTitle(lang))
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Status Filter Tabs (Default: Pending / До покупки)
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 2.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.PENDING,
                        onClick = { statusFilter = AndroidStatusFilter.PENDING },
                        label = {
                            Text(AppStrings.statusPending(lang, pendingCount), fontSize = 12.sp)
                        }
                    )
                }
                if (urgentCount > 0) {
                    item {
                        FilterChip(
                            selected = statusFilter == AndroidStatusFilter.URGENT,
                            onClick = { statusFilter = AndroidStatusFilter.URGENT },
                            label = {
                                Text(AppStrings.statusUrgent(lang, urgentCount), fontSize = 12.sp)
                            }
                        )
                    }
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.COMPLETED,
                        onClick = { statusFilter = AndroidStatusFilter.COMPLETED },
                        label = {
                            Text(AppStrings.statusCompleted(lang, completedCount), fontSize = 12.sp)
                        }
                    )
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.CANCELLED,
                        onClick = { statusFilter = AndroidStatusFilter.CANCELLED },
                        label = {
                            Text(AppStrings.statusCancelled(lang, cancelledCount), fontSize = 12.sp)
                        }
                    )
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.ALL,
                        onClick = { statusFilter = AndroidStatusFilter.ALL },
                        label = {
                            Text(AppStrings.statusAll(lang, allTotalCount), fontSize = 12.sp)
                        }
                    )
                }
            }

            // Category Filter Chips (only categories present in selected section)
            if (visibleCategories.isNotEmpty()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedCategoryFilter == null,
                            onClick = { selectedCategoryFilter = null },
                            label = {
                                Text(AppStrings.allCategories(lang), fontSize = 12.sp)
                            }
                        )
                    }
                    items(visibleCategories, key = { it.id }) { cat ->
                        val catCount = categoryCountsInStatus[cat.id] ?: 0
                        FilterChip(
                            selected = selectedCategoryFilter == cat.id,
                            onClick = {
                                selectedCategoryFilter = if (selectedCategoryFilter == cat.id) null else cat.id
                            },
                            label = {
                                Text(
                                    "${cat.icon} ${AppStrings.categoryName(cat, lang)} ($catCount)",
                                    fontSize = 12.sp
                                )
                            }
                        )
                    }
                }
            }

            if (!syncError.isNullOrBlank()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                        .clickable { onRefresh() },
                    colors = CardDefaults.cardColors(
                        containerColor = if (extended.isDark) Color(0xFF3A1D21) else Color(0xFFFEF2F2)
                    ),
                    border = BorderStroke(
                        1.dp,
                        if (extended.isDark) Color(0xFF6B2D35) else Color(0xFFFECACA)
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = AppStrings.syncErrorBanner(lang, syncError),
                        fontSize = 12.sp,
                        color = extended.accentError,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }

            // Shopping List with Pull-Down-to-Refresh
            PullToRefreshBox(
                isRefreshing = isRefreshing,
                onRefresh = onRefresh,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(top = 6.dp, bottom = 88.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if ((statusFilter == AndroidStatusFilter.COMPLETED || statusFilter == AndroidStatusFilter.ALL) && completedCount > 0) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 2.dp, bottom = 2.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = AppStrings.doneHeader(lang, completedCount),
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                TextButton(onClick = { pendingConfirmAction = PendingConfirmAction.ClearCompleted }) {
                                    Text(
                                        text = AppStrings.clearDone(lang),
                                        color = MaterialTheme.colorScheme.error,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    if (statusFilter == AndroidStatusFilter.CANCELLED && cancelledCount > 0) {
                        item {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 2.dp, bottom = 2.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = AppStrings.cancelledHeader(lang, cancelledCount),
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 12.sp,
                                    color = extended.accentWarning
                                )
                                TextButton(onClick = { pendingConfirmAction = PendingConfirmAction.ClearCancelled }) {
                                    Text(
                                        text = AppStrings.clearCancelled(lang),
                                        color = MaterialTheme.colorScheme.error,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    if (displayedItems.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 16.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = extended.cardSurface)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = if (olderHiddenCount > 0) {
                                            AppStrings.emptyTodayWithOlderMessage(lang)
                                        } else {
                                            AppStrings.emptyMessage(lang, statusFilter.name)
                                        },
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = extended.subtleText
                                    )
                                }
                            }
                        }
                    } else if (isDatePaginatedSection) {
                        groupedByDay.forEach { (dayStartMillis, dayItems) ->
                            item(key = "day_header_$dayStartMillis") {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 8.dp, bottom = 2.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = formatDayHeaderLabel(dayStartMillis, lang),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = extended.mutedText
                                    )
                                    Text(
                                        text = "${dayItems.size}",
                                        fontSize = 11.sp,
                                        color = extended.subtleText
                                    )
                                }
                            }
                            items(dayItems, key = { it.id }) { item ->
                                val cat = categoryMap[item.categoryId]
                                ShoppingItemRow(
                                    item = item,
                                    lang = lang,
                                    categoryLabel = cat?.let { "${it.icon} ${AppStrings.categoryName(it, lang)}" } ?: "",
                                    categoryIcon = cat?.icon,
                                    showAddedBy = showAddedBy,
                                    showTimestamps = showTimestamps,
                                    categoryBackgroundsEnabled = categoryBackgroundsEnabled,
                                    onToggle = { onToggleItem(item) },
                                    onCancel = { pendingConfirmAction = PendingConfirmAction.CancelItem(item) },
                                    onRestore = { onRestoreItem(item) },
                                    onDelete = { pendingConfirmAction = PendingConfirmAction.DeleteItem(item) }
                                )
                            }
                        }
                    } else {
                        items(displayedItems, key = { it.id }) { item ->
                            val cat = categoryMap[item.categoryId]
                            ShoppingItemRow(
                                item = item,
                                lang = lang,
                                categoryLabel = cat?.let { "${it.icon} ${AppStrings.categoryName(it, lang)}" } ?: "",
                                categoryIcon = cat?.icon,
                                showAddedBy = showAddedBy,
                                showTimestamps = showTimestamps,
                                categoryBackgroundsEnabled = categoryBackgroundsEnabled,
                                onToggle = { onToggleItem(item) },
                                onCancel = { pendingConfirmAction = PendingConfirmAction.CancelItem(item) },
                                onRestore = { onRestoreItem(item) },
                                onDelete = { pendingConfirmAction = PendingConfirmAction.DeleteItem(item) }
                            )
                        }
                    }

                    if (isDatePaginatedSection && !showAllHistory && olderHiddenCount > 0) {
                        item(key = "history_pagination_controls") {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp, bottom = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = AppStrings.olderItemsHiddenLabel(
                                        lang = lang,
                                        count = olderHiddenCount,
                                        fromDate = formatShortDate(windowStart)
                                    ),
                                    fontSize = 11.sp,
                                    color = extended.subtleText
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = { weeksLoaded += 1 },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text(AppStrings.showMoreWeekBtn(lang), fontSize = 13.sp)
                                    }
                                    Button(
                                        onClick = { showAllHistory = true },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.primary,
                                            contentColor = MaterialTheme.colorScheme.onPrimary
                                        ),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text(AppStrings.showAllHistoryBtn(lang), fontSize = 13.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    pendingConfirmAction?.let { action ->
        val isCancelAction = action is PendingConfirmAction.CancelItem
        val confirmTitle = when (action) {
            is PendingConfirmAction.CancelItem -> AppStrings.confirmCancelTitle(lang)
            is PendingConfirmAction.DeleteItem -> AppStrings.confirmDeleteTitle(lang)
            is PendingConfirmAction.ClearCompleted -> AppStrings.clearDone(lang)
            is PendingConfirmAction.ClearCancelled -> AppStrings.clearCancelled(lang)
        }
        val confirmBody = when (action) {
            is PendingConfirmAction.CancelItem -> AppStrings.confirmCancelBody(lang, action.item.title)
            is PendingConfirmAction.DeleteItem -> AppStrings.confirmDeleteBody(lang, action.item.title)
            is PendingConfirmAction.ClearCompleted -> AppStrings.confirmClearCompletedBody(lang, completedCount)
            is PendingConfirmAction.ClearCancelled -> AppStrings.confirmClearCancelledBody(lang, cancelledCount)
        }
        val confirmBtnLabel = if (isCancelAction) {
            AppStrings.confirmCancelBtn(lang)
        } else {
            AppStrings.confirmDeleteBtn(lang)
        }
        val confirmBtnColor = if (isCancelAction) Color(0xFFD97706) else Color(0xFFDC2626)

        AlertDialog(
            onDismissRequest = { pendingConfirmAction = null },
            title = { Text(confirmTitle, fontWeight = FontWeight.SemiBold) },
            text = { Text(confirmBody, fontSize = 14.sp) },
            confirmButton = {
                Button(
                    onClick = {
                        when (action) {
                            is PendingConfirmAction.CancelItem -> onCancelItem(action.item)
                            is PendingConfirmAction.DeleteItem -> onDeleteItem(action.item.id)
                            is PendingConfirmAction.ClearCompleted -> onClearCompleted()
                            is PendingConfirmAction.ClearCancelled -> onClearCancelled()
                        }
                        pendingConfirmAction = null
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = confirmBtnColor,
                        contentColor = Color.White
                    )
                ) {
                    Text(confirmBtnLabel)
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingConfirmAction = null }) {
                    Text(AppStrings.cancelButton(lang))
                }
            }
        )
    }

    if (showAddDialog) {
        val pendingTitles = remember(items) {
            items.filter { !it.completed && !it.cancelled }.map { it.title.trim().lowercase(Locale.getDefault()) }.toSet()
        }
        AddItemDialog(
            categories = categories,
            recentItems = recentItems,
            pendingTitles = pendingTitles,
            lang = lang,
            defaultCategoryId = selectedCategoryFilter ?: categories.firstOrNull()?.id ?: "cat_produce",
            onDismiss = { showAddDialog = false },
            onConfirm = { title, catId, qty, unit, urgent, note ->
                onAddItem(title, catId, qty, unit, urgent, note)
                showAddDialog = false
            }
        )
    }
}

private fun itemActionTimestamp(item: ShoppingItem): Long = when {
    item.cancelled -> item.cancelledAt ?: item.createdAt
    item.completed -> item.completedAt ?: item.createdAt
    else -> item.createdAt
}

private fun startOfDayMillis(ts: Long): Long {
    val cal = Calendar.getInstance().apply {
        timeInMillis = ts
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
    return cal.timeInMillis
}

private fun startOfTodayMillis(): Long = startOfDayMillis(System.currentTimeMillis())

private fun subtractDaysFromStartOfDay(dayStartMillis: Long, days: Int): Long {
    val cal = Calendar.getInstance().apply {
        timeInMillis = dayStartMillis
        add(Calendar.DAY_OF_YEAR, -days)
    }
    return cal.timeInMillis
}

private fun formatShortDate(ts: Long): String =
    SimpleDateFormat("dd.MM", Locale.getDefault()).format(Date(ts))

private fun formatDayHeaderLabel(dayStartMillis: Long, lang: String): String {
    val today = startOfTodayMillis()
    val yesterday = subtractDaysFromStartOfDay(today, 1)
    if (dayStartMillis == today) return AppStrings.todayLabel(lang)
    if (dayStartMillis == yesterday) return AppStrings.yesterdayLabel(lang)

    val dayCal = Calendar.getInstance().apply { timeInMillis = dayStartMillis }
    val nowCal = Calendar.getInstance()
    val sameYear = dayCal.get(Calendar.YEAR) == nowCal.get(Calendar.YEAR)
    val locale = when (lang) {
        "ru" -> Locale("ru")
        "en" -> Locale.ENGLISH
        else -> Locale("uk")
    }
    val pattern = if (sameYear) "d MMMM" else "d MMMM yyyy"
    return SimpleDateFormat(pattern, locale).format(Date(dayStartMillis))
}

private fun formatAndroidTimestamp(ts: Long): String {
    val itemCal = Calendar.getInstance().apply { timeInMillis = ts }
    val nowCal = Calendar.getInstance()
    val sameDay = itemCal.get(Calendar.YEAR) == nowCal.get(Calendar.YEAR) &&
        itemCal.get(Calendar.DAY_OF_YEAR) == nowCal.get(Calendar.DAY_OF_YEAR)
    val pattern = if (sameDay) "HH:mm" else "dd.MM HH:mm"
    return SimpleDateFormat(pattern, Locale.getDefault()).format(Date(ts))
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ShoppingItemRow(
    item: ShoppingItem,
    lang: String,
    categoryLabel: String,
    categoryIcon: String?,
    showAddedBy: Boolean,
    showTimestamps: Boolean,
    categoryBackgroundsEnabled: Boolean,
    onToggle: () -> Unit,
    onCancel: () -> Unit,
    onRestore: () -> Unit,
    onDelete: () -> Unit
) {
    val extended = LocalAppExtendedColors.current
    val isMuted = item.completed || item.cancelled
    val cardShape = RoundedCornerShape(10.dp)
    val iconVisual = remember(categoryIcon, item.categoryId, categoryBackgroundsEnabled) {
        if (categoryBackgroundsEnabled) {
            resolveIconVisual(categoryIcon, item.categoryId)
        } else {
            null
        }
    }
    val borderColor = iconVisual?.borderColor(isDark = extended.isDark, isMuted = isMuted)
        ?: extended.cardBorder

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(cardShape)
            .clickable { if (item.cancelled) onRestore() else onToggle() },
        shape = cardShape,
        border = BorderStroke(1.dp, borderColor),
        colors = CardDefaults.cardColors(
            containerColor = if (iconVisual != null) {
                Color.Transparent
            } else if (isMuted) {
                extended.cardCompletedSurface
            } else {
                extended.cardSurface
            }
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isMuted || extended.isDark) 0.dp else 1.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .then(
                    if (iconVisual != null) {
                        Modifier.drawBehind {
                            drawTelegramCategoryBackground(
                                visual = iconVisual,
                                isDark = extended.isDark,
                                isMuted = isMuted,
                                mutedTarget = extended.cardCompletedSurface
                            )
                        }
                    } else {
                        Modifier
                    }
                )
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.wrapContentWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    if (item.cancelled) {
                        IconButton(onClick = onRestore, modifier = Modifier.size(44.dp)) {
                            Icon(
                                Icons.Default.Refresh,
                                contentDescription = "Restore",
                                tint = extended.accentSuccess,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier.size(44.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Checkbox(
                                checked = item.completed,
                                onCheckedChange = { onToggle() },
                                modifier = Modifier.scale(1.3f)
                            )
                        }
                    }
                }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = item.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            textDecoration = if (isMuted) TextDecoration.LineThrough else TextDecoration.None,
                            color = if (isMuted) extended.subtleText else extended.titleText,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        if (item.urgent && !isMuted) {
                            Surface(
                                color = extended.urgentBadgeBg,
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "!",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = extended.urgentBadgeText
                                )
                            }
                        }
                    }

                    val metaParts = buildList {
                        if (categoryLabel.isNotBlank()) {
                            add(Triple(categoryLabel, extended.subtleText, FontWeight.Normal))
                        }
                        if (item.quantity > 0 || item.unit.isNotBlank()) {
                            add(Triple("${item.quantity} ${item.unit}".trim(), extended.subtleText, FontWeight.Normal))
                        }
                        if (showAddedBy && !item.addedBy.isNullOrBlank()) {
                            add(Triple("👤 ${item.addedBy.trim()}", extended.subtleText, FontWeight.Normal))
                        }
                        if (showTimestamps) {
                            if (item.createdAt > 0L) {
                                add(
                                    Triple(
                                        AppStrings.addedPrefix(lang) + formatAndroidTimestamp(item.createdAt),
                                        extended.subtleText,
                                        FontWeight.Normal
                                    )
                                )
                            }
                            if (item.completed && !item.cancelled && item.completedAt != null) {
                                val boughtText = AppStrings.boughtPrefix(lang).trimStart('•', ' ') +
                                    formatAndroidTimestamp(item.completedAt)
                                add(Triple(boughtText, extended.accentSuccess, FontWeight.Medium))
                            }
                            if (item.cancelled && item.cancelledAt != null) {
                                val cancelledText = AppStrings.cancelledPrefix(lang).trimStart('•', ' ') +
                                    formatAndroidTimestamp(item.cancelledAt)
                                add(Triple(cancelledText, extended.accentWarning, FontWeight.Medium))
                            }
                        }
                    }

                    if (metaParts.isNotEmpty()) {
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            metaParts.forEachIndexed { index, (text, color, weight) ->
                                if (index > 0) {
                                    Text(
                                        text = "•",
                                        fontSize = 11.sp,
                                        color = extended.subtleText.copy(alpha = 0.65f)
                                    )
                                }
                                Text(
                                    text = text,
                                    fontSize = 11.sp,
                                    color = color,
                                    fontWeight = weight
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.wrapContentWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!item.cancelled) {
                        IconButton(onClick = onCancel, modifier = Modifier.size(34.dp)) {
                            Icon(
                                Icons.Default.Block,
                                contentDescription = "Cancel",
                                tint = extended.accentWarning,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(34.dp)) {
                        Icon(
                            Icons.Outlined.Delete,
                            contentDescription = "Delete",
                            tint = extended.subtleText,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
            }

            val noteText = item.note?.trim().orEmpty()
            if (noteText.isNotEmpty()) {
                Text(
                    text = noteText,
                    fontStyle = FontStyle.Italic,
                    fontSize = 12.sp,
                    color = extended.mutedText,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun AddItemDialog(
    categories: List<Category>,
    recentItems: List<RecentItem>,
    pendingTitles: Set<String>,
    lang: String,
    defaultCategoryId: String,
    onDismiss: () -> Unit,
    onConfirm: (String, String, Int, String, Boolean, String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var dropdownExpanded by remember { mutableStateOf(true) }
    var selectedCategoryId by remember { mutableStateOf(defaultCategoryId) }
    var quantity by remember { mutableIntStateOf(1) }
    var unit by remember { mutableStateOf("pcs") }
    var note by remember { mutableStateOf("") }
    var urgent by remember { mutableStateOf(false) }

    val categoryMap = remember(categories) { categories.associateBy { it.id } }

    val uniqueOrderedItems = remember(recentItems) {
        val map = linkedMapOf<String, RecentItem>()
        recentItems.sortedByDescending { it.lastUsedAt }.forEach { item ->
            val key = item.title.trim().lowercase(Locale.getDefault())
            if (key.isNotEmpty() && !map.containsKey(key)) {
                map[key] = item
            }
        }
        map.values.toList()
    }

    val filteredRecent = remember(uniqueOrderedItems, title) {
        val q = title.trim().lowercase(Locale.getDefault())
        if (q.isEmpty()) uniqueOrderedItems
        else uniqueOrderedItems.filter { it.title.lowercase(Locale.getDefault()).contains(q) }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(AppStrings.addItemTitle(lang), fontWeight = FontWeight.SemiBold) },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = {
                        title = it
                        dropdownExpanded = true
                    },
                    label = { Text(AppStrings.addItemPlaceholder(lang)) },
                    singleLine = true,
                    trailingIcon = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (title.isNotEmpty()) {
                                IconButton(
                                    onClick = {
                                        title = ""
                                        dropdownExpanded = true
                                    },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        Icons.Default.Close,
                                        contentDescription = "Clear",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                            IconButton(
                                onClick = { dropdownExpanded = !dropdownExpanded },
                                modifier = Modifier.size(36.dp)
                            ) {
                                Icon(
                                    if (dropdownExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                    contentDescription = "Toggle list"
                                )
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                if (dropdownExpanded && filteredRecent.isNotEmpty()) {
                    val extendedDialog = LocalAppExtendedColors.current
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        color = extendedDialog.cardSurface,
                        border = BorderStroke(1.dp, extendedDialog.cardBorder),
                        shadowElevation = 2.dp
                    ) {
                        Column {
                            Text(
                                text = AppStrings.usageOrderLabel(lang, filteredRecent.size),
                                fontSize = 11.sp,
                                color = extendedDialog.subtleText,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                            HorizontalDivider(color = extendedDialog.dividerColor)
                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 200.dp)
                            ) {
                                items(
                                    filteredRecent,
                                    key = { it.title.trim().lowercase(Locale.getDefault()) }
                                ) { recent ->
                                    val cat = categoryMap[recent.categoryId]
                                    val inList = recent.title.trim().lowercase(Locale.getDefault()) in pendingTitles
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                onConfirm(
                                                    recent.title,
                                                    recent.categoryId,
                                                    recent.quantity,
                                                    recent.unit,
                                                    false,
                                                    note.trim().takeIf { it.isNotEmpty() }
                                                )
                                            }
                                            .padding(horizontal = 12.dp, vertical = 9.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        if (cat != null) {
                                            Text(cat.icon, fontSize = 14.sp)
                                        }
                                        Text(
                                            text = recent.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = extendedDialog.titleText,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (recent.quantity > 1 || recent.unit != "pcs") {
                                            Text(
                                                text = "${recent.quantity} ${recent.unit}",
                                                fontSize = 11.sp,
                                                color = extendedDialog.subtleText
                                            )
                                        }
                                        if (inList) {
                                            Text(
                                                text = AppStrings.inListBadge(lang),
                                                fontSize = 11.sp,
                                                color = extendedDialog.accentSuccess,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                        Icon(
                                            Icons.Default.Add,
                                            contentDescription = null,
                                            tint = extendedDialog.accentSuccess,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    HorizontalDivider(color = extendedDialog.dividerColor)
                                }
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = quantity.toString(),
                        onValueChange = { v -> quantity = v.toIntOrNull()?.coerceAtLeast(1) ?: 1 },
                        label = { Text(AppStrings.qtyLabel(lang)) },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = unit,
                        onValueChange = { unit = it },
                        label = { Text(AppStrings.unitLabel(lang)) },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (categories.isNotEmpty()) {
                    LazyRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items(categories, key = { it.id }) { cat ->
                            FilterChip(
                                selected = selectedCategoryId == cat.id,
                                onClick = { selectedCategoryId = cat.id },
                                label = { Text("${cat.icon} ${AppStrings.categoryName(cat, lang)}", fontSize = 11.sp) }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text(AppStrings.noteLabel(lang)) },
                    placeholder = { Text(AppStrings.notePlaceholder(lang)) },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(AppStrings.urgentLabel(lang), fontSize = 14.sp)
                    Switch(checked = urgent, onCheckedChange = { urgent = it })
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val trimmed = title.trim()
                    if (trimmed.isNotEmpty()) {
                        onConfirm(
                            trimmed,
                            selectedCategoryId,
                            quantity,
                            unit.trim(),
                            urgent,
                            note.trim().takeIf { it.isNotEmpty() }
                        )
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text(AppStrings.addItemTitle(lang))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(AppStrings.cancelButton(lang))
            }
        }
    )
}
