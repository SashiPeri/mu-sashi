type PremiumFieldProps = {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
};

export function PremiumField({ id, label, hint, children }: PremiumFieldProps) {
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-[0.2em] text-amber-200/70">
        {label}
      </label>
      <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
        {children}
      </div>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </section>
  );
}
