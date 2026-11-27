import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingItem,
  Category,
  WeekendTemplate,
  NotificationSchedule,
  FirebaseConfig,
  RecentItem,
} from '../types';
import { firebaseService } from '../services/firebaseService';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../data/androidProjectFiles';
import { useLanguage } from '../i18n/LanguageContext';
import { APP_VERSION } from '../constants/version';
import JSZip from 'jszip';
import {
  Download,
  Copy,
  Check,
  Bell,
  Play,
  ShieldCheck,
  Settings,
  FileCode,
  X,
  Plus,
  Ban,
  RotateCcw,
  Trash2,
  ChevronDown,
} from 'lucide-react';

interface AndroidCompanionHubProps {
  items: ShoppingItem[];
  categories: Category[];
  templates: WeekendTemplate[];
  schedules: NotificationSchedule[];
  recentItems: RecentItem[];
  config: FirebaseConfig;
}

function formatSimTime(ts: number, locale: string): string {
  const date = new Date(ts);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const loc = locale === 'uk' ? 'uk-UA' : 'en-US';
  const timeStr = date.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (sameDay) return timeStr;
  const dateStr = date.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' });
  return `${dateStr} ${timeStr}`;
}

export const AndroidCompanionHub: React.FC<AndroidCompanionHubProps> = ({
  items,
  categories,
  templates,
  schedules,
  recentItems,
  config,
}) => {
  const { t, getCategoryName, getUnitName, locale } = useLanguage();

  const [hubTab, setHubTab] = useState<'simulator' | 'code' | 'guide'>('simulator');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [simScreen, setSimScreen] = useState<'list' | 'templates' | 'notifications' | 'settings'>('list');
  const [simStatusFilter, setSimStatusFilter] = useState<'pending' | 'urgent' | 'completed' | 'cancelled' | 'all'>('pending');
  const [simCategoryFilter, setSimCategoryFilter] = useState<string>('all');
  const [simAddOpen, setSimAddOpen] = useState(false);
  const [simNewTitle, setSimNewTitle] = useState('');
  const [simNewCategoryId, setSimNewCategoryId] = useState(categories[0]?.id || 'cat_produce');
  const [simNewUrgent, setSimNewUrgent] = useState(false);
  const [simDropdownOpen, setSimDropdownOpen] = useState(true);
  const [simNotificationBanner, setSimNotificationBanner] = useState<{
    show: boolean;
    title: string;
    body: string;
    items: string[];
    suppressed?: boolean;
    reason?: string;
  } | null>(null);

  const selectedFile: AndroidFile =
    ANDROID_PROJECT_FILES[selectedFileIndex] || ANDROID_PROJECT_FILES[0];

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const simPendingCount = items.filter((i) => !i.completed && !i.cancelled).length;
  const simUrgentCount = items.filter((i) => !i.completed && !i.cancelled && i.urgent).length;
  const simCompletedCount = items.filter((i) => i.completed && !i.cancelled).length;
  const simCancelledCount = items.filter((i) => Boolean(i.cancelled)).length;
  const simAllCount = items.filter((i) => !i.cancelled).length;

  useEffect(() => {
    if (simStatusFilter === 'urgent' && simUrgentCount === 0) {
      setSimStatusFilter('pending');
    }
  }, [simStatusFilter, simUrgentCount]);

  const simFilteredItems = useMemo(() => {
    const byCat =
      simCategoryFilter === 'all'
        ? items
        : items.filter((i) => i.categoryId === simCategoryFilter);

    switch (simStatusFilter) {
      case 'pending':
        return byCat.filter((i) => !i.completed && !i.cancelled);
      case 'urgent':
        return byCat.filter((i) => !i.completed && !i.cancelled && i.urgent);
      case 'completed':
        return byCat.filter((i) => i.completed && !i.cancelled);
      case 'cancelled':
        return byCat.filter((i) => Boolean(i.cancelled));
      case 'all':
        return byCat.filter((i) => !i.cancelled);
    }
  }, [items, simCategoryFilter, simStatusFilter]);

  const simPendingTitles = useMemo(
    () => new Set(items.filter((i) => !i.completed && !i.cancelled).map((i) => i.title.trim().toLowerCase())),
    [items]
  );

  const simFilteredRecent = useMemo(() => {
    const q = simNewTitle.trim().toLowerCase();
    const sorted = [...recentItems].sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    if (!q) return sorted;
    return sorted.filter((r) => r.title.trim().toLowerCase().includes(q));
  }, [recentItems, simNewTitle]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'family-shopping-android-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
      alert('Could not generate ZIP file.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSimulateWorkManager = (schedule: NotificationSchedule) => {
    const monitoredCatIds = new Set(schedule.categoryIds);

    const uncompletedMatchingItems = items.filter((item) => {
      if (item.completed || item.cancelled) return false;
      if (monitoredCatIds.size === 0) return true;
      return monitoredCatIds.has(item.categoryId);
    });

    const catNames = schedule.categoryIds
      .map((id) => getCategoryName(categoryMap.get(id)) || id)
      .join(', ');

    if (uncompletedMatchingItems.length === 0) {
      setSimNotificationBanner({
        show: true,
        title: t.suppressedTitle,
        body: t.suppressedReason(catNames),
        items: [],
        suppressed: true,
        reason: t.suppressedReason(catNames),
      });
    } else {
      const itemNames = uncompletedMatchingItems.map(
        (i) => `${i.title} (${i.quantity} ${getUnitName(i.unit)})`
      );
      setSimNotificationBanner({
        show: true,
        title: t.triggeredTitle(schedule.title, uncompletedMatchingItems.length),
        body: itemNames.slice(0, 3).join(', ') + (itemNames.length > 3 ? '...' : ''),
        items: itemNames,
        suppressed: false,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1 max-w-xl">
          <p className="text-xs font-medium text-neutral-400">{t.androidBadge}</p>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {t.androidHubTitle}
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed">{t.androidHubDesc}</p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isDownloadingZip}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isDownloadingZip ? t.generatingZipBtn : t.downloadZipBtn}</span>
        </button>
      </div>

      {/* Clean Underline Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setHubTab('simulator')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${
            hubTab === 'simulator'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t.tabSimulator}
        </button>

        <button
          type="button"
          onClick={() => setHubTab('code')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${
            hubTab === 'code'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t.tabCodeExplorer(ANDROID_PROJECT_FILES.length)}
        </button>

        <button
          type="button"
          onClick={() => setHubTab('guide')}
          className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap ${
            hubTab === 'guide'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {t.tabSetupGuide}
        </button>
      </div>

      {/* TAB 1: INTERACTIVE MOBILE SIMULATOR */}
      {hubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Clean Minimalist Phone Simulator */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[310px] aspect-[9/19] bg-neutral-900 rounded-[40px] p-2.5 shadow-xl border border-neutral-800 flex flex-col justify-between overflow-hidden">
              {/* Status Bar */}
              <div className="pt-2 px-4 flex items-center justify-between text-[10px] font-medium text-neutral-400 select-none tabular-nums">
                <span>17:30</span>
                <span>5G</span>
              </div>

              {/* Simulated Android Notification Shade */}
              {simNotificationBanner?.show && (
                <div
                  className={`absolute top-9 left-3 right-3 z-50 rounded-xl p-3 shadow-lg border text-xs ${
                    simNotificationBanner.suppressed
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-200'
                      : 'bg-neutral-900 border-neutral-700 text-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {simNotificationBanner.suppressed ? (
                        <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
                      ) : (
                        <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-[11px]">{simNotificationBanner.title}</div>
                        <div className="text-[10px] text-neutral-400">
                          WorkManager · {locale === 'uk' ? 'Щойно' : 'Just now'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSimNotificationBanner(null)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="mt-1.5 text-[11px] text-neutral-300 leading-snug">
                    {simNotificationBanner.suppressed
                      ? simNotificationBanner.reason
                      : simNotificationBanner.body}
                  </p>

                  {!simNotificationBanner.suppressed && simNotificationBanner.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-neutral-800 space-y-0.5 max-h-24 overflow-y-auto">
                      {simNotificationBanner.items.map((item, idx) => (
                        <div key={idx} className="text-[10px] text-neutral-300">
                          · {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Screen Content */}
              <div className="relative flex-1 bg-neutral-50 rounded-[30px] overflow-hidden flex flex-col mt-1.5">
                <div className="bg-white px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-neutral-900">
                      {simScreen === 'list' && (locale === 'uk' ? 'Список покупок' : 'Family Shopping')}
                      {simScreen === 'templates' && (locale === 'uk' ? 'Майстер вихідних' : 'Weekend Master')}
                      {simScreen === 'notifications' && (locale === 'uk' ? 'Нагадування' : 'Reminders')}
                      {simScreen === 'settings' && (locale === 'uk' ? 'Налаштування' : 'Settings')}
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {config.groupId || 'default-family'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSimScreen('notifications')}
                      className={`p-1.5 rounded-md ${
                        simScreen === 'notifications' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimScreen('settings')}
                      className={`p-1.5 rounded-md ${
                        simScreen === 'settings' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                  {simScreen === 'list' && (
                    <div className="space-y-2 pb-10">
                      {/* Status filter strip (Default: Pending) */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSimStatusFilter('pending')}
                          className={`px-2 py-1 rounded-md font-medium shrink-0 tabular-nums transition-colors ${
                            simStatusFilter === 'pending'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {t.filterPending(simPendingCount)}
                        </button>

                        {simUrgentCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setSimStatusFilter('urgent')}
                            className={`px-2 py-1 rounded-md font-medium shrink-0 tabular-nums transition-colors ${
                              simStatusFilter === 'urgent'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white border border-neutral-200 text-rose-600'
                            }`}
                          >
                            {t.filterUrgent(simUrgentCount)}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSimStatusFilter('completed')}
                          className={`px-2 py-1 rounded-md font-medium shrink-0 tabular-nums transition-colors ${
                            simStatusFilter === 'completed'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {t.filterCompleted(simCompletedCount)}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimStatusFilter('cancelled')}
                          className={`px-2 py-1 rounded-md font-medium shrink-0 tabular-nums transition-colors ${
                            simStatusFilter === 'cancelled'
                              ? 'bg-amber-700 text-white'
                              : 'bg-white border border-neutral-200 text-amber-700'
                          }`}
                        >
                          {t.filterCancelled(simCancelledCount)}
                        </button>

                        <button
                          type="button"
                          onClick={() => setSimStatusFilter('all')}
                          className={`px-2 py-1 rounded-md font-medium shrink-0 tabular-nums transition-colors ${
                            simStatusFilter === 'all'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-white border border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {t.filterAll(simAllCount)}
                        </button>
                      </div>

                      {/* Category filter strip */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSimCategoryFilter('all')}
                          className={`px-2 py-0.5 rounded-md font-medium shrink-0 ${
                            simCategoryFilter === 'all'
                              ? 'bg-neutral-200 text-neutral-900'
                              : 'text-neutral-500 hover:bg-neutral-100'
                          }`}
                        >
                          {t.allCategoriesChip}
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              setSimCategoryFilter(simCategoryFilter === cat.id ? 'all' : cat.id)
                            }
                            className={`px-2 py-0.5 rounded-md font-medium shrink-0 ${
                              simCategoryFilter === cat.id
                                ? 'bg-neutral-200 text-neutral-900'
                                : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                          >
                            {cat.icon} {getCategoryName(cat)}
                          </button>
                        ))}
                      </div>

                      {/* Clear header for completed / cancelled */}
                      {(simStatusFilter === 'completed' || simStatusFilter === 'all') &&
                        simCompletedCount > 0 && (
                          <div className="flex items-center justify-between px-1 text-[10px]">
                            <span className="text-neutral-400">
                              {t.filterCompleted(simCompletedCount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => firebaseService.clearCompletedItems()}
                              className="text-rose-600 font-medium hover:underline"
                            >
                              {t.clearCompletedBtn(simCompletedCount)}
                            </button>
                          </div>
                        )}

                      {simStatusFilter === 'cancelled' && simCancelledCount > 0 && (
                        <div className="flex items-center justify-between px-1 text-[10px]">
                          <span className="text-amber-700 font-medium">
                            {t.filterCancelled(simCancelledCount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => firebaseService.clearCancelledItems()}
                            className="text-rose-600 font-medium hover:underline"
                          >
                            {t.clearCancelledBtn(simCancelledCount)}
                          </button>
                        </div>
                      )}

                      {simFilteredItems.length === 0 ? (
                        <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center text-[11px] text-neutral-400">
                          {locale === 'uk' ? 'У цьому розділі порожньо' : 'No items in this view'}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                          {simFilteredItems.map((item) => {
                            const isCancelled = Boolean(item.cancelled);
                            return (
                              <div
                                key={item.id}
                                onClick={() =>
                                  isCancelled
                                    ? firebaseService.restoreItem(item.id)
                                    : firebaseService.toggleItem(item.id)
                                }
                                className="flex items-start gap-2 p-2.5 text-xs cursor-pointer hover:bg-neutral-50"
                              >
                                {isCancelled ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      firebaseService.restoreItem(item.id);
                                    }}
                                    className="mt-0.5 text-emerald-600 shrink-0"
                                    title={t.restoreItemBtn}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => {}}
                                    className="mt-0.5 w-3.5 h-3.5 rounded text-emerald-600 shrink-0"
                                  />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`truncate ${
                                        item.completed || isCancelled
                                          ? 'line-through text-neutral-400'
                                          : 'text-neutral-800 font-medium'
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                    {item.urgent && !item.completed && !isCancelled && (
                                      <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-600 text-[9px] font-bold">
                                        !
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 tabular-nums">
                                    {item.quantity} {getUnitName(item.unit)}
                                  </div>
                                  <div className="text-[9px] text-neutral-400 tabular-nums flex flex-wrap gap-x-1.5 mt-0.5">
                                    {item.createdAt > 0 && (
                                      <span>
                                        {t.addedAtLabel(formatSimTime(item.createdAt, locale))}
                                      </span>
                                    )}
                                    {item.completed && !isCancelled && item.completedAt && (
                                      <span className="text-emerald-600 font-medium">
                                        · {t.boughtAtLabel(formatSimTime(item.completedAt, locale))}
                                      </span>
                                    )}
                                    {isCancelled && item.cancelledAt && (
                                      <span className="text-amber-700 font-medium">
                                        · {t.cancelledAtLabel(formatSimTime(item.cancelledAt, locale))}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        firebaseService.cancelItem(item.id);
                                      }}
                                      className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                      title={t.cancelItemBtn}
                                    >
                                      <Ban className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      firebaseService.deleteItem(item.id);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                    title={t.deleteItemBtn}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {simScreen === 'templates' && (
                    <div className="space-y-2">
                      {templates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2"
                        >
                          <div className="font-medium text-xs text-neutral-900">{tmpl.name}</div>
                          <button
                            type="button"
                            onClick={async () => {
                              await firebaseService.applyTemplate(tmpl.id, 'merge');
                              setSimScreen('list');
                            }}
                            className="w-full py-1.5 bg-neutral-900 text-white rounded-md text-[11px] font-medium"
                          >
                            {t.applyInOneTap}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {simScreen === 'notifications' && (
                    <div className="space-y-2">
                      {schedules.map((s) => (
                        <div
                          key={s.id}
                          className="bg-white p-2.5 rounded-lg border border-neutral-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs text-neutral-800">{s.title}</span>
                            <span className="text-[10px] font-mono text-neutral-500">{s.time}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {s.categoryIds
                              .map((id) => getCategoryName(categoryMap.get(id)) || id)
                              .join(', ')}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateWorkManager(s)}
                            className="w-full py-1 rounded-md bg-neutral-900 text-white text-[10px] font-medium"
                          >
                            {t.triggerSimBtn}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {simScreen === 'settings' && (
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1.5 text-[11px]">
                      <div className="font-medium text-neutral-800">SharedPreferences</div>
                      <div className="text-neutral-500">Group: {config.groupId || 'default'}</div>
                      <div className="text-neutral-500">
                        Project: {config.projectId || 'Demo'}
                      </div>
                      <div className="pt-2 text-[10px] text-neutral-400 tabular-nums">
                        {t.brandName} · v{APP_VERSION}
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulator FAB on List screen */}
                {simScreen === 'list' && !simAddOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimAddOpen(true);
                      setSimDropdownOpen(true);
                    }}
                    className="absolute bottom-11 right-3 w-9 h-9 rounded-full bg-neutral-900 text-white shadow-lg flex items-center justify-center hover:bg-neutral-800 transition-colors"
                    title={t.addItemBtn}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                {/* Simulator Add Item Dialog overlay */}
                {simScreen === 'list' && simAddOpen && (
                  <div className="absolute inset-0 z-40 bg-neutral-950/40 flex items-center justify-center p-3">
                    <div className="bg-white rounded-xl w-full p-3 space-y-2 shadow-xl border border-neutral-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-900">
                          {t.addItemBtn}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSimAddOpen(false)}
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={simNewTitle}
                          onChange={(e) => {
                            setSimNewTitle(e.target.value);
                            setSimDropdownOpen(true);
                          }}
                          placeholder={t.quickAddPlaceholder}
                          className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => setSimDropdownOpen(!simDropdownOpen)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              simDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {simDropdownOpen && simFilteredRecent.length > 0 && (
                        <div className="border border-neutral-200 rounded-lg max-h-36 overflow-y-auto divide-y divide-neutral-100">
                          {simFilteredRecent.map((recent) => {
                            const cat = categoryMap.get(recent.categoryId);
                            const inList = simPendingTitles.has(recent.title.trim().toLowerCase());
                            return (
                              <button
                                key={recent.title.trim().toLowerCase()}
                                type="button"
                                onClick={async () => {
                                  await firebaseService.addItem({
                                    title: recent.title,
                                    categoryId: recent.categoryId || simNewCategoryId,
                                    quantity: recent.quantity || 1,
                                    unit: recent.unit || 'pcs',
                                    urgent: false,
                                    addedBy: 'Android',
                                    completed: false,
                                  });
                                  setSimNewTitle('');
                                  setSimAddOpen(false);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-neutral-50 text-[11px]"
                              >
                                <span className="truncate font-medium text-neutral-800">
                                  {cat ? `${cat.icon} ` : ''}
                                  {recent.title}
                                </span>
                                <span className="shrink-0 text-[10px] text-emerald-600 ml-1">
                                  {inList ? t.inListBadge : '+'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={simNewCategoryId}
                          onChange={(e) => setSimNewCategoryId(e.target.value)}
                          className="flex-1 px-2 py-1 rounded-md border border-neutral-200 text-[11px] bg-neutral-50"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {getCategoryName(c)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-[10px] text-rose-600 font-medium">
                          <input
                            type="checkbox"
                            checked={simNewUrgent}
                            onChange={(e) => setSimNewUrgent(e.target.checked)}
                          />
                          <span>!</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSimAddOpen(false)}
                          className="px-2.5 py-1 text-[11px] text-neutral-500"
                        >
                          {t.cancelBtn}
                        </button>
                        <button
                          type="button"
                          disabled={!simNewTitle.trim()}
                          onClick={async () => {
                            if (!simNewTitle.trim()) return;
                            await firebaseService.addItem({
                              title: simNewTitle.trim(),
                              categoryId: simNewCategoryId,
                              quantity: 1,
                              unit: 'pcs',
                              urgent: simNewUrgent,
                              addedBy: 'Android',
                              completed: false,
                            });
                            setSimNewTitle('');
                            setSimNewUrgent(false);
                            setSimAddOpen(false);
                          }}
                          className="px-3 py-1 rounded-md bg-neutral-900 text-white text-[11px] font-medium disabled:opacity-40"
                        >
                          {t.addItemBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimal Bottom Bar */}
                <div className="bg-white border-t border-neutral-200 px-3 py-2 flex items-center justify-around text-[10px] text-neutral-500">
                  <button
                    type="button"
                    onClick={() => setSimScreen('list')}
                    className={simScreen === 'list' ? 'text-neutral-900 font-semibold' : ''}
                  >
                    {locale === 'uk' ? 'Список' : 'List'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScreen('templates')}
                    className={simScreen === 'templates' ? 'text-neutral-900 font-semibold' : ''}
                  >
                    {locale === 'uk' ? 'Шаблони' : 'Templates'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScreen('notifications')}
                    className={simScreen === 'notifications' ? 'text-neutral-900 font-semibold' : ''}
                  >
                    {locale === 'uk' ? 'Сповіщення' : 'Alerts'}
                  </button>
                </div>
              </div>

              <div className="py-1 flex justify-center">
                <div className="w-20 h-1 bg-neutral-700 rounded-full" />
              </div>
            </div>
          </div>

          {/* Right: Clean WorkManager Test Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-neutral-900 text-sm">
                  {t.testWorkManagerTitle}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">{t.testWorkManagerDesc}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs space-y-1.5 text-neutral-600">
                <div className="font-medium text-neutral-900">{t.smartRuleTitle}</div>
                <p>{t.smartRuleCaseA}</p>
                <p>{t.smartRuleCaseB}</p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-medium text-neutral-500">
                  {t.selectScheduleToTest}
                </div>
                <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg">
                  {schedules.map((schedule) => {
                    const monitoredCatIds = new Set(schedule.categoryIds);
                    const pendingInCat = items.filter(
                      (i) =>
                        !i.completed &&
                        !i.cancelled &&
                        (monitoredCatIds.size === 0 || monitoredCatIds.has(i.categoryId))
                    ).length;

                    return (
                      <div
                        key={schedule.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-neutral-900">
                              {schedule.title}
                            </span>
                            <span className="text-xs font-mono text-neutral-400 tabular-nums">
                              {schedule.time}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {t.monitoredCategoriesLabel(
                              schedule.categoryIds
                                .map((id) => getCategoryName(categoryMap.get(id)) || id)
                                .join(', ')
                            )}
                          </div>
                          <div
                            className={`text-[11px] font-medium tabular-nums ${
                              pendingInCat > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {pendingInCat > 0
                              ? t.pendingWaitingInCat(pendingInCat)
                              : t.zeroWaitingInCat}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSimulateWorkManager(schedule)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shrink-0 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>{t.triggerSimBtn}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCE CODE EXPLORER */}
      {hubTab === 'code' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
            <div className="md:col-span-4 p-3 space-y-1 bg-neutral-50/60">
              {ANDROID_PROJECT_FILES.map((file, idx) => {
                const isSelected = selectedFileIndex === idx;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-8 flex flex-col h-[580px] bg-neutral-950 text-neutral-100">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-neutral-200 truncate">
                    {selectedFile.path}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {selectedFile.description}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 shrink-0 transition-colors"
                >
                  {copiedFile ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedFile ? t.copiedCodeBtn : t.copyCodeBtn}</span>
                </button>
              </div>

              <pre className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-neutral-300 select-all">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP GUIDE */}
      {hubTab === 'guide' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 divide-y divide-neutral-100">
          <div className="pb-4">
            <h3 className="text-base font-semibold text-neutral-900">
              {locale === 'uk'
                ? 'Запуск проекту в Android Studio'
                : 'Setup Guide: Running in Android Studio'}
            </h3>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              01. {locale === 'uk' ? 'Експорт проекту' : 'Export Project'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Завантажте ZIP-архів кнопкою вище та розпакуйте його у робочу директорію.'
                : 'Download the ZIP archive above and extract it to your workspace directory.'}
            </p>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              02. {locale === 'uk' ? 'Відкриття в Android Studio' : 'Open in Android Studio'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Виберіть File → Open та вкажіть папку проекту. Gradle автоматично встановить Compose, WorkManager і Firestore.'
                : 'Select File → Open and choose the project folder. Gradle resolves Compose, WorkManager, and Firestore automatically.'}
            </p>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              03. {locale === 'uk' ? 'Підключення до сімейної групи' : 'Pair Family Group'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Вкажіть параметри Firebase та ідентифікатор групи в налаштуваннях додатка або відскануйте QR-код.'
                : 'Enter Firebase credentials and Group ID in Settings or scan the pairing QR code.'}
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <div className="text-xs font-semibold text-neutral-900">
              04. {locale === 'uk' ? 'Тест WorkManager через ADB' : 'Test WorkManager via ADB'}
            </div>
            <pre className="p-3 bg-neutral-950 rounded-lg font-mono text-xs text-neutral-300 overflow-x-auto">
              adb shell cmd jobscheduler run -f com.familyshopping.app [JOB_ID]
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
