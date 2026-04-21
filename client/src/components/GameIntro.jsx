import Button from "./ui/Button.jsx";

// Intro screen shown before a timed game starts.
// Props: { title, rules: string[], warning?: string, startLabel?, onStart }
export default function GameIntro({ title, rules = [], warning, startLabel = "Start", onStart }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-br from-primary-50 to-primary-100 p-6 ring-1 ring-primary-200">
        <div className="mb-2 text-xs uppercase tracking-widest text-primary-700">Before you start</div>
        <h3 className="text-xl font-extrabold text-ink">{title}</h3>
        {rules.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary-600">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
        {warning && (
          <div className="mt-3 rounded-xl bg-warn-50 px-3 py-2 text-sm text-warn-700 ring-1 ring-warn-100">
            ⚠️ {warning}
          </div>
        )}
      </div>
      <Button variant="accent" size="xl" className="w-full" onClick={onStart}>
        ▶ {startLabel}
      </Button>
    </div>
  );
}
