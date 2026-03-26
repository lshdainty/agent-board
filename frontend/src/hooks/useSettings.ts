import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import React from 'react'

export interface Settings {
  shadows: boolean
  nameLabels: boolean
  activityLogCount: number
}

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const DEFAULTS: Settings = {
  shadows: true,
  nameLabels: true,
  activityLogCount: 25,
}

const STORAGE_KEYS: Record<keyof Settings, string> = {
  shadows: 'settings:shadows',
  nameLabels: 'settings:showAgentLabels',
  activityLogCount: 'settings:activityLogCount',
}

function loadSettings(): Settings {
  try {
    return {
      shadows: loadValue('shadows', DEFAULTS.shadows),
      nameLabels: loadValue('nameLabels', DEFAULTS.nameLabels),
      activityLogCount: loadValue('activityLogCount', DEFAULTS.activityLogCount),
    }
  } catch {
    return DEFAULTS
  }
}

function loadValue<K extends keyof Settings>(key: K, defaultValue: Settings[K]): Settings[K] {
  const stored = localStorage.getItem(STORAGE_KEYS[key])
  if (stored !== null) {
    try {
      return JSON.parse(stored) as Settings[K]
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
  }, [])

  return React.createElement(
    SettingsContext.Provider,
    { value: { settings, updateSetting } },
    children,
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return ctx
}
