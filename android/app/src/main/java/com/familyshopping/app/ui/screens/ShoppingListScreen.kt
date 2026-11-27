package com.familyshopping.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import com.familyshopping.app.R
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.RecentItem
import com.familyshopping.app.data.model.ShoppingItem

private enum class AndroidStatusFilter {
    PENDING,
    URGENT,
    COMPLETED,
    CANCELLED,
    ALL
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListScreen(
    items: List<ShoppingItem>,
    categories: List<Category>,
    recentItems: List<RecentItem>,
    isConnected: Boolean,
    onToggleItem: (ShoppingItem) -> Unit,
    onCancelItem: (ShoppingItem) -> Unit,
    onRestoreItem: (ShoppingItem) -> Unit,
    onAddItem: (String, String, Int, String, Boolean) -> Unit,
    onDeleteItem: (String) -> Unit,
    onClearCompleted: () -> Unit,
    onClearCancelled: () -> Unit,
    onOpenWeekendTemplate: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var statusFilter by remember { mutableStateOf(AndroidStatusFilter.PENDING) }
    var selectedCategoryFilter by remember { mutableStateOf<String?>(null) }
    val isUk = remember { Locale.getDefault().language != "en" }

    val pendingCount = items.count { !it.completed && !it.cancelled }
    val urgentCount = items.count { !it.completed && !it.cancelled && it.urgent }
    val completedCount = items.count { it.completed && !it.cancelled }
    val cancelledCount = items.count { it.cancelled }
    val allNonCancelledCount = items.count { !it.cancelled }

    LaunchedEffect(urgentCount, statusFilter) {
        if (statusFilter == AndroidStatusFilter.URGENT && urgentCount == 0) {
            statusFilter = AndroidStatusFilter.PENDING
        }
    }

    val categoryFilteredItems = if (selectedCategoryFilter == null) {
        items
    } else {
        items.filter { it.categoryId == selectedCategoryFilter }
    }

    val displayedItems = when (statusFilter) {
        AndroidStatusFilter.PENDING -> categoryFilteredItems.filter { !it.completed && !it.cancelled }
        AndroidStatusFilter.URGENT -> categoryFilteredItems.filter { !it.completed && !it.cancelled && it.urgent }
        AndroidStatusFilter.COMPLETED -> categoryFilteredItems.filter { it.completed && !it.cancelled }
        AndroidStatusFilter.CANCELLED -> categoryFilteredItems.filter { it.cancelled }
        AndroidStatusFilter.ALL -> categoryFilteredItems.filter { !it.cancelled }
    }
    val categoryMap = remember(categories) { categories.associateBy { it.id } }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = stringResource(R.string.app_name),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = if (isUk) {
                                "$pendingCount до покупки • " + if (isConnected) "Firestore" else "Локально"
                            } else {
                                "$pendingCount active • " + if (isConnected) "Firebase Sync" else "Local Mode"
                            },
                            fontSize = 12.sp,
                            color = if (isConnected) Color(0xFF059669) else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onOpenWeekendTemplate) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = stringResource(R.string.title_weekend_master),
                            tint = Color(0xFFD97706)
                        )
                    }
                    IconButton(onClick = onOpenNotifications) {
                        Icon(
                            Icons.Default.Notifications,
                            contentDescription = stringResource(R.string.title_smart_reminders)
                        )
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = stringResource(R.string.title_settings)
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = Color(0xFF18181B),
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = stringResource(R.string.action_add_item))
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Minimal Weekend Template Shortcut
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .clickable { onOpenWeekendTemplate() },
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAFAFA)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("🛒", fontSize = 22.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = stringResource(R.string.title_weekend_master),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp,
                            color = Color(0xFF18181B)
                        )
                        Text(
                            text = stringResource(R.string.action_apply_template),
                            fontSize = 12.sp,
                            color = Color(0xFF71717A)
                        )
                    }
                    Button(
                        onClick = onOpenWeekendTemplate,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF18181B)),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(stringResource(R.string.action_apply_template), fontSize = 12.sp)
                    }
                }
            }

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
                            Text(
                                if (isUk) "До покупки ($pendingCount)" else "Pending ($pendingCount)",
                                fontSize = 12.sp
                            )
                        }
                    )
                }
                if (urgentCount > 0) {
                    item {
                        FilterChip(
                            selected = statusFilter == AndroidStatusFilter.URGENT,
                            onClick = { statusFilter = AndroidStatusFilter.URGENT },
                            label = {
                                Text(
                                    if (isUk) "Термінові ($urgentCount)" else "Urgent ($urgentCount)",
                                    fontSize = 12.sp
                                )
                            }
                        )
                    }
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.COMPLETED,
                        onClick = { statusFilter = AndroidStatusFilter.COMPLETED },
                        label = {
                            Text(
                                if (isUk) "Куплено ($completedCount)" else "Done ($completedCount)",
                                fontSize = 12.sp
                            )
                        }
                    )
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.CANCELLED,
                        onClick = { statusFilter = AndroidStatusFilter.CANCELLED },
                        label = {
                            Text(
                                if (isUk) "Відмінені ($cancelledCount)" else "Cancelled ($cancelledCount)",
                                fontSize = 12.sp
                            )
                        }
                    )
                }
                item {
                    FilterChip(
                        selected = statusFilter == AndroidStatusFilter.ALL,
                        onClick = { statusFilter = AndroidStatusFilter.ALL },
                        label = {
                            Text(
                                if (isUk) "Всі ($allNonCancelledCount)" else "All ($allNonCancelledCount)",
                                fontSize = 12.sp
                            )
                        }
                    )
                }
            }

            // Category Filter Chips
            if (categories.isNotEmpty()) {
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
                                Text(
                                    if (isUk) "Усі категорії" else "All categories",
                                    fontSize = 12.sp
                                )
                            }
                        )
                    }
                    items(categories, key = { it.id }) { cat ->
                        FilterChip(
                            selected = selectedCategoryFilter == cat.id,
                            onClick = {
                                selectedCategoryFilter = if (selectedCategoryFilter == cat.id) null else cat.id
                            },
                            label = { Text("${cat.icon} ${cat.name}", fontSize = 12.sp) }
                        )
                    }
                }
            }

            // Shopping List
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
                                text = if (isUk) "Куплено: $completedCount" else "Done: $completedCount",
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            TextButton(onClick = onClearCompleted) {
                                Text(
                                    text = if (isUk) "Очистити куплені" else stringResource(R.string.action_clear_completed),
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
                                text = if (isUk) "Відмінені: $cancelledCount" else "Cancelled: $cancelledCount",
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp,
                                color = Color(0xFFB45309)
                            )
                            TextButton(onClick = onClearCancelled) {
                                Text(
                                    text = if (isUk) "Видалити відмінені" else "Clear Cancelled",
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
                                .padding(vertical = 20.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = when (statusFilter) {
                                        AndroidStatusFilter.PENDING -> if (isUk) "Усе куплено! Список порожній" else "Nothing left to buy!"
                                        AndroidStatusFilter.URGENT -> if (isUk) "Термінових товарів немає" else "No urgent items"
                                        AndroidStatusFilter.COMPLETED -> if (isUk) "Ще немає куплених товарів" else "No completed items yet"
                                        AndroidStatusFilter.CANCELLED -> if (isUk) "Відмінених товарів немає" else "No cancelled items"
                                        AndroidStatusFilter.ALL -> if (isUk) "Список порожній" else "List is empty"
                                    },
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF71717A)
                                )
                            }
                        }
                    }
                } else {
                    items(displayedItems, key = { it.id }) { item ->
                        val cat = categoryMap[item.categoryId]
                        ShoppingItemRow(
                            item = item,
                            isUk = isUk,
                            categoryLabel = cat?.let { "${it.icon} ${it.name}" } ?: "",
                            onToggle = { onToggleItem(item) },
                            onCancel = { onCancelItem(item) },
                            onRestore = { onRestoreItem(item) },
                            onDelete = { onDeleteItem(item.id) }
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        val pendingTitles = remember(items) {
            items.filter { !it.completed && !it.cancelled }.map { it.title.trim().lowercase(Locale.getDefault()) }.toSet()
        }
        AddItemDialog(
            categories = categories,
            recentItems = recentItems,
            pendingTitles = pendingTitles,
            defaultCategoryId = selectedCategoryFilter ?: categories.firstOrNull()?.id ?: "cat_produce",
            onDismiss = { showAddDialog = false },
            onConfirm = { title, catId, qty, unit, urgent ->
                onAddItem(title, catId, qty, unit, urgent)
                showAddDialog = false
            }
        )
    }
}

private fun formatAndroidTimestamp(ts: Long): String {
    val itemCal = Calendar.getInstance().apply { timeInMillis = ts }
    val nowCal = Calendar.getInstance()
    val sameDay = itemCal.get(Calendar.YEAR) == nowCal.get(Calendar.YEAR) &&
        itemCal.get(Calendar.DAY_OF_YEAR) == nowCal.get(Calendar.DAY_OF_YEAR)
    val pattern = if (sameDay) "HH:mm" else "dd.MM HH:mm"
    return SimpleDateFormat(pattern, Locale.getDefault()).format(Date(ts))
}

@Composable
fun ShoppingItemRow(
    item: ShoppingItem,
    isUk: Boolean,
    categoryLabel: String,
    onToggle: () -> Unit,
    onCancel: () -> Unit,
    onRestore: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { if (item.cancelled) onRestore() else onToggle() },
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.completed || item.cancelled) Color(0xFFF4F4F5) else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (item.completed || item.cancelled) 0.dp else 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (item.cancelled) {
                IconButton(onClick = onRestore, modifier = Modifier.size(36.dp)) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "Restore",
                        tint = Color(0xFF059669),
                        modifier = Modifier.size(18.dp)
                    )
                }
            } else {
                Checkbox(checked = item.completed, onCheckedChange = { onToggle() })
            }
            Spacer(modifier = Modifier.width(6.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 15.sp,
                    textDecoration = if (item.completed || item.cancelled) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.completed || item.cancelled) Color(0xFF71717A) else Color(0xFF18181B)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (item.quantity > 0 || item.unit.isNotBlank()) {
                        Text(
                            text = "${item.quantity} ${item.unit}".trim(),
                            fontSize = 12.sp,
                            color = Color(0xFF71717A)
                        )
                    }
                    if (categoryLabel.isNotBlank()) {
                        Text(
                            text = categoryLabel,
                            fontSize = 12.sp,
                            color = Color(0xFF71717A)
                        )
                    }
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 2.dp)
                ) {
                    if (item.createdAt > 0L) {
                        Text(
                            text = (if (isUk) "Додано " else "Added ") + formatAndroidTimestamp(item.createdAt),
                            fontSize = 11.sp,
                            color = Color(0xFF71717A)
                        )
                    }
                    if (item.completed && !item.cancelled && item.completedAt != null) {
                        Text(
                            text = (if (isUk) "• Куплено " else "• Bought ") + formatAndroidTimestamp(item.completedAt),
                            fontSize = 11.sp,
                            color = Color(0xFF059669),
                            fontWeight = FontWeight.Medium
                        )
                    }
                    if (item.cancelled && item.cancelledAt != null) {
                        Text(
                            text = (if (isUk) "• Відмінено " else "• Cancelled ") + formatAndroidTimestamp(item.cancelledAt),
                            fontSize = 11.sp,
                            color = Color(0xFFB45309),
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            if (item.urgent && !item.completed && !item.cancelled) {
                Surface(
                    color = Color(0xFFFFE4E6),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "!",
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE11D48)
                    )
                }
            }
            if (!item.cancelled) {
                IconButton(onClick = onCancel, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Default.Block,
                        contentDescription = "Cancel",
                        tint = Color(0xFFD97706),
                        modifier = Modifier.size(17.dp)
                    )
                }
            }
            IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                Icon(
                    Icons.Outlined.Delete,
                    contentDescription = "Delete",
                    tint = Color(0xFFA1A1AA),
                    modifier = Modifier.size(18.dp)
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
    defaultCategoryId: String,
    onDismiss: () -> Unit,
    onConfirm: (String, String, Int, String, Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var dropdownExpanded by remember { mutableStateOf(true) }
    var selectedCategoryId by remember { mutableStateOf(defaultCategoryId) }
    var quantity by remember { mutableIntStateOf(1) }
    var unit by remember { mutableStateOf("pcs") }
    var urgent by remember { mutableStateOf(false) }

    val isUk = remember { Locale.getDefault().language != "en" }
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
        title = { Text(stringResource(R.string.action_add_item), fontWeight = FontWeight.SemiBold) },
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
                    label = { Text(if (isUk) "Додати товар..." else "Add item...") },
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
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0xFFE4E4E7)),
                        shadowElevation = 2.dp
                    ) {
                        Column {
                            Text(
                                text = if (isUk) {
                                    "За порядком використання (${filteredRecent.size})"
                                } else {
                                    "By usage order (${filteredRecent.size})"
                                },
                                fontSize = 11.sp,
                                color = Color(0xFF71717A),
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                            HorizontalDivider(color = Color(0xFFF4F4F5))
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
                                                    false
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
                                            color = Color(0xFF18181B),
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f)
                                        )
                                        if (recent.quantity > 1 || recent.unit != "pcs") {
                                            Text(
                                                text = "${recent.quantity} ${recent.unit}",
                                                fontSize = 11.sp,
                                                color = Color(0xFF71717A)
                                            )
                                        }
                                        if (inList) {
                                            Text(
                                                text = if (isUk) "у списку" else "in list",
                                                fontSize = 11.sp,
                                                color = Color(0xFF059669),
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                        Icon(
                                            Icons.Default.Add,
                                            contentDescription = null,
                                            tint = Color(0xFF059669),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    HorizontalDivider(color = Color(0xFFF4F4F5))
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
                        label = { Text("Qty") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = unit,
                        onValueChange = { unit = it },
                        label = { Text("Unit") },
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
                                label = { Text("${cat.icon} ${cat.name}", fontSize = 11.sp) }
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Urgent", fontSize = 14.sp)
                    Switch(checked = urgent, onCheckedChange = { urgent = it })
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val trimmed = title.trim()
                    if (trimmed.isNotEmpty()) {
                        onConfirm(trimmed, selectedCategoryId, quantity, unit.trim(), urgent)
                    }
                },
                enabled = title.isNotBlank()
            ) {
                Text(stringResource(R.string.action_add_item))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
