import React, { useState } from 'react';
import {
  ShoppingItem,
  Category,
  WeekendTemplate,
  NotificationSchedule,
  FirebaseConfig,
} from '../types';
import { firebaseService } from '../services/firebaseService';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../data/androidProjectFiles';
import { useLanguage } from '../i18n/LanguageContext';
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
} from 'lucide-react';

interface AndroidCompanionHubProps {
  items: ShoppingItem[];
  categories: Category[];
  templates: WeekendTemplate[];
  schedules: NotificationSchedule[];
  config: FirebaseConfig;
}

export const AndroidCompanionHub: React.FC<AndroidCompanionHubProps> = ({
  items,
  categories,
  templates,
  schedules,
  config,
}) => {
  const { t, getCategoryName, getUnitName, locale } = useLanguage();

  const [hubTab, setHubTab] = useState<'simulator' | 'code' | 'guide'>('simulator');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedFile, setCopiedFile] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const [simScreen, setSimScreen] = useState<'list' | 'templates' | 'notifications' | 'settings'>('list');
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

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

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
      if (item.completed) return false;
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

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {simScreen === 'list' && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-medium text-neutral-400 px-1 tabular-nums">
                        {t.phonePendingCount(items.filter((i) => !i.completed).length)}
                      </div>
                      <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => firebaseService.toggleItem(item.id)}
                            className="flex items-center gap-2.5 p-2.5 text-xs cursor-pointer hover:bg-neutral-50"
                          >
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded text-emerald-600"
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className={`block truncate ${
                                  item.completed
                                    ? 'line-through text-neutral-400'
                                    : 'text-neutral-800 font-medium'
                                }`}
                              >
                                {item.title}
                              </span>
                              <span className="text-[10px] text-neutral-400 tabular-nums">
                                {item.quantity} {getUnitName(item.unit)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
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
                    </div>
                  )}
                </div>

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
