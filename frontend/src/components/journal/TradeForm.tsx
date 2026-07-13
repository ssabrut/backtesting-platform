import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Trade } from '../../types';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

const schema = z.object({
  symbol: z.string().min(1, 'Required').max(30),
  side: z.enum(['long', 'short']),
  entry_price: z.coerce.number().positive('Must be positive'),
  exit_price: z.coerce.number().positive('Must be positive'),
  quantity: z.coerce.number().positive('Must be positive'),
  entry_time: z.string().min(1, 'Required'),
  exit_time: z.string().min(1, 'Required'),
  commission: z.coerce.number().min(0),
  notes: z.string(),
  screenshot_url: z.string(),
  tags: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Trade>;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel: () => void;
}

const toLocalDT = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function TradeForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      symbol: defaultValues?.symbol ?? '',
      side: defaultValues?.side ?? 'long',
      entry_price: defaultValues?.entry_price ?? ('' as unknown as number),
      exit_price: defaultValues?.exit_price ?? ('' as unknown as number),
      quantity: defaultValues?.quantity ?? ('' as unknown as number),
      entry_time: toLocalDT(defaultValues?.entry_time),
      exit_time: toLocalDT(defaultValues?.exit_time),
      commission: defaultValues?.commission ?? 0,
      notes: defaultValues?.notes ?? '',
      screenshot_url: defaultValues?.screenshot_url ?? '',
      tags: defaultValues?.tags?.join(', ') ?? '',
    },
  });

  const [entry, exit, qty, side] = watch(['entry_price', 'exit_price', 'quantity', 'side']);
  const previewPnl = entry && exit && qty
    ? (side === 'long' ? (exit - entry) * qty : (entry - exit) * qty)
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Symbol *</label>
          <input {...register('symbol')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="AAPL" />
          {errors.symbol && <p className="text-xs text-red-500 mt-0.5">{errors.symbol.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Side *</label>
          <select {...register('side')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entry Price *</label>
          <input type="number" step="any" {...register('entry_price')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.entry_price && <p className="text-xs text-red-500 mt-0.5">{errors.entry_price.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Exit Price *</label>
          <input type="number" step="any" {...register('exit_price')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.exit_price && <p className="text-xs text-red-500 mt-0.5">{errors.exit_price.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
          <input type="number" step="any" {...register('quantity')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.quantity && <p className="text-xs text-red-500 mt-0.5">{errors.quantity.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entry Time *</label>
          <input type="datetime-local" {...register('entry_time')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.entry_time && <p className="text-xs text-red-500 mt-0.5">{errors.entry_time.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Exit Time *</label>
          <input type="datetime-local" {...register('exit_time')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.exit_time && <p className="text-xs text-red-500 mt-0.5">{errors.exit_time.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Commission</label>
        <input type="number" step="any" {...register('commission')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
        <input {...register('tags')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="breakout, gap-fill" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea {...register('notes')} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      {previewPnl !== null && (
        <div className={`rounded-lg p-3 text-sm font-medium ${previewPnl >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          Est. P&L: {formatCurrency(previewPnl)}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{defaultValues?.id ? 'Update Trade' : 'Add Trade'}</Button>
      </div>
    </form>
  );
}
