import { v4 as uuidv4 } from 'uuid';
import type { BacktestRules, Condition } from '../../types';
import { ConditionRow } from './ConditionRow';
import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface Props {
  rules: BacktestRules;
  onChange: (rules: BacktestRules) => void;
}

const defaultCondition = (): Condition => ({
  id: uuidv4(),
  indicator: 'SMA',
  params: { period: 20 },
  operator: 'crossesAbove',
  targetType: 'indicator',
  targetIndicator: { indicator: 'SMA', params: { period: 50 } },
});

export function RuleBuilder({ rules, onChange }: Props) {
  const updateEntry = (id: string, updated: Condition) =>
    onChange({ ...rules, entryConditions: rules.entryConditions.map(c => c.id === id ? updated : c) });

  const updateExit = (id: string, updated: Condition) =>
    onChange({ ...rules, exitConditions: rules.exitConditions.map(c => c.id === id ? updated : c) });

  return (
    <div className="space-y-6">
      {/* Side + position */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Direction</label>
          <select
            value={rules.side}
            onChange={e => onChange({ ...rules, side: e.target.value as 'long' | 'short' })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Position Size</label>
          <input
            type="number"
            value={rules.positionSize}
            onChange={e => onChange({ ...rules, positionSize: Number(e.target.value) })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Stop Loss %</label>
          <input
            type="number"
            step="0.1"
            value={rules.stopLoss?.value ?? ''}
            onChange={e => onChange({ ...rules, stopLoss: e.target.value ? { type: 'percent', value: Number(e.target.value) } : undefined })}
            placeholder="Optional"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Take Profit %</label>
          <input
            type="number"
            step="0.1"
            value={rules.takeProfit?.value ?? ''}
            onChange={e => onChange({ ...rules, takeProfit: e.target.value ? { type: 'percent', value: Number(e.target.value) } : undefined })}
            placeholder="Optional"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Initial capital */}
      <div className="max-w-xs">
        <label className="block text-xs font-medium text-gray-600 mb-1">Initial Capital ($)</label>
        <input
          type="number"
          value={rules.initialCapital ?? 10000}
          onChange={e => onChange({ ...rules, initialCapital: Number(e.target.value) })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Entry conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Entry Conditions <span className="text-gray-400 font-normal">(ALL must be true)</span></h4>
          <Button variant="secondary" size="sm" onClick={() => onChange({ ...rules, entryConditions: [...rules.entryConditions, defaultCondition()] })}>
            <Plus size={13} /> Add
          </Button>
        </div>
        {rules.entryConditions.length === 0 && (
          <p className="text-xs text-gray-400 py-3">No entry conditions — add at least one.</p>
        )}
        <div className="space-y-2">
          {rules.entryConditions.map(c => (
            <ConditionRow
              key={c.id}
              cond={c}
              onChange={updated => updateEntry(c.id, updated)}
              onRemove={() => onChange({ ...rules, entryConditions: rules.entryConditions.filter(x => x.id !== c.id) })}
            />
          ))}
        </div>
      </div>

      {/* Exit conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Exit Conditions <span className="text-gray-400 font-normal">(optional — uses SL/TP if empty)</span></h4>
          <Button variant="secondary" size="sm" onClick={() => onChange({ ...rules, exitConditions: [...rules.exitConditions, defaultCondition()] })}>
            <Plus size={13} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {rules.exitConditions.map(c => (
            <ConditionRow
              key={c.id}
              cond={c}
              onChange={updated => updateExit(c.id, updated)}
              onRemove={() => onChange({ ...rules, exitConditions: rules.exitConditions.filter(x => x.id !== c.id) })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
