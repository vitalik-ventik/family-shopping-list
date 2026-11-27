import { SupportedLocale } from '../types';

export interface TranslationSchema {
  // Brand & Header
  brandName: string;
  brandTag: string;
  groupLabel: string;
  remainingCount: (count: number) => string;
  tabShoppingList: string;
  tabWeekendMaster: string;
  tabAndroidCompanion: string;
  tabSettings: string;
  oneTapBadge: string;
  addItemBtn: string;

  // Sync Status
  syncLive: string;
  syncDemo: string;
  syncConnecting: string;
  syncOffline: string;

  // Shopping List
  weekendBannerTitle: string;
  weekendBannerBadge: string;
  weekendBannerDesc: string;
  weekendBannerBtn: string;
  quickAddPlaceholder: string;
  urgentLabel: string;
  urgentBadge: string;
  moreDetailsBtn: string;
  noteLabel: string;
  notePlaceholder: string;
  estPriceLabel: string;
  requestedByLabel: string;
  searchPlaceholder: string;
  filterPending: (count: number) => string;
  filterUrgent: (count: number) => string;
  filterCompleted: (count: number) => string;
  filterCancelled: (count: number) => string;
  filterAll: (count: number) => string;
  viewByCategory: string;
  viewFlatList: string;
  manageCategoriesBtn: string;
  allCategoriesChip: string;
  itemsNeededSummary: (count: number) => string;
  estTotalSummary: (total: string) => string;
  clearCompletedBtn: (count: number) => string;
  clearCancelledBtn: (count: number) => string;
  copyTextBtn: string;
  printBtn: string;
  emptyListTitle: string;
  emptySearchTitle: string;
  emptyListDesc: string;
  emptySearchDesc: string;
  loadWeekendHaulQuick: string;
  neededInCat: (pending: number, total: number) => string;
  confirmClearCompleted: (count: number) => string;
  confirmClearCancelled: (count: number) => string;
  copiedToClipboardAlert: string;
  emptyListAlert: string;
  addedAtLabel: (time: string) => string;
  boughtAtLabel: (time: string) => string;
  cancelledAtLabel: (time: string) => string;
  cancelItemBtn: string;
  restoreItemBtn: string;
  deleteItemBtn: string;
  cancelledBadge: string;

  // Edit Modal
  editItemTitle: string;
  itemTitleLabel: string;
  categoryLabel: string;
  qtyLabel: string;
  unitLabel: string;
  cancelBtn: string;
  saveChangesBtn: string;

  // Weekend Template Master
  weekendMasterTitle: string;
  weekendMasterBadge: string;
  weekendMasterDesc: string;
  saveCurrentAsTemplate: string;
  createNewTemplate: string;
  availableTemplatesCount: (count: number) => string;
  backToActiveList: string;
  curatedItems: (count: number, tag: string) => string;
  includedGroceriesPreview: string;
  lastUsedOn: (date: string) => string;
  applyInOneTap: string;
  applyModalTitle: (name: string) => string;
  applyModalDesc: string;
  applyModeLabel: string;
  modeMergeTitle: string;
  modeMergeDesc: string;
  modeReplaceTitle: string;
  modeReplaceDesc: string;
  selectItemsToInclude: (selected: number, total: number) => string;
  selectAllBtn: string;
  deselectAllBtn: string;
  loadItemsIntoListBtn: (count: number) => string;
  loadingItemsBtn: string;
  confirmDeleteTemplate: (name: string) => string;
  promptTemplateName: string;
  noActiveItemsToSave: string;

