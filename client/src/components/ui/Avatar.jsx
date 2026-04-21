// Avatar with deterministic background color from name.
// No images needed.

const PALETTE = [
  "bg-indigo-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
];

function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export default function Avatar({ name = "", size = "md", className = "", ring = false }) {
  return (
    <span
      className={`inline-flex flex-none items-center justify-center rounded-full font-bold text-white select-none
                  ${colorFor(name)} ${SIZES[size]} ${ring ? "ring-2 ring-white" : ""} ${className}`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
