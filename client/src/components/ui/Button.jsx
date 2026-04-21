// Shared Button primitive with consistent variants + sizes.
// Falls through className so callers can stretch / override layout.

const BASE = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]";

const VARIANTS = {
  primary: "bg-ink text-white shadow-soft hover:bg-ink-soft hover:shadow-lift hover:-translate-y-px",
  accent: "bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:shadow-lift hover:-translate-y-px",
  secondary: "bg-white text-ink ring-1 ring-slate-200 shadow-soft hover:bg-slate-50 hover:-translate-y-px",
  ghost: "text-slate-700 hover:bg-slate-100",
  success: "bg-success-600 text-white shadow-soft hover:bg-success-700",
  danger: "bg-danger-600 text-white shadow-soft hover:bg-danger-500",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
  xl: "px-6 py-4 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  as: Tag = "button",
  children,
  iconLeft,
  iconRight,
  ...rest
}) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  return (
    <Tag className={cls} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Tag>
  );
}