  // Android Hub & WorkManager
  androidBadge: string;
  androidHubTitle: string;
  androidHubDesc: string;
  downloadZipBtn: string;
  generatingZipBtn: string;
  tabSimulator: string;
  tabCodeExplorer: (count: number) => string;
  tabSetupGuide: string;
  phonePendingCount: (count: number) => string;
  testWorkManagerTitle: string;
  testWorkManagerDesc: string;
  smartRuleTitle: string;
  smartRuleCaseA: string;
  smartRuleCaseB: string;
  selectScheduleToTest: string;
  triggerSimBtn: string;
  monitoredCategoriesLabel: (cats: string) => string;
  pendingWaitingInCat: (count: number) => string;
  zeroWaitingInCat: string;
  suppressedTitle: string;
  suppressedReason: (cats: string) => string;
  triggeredTitle: (title: string, count: number) => string;
  copyCodeBtn: string;
  copiedCodeBtn: string;

  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  isolationNoticeTitle: string;
  isolationNoticeText: string;
  modeFirebaseTitle: string;
  modeFirebaseDesc: string;
  modeDemoTitle: string;
  modeDemoDesc: string;
  familyGroupLabel: string;
  familyGroupPlaceholder: string;
  familyGroupHint: string;
  quickPasteLabel: string;
  autoExtractBtn: string;
  projectIdLabel: string;
  apiKeyLabel: string;
  appIdLabel: string;
  storageBucketLabel: string;
  qrPairingTitle: string;
  qrPairingDesc: (groupId: string) => string;
  testConnectionBtn: string;
  testingConnectionBtn: string;
  saveSettingsBtn: string;
  savedSuccessBtn: string;

  // Share Modal
  shareTitle: string;
  shareSubtitle: string;
  scanWithAndroidApp: string;
  familyGroupCode: string;
  shareExplanation: string;
  closeBtn: string;
  copyPairingLinkBtn: string;
  copiedLinkBtn: string;
  qrNeedsConfigHint: string;
  qrImportedNotice: (groupId: string) => string;
  recentItemsLabel: string;
  inListBadge: string;
  noMatchingHistoryHint: string;
  removeFromHistoryLabel: string;

  // Category Manager
  categoriesModalTitle: string;
  categoriesModalDesc: string;
  addNewCategoryLabel: string;
  newCategoryPlaceholder: string;
  confirmDeleteCategory: (name: string) => string;

  // Category Names Translations
  categoryNames: Record<string, string>;

  // Units
  units: Record<string, string>;

  // Members
  members: Record<string, string>;
}

