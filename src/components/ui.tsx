import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl border border-amber-700/40 bg-stone-950 shadow-2xl shadow-amber-900/20`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-amber-800/30 bg-stone-950/95 px-5 py-3 backdrop-blur">
          <h3 className="font-serif text-lg font-bold text-amber-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-amber-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatBar({ value, max = 100, color = 'bg-amber-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pill({ children, color = 'bg-stone-700' }: { children: ReactNode; color?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{children}</span>;
}

export function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-amber-100">
      {icon}
      {children}
    </h2>
  );
}

export function euro(n: number): string {
  return '€' + n.toLocaleString('it-IT');
}
