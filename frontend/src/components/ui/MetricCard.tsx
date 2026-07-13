interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, sub, positive, icon }: MetricCardProps) {
  const valueColor = positive === true ? 'text-emerald-600' : positive === false ? 'text-red-500' : 'text-gray-900';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        {icon && <span className="text-gray-300">{icon}</span>}
      </div>
      <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
