interface Props {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function RingStat({ value, size = 36, strokeWidth = 4, color = '#10b981' }: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round"
      />
    </svg>
  );
}
