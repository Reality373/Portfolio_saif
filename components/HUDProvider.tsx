'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOrFetchGitHubData } from '@/lib/github';

export interface HUDSettings {
  canSimulator: boolean;
  vehicleTelemetry: boolean;
  scrambleEffects: boolean;
  commandPalette: boolean;
  particleCanvas: boolean;
  statusBeacon: boolean;
}

export const DEFAULT_HUD_SETTINGS: HUDSettings = {
  canSimulator: true,
  vehicleTelemetry: true,
  scrambleEffects: true,
  commandPalette: true,
  particleCanvas: true,
  statusBeacon: true,
};

interface HUDContextType {
  settings: HUDSettings;
  toggleSetting: (key: keyof HUDSettings) => void;
  setSetting: (key: keyof HUDSettings, value: boolean) => void;
  toggleAll: (enabled: boolean) => void;
  resetDefaults: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  toggleSettingsPanel: () => void;
}

const HUDContext = createContext<HUDContextType | undefined>(undefined);

const STORAGE_KEY = 'saif-portfolio-hud-settings';

export function HUDProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<HUDSettings>(DEFAULT_HUD_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Prefetch GitHub data once on initial webpage load into memory and sessionStorage cache
    getOrFetchGitHubData();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettingsState({ ...DEFAULT_HUD_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load HUD settings', e);
    }
  }, []);

  const saveSettings = (newSettings: HUDSettings) => {
    setSettingsState(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save HUD settings', e);
    }
  };

  const toggleSetting = (key: keyof HUDSettings) => {
    saveSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const setSetting = (key: keyof HUDSettings, value: boolean) => {
    saveSettings({
      ...settings,
      [key]: value,
    });
  };

  const toggleAll = (enabled: boolean) => {
    saveSettings({
      canSimulator: enabled,
      vehicleTelemetry: enabled,
      scrambleEffects: enabled,
      commandPalette: enabled,
      particleCanvas: enabled,
      statusBeacon: enabled,
    });
  };

  const resetDefaults = () => {
    saveSettings(DEFAULT_HUD_SETTINGS);
  };

  const toggleSettingsPanel = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  return (
    <HUDContext.Provider
      value={{
        settings: mounted ? settings : DEFAULT_HUD_SETTINGS,
        toggleSetting,
        setSetting,
        toggleAll,
        resetDefaults,
        isSettingsOpen,
        setIsSettingsOpen,
        toggleSettingsPanel,
      }}
    >
      {children}
    </HUDContext.Provider>
  );
}

export function useHUD() {
  const context = useContext(HUDContext);
  if (!context) {
    throw new Error('useHUD must be used within a HUDProvider');
  }
  return context;
}
