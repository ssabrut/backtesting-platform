import type { Condition, IndicatorType, OperatorType } from '../../types';
import { Trash2 } from 'lucide-react';

const INDICATORS: { value: IndicatorType; label: string; params: string[] }[] = [
  { value: 'SMA', label: 'SMA', params: ['period'] },
  { value: 'EMA', label: 'EMA', params: ['period'] },
  { value: 'RSI', label: 'RSI', params: ['period'] },
  { value: 'MACD', label: 'MACD', params: ['fast', 'slow', 'signal'] },
  { value: 'BB', label: 'Bollinger Bands', params: ['period', 'stddev'] },
  { value: 'ATR', label: 'ATR', params: ['period'] },
  { value: 'VWAP', label: 'VWAP', params: [] },
  { value: 'Price', label: 'Price', params: [] },
];

const OPERATORS: { value: OperatorType; label: string }[] = [
  { value: 'crossesAbove', label: 'crosses above' },
  { value: 'crossesBelow', label: 'crosses below' },
  { value: 'greaterThan', label: '>' },
  { value: 'lessThan', label: '<' },
  { value: 'equals', label: '=' },
];

const DEFAULT_PARAMS: Record<IndicatorType, Record<string, number>> = {
  SMA: { period: 20 }, EMA: { period: 20 }, RSI: { period: 14 },
  MACD: { fast: 12, slow: 26, signal: 9 }, BB: { period: 20, stddev: 2 },
  ATR: { period: 14 }, VWAP: {}, Price: {},
};

interface Props {
  cond: Condition;
  onChange: (updated: Condition) => void;
  onRemove: () => void;
}

const inputCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function ConditionRow({ cond, onChange, onRemove }: Props) {
  const indicatorDef = INDICATORS.find(i => i.value === cond.indicator)!;

  const setIndicator = (v: IndicatorType) =>
    onChange({ ...cond, indicator: v, params: DEFAULT_PARAMS[v] });

  const setParam = (k: string, v: number) =>
    onChange({ ...cond, params: { ...cond.params, [k]: v } });

  const setTargetType = (t: 'value' | 'indicator') =>
    onChange({ ...cond, targetType: t, targetValue: t === 'value' ? 50 : undefined,
      targetIndicator: t === 'indicator' ? { indicator: 'SMA', params: { period: 50 } } : undefined });

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
      {/* Indicator selector */}
      <select value={cond.indicator} onChange={e => setIndicator(e.target.value as IndicatorType)} className={inputCls}>
        {INDICATORS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
      </select>

      {/* Params */}
      {indicatorDef.params.map(param => (
        <div key={param} className="flex items-center gap-1">
          <span className="text-xs text-gray-400">{param}:</span>
          <input
            type="number"
            value={cond.params[param] ?? DEFAULT_PARAMS[cond.indicator][param]}
            onChange={e => setParam(param, Number(e.target.value))}
            className={`${inputCls} w-16`}
          />
        </div>
      ))}

      {/* Operator */}
      <select value={cond.operator} onChange={e => onChange({ ...cond, operator: e.target.value as OperatorType })} className={inputCls}>
        {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Target type toggle */}
      <select value={cond.targetType} onChange={e => setTargetType(e.target.value as 'value' | 'indicator')} className={inputCls}>
        <option value="value">Value</option>
        <option value="indicator">Indicator</option>
      </select>

      {/* Target value/indicator */}
      {cond.targetType === 'value' ? (
        <input
          type="number"
          value={cond.targetValue ?? 0}
          onChange={e => onChange({ ...cond, targetValue: Number(e.target.value) })}
          className={`${inputCls} w-20`}
        />
      ) : (
        <>
          <select
            value={cond.targetIndicator?.indicator ?? 'SMA'}
            onChange={e => onChange({ ...cond, targetIndicator: { indicator: e.target.value as IndicatorType, params: DEFAULT_PARAMS[e.target.value as IndicatorType] } })}
            className={inputCls}
          >
            {INDICATORS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          {INDICATORS.find(i => i.value === (cond.targetIndicator?.indicator ?? 'SMA'))?.params.map(param => (
            <div key={param} className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{param}:</span>
              <input
                type="number"
                value={cond.targetIndicator?.params[param] ?? 50}
                onChange={e => onChange({ ...cond, targetIndicator: { ...cond.targetIndicator!, params: { ...cond.targetIndicator!.params, [param]: Number(e.target.value) } } })}
                className={`${inputCls} w-16`}
              />
            </div>
          ))}
        </>
      )}

      <button onClick={onRemove} className="ml-auto text-gray-300 hover:text-red-400 transition-colors cursor-pointer">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
