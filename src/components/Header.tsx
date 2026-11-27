import React from 'react';
import { Settings, QrCode, Plus } from 'lucide-react';
import { SyncStatus, FirebaseConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'list' | 'templates' | 'android' | 'settings';
  setActiveTab: (tab: 'list' | 'templates' | 'android' | 'settings') => void;
  syncStatus: SyncStatus;
  config: FirebaseConfig;
  pendingCount: number;
  completedCount: number;
  onOpenQuickAdd: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  syncStatus,
  config,
  pendingCount,
  onOpenQuickAdd,
  onOpenShareModal,
}) => {
  const { t, locale, setLocale } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 h-14">
          {/* Zone 1: Clean Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className="text-base font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
          >
            {t.brandName}
          </button>

          {/* Zone 2: Minimalist Single-Line Navigation */}
          <nav className="hidden md:flex items-center gap-7 h-full">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`relative h-full flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'list'
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span>{t.tabShoppingList}</span>
              {pendingCount > 0 && (
                <span className="ml-1.5 text-xs text-neutral-400 tabular-nums">
                  {pendingCount}
                </span>
              )}
              {activeTab === 'list' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-neutral-900 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`relative h-full flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'templates'
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span>{t.tabWeekendMaster}</span>
              {activeTab === 'templates' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-neutral-900 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`relative h-full flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'android'
                  ? 'text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span>{t.tabAndroidCompanion}</span>
              {activeTab === 'android' && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-neutral-900 rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: Minimalist Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Subtle Group & Sync indicator */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title={syncStatus.details || config.groupId}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors whitespace-nowrap"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus.state === 'connected'
                    ? 'bg-emerald-600'
                    : syncStatus.state === 'demo'
                    ? 'bg-amber-500'
                    : syncStatus.state === 'connecting'
                    ? 'bg-blue-500'
                    : 'bg-rose-600'
                }`}
              />
              <span className="font-mono text-[11px]">{config.groupId || 'default'}</span>
            </button>

            {/* Language Selector */}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'uk' | 'ru' | 'en')}
              aria-label={t.languageLabel}
              className="px-2 py-1 rounded-md text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 bg-transparent transition-colors cursor-pointer focus:outline-none"
            >
              <option value="uk">UA</option>
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>

            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Phone QR Pairing */}
            <button
              type="button"
              onClick={onOpenShareModal}
              title={t.qrPairingTitle}
              aria-label={t.qrPairingTitle}
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title={t.tabSettings}
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary Action */}
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.addItemBtn}</span>
            </button>
          </div>
        </div>

        {/* Minimal Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-neutral-100 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'list' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
            }`}
          >
            {t.tabShoppingList} ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'templates' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
            }`}
          >
            {t.tabWeekendMaster}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'android' ? 'bg-neutral-900 text-white' : 'text-neutral-600'
            }`}
          >
            {t.tabAndroidCompanion}
          </button>
        </div>
      </div>
    </header>
  );
};