export const translations: Record<SupportedLocale, TranslationSchema> = {
  en: {
    brandName: 'FamilyCart',
    brandTag: 'Sync',
    groupLabel: 'Group:',
    remainingCount: (count) => `${count} remaining`,
    tabShoppingList: 'Shopping List',
    tabWeekendMaster: 'Weekend Master',
    tabAndroidCompanion: 'Android Companion',
    tabSettings: 'Settings',
    oneTapBadge: '1-Tap',
    addItemBtn: 'Add Item',

    syncLive: 'Firestore Live',
    syncDemo: 'Demo / Multi-Tab',
    syncConnecting: 'Connecting...',
    syncOffline: 'Offline / Error',

    weekendBannerTitle: 'Weekend Big Haul Master',
    weekendBannerBadge: '1-Tap Ready',
    weekendBannerDesc: 'Stock up for the weekend in seconds. Replenish milk, eggs, bread, chicken, fresh produce, and essentials with one tap.',
    weekendBannerBtn: 'Launch Weekend Master',

    quickAddPlaceholder: 'Add item...',
    urgentLabel: 'Mark as Urgent',
    urgentBadge: 'URGENT',
    moreDetailsBtn: 'More details',
    noteLabel: 'Item Note / Specification',
    notePlaceholder: 'e.g. Check expiry date, organic only',
    estPriceLabel: 'Estimated Price ($)',
    requestedByLabel: 'Requested By',
    searchPlaceholder: 'Search items, notes, or categories...',
    filterPending: (count) => `Pending (${count})`,
    filterUrgent: (count) => `Urgent (${count})`,
    filterCompleted: (count) => `Completed (${count})`,
    filterCancelled: (count) => `Cancelled (${count})`,
    filterAll: (count) => `All (${count})`,
    viewByCategory: '📁 By Category',
    viewFlatList: '📋 Flat List',
    manageCategoriesBtn: 'Manage Categories',
    allCategoriesChip: 'All Categories',
    itemsNeededSummary: (count) => `${count} items needed`,
    estTotalSummary: (total) => `Est. Total: $${total}`,
    clearCompletedBtn: (count) => `Clear ${count} Done`,
    clearCancelledBtn: (count) => `Clear ${count} Cancelled`,
    copyTextBtn: 'Copy Text',
    printBtn: 'Print',
    emptyListTitle: 'Your shopping list is all clear!',
    emptySearchTitle: 'No matching items found',
    emptyListDesc: 'Add new items using the quick add bar above, or load our Weekend Big Haul Master in one tap.',
    emptySearchDesc: 'Try modifying your search term or clearing filters.',
    loadWeekendHaulQuick: '⚡ Load Weekend Haul',
    neededInCat: (pending, total) => `${pending} needed ${total > pending ? `(${total} total)` : ''}`,
    confirmClearCompleted: (count) => `Clear all ${count} completed items?`,
    confirmClearCancelled: (count) => `Permanently delete all ${count} cancelled items?`,
    copiedToClipboardAlert: 'Shopping list copied to clipboard formatted for WhatsApp / Message!',
    emptyListAlert: 'Shopping list is currently empty!',
    addedAtLabel: (time) => `Added ${time}`,
    boughtAtLabel: (time) => `Bought ${time}`,
    cancelledAtLabel: (time) => `Cancelled ${time}`,
    cancelItemBtn: 'Cancel item',
    restoreItemBtn: 'Restore to list',
    deleteItemBtn: 'Delete permanently',
    cancelledBadge: 'CANCELLED',

    editItemTitle: 'Edit Shopping Item',
    itemTitleLabel: 'Item Title',
    categoryLabel: 'Category',
    qtyLabel: 'Qty',
    unitLabel: 'Unit',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',

    weekendMasterTitle: 'Weekend Template Master',
    weekendMasterBadge: 'Weekend Shopping Trip Optimizer',
    weekendMasterDesc: 'Create a fresh family shopping list in one tap. No more starting from scratch or retyping milk, eggs, vegetables, and household supplies every Saturday morning.',
    saveCurrentAsTemplate: 'Save Current Basket as Template',
    createNewTemplate: 'New Template',
    availableTemplatesCount: (count) => `${count} ready`,
    backToActiveList: '← Back to Active List',
    curatedItems: (count, tag) => `${count} curated items • ${tag}`,
    includedGroceriesPreview: 'Included Groceries Preview:',
    lastUsedOn: (date) => `Last used ${date}`,
    applyInOneTap: 'Apply in 1-Tap',
    applyModalTitle: (name) => `Apply ${name}`,
    applyModalDesc: 'Review items and choose how you want to update your family shopping list.',
    applyModeLabel: 'Application Mode:',
    modeMergeTitle: 'Merge List',
    modeMergeDesc: 'Keep your existing uncompleted items and add new items from this template.',
    modeReplaceTitle: 'Fresh Start',
    modeReplaceDesc: 'Clear the current list and replace it completely with this fresh weekend haul.',
    selectItemsToInclude: (selected, total) => `Select Items to Include (${selected} of ${total}):`,
    selectAllBtn: 'Select All',
    deselectAllBtn: 'Deselect All',
    loadItemsIntoListBtn: (count) => `Load ${count} Items into List`,
    loadingItemsBtn: 'Populating List...',
    confirmDeleteTemplate: (name) => `Delete template "${name}"?`,
    promptTemplateName: 'Enter a name for this Weekend Template:',
    noActiveItemsToSave: 'Your current list has no uncompleted items to save as a template!',

    androidBadge: 'Native Android App • Kotlin & Jetpack Compose',
    androidHubTitle: 'Android Companion & WorkManager Engine',
    androidHubDesc: 'Includes smart scheduled notifications powered by Android WorkManager. It wakes up on schedule, queries Firestore, and triggers notifications only if uncompleted items exist in your monitored categories.',
    downloadZipBtn: 'Download Android Project (ZIP)',
    generatingZipBtn: 'Generating ZIP...',
    tabSimulator: 'Interactive Mobile Simulator',
    tabCodeExplorer: (count) => `Source Code Explorer (${count} Files)`,
    tabSetupGuide: 'Setup & Android Studio Guide',
    phonePendingCount: (count) => `Pending Items (${count})`,
    testWorkManagerTitle: 'Test Android WorkManager Smart Notification Logic',
    testWorkManagerDesc: 'Verify the requirement: Notifications only appear if uncompleted items exist in monitored categories.',
    smartRuleTitle: 'The Smart Notification Rule:',
    smartRuleCaseA: 'Case A (Pending items exist): WorkManager finds items in monitored categories → Displays notification banner on Android device.',
    smartRuleCaseB: 'Case B (All items completed or category empty): WorkManager detects 0 pending items → Suppresses notification completely (no spam to user).',
    selectScheduleToTest: 'Select a Schedule to Test:',
    triggerSimBtn: 'Trigger Simulation',
    monitoredCategoriesLabel: (cats) => `Monitors: ${cats}`,
    pendingWaitingInCat: (count) => `⚠️ ${count} uncompleted items waiting in these categories`,
    zeroWaitingInCat: '✅ 0 items waiting (will suppress notification)',
    suppressedTitle: 'WorkManager Background Check',
    suppressedReason: (cats) => `Monitored categories (${cats || 'All'}) have no uncompleted items. WorkManager cleanly suppressed notification to prevent noise!`,
    triggeredTitle: (title, count) => `${title} (${count} item${count > 1 ? 's' : ''} needed)`,
    copyCodeBtn: 'Copy Code',
    copiedCodeBtn: 'Copied!',

    settingsTitle: 'Dynamic Firebase & Family Isolation',
    settingsSubtitle: 'Configure your cloud backend credentials for real-time synchronization between PC and Android.',
    isolationNoticeTitle: 'Multi-Tenant / Group Isolation Principle',
    isolationNoticeText: 'Family members using the same Firebase credentials and Group Identifier (e.g. husband and wife) synchronize their shopping lists in real-time. Different credentials or Group IDs mean completely isolated family groups.',
    modeFirebaseTitle: 'Live Firebase (Firestore)',
    modeFirebaseDesc: 'Connect to your live Google Firebase Firestore project.',
    modeDemoTitle: 'Instant Demo (Multi-Tab)',
    modeDemoDesc: 'Synchronize between browser tabs and simulator without typing keys.',
    familyGroupLabel: 'Family / Group Identifier (Isolation Tag)',
    familyGroupPlaceholder: 'e.g. smith-household, miller-cart, weekend-groceries',
    familyGroupHint: 'Share this exact Group Identifier with your spouse/family to share the list.',
    quickPasteLabel: 'Quick Paste Firebase Web SDK Config (Optional)',
    autoExtractBtn: 'Auto-Extract',
    projectIdLabel: 'Firebase Project ID *',
    apiKeyLabel: 'API Key (Web / Android) *',
    appIdLabel: 'App ID *',
    storageBucketLabel: 'Storage Bucket (Optional)',
    qrPairingTitle: 'Instant Phone Pairing QR Code',
    qrPairingDesc: (groupId) => `Scan this QR code with the companion Android app on your phone. It imports your API credentials and Group ID (${groupId}) instantly without typing!`,
    testConnectionBtn: 'Test Connection',
    testingConnectionBtn: 'Testing...',
    saveSettingsBtn: 'Save & Apply Settings',
    savedSuccessBtn: 'Saved!',

    shareTitle: 'Share Family Shopping Sync',
    shareSubtitle: 'Pair your spouse or Android phone',
    scanWithAndroidApp: 'Scan with Native Android Companion App',
    familyGroupCode: 'Family Group ID',
    shareExplanation: 'Anyone with this Group ID and Firebase project credentials will see changes and check-offs immediately in real time.',
    closeBtn: 'Close',

    categoriesModalTitle: 'Custom Categories & Groups',
    categoriesModalDesc: 'Organize shopping items by grocery department or aisle.',
    addNewCategoryLabel: 'Add New Category',
    newCategoryPlaceholder: 'e.g. Pet Supplies, Bakery, Pharmacy',
    confirmDeleteCategory: (name) => `Delete category "${name}"? Existing items will be moved to Miscellaneous.`,
    copyPairingLinkBtn: 'Copy Pairing Link',
    copiedLinkBtn: 'Link Copied',
    qrNeedsConfigHint: 'Configure Firebase in Settings first so the QR code includes real sync credentials.',
    qrImportedNotice: (groupId) => `Connected via QR link to group "${groupId}"`,
    recentItemsLabel: 'All items by usage',
    inListBadge: 'in list',
    noMatchingHistoryHint: 'No matches in history — press Enter or Add to create',
    removeFromHistoryLabel: 'Remove from history',

    categoryNames: {
      cat_produce: 'Produce',
      cat_dairy: 'Dairy & Eggs',
      cat_bakery: 'Bakery',
      cat_meat: 'Meat & Seafood',
      cat_pantry: 'Pantry & Grains',
      cat_frozen: 'Frozen',
      cat_snacks: 'Snacks & Sweets',
      cat_beverages: 'Beverages',
      cat_household: 'Household & Cleaning',
      cat_personal: 'Personal Care',
      cat_other: 'Other & Miscellaneous',
    },

    units: {
      pcs: 'pcs',
      lbs: 'lbs',
      kg: 'kg',
      gal: 'gal',
      loaf: 'loaf',
      bottle: 'bottle',
      pack: 'pack',
      box: 'box',
      bunch: 'bunch',
    },

    members: {
      Mom: 'Mom',
      Dad: 'Dad',
      Sarah: 'Sarah',
      Alex: 'Alex',
      Me: 'Me',
    },
  },

  uk: {
    brandName: 'FamilyCart',
    brandTag: 'Синхронізація',
    groupLabel: 'Сім\'я:',
    remainingCount: (count) => `Залишилося: ${count}`,
    tabShoppingList: 'Список покупок',
    tabWeekendMaster: 'Майстер вихідних',
    tabAndroidCompanion: 'Android-додаток',
    tabSettings: 'Налаштування',
    oneTapBadge: '1 клік',
    addItemBtn: 'Додати',

    syncLive: 'Живий Firestore',
    syncDemo: 'Демо / Мульти-вкладка',
    syncConnecting: 'З\'єднання...',
    syncOffline: 'Офлайн / Помилка',

    weekendBannerTitle: 'Майстер великих закупок на вихідні',
    weekendBannerBadge: 'Готово в 1 клік',
    weekendBannerDesc: 'Закупіться на вихідні за лічені секунди. Додайте молоко, яйця, хліб, м\'ясо, свіжі овочі та побутові товари одним дотиком.',
    weekendBannerBtn: 'Відкрити Майстер вихідних',

    quickAddPlaceholder: 'Додати товар...',
    urgentLabel: 'Позначити як ТЕРМІНОВО',
    urgentBadge: 'ТЕРМІНОВО',
    moreDetailsBtn: 'Більше деталей',
    noteLabel: 'Примітка до товару',
    notePlaceholder: 'напр. Перевірити термін придатності, тільки свіже',
    estPriceLabel: 'Орієнтовна ціна (₴ або $)',
    requestedByLabel: 'Хто попросив',
    searchPlaceholder: 'Пошук товарів, приміток або категорій...',
    filterPending: (count) => `До покупки (${count})`,
    filterUrgent: (count) => `Термінові (${count})`,
    filterCompleted: (count) => `Куплено (${count})`,
    filterCancelled: (count) => `Відмінені (${count})`,
    filterAll: (count) => `Всі (${count})`,
    viewByCategory: '📁 За категоріями',
    viewFlatList: '📋 Простий список',
    manageCategoriesBtn: 'Керувати категоріями',
    allCategoriesChip: 'Всі категорії',
    itemsNeededSummary: (count) => `Потрібно купити: ${count}`,
    estTotalSummary: (total) => `Орієнтовна сума: ₴${total}`,
    clearCompletedBtn: (count) => `Очистити ${count} куплених`,
    clearCancelledBtn: (count) => `Видалити ${count} відмінених`,
    copyTextBtn: 'Скопіювати текст',
    printBtn: 'Друк списку',
    emptyListTitle: 'Ваш список покупок порожній!',
    emptySearchTitle: 'Товарів за запитом не знайдено',
    emptyListDesc: 'Додайте нові товари через рядок вище або завантажте шаблон "Великий закуп на вихідні" в один клік.',
    emptySearchDesc: 'Спробуйте змінити пошуковий запит або скинути фільтри.',
    loadWeekendHaulQuick: '⚡ Завантажити закуп на вихідні',
    neededInCat: (pending, total) => `Треба: ${pending} ${total > pending ? `(всього: ${total})` : ''}`,
    confirmClearCompleted: (count) => `Видалити всі ${count} куплених товарів зі списку?`,
    confirmClearCancelled: (count) => `Видалити назавжди всі ${count} відмінених товарів?`,
    copiedToClipboardAlert: 'Список покупок скопійовано у буфер обміну для надсилання у Viber / Telegram / WhatsApp!',
    emptyListAlert: 'Список покупок наразі порожній!',
    addedAtLabel: (time) => `Додано ${time}`,
    boughtAtLabel: (time) => `Куплено ${time}`,
    cancelledAtLabel: (time) => `Відмінено ${time}`,
    cancelItemBtn: 'Відмінити позицію',
    restoreItemBtn: 'Повернути у список',
    deleteItemBtn: 'Видалити назавжди',
    cancelledBadge: 'ВІДМІНЕНО',

    editItemTitle: 'Редагувати товар',
    itemTitleLabel: 'Назва товару',
    categoryLabel: 'Категорія',
    qtyLabel: 'К-сть',
    unitLabel: 'Од.',
    cancelBtn: 'Скасувати',
    saveChangesBtn: 'Зберегти зміни',

    weekendMasterTitle: 'Майстер шаблонів на вихідні',
    weekendMasterBadge: 'Оптимізатор закупок для всієї родини',
    weekendMasterDesc: 'Створіть свіжий список покупок на всю сім\'ю в один клік. Більше не потрібно щосуботи друкувати чи згадувати молоко, яйця, хліб та побутові речі з нуля.',
    saveCurrentAsTemplate: 'Зберегти поточний кошик як шаблон',
    createNewTemplate: 'Створити шаблон',
    availableTemplatesCount: (count) => `Доступно: ${count}`,
    backToActiveList: '← Назад до активного списку',
    curatedItems: (count, tag) => `${count} відібраних товарів • ${tag}`,
    includedGroceriesPreview: 'Попередній перегляд товарів:',
    lastUsedOn: (date) => `Востаннє використано: ${date}`,
    applyInOneTap: 'Застосувати в 1 клік',
    applyModalTitle: (name) => `Завантажити "${name}"`,
    applyModalDesc: 'Перевірте товари та виберіть, як оновити список покупок вашої родини.',
    applyModeLabel: 'Режим завантаження:',
    modeMergeTitle: 'Об\'єднати зі списком',
    modeMergeDesc: 'Зберегти ваші поточні некуплені товари та додати нові позиції з цього шаблону.',
    modeReplaceTitle: 'Почати з чистого аркуша',
    modeReplaceDesc: 'Повністю очистити поточний список і створити свіжий закуп за цим шаблоном.',
    selectItemsToInclude: (selected, total) => `Виберіть товари для додавання (${selected} з ${total}):`,
    selectAllBtn: 'Вибрати всі',
    deselectAllBtn: 'Зняти всі',
    loadItemsIntoListBtn: (count) => `Додати ${count} товарів у список`,
    loadingItemsBtn: 'Заповнення списку...',
    confirmDeleteTemplate: (name) => `Видалити шаблон "${name}"?`,
    promptTemplateName: 'Введіть назву для цього шаблону на вихідні:',
    noActiveItemsToSave: 'У вашому поточному списку немає некуплених товарів для збереження в шаблон!',

    androidBadge: 'Нативний додаток для Android • Kotlin & Jetpack Compose',
    androidHubTitle: 'Android-компаньйон та фоновий воркер',
    androidHubDesc: 'Містить розумні заплановані сповіщення на базі Android WorkManager. Воркер прокидається за розкладом, перевіряє Firestore і показує сповіщення ТІЛЬКИ якщо є некуплені товари у вибраних категоріях.',
    downloadZipBtn: 'Завантажити Android-проект (ZIP)',
    generatingZipBtn: 'Формування ZIP-архіву...',
    tabSimulator: 'Інтерактивний симулятор телефону',
    tabCodeExplorer: (count) => `Вихідний код (${count} файлів)`,
    tabSetupGuide: 'Інструкція для Android Studio',
    phonePendingCount: (count) => `Залишилося купити (${count})`,
    testWorkManagerTitle: 'Тестування логіки сповіщень WorkManager',
    testWorkManagerDesc: 'Перевірка ключового правила: сповіщення надходить лише тоді, коли в обраних категоріях є некуплені позиції.',
    smartRuleTitle: 'Розумне правило сповіщень:',
    smartRuleCaseA: 'Варіант А (Є некуплені товари): WorkManager знаходить товари в обраних категоріях → показує сповіщення в шторці Android.',
    smartRuleCaseB: 'Варіант Б (Все куплено або категорія порожня): WorkManager бачить 0 товарів → сповіщення ПРИГЛУШУЄТЬСЯ (жодного спаму чи шуму для користувача).',
    selectScheduleToTest: 'Виберіть розклад для тесту:',
    triggerSimBtn: 'Запустити симуляцію',
    monitoredCategoriesLabel: (cats) => `Відстежує: ${cats}`,
    pendingWaitingInCat: (count) => `⚠️ ${count} некуплених позицій очікують у цих категоріях`,
    zeroWaitingInCat: '✅ 0 позицій (сповіщення буде коректно приглушено)',
    suppressedTitle: 'Фонова перевірка WorkManager',
    suppressedReason: (cats) => `У вибраних категоріях (${cats || 'Всі'}) немає некуплених товарів. WorkManager приглушив сповіщення, щоб не турбувати дарма!`,
    triggeredTitle: (title, count) => `${title} (потрібно: ${count})`,
    copyCodeBtn: 'Скопіювати код',
    copiedCodeBtn: 'Скопійовано!',

    settingsTitle: 'Динамічні налаштування Firebase та ізоляція сім\'ї',
    settingsSubtitle: 'Введіть параметри вашої бази даних Firestore для синхронізації між комп\'ютером та телефонами родини.',
    isolationNoticeTitle: 'Принцип мультиарендності та ізоляції груп',
    isolationNoticeText: 'Члени родини, які використовують однаковий проект Firebase та однаковий Ідентифікатор групи (наприклад, чоловік і дружина), мають спільний список у реальному часі. Різні конфігурації або ID гарантують повну ізоляцію даних.',
    modeFirebaseTitle: 'Живий Firebase (Firestore)',
    modeFirebaseDesc: 'Підключення до вашого хмарного проекту Google Cloud Firestore.',
    modeDemoTitle: 'Миттєве Демо (Мульти-вкладка)',
    modeDemoDesc: 'Синхронізація між вкладками браузера та симулятором без введення ключів.',
    familyGroupLabel: 'Ідентифікатор сім\'ї / групи (Тег ізоляції)',
    familyGroupPlaceholder: 'напр. petrenko-family, nasha-koshik, weekend-groceries',
    familyGroupHint: 'Поділіться цим ID з членами родини, щоб синхронізувати спільний кошик.',
    quickPasteLabel: 'Швидка вставка конфігурації Firebase Web SDK (необов\'язково)',
    autoExtractBtn: 'Розпізнати',
    projectIdLabel: 'Firebase Project ID *',
    apiKeyLabel: 'API Key (Web / Android) *',
    appIdLabel: 'App ID *',
    storageBucketLabel: 'Storage Bucket (Необов\'язково)',
    qrPairingTitle: 'QR-код для миттєвого підключення телефону',
    qrPairingDesc: (groupId) => `Відскануйте цей QR-код камерою в додатку на Android. Він миттєво імпортує всі ключі та ID сім'ї (${groupId}) без ручного введення!`,
    testConnectionBtn: 'Тест підключення',
    testingConnectionBtn: 'Тестування...',
    saveSettingsBtn: 'Зберегти та підключити',
    savedSuccessBtn: 'Збережено!',

    shareTitle: 'Поділитися списком сім\'ї',
    shareSubtitle: 'Підключіть чоловіка/дружину або Android-телефон',
    scanWithAndroidApp: 'Відскануйте через нативний Android-додаток',
    familyGroupCode: 'ID сім\'ї / групи',
    shareExplanation: 'Усі, хто введе ці параметри та ID сім\'ї, миттєво бачитимуть спільний список покупок у реальному часі.',
    closeBtn: 'Закрити',

    categoriesModalTitle: 'Власні категорії та відділи',
    categoriesModalDesc: 'Організуйте товари за відділами магазину або категоріями супермаркету.',
    addNewCategoryLabel: 'Додати нову категорію',
    newCategoryPlaceholder: 'напр. Товари для тварин, Аптека, Кава та чай',
    confirmDeleteCategory: (name) => `Видалити категорію "${name}"? Товари з неї перейдуть до розділу "Різне".`,
    copyPairingLinkBtn: 'Копіювати посилання',
    copiedLinkBtn: 'Скопійовано!',
    qrNeedsConfigHint: 'Спочатку вкажіть ключі Firebase у Налаштуваннях, щоб QR-код містив реальне підключення.',
    qrImportedNotice: (groupId) => `Підключено за QR-посиланням до групи «${groupId}»`,
    recentItemsLabel: 'Товари за порядком використання',
    inListBadge: 'у списку',
    noMatchingHistoryHint: 'Немає в історії — натисніть Enter або Додати',
    removeFromHistoryLabel: 'Видалити з історії',

    categoryNames: {
      cat_produce: 'Овочі та фрукти',
      cat_dairy: 'Молочні продукти та яйця',
      cat_bakery: 'Випічка та хліб',
      cat_meat: 'М\'ясо та морепродукти',
      cat_pantry: 'Бакалія та крупи',
      cat_frozen: 'Заморожені продукти',
      cat_snacks: 'Снеки та солодощі',
      cat_beverages: 'Напої',
      cat_household: 'Побутова хімія та дім',
      cat_personal: 'Особиста гігієна',
      cat_other: 'Різне та інше',
    },

    units: {
      pcs: 'шт',
      lbs: 'фунт',
      kg: 'кг',
      gal: 'гал',
      loaf: 'бух',
      bottle: 'пляш',
      pack: 'уп',
      box: 'кор',
      bunch: 'пучок',
    },

    members: {
      Mom: 'Мама',
      Dad: 'Тато',
      Sarah: 'Оля',
      Alex: 'Віталій',
      Me: 'Я',
    },
  },
};
