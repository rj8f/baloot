import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'dark' | 'light' | 'auto';

// خيارات المشاريع حسب الدبل:
// 'full' = كل المشاريع تتبع المضاعف الكامل
// 'miya-x2' = المية فقط أقصاها ×2
// 'all-x2' = السرا والخمسين والمية كلها أقصاها ×2
type ProjectMultiplierMode = 'full' | 'miya-x2' | 'all-x2';

// خيارات الصن مع مشروع الخمسين:
// 'with-points-40' = الحسبة بالأبناط (40) - 90 تعادل، 91+ فوز، <90 خسارة
// 'success-42' = النجاح من 42 (42+50=92)
// 'success-43' = النجاح من 43 (43+50=93)
type Sun50Mode = 'with-points-40' | 'success-42' | 'success-43';

interface Settings {
  projectMultiplierMode: ProjectMultiplierMode; // وضع المشاريع حسب الدبل
  themeMode: ThemeMode;           // الوضع: ليلي، نهاري، تلقائي
  hokmWithoutPointsMode: boolean; // حكم عادي بدون أبناط (تقريب العشرات)
  sun50Mode: Sun50Mode;           // حسبة الصن مع مشروع الخمسين
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
  projectMultiplierMode: 'all-x2',  // الافتراضي: الكل ×2
  themeMode: 'dark',
  hokmWithoutPointsMode: false,
  sun50Mode: 'with-points-40',
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

        // توافق مع الإصدارات السابقة: miyaFollowsMultiplier => projectMultiplierMode
        if (typeof parsed?.projectMultiplierMode !== 'string') {
          if (typeof parsed?.miyaFollowsMultiplier === 'boolean') {
            parsed.projectMultiplierMode = parsed.miyaFollowsMultiplier ? 'full' : 'miya-x2';
          } else if (typeof parsed?.miyaAlwaysDouble === 'boolean') {
            parsed.projectMultiplierMode = parsed.miyaAlwaysDouble ? 'miya-x2' : 'full';
          }
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
