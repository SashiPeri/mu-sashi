"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReviewPeriod } from "@/types/skill";

type ReminderMode = "never" | "10" | "25" | "50" | "100" | "custom";

type PeriodPreference = {
  mode: ReminderMode;
  customValue: string;
};

export type RepReminderPreferences = Record<ReviewPeriod, PeriodPreference>;

type DueReminder = {
  period: ReviewPeriod;
  repCount: number;
};

type RepReminderPreferencesProps = {
  skillId: string;
  repCount: number;
  onReview: (period: ReviewPeriod) => void;
};

const periods: Array<{ key: ReviewPeriod; label: string }> = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const modeOptions: Array<{ value: ReminderMode; label: string }> = [
  { value: "never", label: "Never" },
  { value: "10", label: "Every 10 reps" },
  { value: "25", label: "Every 25 reps" },
  { value: "50", label: "Every 50 reps" },
  { value: "100", label: "Every 100 reps" },
  { value: "custom", label: "Custom number" },
];

const defaultPreferences: RepReminderPreferences = {
  weekly: { mode: "never", customValue: "" },
  monthly: { mode: "never", customValue: "" },
  quarterly: { mode: "never", customValue: "" },
  yearly: { mode: "never", customValue: "" },
};

function preferencesKey(skillId: string): string {
  return `mu_sashi_rep_reminders_${skillId}`;
}

function dismissedKey(skillId: string, period: ReviewPeriod, repCount: number): string {
  return `mu_sashi_rep_reminder_dismissed_${skillId}_${period}_${repCount}`;
}

function readPreferences(skillId: string): RepReminderPreferences {
  if (typeof window === "undefined") return defaultPreferences;

  const raw = window.localStorage.getItem(preferencesKey(skillId));
  if (!raw) return defaultPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<RepReminderPreferences>;

    return {
      weekly: { ...defaultPreferences.weekly, ...parsed.weekly },
      monthly: { ...defaultPreferences.monthly, ...parsed.monthly },
      quarterly: { ...defaultPreferences.quarterly, ...parsed.quarterly },
      yearly: { ...defaultPreferences.yearly, ...parsed.yearly },
    };
  } catch {
    return defaultPreferences;
  }
}

function getInterval(preference: PeriodPreference): number | null {
  if (preference.mode === "never") return null;
  if (preference.mode !== "custom") return Number(preference.mode);

  const custom = Number(preference.customValue);
  if (!Number.isInteger(custom) || custom <= 0) return null;
  return custom;
}

function getSummary(preference: PeriodPreference): string {
  const interval = getInterval(preference);
  if (!interval) return "Never";
  return `Every ${interval} reps`;
}

export function RepReminderPreferencesPanel({
  skillId,
  repCount,
  onReview,
}: RepReminderPreferencesProps) {
  const [preferences, setPreferences] = useState<RepReminderPreferences>(defaultPreferences);
  const [dueReminder, setDueReminder] = useState<DueReminder | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPreferences(readPreferences(skillId));
      setDueReminder(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [skillId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (repCount <= 0) return;

      const due = periods.find(({ key }) => {
        const interval = getInterval(preferences[key]);
        if (!interval || repCount % interval !== 0) return false;

        return !window.localStorage.getItem(dismissedKey(skillId, key, repCount));
      });

      setDueReminder(due ? { period: due.key, repCount } : null);
    });

    return () => cancelAnimationFrame(frame);
  }, [preferences, repCount, skillId]);

  const activeSummaries = useMemo(
    () =>
      periods
        .map(({ key, label }) => ({ key, label, summary: getSummary(preferences[key]) }))
        .filter((item) => item.summary !== "Never"),
    [preferences]
  );

  const updatePreference = (period: ReviewPeriod, next: PeriodPreference) => {
    setPreferences((current) => {
      const updated = {
        ...current,
        [period]: next,
      };

      window.localStorage.setItem(preferencesKey(skillId), JSON.stringify(updated));
      return updated;
    });
  };

  const acknowledgeReminder = () => {
    if (!dueReminder) return;

    window.localStorage.setItem(
      dismissedKey(skillId, dueReminder.period, dueReminder.repCount),
      "true"
    );
    setDueReminder(null);
  };

  const handleReview = () => {
    if (!dueReminder) return;

    const period = dueReminder.period;
    acknowledgeReminder();
    onReview(period);
  };

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4">
        <div className="space-y-1">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">
            Rep reminders
          </h2>
          <p className="text-xs leading-5 text-zinc-600">
            In-app pauses based on total reps. Dismissing one pause only silences that rep count.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {periods.map(({ key, label }) => {
            const preference = preferences[key];

            return (
              <div key={key} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-400">{label}</span>
                  <select
                    value={preference.mode}
                    onChange={(event) =>
                      updatePreference(key, {
                        ...preference,
                        mode: event.target.value as ReminderMode,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600"
                  >
                    {modeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {preference.mode === "custom" ? (
                  <label className="block space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                      Custom interval
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={preference.customValue}
                      onChange={(event) =>
                        updatePreference(key, {
                          ...preference,
                          customValue: event.target.value,
                        })
                      }
                      placeholder="e.g. 75"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-zinc-600"
                    />
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {activeSummaries.length ? (
            activeSummaries.map((item) => (
              <span
                key={item.key}
                className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-400"
              >
                {item.label}: {item.summary}
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-600">No rep-based reminders active.</span>
          )}
        </div>
      </section>

      {dueReminder ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 text-white backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                Rep {dueReminder.repCount.toLocaleString()}
              </p>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-zinc-50">Pause for a moment.</h2>
                <p className="whitespace-pre-line text-sm leading-6 text-zinc-400">
                  You have walked another step.{"\n"}Would you like to revisit your path?
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleReview}
                className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white"
              >
                Review
              </button>
              <button
                type="button"
                onClick={acknowledgeReminder}
                className="rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
