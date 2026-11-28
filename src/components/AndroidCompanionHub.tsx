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
  RefreshCw,
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
  const loc = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  const timeStr = date.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (sameDay) return timeStr;
  const dateStr = date.toLocaleDateString(loc, { day: '2-digit', month: '2-digit' });
  return `${dateStr} ${timeStr}`;
}

function getSimActionTimestamp(item: ShoppingItem): number {
  if (item.cancelled) return item.cancelledAt || item.createdAt || 0;
  if (item.completed) return item.completedAt || item.createdAt || 0;
  return item.createdAt || 0;
}

function getSimDayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatSimDayHeader(dayStart: number, locale: string): string {
  const today = getSimDayStart(Date.now());
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.getTime();

  if (dayStart === today) {
    return locale === 'ru' ? 'Сегодня' : locale === 'en' ? 'Today' : 'Сьогодні';
  }
  if (dayStart === yesterday) {
    return locale === 'ru' ? 'Вчера' : locale === 'en' ? 'Yesterday' : 'Вчора';
  }
  const loc = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  const sameYear = new Date(dayStart).getFullYear() === new Date(today).getFullYear();
  return new Date(dayStart).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

type SimThemeMode = 'light' | 'dark';
type SimColorSchemeId = 'graphite' | 'sage' | 'ocean' | 'sand' | 'lavender';

const SIM_COLOR_SCHEMES: Record<
  SimColorSchemeId,
  {
    dotLight: string;
    dotDark: string;
    lightBg: string;
    lightAccent: string;
    darkBg: string;
    darkHeader: string;
    darkAccent: string;
    darkAccentText: string;
    names: { uk: string; ru: string; en: string };
  }
> = {
  graphite: {
    dotLight: '#27272A',
    dotDark: '#D4D4D8',
    lightBg: '#FAFAFA',
    lightAccent: '#18181B',
    darkBg: '#111214',
    darkHeader: '#18191D',
    darkAccent: '#E4E4E7',
    darkAccentText: '#18181B',
    names: { uk: 'Графіт', ru: 'Графит', en: 'Graphite' },
  },
  sage: {
    dotLight: '#2D4F3E',
    dotDark: '#8AB89E',
    lightBg: '#F6F9F7',
    lightAccent: '#2D4F3E',
    darkBg: '#0E1411',
    darkHeader: '#151E1A',
    darkAccent: '#9BC4AE',
    darkAccentText: '#102219',
    names: { uk: 'Шавлія', ru: 'Шалфей', en: 'Sage' },
  },
  ocean: {
    dotLight: '#234766',
    dotDark: '#8BB7DC',
    lightBg: '#F5F8FB',
    lightAccent: '#234766',
    darkBg: '#0E1318',
    darkHeader: '#151C24',
    darkAccent: '#99BFE0',
    darkAccentText: '#0E2030',
    names: { uk: 'Океан', ru: 'Океан', en: 'Ocean' },
  },
  sand: {
    dotLight: '#6B4E3B',
    dotDark: '#D2B29C',
    lightBg: '#FAF7F3',
    lightAccent: '#5C4332',
    darkBg: '#15120F',
    darkHeader: '#1E1915',
    darkAccent: '#D6B8A3',
    darkAccentText: '#281B12',
    names: { uk: 'Пісок', ru: 'Песок', en: 'Sand' },
  },
  lavender: {
    dotLight: '#4B3F6B',
    dotDark: '#B9AADF',
    lightBg: '#F8F7FB',
    lightAccent: '#463A63',
    darkBg: '#121018',
    darkHeader: '#1A1723',
    darkAccent: '#BEB0E0',
    darkAccentText: '#1E1730',
    names: { uk: 'Лаванда', ru: 'Лаванда', en: 'Lavender' },
  },
};

const SIM_LIGHT_GRADIENTS: Array<{ bg: string; border: string }> = [
  { bg: 'linear-gradient(135deg, #F6FBF7, #E8F5EC)', border: '#D0E6D7' },
  { bg: 'linear-gradient(90deg, #F5F9FD, #E6F0FA)', border: '#CEDEEB' },
  { bg: 'radial-gradient(circle at 88% 15%, #F6ECDA, #FDF9F2)', border: '#EADBC0' },
  { bg: 'linear-gradient(45deg, #FCF5F7, #F6E7EC)', border: '#E7D0D8' },
  { bg: 'linear-gradient(135deg, #F8F6FC, #EDE8F8, #F8F6FC)', border: '#D9D0EB' },
  { bg: 'linear-gradient(180deg, #F3FAFA, #E3F2F2)', border: '#C9E2E2' },
  { bg: 'linear-gradient(135deg, #FDF7F3, #F7E9DF)', border: '#EAD3C3' },
  { bg: 'linear-gradient(90deg, #F6F7FA, #E9EDF4)', border: '#D2D8E4' },
  { bg: 'radial-gradient(circle at 88% 15%, #EBF2E2, #F7FAF3)', border: '#D5E1C7' },
  { bg: 'linear-gradient(45deg, #F4F7FC, #E5ECFA)', border: '#CCD7EC' },
  { bg: 'linear-gradient(135deg, #FAF7F2, #F1E9DD, #FAF7F2)', border: '#E0D4C3' },
  { bg: 'linear-gradient(180deg, #FAF5FA, #F2E6F2)', border: '#E1CEE1' },
  { bg: 'linear-gradient(135deg, #F3FAFC, #E3F3F8)', border: '#C9E3EC' },
  { bg: 'linear-gradient(90deg, #FAFAF2, #F1F2DF)', border: '#DDDFC3' },
  { bg: 'radial-gradient(circle at 88% 15%, #F5E6E1, #FCF6F4)', border: '#E4CFC8' },
  { bg: 'linear-gradient(45deg, #F6F6FC, #E8E9F8)', border: '#D0D2EC' },
  { bg: 'linear-gradient(135deg, #F4FAF7, #E5F2EC, #F4FAF7)', border: '#CCE2D7' },
  { bg: 'linear-gradient(180deg, #FDFBF2, #F7F2DB)', border: '#E8E0C0' },
  { bg: 'linear-gradient(135deg, #FDF5F5, #F7E5E5)', border: '#E8CECE' },
  { bg: 'linear-gradient(90deg, #F8F8F8, #ECECEE)', border: '#D8D8DC' },
];

const SIM_DARK_GRADIENTS: Array<{ bg: string; border: string }> = [
  { bg: 'linear-gradient(135deg, #17211C, #1E2D25)', border: '#2B4135' },
  { bg: 'linear-gradient(90deg, #161E27, #1D2836)', border: '#2B3B4E' },
  { bg: 'radial-gradient(circle at 88% 15%, #2D261E, #211C17)', border: '#42372C' },
  { bg: 'linear-gradient(45deg, #22191D, #2E2027)', border: '#443039' },
  { bg: 'linear-gradient(135deg, #1B1926, #252134, #1B1926)', border: '#36314D' },
  { bg: 'linear-gradient(180deg, #152021, #1B2B2D)', border: '#284043' },
  { bg: 'linear-gradient(135deg, #231B17, #30241E)', border: '#46352C' },
  { bg: 'linear-gradient(90deg, #181C22, #212630)', border: '#313947' },
  { bg: 'radial-gradient(circle at 88% 15%, #232C1D, #1A2016)', border: '#34412B' },
  { bg: 'linear-gradient(45deg, #161B26, #1E2535)', border: '#2D374E' },
  { bg: 'linear-gradient(135deg, #1F1C18, #2A2620, #1F1C18)', border: '#3E382F' },
  { bg: 'linear-gradient(180deg, #201822, #2C202F)', border: '#412F45' },
  { bg: 'linear-gradient(135deg, #151E23, #1C2930)', border: '#293C46' },
  { bg: 'linear-gradient(90deg, #1D2016, #282C1E)', border: '#3B412C' },
  { bg: 'radial-gradient(circle at 88% 15%, #2F2321, #221A19)', border: '#443330' },
  { bg: 'linear-gradient(45deg, #191A26, #222435)', border: '#33364F' },
  { bg: 'linear-gradient(135deg, #16211D, #1D2D27, #16211D)', border: '#2B4239' },
  { bg: 'linear-gradient(180deg, #201E16, #2B281D)', border: '#403B2A' },
  { bg: 'linear-gradient(135deg, #231819, #302022)', border: '#462F32' },
  { bg: 'linear-gradient(90deg, #1A1B1E, #23252A)', border: '#34373F' },
];

function getSimCategoryGradient(
  categoryId: string,
  categories: Category[],
  isDark: boolean
): { bg: string; border: string } {
  const idx = categories.findIndex((c) => c.id === categoryId);
  let slot = 0;
  if (idx >= 0) {
    slot = idx % 20;
  } else {
    let hash = 0;
    for (let i = 0; i < categoryId.length; i++) {
      hash = (hash * 31 + categoryId.charCodeAt(i)) | 0;
    }
    slot = Math.abs(hash) % 20;
  }
  const list = isDark ? SIM_DARK_GRADIENTS : SIM_LIGHT_GRADIENTS;
  return list[slot];
}

export const AndroidCompanionHub: React.FC<AndroidCompanionHubProps> = ({
  items,
  categories,
  templates,
  schedules,
  recentItems,
  config,
}) => {
  const { t, getCategoryName, getUnitName, locale, setLocale } = useLanguage();

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
  const [simNewNote, setSimNewNote] = useState('');
  const [simNewUrgent, setSimNewUrgent] = useState(false);
  const [simDropdownOpen, setSimDropdownOpen] = useState(true);
  const [simPendingConfirm, setSimPendingConfirm] = useState<
    | { type: 'cancel'; item: ShoppingItem }
    | { type: 'delete'; item: ShoppingItem }
    | { type: 'clearCompleted' }
    | { type: 'clearCancelled' }
    | null
  >(null);
  const [simNotificationBanner, setSimNotificationBanner] = useState<{
    show: boolean;
    title: string;
    body: string;
    items: string[];
    suppressed?: boolean;
    reason?: string;
  } | null>(null);
  const [simRefreshing, setSimRefreshing] = useState(false);
  const [simWeeksLoaded, setSimWeeksLoaded] = useState(0);
  const [simShowAllHistory, setSimShowAllHistory] = useState(false);
  const [simThemeMode, setSimThemeMode] = useState<SimThemeMode>('light');
  const [simColorScheme, setSimColorScheme] = useState<SimColorSchemeId>('graphite');
  const [simCategoryBgEnabled, setSimCategoryBgEnabled] = useState(true);
  const [simShowAddedBy, setSimShowAddedBy] = useState(true);
  const [simShowTimestamps, setSimShowTimestamps] = useState(true);

  const simDark = simThemeMode === 'dark';
  const simScheme = SIM_COLOR_SCHEMES[simColorScheme];

  const handleSimRefresh = () => {
    setSimRefreshing(true);
    setTimeout(() => setSimRefreshing(false), 600);
  };

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
  const simAllCount = items.length;

  useEffect(() => {
    if (simStatusFilter === 'urgent' && simUrgentCount === 0) {
      setSimStatusFilter('pending');
    }
  }, [simStatusFilter, simUrgentCount]);

  useEffect(() => {
    setSimWeeksLoaded(0);
    setSimShowAllHistory(false);
  }, [simStatusFilter]);

  const simIsDatePaginated =
    simStatusFilter === 'all' ||
    simStatusFilter === 'completed' ||
    simStatusFilter === 'cancelled';

  const simTodayStart = getSimDayStart(Date.now());
  const simWindowStart = useMemo(() => {
    if (simWeeksLoaded <= 0) return simTodayStart;
    const d = new Date(simTodayStart);
    d.setDate(d.getDate() - simWeeksLoaded * 7);
    return d.getTime();
  }, [simTodayStart, simWeeksLoaded]);

  const simSectionPool = useMemo(() => {
    switch (simStatusFilter) {
      case 'pending':
        return items.filter((i) => !i.completed && !i.cancelled);
      case 'urgent':
        return items.filter((i) => !i.completed && !i.cancelled && i.urgent);
      case 'completed':
        return items.filter((i) => i.completed && !i.cancelled);
      case 'cancelled':
        return items.filter((i) => Boolean(i.cancelled));
      case 'all':
        return items;
    }
  }, [items, simStatusFilter]);

  const simItemsInStatus = useMemo(() => {
    if (!simIsDatePaginated) return simSectionPool;
    if (simShowAllHistory) {
      return [...simSectionPool].sort(
        (a, b) => getSimActionTimestamp(b) - getSimActionTimestamp(a)
      );
    }
    if (simStatusFilter === 'all') {
      return simSectionPool
        .filter((i) => (!i.completed && !i.cancelled) || getSimActionTimestamp(i) >= simWindowStart)
        .sort((a, b) => getSimActionTimestamp(b) - getSimActionTimestamp(a));
    }
    return simSectionPool
      .filter((i) => getSimActionTimestamp(i) >= simWindowStart)
      .sort((a, b) => getSimActionTimestamp(b) - getSimActionTimestamp(a));
  }, [simSectionPool, simIsDatePaginated, simShowAllHistory, simStatusFilter, simWindowStart]);

  const simCategoryCountsInStatus = useMemo(() => {
    const counts = new Map<string, number>();
    simItemsInStatus.forEach((item) => {
      counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1);
    });
    return counts;
  }, [simItemsInStatus]);

  const simVisibleCategories = useMemo(
    () => categories.filter((c) => (simCategoryCountsInStatus.get(c.id) || 0) > 0),
    [categories, simCategoryCountsInStatus]
  );

  useEffect(() => {
    if (
      simCategoryFilter !== 'all' &&
      (simCategoryCountsInStatus.get(simCategoryFilter) || 0) === 0
    ) {
      setSimCategoryFilter('all');
    }
  }, [simCategoryFilter, simCategoryCountsInStatus]);

  const simFilteredItems = useMemo(() => {
    if (simCategoryFilter === 'all') return simItemsInStatus;
    return simItemsInStatus.filter((i) => i.categoryId === simCategoryFilter);
  }, [simItemsInStatus, simCategoryFilter]);

  const simOlderHiddenCount = useMemo(() => {
    if (!simIsDatePaginated || simShowAllHistory) return 0;
    const pool =
      simCategoryFilter === 'all'
        ? simSectionPool
        : simSectionPool.filter((i) => i.categoryId === simCategoryFilter);
    return pool.filter((item) => {
      const isHistorical = simStatusFilter === 'all' ? item.completed || item.cancelled : true;
      return isHistorical && getSimActionTimestamp(item) < simWindowStart;
    }).length;
  }, [simIsDatePaginated, simShowAllHistory, simCategoryFilter, simSectionPool, simStatusFilter, simWindowStart]);

  const simGroupedByDay = useMemo(() => {
    if (!simIsDatePaginated) return [];
    const groups = new Map<number, ShoppingItem[]>();
    simFilteredItems.forEach((item) => {
      const ts = getSimActionTimestamp(item);
      const dayKey = ts > 0 ? getSimDayStart(ts) : simTodayStart;
      const arr = groups.get(dayKey) || [];
      arr.push(item);
      groups.set(dayKey, arr);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [simFilteredItems, simIsDatePaginated, simTodayStart]);

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
                          WorkManager · {locale === 'uk' ? 'Щойно' : locale === 'ru' ? 'Только что' : 'Just now'}
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
              <div
                className="relative flex-1 rounded-[30px] overflow-hidden flex flex-col mt-1.5 transition-colors"
                style={{
                  backgroundColor: simDark ? simScheme.darkBg : simScheme.lightBg,
                }}
              >
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
                    simDark ? 'border-zinc-800' : 'bg-white border-neutral-200'
                  }`}
                  style={simDark ? { backgroundColor: simScheme.darkHeader } : undefined}
                >
                  <div>
                    <h4
                      className={`font-semibold text-xs ${
                        simDark ? 'text-zinc-100' : 'text-neutral-900'
                      }`}
                    >
                      {simScreen === 'list' && t.tabShoppingList}
                      {simScreen === 'templates' && t.tabWeekendMaster}
                      {simScreen === 'notifications' &&
                        (locale === 'uk' ? 'Нагадування' : locale === 'ru' ? 'Напоминания' : 'Reminders')}
                      {simScreen === 'settings' && t.tabSettings}
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {config.groupId || 'default-family'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {simScreen === 'list' && (
                      <button
                        type="button"
                        onClick={handleSimRefresh}
                        className={`p-1.5 rounded-md ${
                          simDark
                            ? 'text-zinc-400 hover:text-zinc-100'
                            : 'text-neutral-400 hover:text-neutral-900'
                        }`}
                        title={locale === 'uk' ? 'Оновити список' : locale === 'ru' ? 'Обновить список' : 'Refresh'}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${simRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSimScreen('notifications')}
                      className={`p-1.5 rounded-md ${
                        simScreen === 'notifications'
                          ? simDark
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-400'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimScreen('settings')}
                      className={`p-1.5 rounded-md ${
                        simScreen === 'settings'
                          ? simDark
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-400'
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

                      {/* Category filter strip (only categories present in selected section) */}
                      {simVisibleCategories.length > 0 && (
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
                          {simVisibleCategories.map((cat) => {
                            const catCount = simCategoryCountsInStatus.get(cat.id) || 0;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() =>
                                  setSimCategoryFilter(simCategoryFilter === cat.id ? 'all' : cat.id)
                                }
                                className={`px-2 py-0.5 rounded-md font-medium shrink-0 tabular-nums ${
                                  simCategoryFilter === cat.id
                                    ? 'bg-neutral-200 text-neutral-900'
                                    : 'text-neutral-500 hover:bg-neutral-100'
                                }`}
                              >
                                {cat.icon} {getCategoryName(cat)} ({catCount})
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Clear header for completed / cancelled */}
                      {(simStatusFilter === 'completed' || simStatusFilter === 'all') &&
                        simCompletedCount > 0 && (
                          <div className="flex items-center justify-between px-1 text-[10px]">
                            <span className="text-neutral-400">
                              {t.filterCompleted(simCompletedCount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSimPendingConfirm({ type: 'clearCompleted' })}
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
                            onClick={() => setSimPendingConfirm({ type: 'clearCancelled' })}
                            className="text-rose-600 font-medium hover:underline"
                          >
                            {t.clearCancelledBtn(simCancelledCount)}
                          </button>
                        </div>
                      )}

                      {(() => {
                        const renderSimItemCard = (item: ShoppingItem) => {
                          const isCancelled = Boolean(item.cancelled);
                          const isMuted = item.completed || isCancelled;
                          const cat = categoryMap.get(item.categoryId);
                          const categoryLabel = cat ? `${cat.icon} ${getCategoryName(cat)}` : '';
                          const metaParts: { text: string; className?: string }[] = [];
                          if (categoryLabel) {
                            metaParts.push({ text: categoryLabel });
                          }
                          if (item.quantity > 0 || item.unit) {
                            metaParts.push({
                              text: `${item.quantity} ${getUnitName(item.unit)}`.trim(),
                            });
                          }
                          if (simShowAddedBy && item.addedBy) {
                            metaParts.push({ text: `👤 ${item.addedBy}` });
                          }
                          if (simShowTimestamps) {
                            if (item.createdAt > 0) {
                              metaParts.push({
                                text: t.addedAtLabel(formatSimTime(item.createdAt, locale)),
                              });
                            }
                            if (item.completed && !isCancelled && item.completedAt) {
                              metaParts.push({
                                text: t.boughtAtLabel(formatSimTime(item.completedAt, locale)),
                                className: simDark
                                  ? 'text-emerald-400 font-medium'
                                  : 'text-emerald-600 font-medium',
                              });
                            }
                            if (isCancelled && item.cancelledAt) {
                              metaParts.push({
                                text: t.cancelledAtLabel(formatSimTime(item.cancelledAt, locale)),
                                className: simDark
                                  ? 'text-amber-400 font-medium'
                                  : 'text-amber-700 font-medium',
                              });
                            }
                          }
                          const trimmedNote = item.note?.trim() || '';
                          const catGrad = simCategoryBgEnabled
                            ? getSimCategoryGradient(item.categoryId, categories, simDark)
                            : null;

                          return (
                            <div
                              key={item.id}
                              onClick={() =>
                                isCancelled
                                  ? firebaseService.restoreItem(item.id)
                                  : firebaseService.toggleItem(item.id)
                              }
                              style={
                                catGrad
                                  ? {
                                      backgroundImage: catGrad.bg,
                                      borderColor: catGrad.border,
                                      opacity: isMuted ? 0.72 : 1,
                                    }
                                  : undefined
                              }
                              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                                catGrad
                                  ? ''
                                  : simDark
                                    ? isMuted
                                      ? 'bg-zinc-900/70 border-zinc-800'
                                      : 'bg-zinc-900 border-zinc-800'
                                    : isMuted
                                      ? 'bg-neutral-100 border-neutral-200 hover:bg-neutral-100/80'
                                      : 'bg-white border-neutral-200 shadow-xs hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {/* Left column: wrap-content, vertically centered */}
                                <div className="shrink-0 flex items-center justify-center">
                                  {isCancelled ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        firebaseService.restoreItem(item.id);
                                      }}
                                      className="p-1 text-emerald-500"
                                      title={t.restoreItemBtn}
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={item.completed}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-emerald-600"
                                    />
                                  )}
                                </div>

                                {/* Center column: flex-1, Title (max 2 lines) + wrapping metadata */}
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-xs font-bold leading-snug line-clamp-2 ${
                                        isMuted
                                          ? simDark
                                            ? 'line-through text-zinc-500'
                                            : 'line-through text-neutral-400'
                                          : simDark
                                            ? 'text-zinc-100'
                                            : 'text-neutral-900'
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                    {item.urgent && !isMuted && (
                                      <span
                                        className={`shrink-0 px-1 py-0.2 rounded text-[9px] font-bold ${
                                          simDark
                                            ? 'bg-rose-950 text-rose-300'
                                            : 'bg-rose-100 text-rose-600'
                                        }`}
                                      >
                                        !
                                      </span>
                                    )}
                                  </div>

                                  {metaParts.length > 0 && (
                                    <div
                                      className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] leading-tight tabular-nums ${
                                        simDark ? 'text-zinc-400' : 'text-neutral-500'
                                      }`}
                                    >
                                      {metaParts.map((part, idx) => (
                                        <React.Fragment key={idx}>
                                          {idx > 0 && (
                                            <span
                                              className={
                                                simDark ? 'text-zinc-600' : 'text-neutral-300'
                                              }
                                            >
                                              •
                                            </span>
                                          )}
                                          <span className={part.className}>{part.text}</span>
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Right column: wrap-content, [Cancel] [Delete] in a row, vertically centered */}
                                <div className="shrink-0 flex items-center gap-0.5">
                                  {!isCancelled && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSimPendingConfirm({ type: 'cancel', item });
                                      }}
                                      className={`p-1 rounded ${
                                        simDark
                                          ? 'text-amber-400 hover:bg-amber-950/60'
                                          : 'text-amber-600 hover:bg-amber-50'
                                      }`}
                                      title={t.cancelItemBtn}
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSimPendingConfirm({ type: 'delete', item });
                                    }}
                                    className={`p-1 rounded ${
                                      simDark
                                        ? 'text-zinc-400 hover:text-rose-400 hover:bg-rose-950/50'
                                        : 'text-neutral-400 hover:text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title={t.deleteItemBtn}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom full-width Note row (only if non-empty) */}
                              {trimmedNote && (
                                <div
                                  className={`mt-2 text-[11px] italic leading-snug break-words ${
                                    simDark ? 'text-zinc-300' : 'text-neutral-600'
                                  }`}
                                >
                                  {trimmedNote}
                                </div>
                              )}
                            </div>
                          );
                        };

                        if (simFilteredItems.length === 0) {
                          return (
                            <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center text-[11px] text-neutral-400">
                              {simOlderHiddenCount > 0
                                ? locale === 'uk'
                                  ? 'За вибраний період позицій немає'
                                  : locale === 'ru'
                                    ? 'За выбранный период позиций нет'
                                    : 'No items in this period'
                                : locale === 'uk'
                                  ? 'У цьому розділі порожньо'
                                  : locale === 'ru'
                                    ? 'В этом разделе пусто'
                                    : 'No items in this view'}
                            </div>
                          );
                        }

                        if (simIsDatePaginated) {
                          return (
                            <div className="space-y-2.5">
                              {simGroupedByDay.map(([dayKey, dayItems]) => (
                                <div key={dayKey} className="space-y-1.5">
                                  <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-neutral-500">
                                    <span>{formatSimDayHeader(dayKey, locale)}</span>
                                    <span className="text-neutral-400 tabular-nums">{dayItems.length}</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {dayItems.map(renderSimItemCard)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-1.5">
                            {simFilteredItems.map(renderSimItemCard)}
                          </div>
                        );
                      })()}

                      {simIsDatePaginated && !simShowAllHistory && simOlderHiddenCount > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setSimWeeksLoaded((w) => w + 1)}
                            className="flex-1 py-1.5 rounded-lg border border-neutral-300 bg-white text-neutral-700 text-[10px] font-medium hover:bg-neutral-50"
                          >
                            {locale === 'ru'
                              ? 'Показать ещё'
                              : locale === 'en'
                                ? 'Show more'
                                : 'Показати ще'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimShowAllHistory(true)}
                            className="flex-1 py-1.5 rounded-lg bg-neutral-900 text-white text-[10px] font-medium hover:bg-neutral-800"
                          >
                            {locale === 'ru'
                              ? 'Показать все'
                              : locale === 'en'
                                ? 'Show all'
                                : 'Показати всі'}
                          </button>
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
                    <div className="space-y-2 text-[11px] pb-4">
                      <div
                        className={`p-2.5 rounded-lg border space-y-2 ${
                          simDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                            : 'bg-white border-neutral-200 text-neutral-800'
                        }`}
                      >
                        <div className="font-medium">{t.languageLabel}</div>
                        <div className="grid grid-cols-3 gap-1">
                          {(
                            [
                              { code: 'uk', label: 'UA' },
                              { code: 'ru', label: 'RU' },
                              { code: 'en', label: 'EN' },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.code}
                              type="button"
                              onClick={() => setLocale(opt.code)}
                              className={`py-1 rounded-md text-[10px] font-medium border transition-colors ${
                                locale === opt.code
                                  ? 'bg-neutral-900 border-neutral-900 text-white'
                                  : simDark
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Theme & Color Scheme */}
                      <div
                        className={`p-2.5 rounded-lg border space-y-2 ${
                          simDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                            : 'bg-white border-neutral-200 text-neutral-800'
                        }`}
                      >
                        <div className="font-medium">
                          {locale === 'ru'
                            ? 'Тема оформления'
                            : locale === 'en'
                              ? 'Theme'
                              : 'Тема оформлення'}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {(
                            [
                              {
                                id: 'light',
                                label:
                                  locale === 'ru'
                                    ? 'Светлая'
                                    : locale === 'en'
                                      ? 'Light'
                                      : 'Світла',
                              },
                              {
                                id: 'dark',
                                label:
                                  locale === 'ru'
                                    ? 'Тёмная'
                                    : locale === 'en'
                                      ? 'Dark'
                                      : 'Темна',
                              },
                            ] as const
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSimThemeMode(opt.id)}
                              className={`py-1 rounded-md text-[10px] font-medium border transition-colors ${
                                simThemeMode === opt.id
                                  ? simDark
                                    ? 'bg-zinc-100 border-zinc-100 text-zinc-900'
                                    : 'bg-neutral-900 border-neutral-900 text-white'
                                  : simDark
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        <div className="font-medium pt-1">
                          {locale === 'ru'
                            ? 'Цветовая схема'
                            : locale === 'en'
                              ? 'Color scheme'
                              : 'Кольорова схема'}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(Object.keys(SIM_COLOR_SCHEMES) as SimColorSchemeId[]).map((id) => {
                            const s = SIM_COLOR_SCHEMES[id];
                            const selected = simColorScheme === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => setSimColorScheme(id)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-colors ${
                                  selected
                                    ? simDark
                                      ? 'bg-zinc-100 border-zinc-100 text-zinc-900 font-medium'
                                      : 'bg-neutral-900 border-neutral-900 text-white font-medium'
                                    : simDark
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                      : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                                }`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: simDark ? s.dotDark : s.dotLight }}
                                />
                                <span>{s.names[locale]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Display Toggles */}
                      <div
                        className={`p-2.5 rounded-lg border space-y-1.5 ${
                          simDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                            : 'bg-white border-neutral-200 text-neutral-800'
                        }`}
                      >
                        <div className="font-medium">
                          {locale === 'ru'
                            ? 'Отображение карточек'
                            : locale === 'en'
                              ? 'Card Display'
                              : 'Відображення карток'}
                        </div>

                        <label className="flex items-center justify-between gap-2 text-[10px] cursor-pointer">
                          <span>
                            {locale === 'ru'
                              ? 'Показывать, кто добавил'
                              : locale === 'en'
                                ? 'Show who added'
                                : 'Показувати, хто додав'}
                          </span>
                          <input
                            type="checkbox"
                            checked={simShowAddedBy}
                            onChange={(e) => setSimShowAddedBy(e.target.checked)}
                          />
                        </label>

                        <label className="flex items-center justify-between gap-2 text-[10px] cursor-pointer">
                          <span>
                            {locale === 'ru'
                              ? 'Показывать время (добавления/покупки/отмены)'
                              : locale === 'en'
                                ? 'Show added/bought/cancelled time'
                                : 'Показувати час (додавання/покупки/відміни)'}
                          </span>
                          <input
                            type="checkbox"
                            checked={simShowTimestamps}
                            onChange={(e) => setSimShowTimestamps(e.target.checked)}
                          />
                        </label>

                        <label className="flex items-center justify-between gap-2 text-[10px] cursor-pointer">
                          <span>
                            {locale === 'ru'
                              ? 'Градиентный фон категорий'
                              : locale === 'en'
                                ? 'Category gradient backgrounds'
                                : 'Градієнтний фон категорій'}
                          </span>
                          <input
                            type="checkbox"
                            checked={simCategoryBgEnabled}
                            onChange={(e) => setSimCategoryBgEnabled(e.target.checked)}
                          />
                        </label>
                      </div>

                      <div
                        className={`p-2.5 rounded-lg border space-y-1 ${
                          simDark
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            : 'bg-white border-neutral-200 text-neutral-500'
                        }`}
                      >
                        <div
                          className={`font-medium ${
                            simDark ? 'text-zinc-100' : 'text-neutral-800'
                          }`}
                        >
                          SharedPreferences
                        </div>
                        <div>Group: {config.groupId || 'default'}</div>
                        <div>Project: {config.projectId || 'Demo'}</div>
                        <div className="pt-1 text-[10px] opacity-70 tabular-nums">
                          {t.brandName} · v{APP_VERSION}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSimScreen('list')}
                        style={{
                          backgroundColor: simDark
                            ? simScheme.darkAccent
                            : simScheme.lightAccent,
                          color: simDark ? simScheme.darkAccentText : '#FFFFFF',
                        }}
                        className="w-full py-1.5 rounded-lg text-[11px] font-medium"
                      >
                        {locale === 'ru'
                          ? 'Сохранить'
                          : locale === 'en'
                            ? 'Save'
                            : 'Зберегти'}
                      </button>
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
                    style={{
                      backgroundColor: simDark ? simScheme.darkAccent : simScheme.lightAccent,
                      color: simDark ? simScheme.darkAccentText : '#FFFFFF',
                    }}
                    className="absolute bottom-11 right-3 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition-colors"
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
                                    note: simNewNote.trim() || undefined,
                                    urgent: false,
                                    addedBy: 'Android',
                                    completed: false,
                                  });
                                  setSimNewTitle('');
                                  setSimNewNote('');
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

                      <input
                        type="text"
                        value={simNewNote}
                        onChange={(e) => setSimNewNote(e.target.value)}
                        placeholder={
                          locale === 'ru'
                            ? 'Примечание (необязательно)...'
                            : locale === 'en'
                              ? 'Note (optional)...'
                              : 'Примітка (необовʼязково)...'
                        }
                        className="w-full px-2.5 py-1 rounded-lg border border-neutral-200 text-[11px] focus:outline-none focus:border-neutral-900"
                      />

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
                              note: simNewNote.trim() || undefined,
                              urgent: simNewUrgent,
                              addedBy: 'Android',
                              completed: false,
                            });
                            setSimNewTitle('');
                            setSimNewNote('');
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

                {/* Simulator Confirm Action Dialog overlay */}
                {simPendingConfirm && (
                  <div className="absolute inset-0 z-50 bg-neutral-950/45 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full p-3.5 space-y-2.5 shadow-xl border border-neutral-200">
                      <div className="text-xs font-semibold text-neutral-900">
                        {simPendingConfirm.type === 'cancel' && t.cancelConfirmTitle}
                        {simPendingConfirm.type === 'delete' && t.deleteConfirmTitle}
                        {simPendingConfirm.type === 'clearCompleted' && t.clearCompletedBtn(simCompletedCount)}
                        {simPendingConfirm.type === 'clearCancelled' && t.clearCancelledBtn(simCancelledCount)}
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-snug">
                        {simPendingConfirm.type === 'cancel' &&
                          t.cancelConfirmDesc(simPendingConfirm.item.title)}
                        {simPendingConfirm.type === 'delete' &&
                          t.deleteConfirmDesc(simPendingConfirm.item.title)}
                        {simPendingConfirm.type === 'clearCompleted' &&
                          t.confirmClearCompleted(simCompletedCount)}
                        {simPendingConfirm.type === 'clearCancelled' &&
                          t.confirmClearCancelled(simCancelledCount)}
                      </p>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSimPendingConfirm(null)}
                          className="px-2.5 py-1 rounded-md text-[11px] text-neutral-600 hover:bg-neutral-100"
                        >
                          {t.cancelBtn}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const action = simPendingConfirm;
                            setSimPendingConfirm(null);
                            if (action.type === 'cancel') {
                              await firebaseService.cancelItem(action.item.id);
                            } else if (action.type === 'delete') {
                              await firebaseService.deleteItem(action.item.id);
                            } else if (action.type === 'clearCompleted') {
                              await firebaseService.clearCompletedItems();
                            } else if (action.type === 'clearCancelled') {
                              await firebaseService.clearCancelledItems();
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-white text-[11px] font-medium ${
                            simPendingConfirm.type === 'cancel'
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          {simPendingConfirm.type === 'cancel'
                            ? t.confirmCancelActionBtn
                            : t.confirmDeleteActionBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Minimal Bottom Bar */}
                <div
                  className={`border-t px-3 py-2 flex items-center justify-around text-[10px] transition-colors ${
                    simDark
                      ? 'border-zinc-800 text-zinc-400'
                      : 'bg-white border-neutral-200 text-neutral-500'
                  }`}
                  style={simDark ? { backgroundColor: simScheme.darkHeader } : undefined}
                >
                  <button
                    type="button"
                    onClick={() => setSimScreen('list')}
                    className={
                      simScreen === 'list'
                        ? simDark
                          ? 'text-zinc-100 font-semibold'
                          : 'text-neutral-900 font-semibold'
                        : ''
                    }
                  >
                    {locale === 'uk' ? 'Список' : locale === 'ru' ? 'Список' : 'List'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScreen('templates')}
                    className={
                      simScreen === 'templates'
                        ? simDark
                          ? 'text-zinc-100 font-semibold'
                          : 'text-neutral-900 font-semibold'
                        : ''
                    }
                  >
                    {locale === 'uk' ? 'Шаблони' : locale === 'ru' ? 'Шаблоны' : 'Templates'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScreen('notifications')}
                    className={
                      simScreen === 'notifications'
                        ? simDark
                          ? 'text-zinc-100 font-semibold'
                          : 'text-neutral-900 font-semibold'
                        : ''
                    }
                  >
                    {locale === 'uk' ? 'Сповіщення' : locale === 'ru' ? 'Уведомления' : 'Alerts'}
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
                : locale === 'ru'
                  ? 'Запуск проекта в Android Studio'
                  : 'Setup Guide: Running in Android Studio'}
            </h3>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              01. {locale === 'uk' ? 'Експорт проекту' : locale === 'ru' ? 'Экспорт проекта' : 'Export Project'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Завантажте ZIP-архів кнопкою вище та розпакуйте його у робочу директорію.'
                : locale === 'ru'
                  ? 'Скачайте ZIP-архив кнопкой выше и распакуйте его в рабочую папку.'
                  : 'Download the ZIP archive above and extract it to your workspace directory.'}
            </p>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              02. {locale === 'uk' ? 'Відкриття в Android Studio' : locale === 'ru' ? 'Открытие в Android Studio' : 'Open in Android Studio'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Виберіть File → Open та вкажіть папку проекту. Gradle автоматично встановить Compose, WorkManager і Firestore.'
                : locale === 'ru'
                  ? 'Выберите File → Open и укажите папку проекта. Gradle автоматически установит Compose, WorkManager и Firestore.'
                  : 'Select File → Open and choose the project folder. Gradle resolves Compose, WorkManager, and Firestore automatically.'}
            </p>
          </div>

          <div className="py-4 space-y-1">
            <div className="text-xs font-semibold text-neutral-900">
              03. {locale === 'uk' ? 'Підключення до сімейної групи' : locale === 'ru' ? 'Подключение к семейной группе' : 'Pair Family Group'}
            </div>
            <p className="text-xs text-neutral-500">
              {locale === 'uk'
                ? 'Вкажіть параметри Firebase та ідентифікатор групи в налаштуваннях додатка або відскануйте QR-код.'
                : locale === 'ru'
                  ? 'Укажите параметры Firebase и ID группы в настройках приложения или отсканируйте QR-код.'
                  : 'Enter Firebase credentials and Group ID in Settings or scan the pairing QR code.'}
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <div className="text-xs font-semibold text-neutral-900">
              04. {locale === 'uk' ? 'Тест WorkManager через ADB' : locale === 'ru' ? 'Тест WorkManager через ADB' : 'Test WorkManager via ADB'}
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
