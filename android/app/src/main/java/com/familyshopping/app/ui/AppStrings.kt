package com.familyshopping.app.ui

import com.familyshopping.app.data.model.Category

object AppStrings {
    fun langCodeLabel(lang: String): String = when (lang) {
        "ru" -> "RU"
        "en" -> "EN"
        else -> "UA"
    }

    fun appName(lang: String): String = when (lang) {
        "ru" -> "FamilyCart"
        "en" -> "FamilyCart"
        else -> "FamilyCart"
    }

    fun subtitleStatus(lang: String, pendingCount: Int, isConnected: Boolean): String = when (lang) {
        "ru" -> "$pendingCount купить • " + if (isConnected) "Firestore" else "Локально"
        "en" -> "$pendingCount active • " + if (isConnected) "Firebase Sync" else "Local Mode"
        else -> "$pendingCount до покупки • " + if (isConnected) "Firestore" else "Локально"
    }

    fun weekendMasterTitle(lang: String): String = when (lang) {
        "ru" -> "Мастер выходных"
        "en" -> "Weekend Master"
        else -> "Майстер вихідних"
    }

    fun loadOneTap(lang: String): String = when (lang) {
        "ru" -> "В 1 клик"
        "en" -> "Load 1-Tap"
        else -> "В 1 клік"
    }

    fun statusPending(lang: String, count: Int): String = when (lang) {
        "ru" -> "Нужно купить ($count)"
        "en" -> "Pending ($count)"
        else -> "До покупки ($count)"
    }

    fun statusUrgent(lang: String, count: Int): String = when (lang) {
        "ru" -> "Срочно ($count)"
        "en" -> "Urgent ($count)"
        else -> "Термінові ($count)"
    }

    fun statusCompleted(lang: String, count: Int): String = when (lang) {
        "ru" -> "Куплено ($count)"
        "en" -> "Done ($count)"
        else -> "Куплено ($count)"
    }

    fun statusCancelled(lang: String, count: Int): String = when (lang) {
        "ru" -> "Отменённые ($count)"
        "en" -> "Cancelled ($count)"
        else -> "Відмінені ($count)"
    }

    fun statusAll(lang: String, count: Int): String = when (lang) {
        "ru" -> "Все ($count)"
        "en" -> "All ($count)"
        else -> "Всі ($count)"
    }

    fun allCategories(lang: String): String = when (lang) {
        "ru" -> "Все категории"
        "en" -> "All categories"
        else -> "Усі категорії"
    }

    fun doneHeader(lang: String, count: Int): String = when (lang) {
        "ru" -> "Куплено: $count"
        "en" -> "Done: $count"
        else -> "Куплено: $count"
    }

    fun clearDone(lang: String): String = when (lang) {
        "ru" -> "Очистить купленные"
        "en" -> "Clear Done"
        else -> "Очистити куплені"
    }

    fun cancelledHeader(lang: String, count: Int): String = when (lang) {
        "ru" -> "Отменённые: $count"
        "en" -> "Cancelled: $count"
        else -> "Відмінені: $count"
    }

    fun clearCancelled(lang: String): String = when (lang) {
        "ru" -> "Удалить отменённые"
        "en" -> "Clear Cancelled"
        else -> "Видалити відмінені"
    }

    fun emptyMessage(lang: String, filterName: String): String = when (filterName) {
        "PENDING" -> when (lang) {
            "ru" -> "Всё куплено! Список пуст"
            "en" -> "Nothing left to buy!"
            else -> "Усе куплено! Список порожній"
        }
        "URGENT" -> when (lang) {
            "ru" -> "Срочных товаров нет"
            "en" -> "No urgent items"
            else -> "Термінових товарів немає"
        }
        "COMPLETED" -> when (lang) {
            "ru" -> "Купленных товаров пока нет"
            "en" -> "No completed items yet"
            else -> "Ще немає куплених товарів"
        }
        "CANCELLED" -> when (lang) {
            "ru" -> "Отменённых товаров нет"
            "en" -> "No cancelled items"
            else -> "Відмінених товарів немає"
        }
        else -> when (lang) {
            "ru" -> "Список пуст"
            "en" -> "List is empty"
            else -> "Список порожній"
        }
    }

    fun addedPrefix(lang: String): String = when (lang) {
        "ru" -> "Добавлено "
        "en" -> "Added "
        else -> "Додано "
    }

    fun boughtPrefix(lang: String): String = when (lang) {
        "ru" -> "• Куплено "
        "en" -> "• Bought "
        else -> "• Куплено "
    }

    fun cancelledPrefix(lang: String): String = when (lang) {
        "ru" -> "• Отменено "
        "en" -> "• Cancelled "
        else -> "• Відмінено "
    }

