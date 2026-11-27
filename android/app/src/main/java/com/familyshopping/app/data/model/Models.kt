package com.familyshopping.app.data.model

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
