import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useChartSettings } from '../../hooks/useChartSettings';

export function ChartSettingsPanel() {
  const { settings, update } = useChartSettings();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 cursor-pointer"
        title="Chart settings"
      >
        <Settings size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 text-xs text-gray-700 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Bull color</label>
            <input type="color" value={settings.upColor} onChange={e => update({ upColor: e.target.value })}
              className="w-8 h-5.5 border border-gray-200 rounded cursor-pointer" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Bear color</label>
            <input type="color" value={settings.downColor} onChange={e => update({ downColor: e.target.value })}
              className="w-8 h-5.5 border border-gray-200 rounded cursor-pointer" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Grid lines</label>
            <input type="checkbox" checked={settings.gridLines} onChange={e => update({ gridLines: e.target.checked })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Price precision</label>
            <input type="number" min={0} max={8} step={1} value={settings.precision}
              onChange={e => update({ precision: Math.max(0, Math.min(8, parseInt(e.target.value, 10) || 0)) })}
              className="w-12 border border-gray-200 rounded px-1.5 py-0.5" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Indicators</label>
            <input type="checkbox" checked={settings.indicators} onChange={e => update({ indicators: e.target.checked })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-500">Trade zones</label>
            <input type="checkbox" checked={settings.trades} onChange={e => update({ trades: e.target.checked })} />
          </div>
        </div>
      )}
    </div>
  );
}
