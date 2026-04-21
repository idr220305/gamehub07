import Button from "./Button.jsx";

// Lightweight confirm modal. Controlled — parent supplies open + handlers.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 animate-fade-in" onClick={onCancel}>
      <div
        className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {body && <div className="mt-2 text-sm text-slate-600">{body}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
