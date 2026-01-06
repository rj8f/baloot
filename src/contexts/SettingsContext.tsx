import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'dark' | 'light' | 'auto';

interface Settings {
  miyaFollowsMultiplier: boolean; // المية حسب الدبل (true = تتبع المضاعف، false = أقصاها x2)
  themeMode: ThemeMode;           // الوضع: ليلي، نهاري، تلقائي
  hokmWithoutPointsMode: boolean; // حكم عادي بدون أبناط (تقريب العشرات)
  isMuted: boolean;              // كتم صوت الإعلان
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isFirstTime: boolean;
  setFirstTimeComplete: () => void;
  toggleMute: () => void;
  effectiveTheme: 'dark' | 'light';
}

const defaultSettings: Settings = {
  miyaFollowsMultiplier: true,  // الافتراضي: المية تتبع المضاعف
  themeMode: 'dark',
  hokmWithoutPointsMode: false,
  isMuted: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('baloot_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // توافق مع الإصدارات السابقة: miyaAlwaysDouble => miyaFollowsMultiplier
        if (typeof parsed?.miyaFollowsMultiplier !== 'boolean' && typeof parsed?.miyaAlwaysDouble === 'boolean') {
          parsed.miyaFollowsMultiplier = !parsed.miyaAlwaysDouble;
        }

        // توافق مع الإصدارات السابقة: darkMode => themeMode
        if (typeof parsed?.themeMode !== 'string' && typeof parsed?.darkMode === 'boolean') {
          parsed.themeMode = parsed.darkMode ? 'dark' : 'light';
        }

        return { ...defaultSettings, ...parsed };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    return !localStorage.getItem('baloot_settings_complete');
  });

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('baloot_settings', JSON.stringify(settings));
  }, [settings]);

  // Calculate effective theme
  const effectiveTheme: 'dark' | 'light' = 
    settings.themeMode === 'auto' 
      ? (systemPrefersDark ? 'dark' : 'light')
      : settings.themeMode;

  useEffect(() => {
    // تطبيق الوضع الليلي/النهاري
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const setFirstTimeComplete = () => {
    localStorage.setItem('baloot_settings_complete', 'true');
    setIsFirstTime(false);
  };

  const toggleMute = () => {
    setSettings(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isFirstTime, setFirstTimeComplete, toggleMute, effectiveTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};
