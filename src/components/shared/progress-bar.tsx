interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-[6px] w-[95px] overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-[var(--app-orange)]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
