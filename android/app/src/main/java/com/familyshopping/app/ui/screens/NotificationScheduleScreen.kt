package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.NotificationSchedule
import com.familyshopping.app.ui.AppStrings

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScheduleScreen(
    schedules: List<NotificationSchedule>,
    categories: List<Category>,
    lang: String,
    onToggleSchedule: (NotificationSchedule) -> Unit,
    onSaveSchedule: (NotificationSchedule) -> Unit,
    onTestScheduleNow: (NotificationSchedule) -> Unit,
    onBack: () -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(AppStrings.remindersTitle(lang), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = Color(0xFF18181B),
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add schedule")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF4F4F5)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Notifications, contentDescription = null, tint = Color(0xFF18181B))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = AppStrings.remindersDesc(lang),
                            fontSize = 12.sp,
                            color = Color(0xFF52525B)
                        )
                    }
                }
            }

            items(schedules, key = { it.id }) { schedule ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(schedule.title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                Text(
                                    text = schedule.time,
                                    fontSize = 13.sp,
                                    color = Color(0xFF059669),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Switch(
                                checked = schedule.active,
                                onCheckedChange = { onToggleSchedule(schedule) }
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        val catSummary = if (schedule.categoryIds.isEmpty()) {
                            AppStrings.allCategories(lang)
                        } else {
                            schedule.categoryIds.joinToString(", ") { id ->
                                categories.find { it.id == id }?.let { AppStrings.categoryName(it, lang) } ?: id
                            }
                        }
                        Text(
                            text = catSummary,
                            fontSize = 12.sp,
                            color = Color(0xFF71717A)
                        )

                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = { onTestScheduleNow(schedule) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(AppStrings.checkNowBtn(lang), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateScheduleDialog(
            categories = categories,
            lang = lang,
            onDismiss = { showCreateDialog = false },
            onSave = { title, time, selectedCats ->
                val newSchedule = NotificationSchedule(
                    id = "sched_${System.currentTimeMillis()}",
                    title = title,
                    time = time,
                    categoryIds = selectedCats,
                    active = true
                )
                onSaveSchedule(newSchedule)
                showCreateDialog = false
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CreateScheduleDialog(
    categories: List<Category>,
    lang: String,
    onDismiss: () -> Unit,
    onSave: (String, String, List<String>) -> Unit
) {
    var title by remember { mutableStateOf("Shopping Reminder") }
    var time by remember { mutableStateOf("17:30") }
    val selectedCategoryIds = remember { mutableStateListOf<String>() }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(AppStrings.remindersTitle(lang), fontWeight = FontWeight.SemiBold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Label") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Time (HH:mm)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = selectedCategoryIds.contains(cat.id)
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                if (isSelected) selectedCategoryIds.remove(cat.id)
                                else selectedCategoryIds.add(cat.id)
                            },
                            label = { Text("${cat.icon} ${AppStrings.categoryName(cat, lang)}", fontSize = 11.sp) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onSave(title.trim(), time.trim().ifBlank { "17:30" }, selectedCategoryIds.toList())
                    }
                }
            ) {
                Text(AppStrings.saveBtn(lang))
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(AppStrings.cancelButton(lang))
            }
        }
    )
}
