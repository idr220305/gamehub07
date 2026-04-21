// Shared Card primitive. Variants: default, hover, accent (primary tint), success.
// Composes className so callers can extend freely.

const VARIANTS = {
  default: "bg-white ring-1 ring-slate-200 shadow-soft",
  hover: "bg-white ring-1 ring-slate-200 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
  accent: "bg-gradient-to-br from-primary-50 to-white ring-1 ring-primary-100 shadow-soft",
  success: "bg-gradient-to-br from-success-50 to-white ring-1 ring-success-100 shadow-soft",
  flat: "bg-slate-50 ring-1 ring-slate-200",
};

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-7",
};

export default function Card({ variant = "default", padding = "md", className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`rounded-2xl ${VARIANTS[variant]} ${PADDING[padding]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