    fun addItemTitle(lang: String): String = when (lang) {
        "ru" -> "Добавить"
        "en" -> "Add"
        else -> "Додати"
    }

    fun addItemPlaceholder(lang: String): String = when (lang) {
        "ru" -> "Добавить товар..."
        "en" -> "Add item..."
        else -> "Додати товар..."
    }

    fun usageOrderLabel(lang: String, count: Int): String = when (lang) {
        "ru" -> "По порядку использования ($count)"
        "en" -> "By usage order ($count)"
        else -> "За порядком використання ($count)"
    }

    fun inListBadge(lang: String): String = when (lang) {
        "ru" -> "в списке"
        "en" -> "in list"
        else -> "у списку"
    }

    fun qtyLabel(lang: String): String = when (lang) {
        "ru" -> "Кол-во"
        "en" -> "Qty"
        else -> "К-сть"
    }

    fun unitLabel(lang: String): String = when (lang) {
        "ru" -> "Ед."
        "en" -> "Unit"
        else -> "Од."
    }

    fun urgentLabel(lang: String): String = when (lang) {
        "ru" -> "Срочно"
        "en" -> "Urgent"
        else -> "Терміново"
    }

    fun cancelButton(lang: String): String = when (lang) {
        "ru" -> "Отмена"
        "en" -> "Cancel"
        else -> "Скасувати"
    }

    // Confirm dialogs
    fun confirmCancelTitle(lang: String): String = when (lang) {
        "ru" -> "Отменить позицию?"
        "en" -> "Cancel item?"
        else -> "Відмінити позицію?"
    }

    fun confirmCancelBody(lang: String, title: String): String = when (lang) {
        "ru" -> "«$title» будет перенесено в раздел «Отменённые»."
        "en" -> "\"$title\" will be moved to Cancelled."
        else -> "«$title» буде перенесено до розділу «Відмінені»."
    }

    fun confirmCancelBtn(lang: String): String = when (lang) {
        "ru" -> "Да, отменить"
        "en" -> "Yes, cancel"
        else -> "Так, відмінити"
    }

    fun confirmDeleteTitle(lang: String): String = when (lang) {
        "ru" -> "Удалить навсегда?"
        "en" -> "Delete permanently?"
        else -> "Видалити назавжди?"
    }

    fun confirmDeleteBody(lang: String, title: String): String = when (lang) {
        "ru" -> "Удалить «$title» из списка?"
        "en" -> "Permanently delete \"$title\" from the list?"
        else -> "Видалити «$title» зі списку?"
    }

    fun confirmDeleteBtn(lang: String): String = when (lang) {
        "ru" -> "Удалить"
        "en" -> "Delete"
        else -> "Видалити"
    }

    fun confirmClearCompletedBody(lang: String, count: Int): String = when (lang) {
        "ru" -> "Удалить все $count купленных товаров из списка?"
        "en" -> "Clear all $count completed items?"
        else -> "Видалити всі $count куплених товарів зі списку?"
    }

    fun confirmClearCancelledBody(lang: String, count: Int): String = when (lang) {
        "ru" -> "Удалить навсегда все $count отменённых товаров?"
        "en" -> "Permanently delete all $count cancelled items?"
        else -> "Видалити назавжди всі $count відмінених товарів?"
    }

    // Settings
    fun settingsTitle(lang: String): String = when (lang) {
        "ru" -> "Настройки"
        "en" -> "Settings"
        else -> "Налаштування"
    }

    fun languageLabel(lang: String): String = when (lang) {
        "ru" -> "Язык интерфейса"
        "en" -> "Interface Language"
        else -> "Мова інтерфейсу"
    }

    fun scanQrLabel(lang: String): String = when (lang) {
        "ru" -> "Сканировать QR с сайта"
        "en" -> "Scan QR from Web"
        else -> "Сканувати QR із сайту"
    }

    fun groupIsolationTitle(lang: String): String = when (lang) {
        "ru" -> "Изоляция семейной группы"
        "en" -> "Family Group Isolation"
        else -> "Ізоляція сімейної групи"
    }

    fun groupIsolationDesc(lang: String): String = when (lang) {
        "ru" -> "Отсканируйте QR-код на сайте или введите одинаковые ключи Firebase и ID группы для синхронизации."
        "en" -> "Scan the QR code from the Web App or enter the same Firebase Project & Group ID manually to sync in real time."
        else -> "Відскануйте QR-код із сайту або введіть однакові ключі Firebase та ID групи для синхронізації."
    }

    fun testConnectionBtn(lang: String): String = when (lang) {
        "ru" -> "Проверить подключение"
        "en" -> "Test Connection"
        else -> "Перевірити підключення"
    }

