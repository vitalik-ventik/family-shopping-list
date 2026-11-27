package com.familyshopping.app.data.repository

import android.content.Context
import android.util.Log
import com.familyshopping.app.data.local.PreferencesManager
import com.familyshopping.app.data.model.Category
import com.familyshopping.app.data.model.FirebaseConfig
import com.familyshopping.app.data.model.RecentItem
import com.familyshopping.app.data.model.ShoppingItem
import com.familyshopping.app.data.model.ShoppingTemplate
import com.familyshopping.app.data.model.TemplateItem
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.util.Locale

class ShoppingRepository(private val context: Context) {

    private val prefs = PreferencesManager(context)
    private var firestoreInstance: FirebaseFirestore? = null

    private var itemsListener: ListenerRegistration? = null
    private var categoriesListener: ListenerRegistration? = null
    private var templatesListener: ListenerRegistration? = null

    private val _items = MutableStateFlow<List<ShoppingItem>>(emptyList())
    val items: StateFlow<List<ShoppingItem>> = _items.asStateFlow()

    private val _categories = MutableStateFlow<List<Category>>(defaultCategories())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()

    private val _templates = MutableStateFlow<List<ShoppingTemplate>>(defaultTemplates())
    val templates: StateFlow<List<ShoppingTemplate>> = _templates.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _recentItems = MutableStateFlow<List<RecentItem>>(prefs.getRecentItems())
    val recentItems: StateFlow<List<RecentItem>> = _recentItems.asStateFlow()

    init {
        if (!initializeFirestore()) {
            _items.value = defaultDemoItems()
        }
    }

    fun initializeFirestore(): Boolean {
        detachListeners()
        val config = prefs.getFirebaseConfig()
        if (!config.isConfigured || config.projectId.isBlank() || config.apiKey.isBlank() || config.appId.isBlank()) {
            firestoreInstance = null
            _isConnected.value = false
            return false
        }

        return try {
            val groupId = config.groupId.ifBlank { "default-family" }
            val appName = "app_${config.projectId}_$groupId"
            val app = try {
                FirebaseApp.getInstance(appName)
            } catch (_: IllegalStateException) {
                val optionsBuilder = FirebaseOptions.Builder()
                    .setApiKey(config.apiKey)
                    .setProjectId(config.projectId)
                    .setApplicationId(config.appId)
                if (config.storageBucket.isNotBlank()) {
                    optionsBuilder.setStorageBucket(config.storageBucket)
                }
                FirebaseApp.initializeApp(context, optionsBuilder.build(), appName)
            }
            val firestore = FirebaseFirestore.getInstance(app)
            firestoreInstance = firestore
            _isConnected.value = true
            attachListeners(firestore, groupId)
            true
        } catch (e: Exception) {
            Log.e("ShoppingRepository", "Firestore init failed", e)
            firestoreInstance = null
            _isConnected.value = false
            false
        }
    }

    private fun attachListeners(firestore: FirebaseFirestore, groupId: String) {
        val groupRef = firestore.collection("family_groups").document(groupId)

        itemsListener = groupRef.collection("items")
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Items listen failed", error)
                    return@addSnapshotListener
                }
                val fetched = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(ShoppingItem::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                _items.value = fetched
                mergeRecentFromItems(fetched)
            }

