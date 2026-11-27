package com.familyshopping.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Notifications
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.R
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.ShoppingItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListScreen(
    items: List<ShoppingItem>,
    categories: List<Category>,
    isConnected: Boolean,
    onToggleItem: (ShoppingItem) -> Unit,
    onAddItem: (String, String, Int, String, Boolean) -> Unit,
    onDeleteItem: (String) -> Unit,
    onClearCompleted: () -> Unit,
    onOpenWeekendTemplate: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var selectedCategoryFilter by remember { mutableStateOf<String?>(null) }

    val filteredItems = if (selectedCategoryFilter == null) {
        items
    } else {
        items.filter { it.categoryId == selectedCategoryFilter }
    }

    val uncompletedItems = filteredItems.filter { !it.completed }
    val completedItems = filteredItems.filter { it.completed }
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
                            text = "${items.count { !it.completed }} active • " +
                                if (isConnected) "Firebase Sync" else "Local Mode",
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

            // Category Filter Chips
            if (categories.isNotEmpty()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedCategoryFilter == null,
                            onClick = { selectedCategoryFilter = null },
                            label = { Text("All (${items.count { !it.completed }})", fontSize = 12.sp) }
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
                items(uncompletedItems, key = { it.id }) { item ->
                    val cat = categoryMap[item.categoryId]
                    ShoppingItemRow(
                        item = item,
                        categoryLabel = cat?.let { "${it.icon} ${it.name}" } ?: "",
                        onToggle = { onToggleItem(item) },
                        onDelete = { onDeleteItem(item.id) }
                    )
                }

                if (completedItems.isNotEmpty()) {
                    item {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp, bottom = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Done (${completedItems.size})",
                                fontWeight = FontWeight.Medium,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            TextButton(onClick = onClearCompleted) {
                                Text(
                                    text = stringResource(R.string.action_clear_completed),
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }

                    items(completedItems, key = { it.id }) { item ->
                        val cat = categoryMap[item.categoryId]
                        ShoppingItemRow(
                            item = item,
                            categoryLabel = cat?.let { "${it.icon} ${it.name}" } ?: "",
                            onToggle = { onToggleItem(item) },
                            onDelete = { onDeleteItem(item.id) }
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddItemDialog(
            categories = categories,
            defaultCategoryId = selectedCategoryFilter ?: categories.firstOrNull()?.id ?: "cat_produce",
            onDismiss = { showAddDialog = false },
            onConfirm = { title, catId, qty, unit, urgent ->
                onAddItem(title, catId, qty, unit, urgent)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun ShoppingItemRow(
    item: ShoppingItem,
    categoryLabel: String,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() },
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.completed) Color(0xFFF4F4F5) else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (item.completed) 0.dp else 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(checked = item.completed, onCheckedChange = { onToggle() })
            Spacer(modifier = Modifier.width(6.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    fontWeight = FontWeight.Medium,
                    fontSize = 15.sp,
                    textDecoration = if (item.completed) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.completed) Color(0xFF71717A) else Color(0xFF18181B)
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
            }
            if (item.urgent && !item.completed) {
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
    defaultCategoryId: String,
    onDismiss: () -> Unit,
    onConfirm: (String, String, Int, String, Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf(defaultCategoryId) }
    var quantity by remember { mutableIntStateOf(1) }
    var unit by remember { mutableStateOf("pcs") }
    var urgent by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.action_add_item), fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Item name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

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