    fun saveBtn(lang: String): String = when (lang) {
        "ru" -> "Сохранить"
        "en" -> "Save"
        else -> "Зберегти"
    }

    fun remindersTitle(lang: String): String = when (lang) {
        "ru" -> "Умные напоминания"
        "en" -> "Smart Reminders"
        else -> "Розумні нагадування"
    }

    fun remindersDesc(lang: String): String = when (lang) {
        "ru" -> "WorkManager срабатывает по расписанию и присылает уведомление ТОЛЬКО если в выбранных категориях есть некупленные товары."
        "en" -> "WorkManager triggers at your chosen time and notifies ONLY if uncompleted items exist in selected categories."
        else -> "WorkManager спрацьовує за розкладом і надсилає сповіщення ТІЛЬКИ якщо у вибраних категоріях є некуплені товари."
    }

    fun checkNowBtn(lang: String): String = when (lang) {
        "ru" -> "Проверить сейчас"
        "en" -> "Check & Notify Now"
        else -> "Перевірити зараз"
    }

    fun mergeBtn(lang: String): String = when (lang) {
        "ru" -> "Объединить"
        "en" -> "Merge"
        else -> "Об'єднати"
    }

    fun replaceBtn(lang: String): String = when (lang) {
        "ru" -> "С чистого листа"
        "en" -> "Replace"
        else -> "Почати з нуля"
    }

    fun categoryName(category: Category, lang: String): String {
        val ukMap = mapOf(
            "cat_produce" to "Овочі та фрукти",
            "cat_dairy" to "Молочні продукти та яйця",
            "cat_bakery" to "Випічка та хліб",
            "cat_meat" to "М'ясо та морепродукти",
            "cat_pantry" to "Бакалія та крупи",
            "cat_frozen" to "Заморожені продукти",
            "cat_snacks" to "Снеки та солодощі",
            "cat_beverages" to "Напої",
            "cat_household" to "Побутова хімія та дім",
            "cat_personal" to "Особиста гігієна",
            "cat_other" to "Різне та інше"
        )
        val ruMap = mapOf(
            "cat_produce" to "Овощи и фрукты",
            "cat_dairy" to "Молочные продукты и яйца",
            "cat_bakery" to "Выпечка и хлеб",
            "cat_meat" to "Мясо и морепродукты",
            "cat_pantry" to "Бакалея и крупы",
            "cat_frozen" to "Замороженные продукты",
            "cat_snacks" to "Снеки и сладости",
            "cat_beverages" to "Напитки",
            "cat_household" to "Бытовая химия и дом",
            "cat_personal" to "Личная гигиена",
            "cat_other" to "Разное и прочее"
        )
        val enMap = mapOf(
            "cat_produce" to "Produce",
            "cat_dairy" to "Dairy & Eggs",
            "cat_bakery" to "Bakery",
            "cat_meat" to "Meat & Seafood",
            "cat_pantry" to "Pantry & Grains",
            "cat_frozen" to "Frozen",
            "cat_snacks" to "Snacks & Sweets",
            "cat_beverages" to "Beverages",
            "cat_household" to "Household & Cleaning",
            "cat_personal" to "Personal Care",
            "cat_other" to "Other & Miscellaneous"
        )
        return when (lang) {
            "ru" -> ruMap[category.id]
            "en" -> enMap[category.id]
            else -> ukMap[category.id]
        } ?: category.name
    }

    fun refreshTooltip(lang: String): String = when (lang) {
        "ru" -> "Обновить список"
        "en" -> "Refresh list"
        else -> "Оновити список"
    }

    fun syncErrorBanner(lang: String, message: String): String = when (lang) {
        "ru" -> "Ошибка синхронизации: $message"
        "en" -> "Sync error: $message"
        else -> "Помилка синхронізації: $message"
    }

    fun newItemNotificationTitleSingle(lang: String, title: String): String = when (lang) {
        "ru" -> "Добавлено в список: $title"
        "en" -> "Added to list: $title"
        else -> "Додано до списку: $title"
    }

    fun newItemNotificationTitleMultiple(lang: String, count: Int): String = when (lang) {
        "ru" -> "Новые товары в списке ($count)"
        "en" -> "New items in shopping list ($count)"
        else -> "Нові товари у списку ($count)"
    }

    fun newItemNotificationMore(lang: String, extraCount: Int): String = when (lang) {
        "ru" -> "и ещё $extraCount..."
        "en" -> "and $extraCount more..."
        else -> "та ще $extraCount..."
    }

    fun todayLabel(lang: String): String = when (lang) {
        "ru" -> "Сегодня"
        "en" -> "Today"
        else -> "Сьогодні"
    }

