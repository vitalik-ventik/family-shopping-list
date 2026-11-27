import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const { locale } = useLanguage();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg border border-neutral-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      <span>
        {locale === 'uk'
          ? 'Офлайн-режим · Використовується локальний кеш'
          : 'Offline · Using cached data'}
      </span>
    </div>
  );
};
