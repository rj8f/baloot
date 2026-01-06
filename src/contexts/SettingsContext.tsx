import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  miyaAlwaysDouble: boolean;     // المية دائماً ×2 في حكم مع ×3 أو ×4
  darkMode: boolean;             // الوضع الليلي
  hokmWithoutPointsMode: boolean; // حكم عادي بدون أبناط (تقريب العشرات)
  isMuted: boolean;              // كتم صوت الإعلان
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  isFirstTime: boolean;
  setFirstTimeComplete: () => void;
  toggleMute: () => void;
}

const defaultSettings: Settings = {
  miyaAlwaysDouble: false,
  darkMode: true,
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
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    return !localStorage.getItem('baloot_settings_complete');
  });

  useEffect(() => {
    localStorage.setItem('baloot_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // تطبيق الوضع الليلي/النهاري
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

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
    <SettingsContext.Provider value={{ settings, updateSettings, isFirstTime, setFirstTimeComplete, toggleMute }}>
      {children}
    </SettingsContext.Provider>
  );
};
