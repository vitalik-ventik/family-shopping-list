import React, { useState, useMemo } from 'react';
import { ShoppingItem, Category, RecentItem } from '../types';
import { firebaseService } from '../services/firebaseService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Plus,
  Search,
  Flame,
  Trash2,
  Printer,
  Share2,
  Check,
  Edit3,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  History,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  categories: Category[];
  recentItems: RecentItem[];
  onOpenWeekendMaster: () => void;
  onOpenManageCategories: () => void;
  quickAddInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  categories,
  recentItems,
  onOpenWeekendMaster,
  onOpenManageCategories,
  quickAddInputRef,
}) => {
  const { t, getCategoryName, getUnitName, getMemberName } = useLanguage();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('pending');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Quick Add State
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || 'cat_produce');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('pcs');
  const [newNote, setNewNote] = useState('');
  const [newUrgent, setNewUrgent] = useState(false);
  const [newPrice, setNewPrice] = useState<string>('');
  const [newAddedBy, setNewAddedBy] = useState('Me');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const filteredRecentSuggestions = useMemo(() => {
    const q = newTitle.trim().toLowerCase();
    const pendingTitles = new Set(
      items.filter((i) => !i.completed).map((i) => i.title.trim().toLowerCase())
    );
    return recentItems
      .filter((r) => {
        const key = r.title.trim().toLowerCase();
        if (q && !key.includes(q)) return false;
        return !pendingTitles.has(key);
      })
      .slice(0, 10);
  }, [recentItems, newTitle, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNote = item.note?.toLowerCase().includes(q);
        const cat = categoryMap.get(item.categoryId);
        const catName = getCategoryName(cat);
        const matchesCat = catName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNote && !matchesCat) return false;
      }

      if (statusFilter === 'pending' && item.completed) return false;
      if (statusFilter === 'completed' && !item.completed) return false;
      if (statusFilter === 'urgent' && (!item.urgent || item.completed)) return false;

      if (selectedCategoryFilter !== 'all' && item.categoryId !== selectedCategoryFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, statusFilter, selectedCategoryFilter, categoryMap, getCategoryName]);

  const totalItemsCount = items.length;
  const uncompletedCount = items.filter((i) => !i.completed).length;
  const completedCount = items.filter((i) => i.completed).length;
  const urgentCount = items.filter((i) => !i.completed && i.urgent).length;

  const estimatedTotalCost = useMemo(() => {
    return items
      .filter((i) => !i.completed && i.estimatedPrice)
      .reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  }, [items]);

  const groupedByCategory = useMemo(() => {
    const groups: { category: Category; items: ShoppingItem[] }[] = [];

    categories.forEach((cat) => {
      const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
      if (
        catItems.length > 0 ||
        (selectedCategoryFilter === 'all' && !searchQuery.trim() && statusFilter === 'all')
      ) {
        groups.push({ category: cat, items: catItems });
      }
    });

    const knownCatIds = new Set(categories.map((c) => c.id));
    const uncategorizedItems = filteredItems.filter((i) => !knownCatIds.has(i.categoryId));
    if (uncategorizedItems.length > 0) {
      groups.push({
        category: {
          id: 'cat_other',
          name: t.categoryNames['cat_other'] || 'Other',
          icon: '📦',
          color: '#737373',
          bgLight: '#fafafa',
          order: 999,
        },
        items: uncategorizedItems,
      });
    }

    return groups;
  }, [categories, filteredItems, selectedCategoryFilter, searchQuery, statusFilter, t]);

  const handleToggleItem = async (item: ShoppingItem) => {
    await firebaseService.toggleItem(item.id);
    if (!item.completed && uncompletedCount === 1) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await firebaseService.addItem({
      title: newTitle.trim(),
      categoryId: newCategoryId,
      quantity: Number(newQuantity) || 1,
      unit: newUnit,
      note: newNote.trim() || undefined,
      urgent: newUrgent,
      estimatedPrice: newPrice ? parseFloat(newPrice) : undefined,
      addedBy: newAddedBy,
      completed: false,
    });

    setNewTitle('');
    setNewNote('');
    setNewPrice('');
    setNewUrgent(false);
    setIsQuickAddExpanded(false);
  };

  const handleQuickPickRecent = async (recent: RecentItem) => {
    await firebaseService.addItem({
      title: recent.title,
      categoryId: recent.categoryId || newCategoryId,
      quantity: recent.quantity || 1,
      unit: recent.unit || 'pcs',
      urgent: false,
      addedBy: newAddedBy,
      completed: false,
    });
    setNewTitle('');
  };

  const handleClearCompleted = async () => {
    if (completedCount === 0) return;
    if (window.confirm(t.confirmClearCompleted(completedCount))) {
      await firebaseService.clearCompletedItems();
    }
  };

  const handleShareListAsText = () => {
    const activeItems = items.filter((i) => !i.completed);
    if (activeItems.length === 0) {
      alert(t.emptyListAlert);
      return;
    }

    let text = `${t.brandName} · ${t.tabShoppingList} (${activeItems.length}):\n\n`;
    const grouped: Record<string, ShoppingItem[]> = {};

    activeItems.forEach((item) => {
      const cat = categoryMap.get(item.categoryId);
      const catName = getCategoryName(cat) || 'Інше';
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(item);
    });

    Object.entries(grouped).forEach(([catName, list]) => {
      text += `${catName}:\n`;
      list.forEach((item) => {
        const urgentMark = item.urgent ? ` [${t.urgentBadge}]` : '';
        const qty =
          item.quantity > 1 || item.unit !== 'pcs'
            ? ` (${item.quantity} ${getUnitName(item.unit)})`
            : '';
        text += `  • ${item.title}${qty}${urgentMark}\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    alert(t.copiedToClipboardAlert);
  };

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Page Header Row: Title, Summary Metrics & Weekend Master link */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {t.tabShoppingList}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 tabular-nums flex items-center gap-2">
            <span>{t.itemsNeededSummary(uncompletedCount)}</span>
            {estimatedTotalCost > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t.estTotalSummary(estimatedTotalCost.toFixed(2))}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onOpenWeekendMaster}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.tabWeekendMaster}</span>
          </button>

          <button
            type="button"
            onClick={onOpenManageCategories}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium transition-colors whitespace-nowrap"
          >
            {t.manageCategoriesBtn}
          </button>
        </div>
      </div>

      {/* Minimalist Quick Add Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-2.5 transition-all">
        <form onSubmit={handleAddItem} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={quickAddInputRef}
              type="text"
              placeholder={t.quickAddPlaceholder}
              value={newTitle}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setTimeout(() => setIsTitleFocused(false), 150)}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-transparent text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:bg-neutral-50 transition-colors"
            />

            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="px-2.5 py-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-700 text-xs font-medium focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {getCategoryName(c)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max="999"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-800 text-xs font-semibold text-center tabular-nums focus:outline-none focus:border-neutral-400"
              />

              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="px-2 py-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-700 text-xs font-medium focus:outline-none focus:border-neutral-400 cursor-pointer"
              >
                {Object.keys(t.units).map((u) => (
                  <option key={u} value={u}>
                    {t.units[u]}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setNewUrgent(!newUrgent)}
                className={`p-2 rounded-lg border transition-colors ${
                  newUrgent
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-neutral-50 border-neutral-200/80 text-neutral-400 hover:text-neutral-600'
                }`}
                title={t.urgentLabel}
              >
                <Flame className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsQuickAddExpanded(!isQuickAddExpanded)}
                className={`p-2 rounded-lg border transition-colors ${
                  isQuickAddExpanded
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-neutral-50 border-neutral-200/80 text-neutral-500 hover:text-neutral-800'
                }`}
                title={t.moreDetailsBtn}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addItemBtn}</span>
              </button>
            </div>
          </div>

          {isQuickAddExpanded && (
            <div className="pt-2.5 px-1 pb-1 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  {t.noteLabel}
                </label>
                <input
                  type="text"
                  placeholder={t.notePlaceholder}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  {t.estPriceLabel}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs tabular-nums focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-500 mb-1">
                  {t.requestedByLabel}
                </label>
                <select
                  value={newAddedBy}
                  onChange={(e) => setNewAddedBy(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400"
                >
                  {Object.keys(t.members).map((m) => (
                    <option key={m} value={m}>
                      {t.members[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </form>

        {(isTitleFocused || newTitle.trim().length > 0) && filteredRecentSuggestions.length > 0 && (
          <div className="mt-2 pt-2 px-1 border-t border-neutral-100">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-1.5">
              <History className="w-3 h-3" />
              <span>{t.recentItemsLabel}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredRecentSuggestions.map((recent) => {
                const cat = categoryMap.get(recent.categoryId);
                return (
                  <div
                    key={recent.title}
                    className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleQuickPickRecent(recent);
                      }}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium text-neutral-800"
                    >
                      {cat && <span className="text-xs">{cat.icon}</span>}
                      <span>{recent.title}</span>
                      {(recent.quantity > 1 || recent.unit !== 'pcs') && (
                        <span className="text-[11px] text-neutral-400 tabular-nums">
                          {recent.quantity} {getUnitName(recent.unit)}
                        </span>
                      )}
                      <Plus className="w-3 h-3 text-emerald-600 ml-0.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        firebaseService.removeRecentItem(recent.title);
                      }}
                      title="Remove from history"
                      className="pr-2 pl-0.5 py-1 text-neutral-300 hover:text-neutral-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Segmented Status Filter */}
        <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
              statusFilter === 'pending'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.filterPending(uncompletedCount)}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
              statusFilter === 'urgent'
                ? 'bg-white text-rose-600 shadow-2xs'
                : 'text-neutral-600 hover:text-rose-600'
            }`}
          >
            {t.filterUrgent(urgentCount)}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
              statusFilter === 'completed'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.filterCompleted(completedCount)}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {t.filterAll(totalItemsCount)}
          </button>
        </div>

        {/* Search + Utility Actions */}
        <div className="flex items-center gap-2 flex-1 md:justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs focus:outline-none focus:border-neutral-400 text-neutral-900 placeholder-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-600 whitespace-nowrap transition-colors"
          >
            {viewMode === 'grouped' ? t.viewByCategory : t.viewFlatList}
          </button>

          <button
            type="button"
            onClick={handleShareListAsText}
            title={t.copyTextBtn}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title={t.printBtn}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              title={t.clearCompletedBtn(completedCount)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-neutral-600 text-xs font-medium whitespace-nowrap transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.clearCompletedBtn(completedCount)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Minimal Category Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
            selectedCategoryFilter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          {t.allCategoriesChip}
        </button>
        {categories.map((c) => {
          const count = items.filter((i) => !i.completed && i.categoryId === c.id).length;
          if (count === 0 && selectedCategoryFilter !== c.id) return null;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(c.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors tabular-nums ${
                selectedCategoryFilter === c.id
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>{c.icon}</span>
              <span>{getCategoryName(c)}</span>
              {count > 0 && (
                <span className={selectedCategoryFilter === c.id ? 'text-neutral-300' : 'text-neutral-400'}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Items Area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            {searchQuery ? t.emptySearchTitle : t.emptyListTitle}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {searchQuery ? t.emptySearchDesc : t.emptyListDesc}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenWeekendMaster}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors"
            >
              {t.loadWeekendHaulQuick}
            </button>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {groupedByCategory.map(({ category, items: catItems }) => {
            if (catItems.length === 0) return null;
            const isCollapsed = collapsedCategories[category.id];
            const pendingCatCount = catItems.filter((i) => !i.completed).length;

            return (
              <section key={category.id} className="space-y-2">
                {/* Quiet Category Heading (Zero-pill, no thick left stripe) */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(category.id)}
                  className="w-full flex items-center justify-between px-1 py-1 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{category.icon}</span>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover:text-neutral-800 transition-colors">
                      {getCategoryName(category)}
                    </h2>
                    <span className="text-xs text-neutral-400 tabular-nums">
                      {pendingCatCount}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                    {catItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={() => handleToggleItem(item)}
                        onDelete={() => firebaseService.deleteItem(item.id)}
                        onEdit={() => setEditingItem(item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
          {filteredItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              category={categoryMap.get(item.categoryId)}
              showCategory
              onToggle={() => handleToggleItem(item)}
              onDelete={() => firebaseService.deleteItem(item.id)}
              onEdit={() => setEditingItem(item)}
            />
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          categories={categories}
          onClose={() => setEditingItem(null)}
          onSave={async (updates) => {
            await firebaseService.updateItem(editingItem.id, updates);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

interface ItemRowProps {
  item: ShoppingItem;
  category?: Category;
  showCategory?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item,
  category,
  showCategory,
  onToggle,
  onDelete,
  onEdit,
}) => {
  const { t, getUnitName, getMemberName, getCategoryName } = useLanguage();

  return (
    <div
      className={`group flex items-center justify-between px-4 py-3 transition-colors ${
        item.completed ? 'bg-neutral-50/50' : 'bg-white hover:bg-neutral-50/70'
      }`}
    >
      <div
        className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 pr-3 cursor-pointer"
        onClick={onToggle}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={item.title}
          className={`mt-0.5 sm:mt-0 w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
            item.completed
              ? 'bg-emerald-600 text-white'
              : 'border border-neutral-300 hover:border-emerald-600 bg-white'
          }`}
        >
          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={`text-sm transition-colors ${
                item.completed
                  ? 'line-through text-neutral-400'
                  : 'font-medium text-neutral-900'
              }`}
            >
              {item.title}
            </span>

            {item.urgent && !item.completed && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-600">
                <Flame className="w-3 h-3" />
                <span>{localeLabelUrgent(t.urgentBadge)}</span>
              </span>
            )}
          </div>

          {/* Unboxed clean metadata line with middot separators */}
          {(item.quantity > 1 ||
            item.unit !== 'pcs' ||
            item.note ||
            item.addedBy ||
            item.estimatedPrice ||
            (showCategory && category)) && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5 flex-wrap tabular-nums">
              {(item.quantity > 1 || item.unit !== 'pcs') && (
                <span className="text-neutral-600 font-medium">
                  {item.quantity} {getUnitName(item.unit)}
                </span>
              )}

              {showCategory && category && (
                <>
                  {(item.quantity > 1 || item.unit !== 'pcs') && <span aria-hidden="true">·</span>}
                  <span>{getCategoryName(category)}</span>
                </>
              )}

              {item.estimatedPrice && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>~{(item.estimatedPrice * (item.quantity || 1)).toFixed(2)}</span>
                </>
              )}

              {item.note && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate max-w-xs">{item.note}</span>
                </>
              )}

              {item.addedBy && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{getMemberName(item.addedBy)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
          title={t.editItemTitle}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

function localeLabelUrgent(badge: string): string {
  return badge.charAt(0).toUpperCase() + badge.slice(1).toLowerCase();
}

interface EditItemModalProps {
  item: ShoppingItem;
  categories: Category[];
  onClose: () => void;
  onSave: (updates: Partial<ShoppingItem>) => Promise<void>;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, categories, onClose, onSave }) => {
  const { t, getCategoryName } = useLanguage();
  const [title, setTitle] = useState(item.title);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [note, setNote] = useState(item.note || '');
  const [urgent, setUrgent] = useState(item.urgent || false);
  const [price, setPrice] = useState(item.estimatedPrice ? String(item.estimatedPrice) : '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      categoryId,
      quantity: Number(quantity) || 1,
      unit,
      note: note.trim() || undefined,
      urgent,
      estimatedPrice: price ? parseFloat(price) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/30 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900 text-base">{t.editItemTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {t.itemTitleLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                {t.categoryLabel}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {getCategoryName(c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  {t.qtyLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-center font-medium tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  {t.unitLabel}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-center"
                >
                  {Object.keys(t.units).map((u) => (
                    <option key={u} value={u}>
                      {t.units[u]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {t.noteLabel}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              className="w-full px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-medium text-rose-600">{t.urgentLabel}</span>
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500">{t.estPriceLabel}:</span>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-20 px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 text-xs font-medium"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium"
            >
              {t.saveChangesBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
