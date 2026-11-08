export function ProgressBar({
  value,
  max,
  label,
  color = "bg-indigo-500",
}: {
  value: number;
  max: number;
  label?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-sm text-slate-600">
          <span>{label}</span>
          <span>
            {value}/{max} ({pct}%)
          </span>
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
