import type { RepLogEntry } from "@/types/mastery";

type ReflectionFeedProps = {
  logs: RepLogEntry[];
};

export function ReflectionFeed({ logs }: ReflectionFeedProps) {
  if (logs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
        Your reflections will appear here as you log reps.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {logs.slice(0, 8).map((log) => (
        <li
          key={log.id}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300"
        >
          <p className="text-zinc-100">{log.note}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wider text-zinc-500">
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
