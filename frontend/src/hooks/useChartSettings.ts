import { useEffect, useState } from 'react';

export interface ChartSettings {
  upColor: string;
  downColor: string;
  gridLines: boolean;
  precision: number;
  indicators: boolean;
  trades: boolean;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  upColor: '#10b981',
  downColor: '#ef4444',
  gridLines: true,
  precision: 2,
  indicators: true,
  trades: true,
};

const STORAGE_KEY = 'chartSettings';

function loadSettings(): ChartSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return { ...DEFAULT_CHART_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_CHART_SETTINGS };
  }
}

export function useChartSettings() {
  const [settings, setSettings] = useState<ChartSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (patch: Partial<ChartSettings>) => setSettings(prev => ({ ...prev, ...patch }));

  return { settings, update };
}
