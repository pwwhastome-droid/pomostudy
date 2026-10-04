import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Sheet — forms and settings.
 * Mobile: slides up from the bottom, thumb-reachable, sticky title + footer actions.
 * Desktop: centered dialog. Esc / backdrop tap closes.
 * Rendered in a portal so `position: fixed` isn't trapped by glass-panel's backdrop-filter.
 * ------------------------------------------------------------------ */
interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, title, onClose, children }) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sheet-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-panel w-full sm:max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[86dvh] bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/5 shrink-0">
          <h2 className="text-base font-bold text-white truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

/** Sticky Cancel / Save row for the bottom of a Sheet form. Primary action is on the right (thumb side). */
export const SheetActions: React.FC<{
  onCancel: () => void;
  submitLabel: string;
  accent?: string; // tailwind bg classes
}> = ({ onCancel, submitLabel, accent = 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/25' }) => (
  <div className="sheet-actions flex items-center gap-3 pt-4 mt-5">
    <button
      type="button"
      onClick={onCancel}
      className="flex-1 sm:flex-none sm:px-5 h-11 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
    >
      Cancel
    </button>
    <button
      type="submit"
      className={`flex-[2] sm:flex-none sm:px-6 h-11 rounded-xl text-sm font-bold text-white shadow-lg transition active:scale-[0.98] ${accent}`}
    >
      {submitLabel}
    </button>
  </div>
);

/* ------------------------------------------------------------------ *
 * AddAction — the one place "add" lives on every page.
 * sm+: button in the page header.  Mobile: floating button above the tab bar, right side.
 * ------------------------------------------------------------------ */
interface AddActionProps {
  label: string;
  onClick: () => void;
  accent?: string; // tailwind bg/shadow classes
}

export const AddAction: React.FC<AddActionProps> = ({
  label,
  onClick,
  accent = 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-rose-500/30',
}) => (
  <>
    <button
      type="button"
      onClick={onClick}
      className={`hidden sm:flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-bold shadow-lg transition active:scale-95 shrink-0 ${accent}`}
    >
      <Plus className="w-4 h-4" />
      <span>{label}</span>
    </button>
    {createPortal(
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`sm:hidden fab fixed right-4 z-30 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition active:scale-90 ${accent}`}
      >
        <Plus className="w-6 h-6" />
      </button>,
      document.body
    )}
  </>
);

/* ------------------------------------------------------------------ *
 * ConfirmDelete — tap once to arm ("Delete?"), tap again within 3s to confirm.
 * Stops accidental deletes without a modal.
 * ------------------------------------------------------------------ */
export const ConfirmDelete: React.FC<{
  onConfirm: () => void;
  label?: string;
}> = ({ onConfirm, label = 'Delete' }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return armed ? (
    <button
      type="button"
      onClick={() => {
        setArmed(false);
        onConfirm();
      }}
      className="h-10 px-3 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/30 transition active:scale-95"
    >
      {label}?
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setArmed(true)}
      aria-label={label}
      title={label}
      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

/* ------------------------------------------------------------------ *
 * Segmented — filter tabs. Full width on mobile (equal segments), compact on desktop.
 * ------------------------------------------------------------------ */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  activeClass = 'bg-slate-700 text-white',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  activeClass?: string;
}) {
  return (
    <div role="tablist" className="flex w-full sm:w-fit p-1 gap-1 glass-pill rounded-2xl">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 sm:flex-none h-9 px-3 sm:px-4 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            value === o.value ? `${activeClass} shadow-sm` : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Page header: title block left, primary action right. Wraps nothing on mobile — subtitle truncates. */
export const PageHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between gap-3 mb-5">
    <div className="flex items-center gap-3 min-w-0">
      {icon}
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-white truncate">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);
