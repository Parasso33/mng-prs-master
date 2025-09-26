import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translation } from '@/types/manga';
import { translations } from '@/data/translations';

interface AppContextType {
  language: Language;
  translation: Translation;
  theme: 'light' | 'dark';
  toggleLanguage: () => void;
  toggleTheme: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const languages: Record<'ar' | 'fr', Language> = {
  ar: { code: 'ar', name: 'العربية', direction: 'rtl' },
  fr: { code: 'fr', name: 'Français', direction: 'ltr' }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<'ar' | 'fr'>('ar');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const language = languages[currentLang];
  const translation = translations[currentLang];

  useEffect(() => {
    // Set HTML attributes for language and direction
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.direction;
    
    // Set theme
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [language, currentTheme]);

  const toggleLanguage = () => {
    setCurrentLang(prev => prev === 'ar' ? 'fr' : 'ar');
  };

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value: AppContextType = {
    language,
    translation,
    theme: currentTheme,
    toggleLanguage,
    toggleTheme,
    isLoggedIn,
    setIsLoggedIn
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};