import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale, Category } from '../types';
import { translations, TranslationSchema } from './translations';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslationSchema;
  getCategoryName: (category?: Category | null) => string;
  getUnitName: (unit: string) => string;
  getMemberName: (member?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'family_shopping_locale';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'uk' || saved === 'en') return saved;
      // Autodetect browser language
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('uk')) {
        return 'uk';
      }
    } catch {
      // fallback
    }
    return 'uk'; // Default to Ukrainian as requested!
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  };

  const t = translations[locale];

  const getCategoryName = (category?: Category | null): string => {
    if (!category) return '';
    return t.categoryNames[category.id] || category.name;
  };

  const getUnitName = (unit: string): string => {
    return t.units[unit] || unit;
  };

  const getMemberName = (member?: string): string => {
    if (!member) return '';
    return t.members[member] || member;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        getCategoryName,
        getUnitName,
        getMemberName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
