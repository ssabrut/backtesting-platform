export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatRatio(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function pnlColor(value: number): string {
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function pnlBg(value: number): string {
  if (value > 0) return 'bg-emerald-50 text-emerald-700';
  if (value < 0) return 'bg-red-50 text-red-600';
  return 'bg-gray-50 text-gray-500';
}
