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
import com.familyshopping.app.notifications.NotificationScheduler
import com.familyshopping.app.notifications.ShoppingNotifier
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Source
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.util.Collections
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

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _syncError = MutableStateFlow<String?>(null)
    val syncError: StateFlow<String?> = _syncError.asStateFlow()

    private val _recentItems = MutableStateFlow<List<RecentItem>>(prefs.getRecentItems())
    val recentItems: StateFlow<List<RecentItem>> = _recentItems.asStateFlow()

    private val locallyCreatedIds = Collections.synchronizedSet(mutableSetOf<String>())
    private var activeGroupKey: String = ""

    init {
        if (!initializeFirestore()) {
            _items.value = defaultDemoItems()
        }
    }

    private fun normalizedGroupId(config: FirebaseConfig): String =
        config.groupId.trim().ifBlank { "my-family" }

    fun initializeFirestore(): Boolean {
        detachListeners()
        val config = prefs.getFirebaseConfig()
        val apiKey = config.apiKey.trim()
        val projectId = config.projectId.trim()
        val appId = config.appId.trim()
        val storageBucket = config.storageBucket.trim()
        val senderId = config.messagingSenderId.trim()

        if (!config.isConfigured || projectId.isBlank() || apiKey.isBlank() || appId.isBlank()) {
            firestoreInstance = null
            _isConnected.value = false
            _syncError.value = null
            activeGroupKey = ""
            NotificationScheduler.cancelBackgroundItemSync(context)
            return false
        }

        return try {
            val groupId = normalizedGroupId(config)
            activeGroupKey = "${projectId}_$groupId"
            val appName = "app_${projectId}_$groupId"

            val existingApp = try {
                FirebaseApp.getInstance(appName)
            } catch (_: IllegalStateException) {
                null
            }

            val app = if (existingApp != null) {
                val opts = existingApp.options
                val sameCredentials = opts.apiKey == apiKey &&
                    opts.projectId == projectId &&
                    opts.applicationId == appId
                if (sameCredentials) {
                    existingApp
                } else {
                    existingApp.delete()
                    createFirebaseApp(appName, apiKey, projectId, appId, storageBucket, senderId)
                }
            } else {
                createFirebaseApp(appName, apiKey, projectId, appId, storageBucket, senderId)
            }

            val firestore = FirebaseFirestore.getInstance(app)
            firestoreInstance = firestore
            _syncError.value = null
            _isConnected.value = true
            attachListeners(firestore, groupId, projectId)
            NotificationScheduler.scheduleBackgroundItemSync(context)
            true
        } catch (e: Exception) {
            Log.e("ShoppingRepository", "Firestore init failed", e)
            firestoreInstance = null
            _isConnected.value = false
            _syncError.value = e.localizedMessage
            false
        }
    }

    private fun createFirebaseApp(
        appName: String,
        apiKey: String,
        projectId: String,
        appId: String,
        storageBucket: String,
        senderId: String
    ): FirebaseApp {
        val optionsBuilder = FirebaseOptions.Builder()
            .setApiKey(apiKey)
            .setProjectId(projectId)
            .setApplicationId(appId)
        if (storageBucket.isNotBlank()) {
            optionsBuilder.setStorageBucket(storageBucket)
        }
        if (senderId.isNotBlank()) {
            optionsBuilder.setGcmSenderId(senderId)
        }
        return FirebaseApp.initializeApp(context, optionsBuilder.build(), appName)
    }

    private fun attachListeners(firestore: FirebaseFirestore, groupId: String, projectId: String) {
        detachListeners()
        val groupRef = firestore.collection("family_groups").document(groupId)
        val groupKey = "${projectId}_$groupId"

        itemsListener = groupRef.collection("items")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Items listen failed", error)
                    _isConnected.value = false
                    _syncError.value = error.localizedMessage ?: "Sync error"
                    return@addSnapshotListener
                }
                if (snapshot == null) return@addSnapshotListener

                val fetched = snapshot.documents
                    .mapNotNull { it.toShoppingItemSafe() }
                    .sortedByDescending { it.createdAt }

                _items.value = fetched
                _isConnected.value = true
                _syncError.value = null
                mergeRecentFromItems(fetched)
                handleNewItemsNotification(groupKey, fetched, fromCache = snapshot.metadata.isFromCache)
            }

        categoriesListener = groupRef.collection("categories")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.e("ShoppingRepository", "Categories listen failed", error)
                    return@addSnapshotListener
                }
                val fetched = snapshot?.documents
                    ?.mapNotNull { it.toCategorySafe() }
                    ?.sortedBy { it.order }
                    ?: emptyList()
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
                val fetched = snapshot?.documents
                    ?.mapNotNull { it.toTemplateSafe() }
                    ?: emptyList()
                if (fetched.isNotEmpty()) {
                    _templates.value = fetched
                }
            }
    }

    private fun handleNewItemsNotification(
        groupKey: String,
        fetched: List<ShoppingItem>,
        fromCache: Boolean
    ) {
        if (groupKey.isBlank()) return
        val allIds = fetched.map { it.id }.toSet()

        if (!prefs.hasKnownItemsSeeded(groupKey)) {
            if (!fromCache || fetched.isNotEmpty()) {
                prefs.saveKnownItemIds(groupKey, allIds)
                prefs.markKnownItemsSeeded(groupKey)
            }
            return
        }

        val knownIds = prefs.getKnownItemIds(groupKey)
        val brandNewPending = fetched.filter { item ->
            !item.completed &&
                !item.cancelled &&
                item.id !in knownIds &&
                item.id !in locallyCreatedIds
        }

        if (brandNewPending.isNotEmpty() && !fromCache) {
            ShoppingNotifier.showNewItemsNotification(context, brandNewPending)
        }

        if (allIds.isNotEmpty()) {
            prefs.addKnownItemIds(groupKey, allIds)
        }
    }

    suspend fun refreshFromServer(): Result<Unit> {
        _isRefreshing.value = true
        return try {
            val config = prefs.getFirebaseConfig()
            val apiKey = config.apiKey.trim()
            val projectId = config.projectId.trim()
            val appId = config.appId.trim()
            if (!config.isConfigured || apiKey.isBlank() || projectId.isBlank() || appId.isBlank()) {
                return Result.failure(IllegalStateException("Firebase is not configured"))
            }

            if (firestoreInstance == null) {
                initializeFirestore()
            }
            val firestore = firestoreInstance
                ?: return Result.failure(IllegalStateException("Firestore unavailable"))

            val groupId = normalizedGroupId(config)
            val groupKey = "${projectId}_$groupId"
            val groupRef = firestore.collection("family_groups").document(groupId)

            runCatching { firestore.enableNetwork().await() }

            val itemsSnap = groupRef.collection("items").get(Source.SERVER).await()
            val fetchedItems = itemsSnap.documents
                .mapNotNull { it.toShoppingItemSafe() }
                .sortedByDescending { it.createdAt }

            _items.value = fetchedItems
            mergeRecentFromItems(fetchedItems)
            handleNewItemsNotification(groupKey, fetchedItems, fromCache = false)

            runCatching {
                val catsSnap = groupRef.collection("categories").get(Source.SERVER).await()
                val fetchedCats = catsSnap.documents
                    .mapNotNull { it.toCategorySafe() }
                    .sortedBy { it.order }
                if (fetchedCats.isNotEmpty()) {
                    _categories.value = fetchedCats
                }
            }

            runCatching {
                val tmplsSnap = groupRef.collection("templates").get(Source.SERVER).await()
                val fetchedTmpls = tmplsSnap.documents.mapNotNull { it.toTemplateSafe() }
                if (fetchedTmpls.isNotEmpty()) {
                    _templates.value = fetchedTmpls
                }
            }

            _isConnected.value = true
            _syncError.value = null
            attachListeners(firestore, groupId, projectId)
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("ShoppingRepository", "Manual server refresh failed", e)
            _syncError.value = e.localizedMessage ?: "Refresh failed"
            Result.failure(e)
        } finally {
            _isRefreshing.value = false
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
        var testApp: FirebaseApp? = null
        return try {
            val groupId = normalizedGroupId(config)
            val testAppName = "test_${config.projectId.trim()}_${System.currentTimeMillis()}"
            val options = FirebaseOptions.Builder()
                .setApiKey(config.apiKey.trim())
                .setProjectId(config.projectId.trim())
                .setApplicationId(config.appId.trim())
                .build()
            testApp = FirebaseApp.initializeApp(context, options, testAppName)
            val db = FirebaseFirestore.getInstance(testApp)
            db.collection("family_groups")
                .document(groupId)
                .collection("items")
                .limit(1)
                .get(Source.SERVER)
                .await()
            Result.success("Connected to ${config.projectId.trim()} ($groupId)")
        } catch (e: Exception) {
            Result.failure(e)
        } finally {
            runCatching { testApp?.delete() }
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
        locallyCreatedIds.add(item.id)
        if (activeGroupKey.isNotBlank()) {
            prefs.addKnownItemIds(activeGroupKey, listOf(item.id))
        }
        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = listOf(item) + _items.value
            return
        }
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
        firestore.collection("family_groups")
            .document(groupId)
            .collection("items")
            .document(item.id)
            .set(item.toFirestoreMap())
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
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
            locallyCreatedIds.add(ni.id)
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
        if (activeGroupKey.isNotBlank()) {
            prefs.addKnownItemIds(activeGroupKey, newItems.map { it.id })
        }

        val firestore = firestoreInstance
        if (firestore == null) {
            _items.value = if (mergeMode) newItems + _items.value else newItems
            return
        }

        val groupId = normalizedGroupId(prefs.getFirebaseConfig())
        val batch = firestore.batch()
        val itemsCol = firestore.collection("family_groups").document(groupId).collection("items")

        if (!mergeMode) {
            val existing = itemsCol.get().await()
            existing.documents.forEach { batch.delete(it.reference) }
        }

        newItems.forEach { newItem ->
            batch.set(itemsCol.document(newItem.id), newItem.toFirestoreMap())
        }

        batch.commit().await()
    }

    private fun ShoppingItem.toFirestoreMap(): Map<String, Any> {
        val map = hashMapOf<String, Any>(
            "title" to title,
            "categoryId" to categoryId,
            "quantity" to quantity,
            "unit" to unit,
            "completed" to completed,
            "cancelled" to cancelled,
            "createdAt" to createdAt,
            "urgent" to urgent
        )
        note?.takeIf { it.isNotBlank() }?.let { map["note"] = it }
        completedAt?.let { map["completedAt"] = it }
        cancelledAt?.let { map["cancelledAt"] = it }
        addedBy?.takeIf { it.isNotBlank() }?.let { map["addedBy"] = it }
        estimatedPrice?.let { map["estimatedPrice"] = it }
        return map
    }

    private fun DocumentSnapshot.toShoppingItemSafe(): ShoppingItem? {
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

    private fun DocumentSnapshot.toCategorySafe(): Category? {
        val name = getString("name")?.trim() ?: return null
        return Category(
            id = id,
            name = name,
            icon = getString("icon") ?: "🛒",
            color = getString("color") ?: "#10b981",
            order = (get("order") as? Number)?.toInt() ?: 0
        )
    }

    private fun DocumentSnapshot.toTemplateSafe(): ShoppingTemplate? {
        val name = getString("name")?.trim() ?: return null
        @Suppress("UNCHECKED_CAST")
        val rawItems = (get("items") as? List<Map<String, Any?>>).orEmpty()
        val parsedItems = rawItems.mapNotNull { entry ->
            val tTitle = (entry["title"] as? String)?.trim()
            if (tTitle.isNullOrEmpty()) null
            else TemplateItem(
                title = tTitle,
                categoryId = (entry["categoryId"] as? String) ?: "cat_produce",
                quantity = (entry["quantity"] as? Number)?.toInt() ?: 1,
                unit = (entry["unit"] as? String) ?: "pcs",
                note = entry["note"] as? String,
                urgent = (entry["urgent"] as? Boolean) ?: false,
                estimatedPrice = (entry["estimatedPrice"] as? Number)?.toDouble()
            )
        }
        return ShoppingTemplate(
            id = id,
            name = name,
            description = getString("description") ?: "",
            icon = getString("icon") ?: "🛒",
            tag = getString("tag") ?: "Weekend",
            items = parsedItems,
            createdAt = (get("createdAt") as? Number)?.toLong() ?: 0L,
            lastUsedAt = (get("lastUsedAt") as? Number)?.toLong()
        )
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
