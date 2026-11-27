import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { locale } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title={
          locale === 'uk'
            ? 'Встановити як додаток'
            : locale === 'ru'
              ? 'Установить как приложение'
              : 'Install as App'
        }
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {locale === 'uk' ? 'Встановити' : locale === 'ru' ? 'Установить' : 'Install'}
        </span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {locale === 'uk' ? 'Встановити' : locale === 'ru' ? 'Установить' : 'Install'}
          </span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/30 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-neutral-200 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-neutral-900">
                  {locale === 'uk'
                    ? 'Встановлення на iPhone / iPad'
                    : locale === 'ru'
                      ? 'Установка на iPhone / iPad'
                      : 'Install on iPhone / iPad'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {locale === 'uk' ? (
                  <>
                    1. Натисніть кнопку <strong>Поділитися</strong> у нижній панелі Safari.
                    <br />
                    2. Прокрутіть униз і виберіть <strong>На початковий екран</strong>.
                  </>
                ) : locale === 'ru' ? (
                  <>
                    1. Нажмите кнопку <strong>Поделиться</strong> на нижней панели Safari.
                    <br />
                    2. Прокрутите вниз и выберите <strong>На экран «Домой»</strong>.
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in Safari toolbar.
                    <br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2 text-xs font-medium text-white transition-colors"
              >
                {locale === 'uk' ? 'Зрозуміло' : locale === 'ru' ? 'Понятно' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