        categoriesListener = groupRef.collection("categories")
            .orderBy("order")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Categories listen failed", error)
                    return@addSnapshotListener
                }
                val fetched = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Category::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                if (fetched.isNotEmpty()) {
                    _categories.value = fetched
                }
            }

        templatesListener = groupRef.collection("templates")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Templates listen failed", error)
                    return@addSnapshotListener
                }
                val fetched = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(ShoppingTemplate::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                if (fetched.isNotEmpty()) {
                    _templates.value = fetched
                }
            }
    }

    private fun detachListeners() {
        itemsListener?.remove()
        categoriesListener?.remove()
        templatesListener?.remove()
        itemsListener = null
        categoriesListener = null
        templatesListener = null
    }

    suspend fun testConnection(config: FirebaseConfig): Result<String> {
        if (config.apiKey.isBlank() || config.projectId.isBlank() || config.appId.isBlank()) {
            return Result.failure(IllegalArgumentException("API Key, Project ID, and App ID are required"))
        }
        return try {
            val groupId = config.groupId.ifBlank { "default-family" }
            val testAppName = "test_${config.projectId}_${System.currentTimeMillis()}"
            val options = FirebaseOptions.Builder()
                .setApiKey(config.apiKey.trim())
                .setProjectId(config.projectId.trim())
                .setApplicationId(config.appId.trim())
                .build()
            val app = FirebaseApp.initializeApp(context, options, testAppName)
            val db = FirebaseFirestore.getInstance(app)
            db.collection("family_groups")
                .document(groupId)
                .collection("items")
                .limit(1)
                .get()
                .await()
            app.delete()
            Result.success("Connected to ${config.projectId} ($groupId)")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleItem(item: ShoppingItem) {
        _recentItems.value = prefs.recordRecentItem(
            RecentItem(
                title = item.title,
                categoryId = item.categoryId,
                quantity = item.quantity,
                unit = item.unit,
                lastUsedAt = System.currentTimeMillis()
            )
        )
        val firestore = firestoreInstance
        val newCompleted = !item.completed
        val newCompletedAt = if (newCompleted) System.currentTimeMillis() else null
        if (firestore == null) {
            _items.value = _items.value.map {
                if (it.id == item.id) {
                    it.copy(
                        completed = newCompleted,
                        completedAt = newCompletedAt,
                        cancelled = false,
                        cancelledAt = null
                    )
                } else it
            }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .update(
                mapOf(
                    "completed" to newCompleted,
                    "completedAt" to newCompletedAt,
                    "cancelled" to false,
                    "cancelledAt" to null
                )
            )
            .await()
    }

    suspend fun cancelItem(item: ShoppingItem) {
        val now = System.currentTimeMillis()
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value.map {
                if (it.id == item.id) {
                    it.copy(
                        cancelled = true,
                        cancelledAt = now,
                        completed = false,
                        completedAt = null
                    )
                } else it
            }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .update(
                mapOf(
                    "cancelled" to true,
                    "cancelledAt" to now,
                    "completed" to false,
                    "completedAt" to null
                )
            )
            .await()
    }

    suspend fun restoreItem(item: ShoppingItem) {
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value.map {
                if (it.id == item.id) {
                    it.copy(cancelled = false, cancelledAt = null)
                } else it
            }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .update(
                mapOf(
                    "cancelled" to false,
                    "cancelledAt" to null
                )
            )
            .await()
    }

    suspend fun addItem(item: ShoppingItem) {
        _recentItems.value = prefs.recordRecentItem(
            RecentItem(
                title = item.title,
                categoryId = item.categoryId,
                quantity = item.quantity,
                unit = item.unit
            )
        )
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value + item
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .set(item)
            .await()
    }

    private fun mergeRecentFromItems(items: List<ShoppingItem>) {
        val byKey = linkedMapOf<String, RecentItem>()
        _recentItems.value.forEach { existing ->
            val key = existing.title.trim().lowercase(Locale.getDefault())
            if (key.isNotEmpty()) {
                val prev = byKey[key]
                if (prev == null || existing.lastUsedAt > prev.lastUsedAt) {
                    byKey[key] = existing.copy(title = existing.title.trim())
                }
            }
        }

        var changed = false
        items.forEach { item ->
            val cleanTitle = item.title.trim()
            val key = cleanTitle.lowercase(Locale.getDefault())
            if (key.isNotEmpty()) {
                val usedAt = maxOf(item.completedAt ?: 0L, item.createdAt)
                val existing = byKey[key]
                if (existing == null) {
                    byKey[key] = RecentItem(
                        title = cleanTitle,
                        categoryId = item.categoryId,
                        quantity = item.quantity,
                        unit = item.unit,
                        lastUsedAt = usedAt
                    )
                    changed = true
                } else if (usedAt > existing.lastUsedAt) {
                    byKey[key] = existing.copy(
                        title = cleanTitle,
                        categoryId = item.categoryId.ifBlank { existing.categoryId },
                        quantity = item.quantity.coerceAtLeast(1),
                        unit = item.unit.ifBlank { existing.unit },
                        lastUsedAt = usedAt
                    )
                    changed = true
                }
            }
        }

        if (changed) {
            val merged = byKey.values
                .sortedByDescending { it.lastUsedAt }
                .take(500)
            prefs.saveRecentItems(merged)
            _recentItems.value = merged
        }
    }

    suspend fun deleteItem(itemId: String) {
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value.filterNot { it.id == itemId }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(itemId)
            .delete()
            .await()
    }

    suspend fun clearCompletedItems() {
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value.filterNot { it.completed && !it.cancelled }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        val completed = firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .whereEqualTo("completed", true)
            .get()
            .await()

        val batch = firestore.batch()
        completed.documents
            .filter { it.getBoolean("cancelled") != true }
            .forEach { batch.delete(it.reference) }
        batch.commit().await()
    }

    suspend fun clearCancelledItems() {
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = _items.value.filterNot { it.cancelled }
            return
        }
        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        val cancelled = firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .whereEqualTo("cancelled", true)
            .get()
            .await()

        val batch = firestore.batch()
        cancelled.documents.forEach { batch.delete(it.reference) }
        batch.commit().await()
    }

    suspend fun applyWeekendTemplate(template: ShoppingTemplate, mergeMode: Boolean = true) {
        val now = System.currentTimeMillis()
        val newItems = template.items.mapIndexed { index, tmplItem ->
            ShoppingItem(
                id = "item_tmpl_${now}_$index",
                title = tmplItem.title,
                categoryId = tmplItem.categoryId,
                quantity = tmplItem.quantity,
                unit = tmplItem.unit,
                note = tmplItem.note,
                urgent = tmplItem.urgent,
                estimatedPrice = tmplItem.estimatedPrice,
                completed = false,
                createdAt = now + index * 10L,
                addedBy = "Template"
            )
        }

        newItems.forEach { ni ->
            _recentItems.value = prefs.recordRecentItem(
                RecentItem(
                    title = ni.title,
                    categoryId = ni.categoryId,
                    quantity = ni.quantity,
                    unit = ni.unit,
                    lastUsedAt = ni.createdAt
                )
            )
        }

        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = if (mergeMode) _items.value + newItems else newItems
            return
        }

        val groupId = prefs.getFirebaseConfig().groupId.ifBlank { "default-family" }
        val batch = firestore.batch()
        val itemsCol = firestore.collection("family_groups").document(groupId).collection("items")

        if (!mergeMode) {
            val existing = itemsCol.get().await()
            existing.documents.forEach { batch.delete(it.reference) }
        }

        newItems.forEach { newItem ->
            batch.set(itemsCol.document(newItem.id), newItem)
        }

        batch.commit().await()
    }

    private fun isUk(): Boolean = Locale.getDefault().language != "en"

    private fun defaultCategories(): List<Category> {
        val uk = isUk()
        return listOf(
            Category("cat_produce", if (uk) "Овочі та фрукти" else "Produce", "🥬", "#10b981", 0),
            Category("cat_dairy", if (uk) "Молочні та яйця" else "Dairy & Eggs", "🥛", "#3b82f6", 1),
            Category("cat_bakery", if (uk) "Випічка та хліб" else "Bakery", "🥖", "#f59e0b", 2),
            Category("cat_meat", if (uk) "М'ясо та риба" else "Meat & Seafood", "🥩", "#ef4444", 3),
            Category("cat_pantry", if (uk) "Бакалія та крупи" else "Pantry", "🍝", "#8b5cf6", 4),
            Category("cat_frozen", if (uk) "Заморозка" else "Frozen", "❄️", "#06b6d4", 5),
            Category("cat_household", if (uk) "Побутова хімія" else "Household", "🧴", "#ec4899", 6),
            Category("cat_personal", if (uk) "Гігієна" else "Personal Care", "🧼", "#6366f1", 7)
        )
    }

    private fun defaultTemplates(): List<ShoppingTemplate> {
        val uk = isUk()
        return if (uk) {
            listOf(
                ShoppingTemplate(
                    id = "tmpl_weekend",
                    name = "Великі закупи на вихідні",
                    description = "Повний набір продуктів для сім'ї на весь тиждень.",
                    icon = "🛒",
                    tag = "Вихідні",
                    items = listOf(
                        TemplateItem("Банани", "cat_produce", 1, "кг"),
                        TemplateItem("Помідори", "cat_produce", 1, "кг"),
                        TemplateItem("Молоко 2.5%", "cat_dairy", 2, "л", urgent = true),
                        TemplateItem("Яйця С0", "cat_dairy", 1, "дес"),
                        TemplateItem("Хліб житній", "cat_bakery", 1, "шт"),
                        TemplateItem("Куряче філе", "cat_meat", 1, "кг"),
                        TemplateItem("Гречка", "cat_pantry", 1, "кг")
                    )
                ),
                ShoppingTemplate(
                    id = "tmpl_household",
                    name = "Побутова хімія та дім",
                    description = "Регулярне поповнення засобів для прання та чистоти.",
                    icon = "🧹",
                    tag = "Дім",
                    items = listOf(
                        TemplateItem("Засіб для миття посуду", "cat_household", 1, "шт"),
                        TemplateItem("Капсули для прання", "cat_household", 1, "уп"),
                        TemplateItem("Паперові рушники", "cat_household", 2, "шт"),
                        TemplateItem("Зубна паста", "cat_personal", 1, "шт")
                    )
                )
            )
        } else {
            listOf(
                ShoppingTemplate(
                    id = "tmpl_weekend",
                    name = "Big Weekend Grocery Run",
                    description = "Complete weekly family staples across produce, dairy, and pantry.",
                    icon = "🛒",
                    tag = "Weekend",
                    items = listOf(
                        TemplateItem("Bananas", "cat_produce", 1, "bunch"),
                        TemplateItem("Tomatoes", "cat_produce", 1, "kg"),
                        TemplateItem("Milk 2.5%", "cat_dairy", 2, "L", urgent = true),
                        TemplateItem("Free-range Eggs", "cat_dairy", 12, "pcs"),
                        TemplateItem("Sourdough Bread", "cat_bakery", 1, "loaf"),
                        TemplateItem("Chicken Breast", "cat_meat", 1, "kg"),
                        TemplateItem("Pasta", "cat_pantry", 2, "pack")
                    )
                ),
                ShoppingTemplate(
                    id = "tmpl_household",
                    name = "Household & Care Restock",
                    description = "Essential home cleaning and personal care supplies.",
                    icon = "🧹",
                    tag = "Household",
                    items = listOf(
                        TemplateItem("Dish Soap", "cat_household", 1, "bottle"),
                        TemplateItem("Laundry Detergent", "cat_household", 1, "pack"),
                        TemplateItem("Paper Towels", "cat_household", 2, "rolls"),
                        TemplateItem("Toothpaste", "cat_personal", 1, "tube")
                    )
                )
            )
        }
    }

    private fun defaultDemoItems(): List<ShoppingItem> {
        val uk = isUk()
        return listOf(
            ShoppingItem(
                id = "demo_1",
                title = if (uk) "Молоко 2.5%" else "Whole Milk",
                categoryId = "cat_dairy",
                quantity = 2,
                unit = if (uk) "л" else "L",
                urgent = true
            ),
            ShoppingItem(
                id = "demo_2",
                title = if (uk) "Свіжий хліб" else "Fresh Bread",
                categoryId = "cat_bakery",
                quantity = 1,
                unit = if (uk) "шт" else "loaf"
            ),
            ShoppingItem(
                id = "demo_3",
                title = if (uk) "Засіб для посуду" else "Dish Soap",
                categoryId = "cat_household",
                quantity = 1,
                unit = if (uk) "шт" else "pcs"
            )
        )
    }
}
