import type { RepLogEntry } from "@/types/mastery";

type ReflectionFeedProps = {
  logs: RepLogEntry[];
};

export function ReflectionFeed({ logs }: ReflectionFeedProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] font-mono border border-white/5 px-4 py-6 text-center">
        Your reflections will appear here as you log reps.
      </p>
    );
  }

  return (
    <div className="border-t border-white/5">
      {logs.slice(0, 8).map((log, index) => (
        <div
          key={log.id}
          className="py-4"
        >
          <p className="text-[var(--fg)] text-sm leading-relaxed">
            {log.note}
          </p>

          <p className="mt-2 text-[11px] font-mono tracking-wide text-[var(--muted)]">
            {new Date(log.created_at).toLocaleString()}
          </p>

          {index !== logs.slice(0, 8).length - 1 && (
            <div className="mt-4 h-[1px] bg-white/5" />
          )}
        </div>
      ))}
    </div>
  );
}