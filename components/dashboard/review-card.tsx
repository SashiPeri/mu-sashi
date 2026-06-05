"use client";

import { useEffect, useRef, useState } from "react";
import { saveReview } from "@/lib/skill-storage";
import type { ReviewPeriod } from "@/types/skill";

const PERIOD_CONFIG: Record<
  ReviewPeriod,
  {
    label: string;
    title: string;
  }
> = {
  weekly: {
    label: "Weekly",
    title: "Weekly Review",
  },
  monthly: {
    label: "Monthly",
    title: "Monthly Review",
  },
  quarterly: {
    label: "Quarterly",
    title: "Quarterly Review",
  },
  yearly: {
    label: "Yearly",
    title: "Yearly Review",
  },
};

type ReviewCardProps = {
  skillId: string;
  period: ReviewPeriod;
  lastReviewedAt: string | null;
  reminderEnabled: boolean;
  openSignal?: number;
  onSaved: () => void;
};

function getLastReviewedLabel(lastReviewedAt: string | null): string {
  if (!lastReviewedAt) return "Last reviewed never.";

  const reviewed = new Date(lastReviewedAt);
  if (Number.isNaN(reviewed.getTime())) return "Last reviewed never.";

  const now = new Date();
  const reviewedStart = new Date(reviewed.getFullYear(), reviewed.getMonth(), reviewed.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = Math.max(
    0,
    Math.floor((nowStart.getTime() - reviewedStart.getTime()) / 86_400_000)
  );

  return `Last reviewed ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago.`;
}

export function ReviewCard({
  skillId,
  period,
  lastReviewedAt,
  reminderEnabled,
  openSignal = 0,
  onSaved,
}: ReviewCardProps) {
  const config = PERIOD_CONFIG[period];
  const closeTimer = useRef<number | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [worked, setWorked] = useState("");
  const [resisted, setResisted] = useState("");
  const [changes, setChanges] = useState("");
  const [carryGoal, setCarryGoal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (openSignal <= 0) return;

    const frame = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(frame);
  }, [openSignal]);

  const reviewText = [
    `What worked?\n${worked.trim()}`,
    `What resisted you?\n${resisted.trim()}`,
    `What changes next?\n${changes.trim()}`,
  ].join("\n\n");

  const hasReflection = Boolean(worked.trim() || resisted.trim() || changes.trim());

  const handleSave = async () => {
    if (!hasReflection || saving) return;

    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const { error } = await saveReview({
      skillId,
      period,
      review: reviewText,
      carryWeeklyGoal: period === "weekly" ? carryGoal : undefined,
    });

    setSaving(false);

    if (error) {
      setSaveError(error);
      return;
    }

    setSaved(true);
    onSaved();

    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }

    closeTimer.current = window.setTimeout(() => {
      setExpanded(false);
      setWorked("");
      setResisted("");
      setChanges("");
      setCarryGoal(false);
      setSaved(false);
    }, 1500);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/55 shadow-xl shadow-black/20">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-white/[0.03]"
        aria-expanded={expanded}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-100">{config.title}</p>
          <p className="text-xs text-zinc-500">{getLastReviewedLabel(lastReviewedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-500 sm:inline">
            {reminderEnabled ? "Schedule on" : "Schedule off"}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {expanded ? "Close" : "Review"}
          </span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-zinc-800/80 p-4">
            <p className="text-xs leading-5 text-zinc-500">
              Scheduled dates are reminders. You can record a {config.label.toLowerCase()} reflection whenever the work asks for one.
            </p>

            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                What worked?
              </span>
              <textarea
                value={worked}
                onChange={(event) => setWorked(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
                placeholder="Name the signal, habit, or condition that helped."
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                What resisted you?
              </span>
              <textarea
                value={resisted}
                onChange={(event) => setResisted(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
                placeholder="Friction, avoidance, confusion, fatigue, drift."
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                What changes next?
              </span>
              <textarea
                value={changes}
                onChange={(event) => setChanges(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
                placeholder="Choose the next adjustment with restraint."
              />
            </label>

            {period === "weekly" ? (
              <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={carryGoal}
                  onChange={(event) => setCarryGoal(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-zinc-100"
                />
                <span className="text-sm text-zinc-300">Carry Weekly Goal Forward</span>
              </label>
            ) : null}

            {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}
            {saved ? (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                Reflection recorded. Return to practice.
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasReflection}
              className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Review"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
