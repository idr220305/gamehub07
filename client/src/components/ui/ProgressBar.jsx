// Animated horizontal progress bar.
// Props: value (0..max), max (default 100), variant, size, label, showValue.

const TRACK = {
  default: "bg-slate-100",
  light: "bg-white/70",
};

const FILL = {
  primary: "bg-primary-600",
  success: "bg-success-500",
  danger: "bg-danger-500",
  warn: "bg-warn-500",
  ink: "bg-ink",
};

const SIZES = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export default function ProgressBar({
  value = 0,
  max = 100,
  variant = "primary",
  size = "md",
  track = "default",
  label,
  showValue = false,
  className = "",
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500">
          {label ? <span className="font-medium">{label}</span> : <span />}
          {showValue && (
            <span className="tabular-nums">
              <b className="text-slate-900">{value}</b>
              <span className="text-slate-400"> / {max}</span>
            </span>
          )}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full ${TRACK[track]} ${SIZES[size]}`}>
        <div
          className={`h-full ${FILL[variant]} rounded-full transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