    fun yesterdayLabel(lang: String): String = when (lang) {
        "ru" -> "Вчера"
        "en" -> "Yesterday"
        else -> "Вчора"
    }

    fun showMoreWeekBtn(lang: String): String = when (lang) {
        "ru" -> "Показать ещё"
        "en" -> "Show more"
        else -> "Показати ще"
    }

    fun showAllHistoryBtn(lang: String): String = when (lang) {
        "ru" -> "Показать все"
        "en" -> "Show all"
        else -> "Показати всі"
    }

    fun emptyTodayWithOlderMessage(lang: String): String = when (lang) {
        "ru" -> "За выбранный период позиций нет"
        "en" -> "No items in this period"
        else -> "За вибраний період позицій немає"
    }

    fun olderItemsHiddenLabel(lang: String, count: Int, fromDate: String): String = when (lang) {
        "ru" -> "С $fromDate · ещё $count ранее"
        "en" -> "Since $fromDate · $count earlier"
        else -> "З $fromDate · ще $count раніше"
    }

    fun noteLabel(lang: String): String = when (lang) {
        "ru" -> "Примечание"
        "en" -> "Note"
        else -> "Примітка"
    }

    fun notePlaceholder(lang: String): String = when (lang) {
        "ru" -> "Например: без сахара, спелые..."
        "en" -> "e.g. brand, ripeness..."
        else -> "Наприклад: без цукру, стиглі..."
    }

    fun listDisplayTitle(lang: String): String = when (lang) {
        "ru" -> "Отображение карточек"
        "en" -> "Card Display"
        else -> "Відображення карток"
    }

    fun showAddedByLabel(lang: String): String = when (lang) {
        "ru" -> "Показывать, кто добавил"
        "en" -> "Show who added"
        else -> "Показувати, хто додав"
    }

    fun showTimestampsLabel(lang: String): String = when (lang) {
        "ru" -> "Показывать время добавления, покупки и отмены"
        "en" -> "Show added, bought & cancelled time"
        else -> "Показувати час додавання, покупки та відміни"
    }

    fun categoryBackgroundsLabel(lang: String): String = when (lang) {
        "ru" -> "Градиентный фон категорий"
        "en" -> "Category gradient backgrounds"
        else -> "Градієнтний фон категорій"
    }

    fun userNameLabel(lang: String): String = when (lang) {
        "ru" -> "Ваше имя (кто добавил)"
        "en" -> "Your name (added by)"
        else -> "Ваше ім'я (хто додав)"
    }

    fun appearanceTitle(lang: String): String = when (lang) {
        "ru" -> "Тема оформления"
        "en" -> "Theme"
        else -> "Тема оформлення"
    }

    fun themeSystem(lang: String): String = when (lang) {
        "ru" -> "Системная"
        "en" -> "System"
        else -> "Системна"
    }

    fun themeLight(lang: String): String = when (lang) {
        "ru" -> "Светлая"
        "en" -> "Light"
        else -> "Світла"
    }

    fun themeDark(lang: String): String = when (lang) {
        "ru" -> "Тёмная"
        "en" -> "Dark"
        else -> "Темна"
    }

    fun colorSchemeTitle(lang: String): String = when (lang) {
        "ru" -> "Цветовая схема"
        "en" -> "Color scheme"
        else -> "Кольорова схема"
    }

    fun colorSchemeName(schemeId: String, lang: String): String = when (schemeId) {
        "sage" -> when (lang) {
            "ru" -> "Шалфей"
            "en" -> "Sage"
            else -> "Шавлія"
        }
        "ocean" -> when (lang) {
            "ru" -> "Океан"
            "en" -> "Ocean"
            else -> "Океан"
        }
        "sand" -> when (lang) {
            "ru" -> "Песок"
            "en" -> "Sand"
            else -> "Пісок"
        }
        "lavender" -> when (lang) {
            "ru" -> "Лаванда"
            "en" -> "Lavender"
            else -> "Лаванда"
        }
        else -> when (lang) {
            "ru" -> "Графит"
            "en" -> "Graphite"
            else -> "Графіт"
        }
    }

    fun connectingStatus(lang: String): String = when (lang) {
        "ru" -> "Подключение и сохранение..."
        "en" -> "Connecting & saving..."
        else -> "Підключення та збереження..."
    }

    fun partialKeysError(lang: String): String = when (lang) {
        "ru" -> "Заполните API Key, Project ID и App ID или очистите их для локального режима"
        "en" -> "Fill in API Key, Project ID, and App ID, or clear them for local mode"
        else -> "Заповніть API Key, Project ID та App ID або очистіть їх для локального режиму"
    }
}
