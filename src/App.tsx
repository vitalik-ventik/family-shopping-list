import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingItem,
  Category,
  WeekendTemplate,
  NotificationSchedule,
  SyncStatus,
  FirebaseConfig,
} from './types';
import { firebaseService } from './services/firebaseService';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { Header } from './components/Header';
import { ShoppingListView } from './components/ShoppingListView';
import { WeekendTemplateMaster } from './components/WeekendTemplateMaster';
import { AndroidCompanionHub } from './components/AndroidCompanionHub';
import { SettingsModal } from './components/SettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ShareModal } from './components/ShareModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'list' | 'templates' | 'android' | 'settings'>('list');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<WeekendTemplate[]>([]);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'disconnected' });
  const [config, setConfig] = useState<FirebaseConfig>(firebaseService.getStoredConfig());

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const quickAddInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubItems = firebaseService.subscribeToItems(setItems);
    const unsubCats = firebaseService.subscribeToCategories(setCategories);
    const unsubTmpls = firebaseService.subscribeToTemplates(setTemplates);
    const unsubScheds = firebaseService.subscribeToSchedules(setSchedules);
    const unsubStatus = firebaseService.subscribeToStatus((status) => {
      setSyncStatus(status);
      setConfig(firebaseService.getStoredConfig());
    });

    return () => {
      unsubItems();
      unsubCats();
      unsubTmpls();
      unsubScheds();
      unsubStatus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || e.key === 'n') &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        if (activeTab === 'list') {
          e.preventDefault();
          quickAddInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const pendingCount = items.filter((i) => !i.completed).length;
  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        syncStatus={syncStatus}
        config={config}
        pendingCount={pendingCount}
        completedCount={completedCount}
        onOpenQuickAdd={() => {
          setActiveTab('list');
          setTimeout(() => quickAddInputRef.current?.focus(), 50);
        }}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'list' && (
          <ShoppingListView
            items={items}
            categories={categories}
            onOpenWeekendMaster={() => setActiveTab('templates')}
            onOpenManageCategories={() => setIsCategoryModalOpen(true)}
            quickAddInputRef={quickAddInputRef}
          />
        )}

        {activeTab === 'templates' && (
          <WeekendTemplateMaster
            templates={templates}
            categories={categories}
            currentItems={items}
            onBackToList={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'android' && (
          <AndroidCompanionHub
            items={items}
            categories={categories}
            templates={templates}
            schedules={schedules}
            config={config}
          />
        )}
      </main>

      <footer className="border-t border-neutral-200/80 bg-white/60 py-4 text-xs text-neutral-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.brandName}</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-neutral-700 transition-colors"
            >
              {t.tabSettings}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className="hover:text-neutral-700 transition-colors"
            >
              {t.tabAndroidCompanion}
            </button>
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentConfig={config}
        syncStatus={syncStatus}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        config={config}
      />

      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
