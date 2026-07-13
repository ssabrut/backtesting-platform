interface BadgeProps {
  children: React.ReactNode;
  variant?: 'long' | 'short' | 'win' | 'loss' | 'neutral' | 'running' | 'complete' | 'error' | 'pending';
}

const variants = {
  long: 'bg-blue-100 text-blue-700',
  short: 'bg-orange-100 text-orange-700',
  win: 'bg-emerald-100 text-emerald-700',
  loss: 'bg-red-100 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
  running: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-600',
  pending: 'bg-gray-100 text-gray-600',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
