// Small colored badges used throughout — streaks, difficulty, status.

const VARIANTS = {
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-success-100 text-success-700",
  danger: "bg-danger-100 text-danger-600",
  warn: "bg-warn-100 text-warn-600",
  ink: "bg-ink text-white",
  outline: "bg-white text-slate-700 ring-1 ring-slate-200",
};

const SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export default function Badge({ variant = "neutral", size = "md", className = "", children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
      {children}
    </span>
  );
}
