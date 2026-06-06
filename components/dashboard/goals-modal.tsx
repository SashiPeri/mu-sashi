"use client";

import { useEffect, useState } from "react";
import type { Skill } from "@/types/skill";

type Props = {
  skill: Skill;
  open: boolean;
  onClose: () => void;
};

type SectionKey = "weekly" | "monthly" | "quarterly" | "yearly";

type GoalSkill = Skill & {
  weeklyGoalText?: string | null;
  monthlyGoalText?: string | null;
  quarterlyGoalText?: string | null;
  yearlyGoalText?: string | null;
  weeklyReflectionPreview?: string | null;
  monthlyReflectionPreview?: string | null;
  quarterlyReflectionPreview?: string | null;
  yearlyReflectionPreview?: string | null;
  periodGoals?: Partial<Record<SectionKey, string>>;
};

type LocalGoals = Record<SectionKey, string>;

const sections: Array<{
    key: SectionKey;
    mark: string;
    title: string;
    subtitle: string;
    goalField: keyof GoalSkill;
    reflectionField: keyof GoalSkill;
    reviewedField: keyof Skill;
    reminderField: keyof Skill;
    delay: string;
  }> = [  {
    key: "weekly",
    mark: "W",
    title: "Weekly Action",
    subtitle: "The ritual small enough to repeat, serious enough to matter.",
    goalField: "weeklyGoalText",
    reflectionField: "weeklyReflectionPreview",
    reviewedField: "lastWeeklyReviewAt",
    reminderField: "enableWeeklyReminder",
    delay: "delay-75",
  },
  {
    key: "monthly",
    mark: "M",
    title: "Monthly Outcome",
    subtitle: "A visible harvest from the quiet work nobody saw.",
    goalField: "monthlyGoalText",
    reflectionField: "monthlyReflectionPreview",
    reviewedField: "lastMonthlyReviewAt",
    reminderField: "enableMonthlyReminder",
    delay: "delay-100",
  },
  {
    key: "quarterly",
    mark: "Q",
    title: "Quarterly Identity",
    subtitle: "Not what you chase, but who the chase is making.",
    goalField: "quarterlyGoalText",
    reflectionField: "quarterlyReflectionPreview",
    reviewedField: "lastQuarterlyReviewAt",
    reminderField: "enableQuarterlyReminder",
    delay: "delay-150",
  },
  {
    key: "yearly",
    mark: "Y",
    title: "Yearly Mastery",
    subtitle: "The long vow, written with ordinary days.",
    goalField: "yearlyGoalText",
    reflectionField: "yearlyReflectionPreview",
    reviewedField: "lastYearlyReviewAt",
    reminderField: "enableYearlyReminder",
    delay: "delay-200",
  },
];

const emptyGoals: LocalGoals = {
  weekly: "",
  monthly: "",
  quarterly: "",
  yearly: "",
};
function goalsKey(skillId: string): string {
    return `mu_sashi_goals_${skillId}`;
  }
function readStoredGoals(skillId: string): Partial<LocalGoals> {
  if (typeof window === "undefined") return {};

  const raw = window.localStorage.getItem(goalsKey(skillId));
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Partial<LocalGoals>;
  } catch {
    return {};
  }
}

function getSkillGoal(goalSkill: GoalSkill, section: (typeof sections)[number]): string {
  return String(
    goalSkill[section.goalField] ?? goalSkill.periodGoals?.[section.key] ?? ""
  ).trim();
}

function formatReviewedDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "Not reviewed yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reviewed yet";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function GoalsModal({ skill, open, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [expandedKey, setExpandedKey] = useState<SectionKey>("weekly");
  const [localGoals, setLocalGoals] = useState<LocalGoals>(emptyGoals);
  const [draftGoals, setDraftGoals] = useState<LocalGoals>(emptyGoals);
  const [editingKey, setEditingKey] = useState<SectionKey | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [activeReminders, setActiveReminders] = useState<
    Record<SectionKey, boolean>
  >({
    weekly: Boolean(skill.enableWeeklyReminder),
    monthly: Boolean(skill.enableMonthlyReminder),
    quarterly: Boolean(skill.enableQuarterlyReminder),
    yearly: Boolean(skill.enableYearlyReminder),
  });

  useEffect(() => {
    setActiveReminders({
      weekly: Boolean(skill.enableWeeklyReminder),
      monthly: Boolean(skill.enableMonthlyReminder),
      quarterly: Boolean(skill.enableQuarterlyReminder),
      yearly: Boolean(skill.enableYearlyReminder),
    });
  }, [skill]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      const goalSkill = skill as GoalSkill;
      const storedGoals = readStoredGoals(skill.id);
      const nextGoals = sections.reduce<LocalGoals>((acc, section) => {
        acc[section.key] = storedGoals[section.key] ?? getSkillGoal(goalSkill, section);
        return acc;
      }, { ...emptyGoals });

      setLocalGoals(nextGoals);
      setDraftGoals(nextGoals);
      setEditingKey(null);
      setSaveMessage(null);
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [open, skill]);

  if (!open) return null;

  const goalSkill = skill as GoalSkill;
  const enabledReminders = sections.filter(
    (section) => activeReminders[section.key]
  );

  const handleClose = () => {
    setVisible(false);
    window.setTimeout(onClose, 180);
  };

  const startEditing = (sectionKey: SectionKey) => {
    setExpandedKey(sectionKey);
    setEditingKey(sectionKey);
    setSaveMessage(null);
  };

  const cancelEditing = () => {
    setDraftGoals(localGoals);
    setEditingKey(null);
    setSaveMessage(null);
  };

  const saveGoal = (sectionKey: SectionKey) => {
    const nextGoals = {
      ...localGoals,
      [sectionKey]: draftGoals[sectionKey].trim(),
    };

    window.localStorage.setItem(goalsKey(skill.id), JSON.stringify(nextGoals));
    setLocalGoals(nextGoals);
    setDraftGoals(nextGoals);
    setEditingKey(null);
    setSaveMessage("Goal saved.");
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-black/75 p-3 text-white backdrop-blur-xl transition-opacity duration-300 sm:p-6 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative my-6 w-full max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#14110d]/80 p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-500 sm:p-8 lg:p-10 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-200/10 via-stone-100/5 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(180,133,72,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.2))]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-100/50 via-amber-700/20 to-transparent" />

        <div className="relative space-y-7">
          <header className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-amber-100/70">
                  TRADING
                </p>
                <h2 className="text-3xl font-semibold tracking-normal text-stone-50 sm:text-5xl">
                  The path is walked one rep at a time.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-stone-400">
                A private ledger for {goalSkill.name}. Open one horizon, read it slowly, then return to the work.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-xl leading-none text-stone-300 shadow-lg shadow-black/30 transition hover:border-amber-100/40 hover:bg-amber-100/10 hover:text-amber-100"
              aria-label="Close goals journal"
            >
              x
            </button>
          </header>

          <nav className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 shadow-inner shadow-black/30">
            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-center gap-2">
              {sections.map((section, index) => {
                const active = expandedKey === section.key;

                return (
                  <div key={section.key} className="contents">
                    <button
                      type="button"
                      onClick={() => setExpandedKey(section.key)}
                      className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold transition ${
                        active
                          ? "border-amber-100/60 bg-amber-100/15 text-amber-50 shadow-lg shadow-amber-950/30"
                          : "border-white/10 bg-black/20 text-stone-500 hover:border-white/20 hover:text-stone-300"
                      }`}
                      aria-label={`Open ${section.title}`}
                    >
                      {section.mark}
                    </button>
                    {index < sections.length - 1 ? (
                      <div className="h-px bg-gradient-to-r from-white/10 via-amber-100/25 to-white/10" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="space-y-3">
            {sections.map((section, index) => {
              const goalText = localGoals[section.key].trim();
              const reflectionPreview = String(goalSkill[section.reflectionField] ?? "").trim();
              const reviewedDate = formatReviewedDate(skill[section.reviewedField]);
              const expanded = expandedKey === section.key;
              const editing = editingKey === section.key;

              return (
                <article
                  key={section.key}
                  className={`group block w-full overflow-hidden rounded-2xl border text-left shadow-xl shadow-black/20 transition-all duration-500 ${section.delay} ${
                    visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  } ${
                    expanded
                      ? "border-amber-100/30 bg-stone-950/55"
                      : "border-white/10 bg-white/[0.035] hover:border-amber-100/20 hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="relative p-5 sm:p-6">
                    <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/40 to-transparent" />

                    <button
                      type="button"
                      onClick={() => setExpandedKey(section.key)}
                      className="flex w-full items-start justify-between gap-4 text-left"
                      aria-expanded={expanded}
                    >
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-stone-500">
                          Entry {String(index + 1).padStart(2, "0")}
                        </p>
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-semibold tracking-normal text-stone-50">
                            {section.title}
                          </h3>
                          <p className="max-w-2xl text-sm italic leading-6 text-amber-100/60">
                            {section.subtitle}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm transition ${
                          expanded
                            ? "rotate-45 border-amber-100/40 bg-amber-100/10 text-amber-100"
                            : "border-white/10 bg-black/20 text-stone-500 group-hover:text-stone-300"
                        }`}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>

                    <div
                      className={`grid transition-all duration-500 ${
                        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                                Goal text
                              </p>
                              {!editing ? (
                                <button
                                  type="button"
                                  onClick={() => startEditing(section.key)}
                                  className="rounded-full border border-amber-100/20 px-3 py-1 text-xs text-amber-100/80 transition hover:border-amber-100/50 hover:text-amber-50"
                                >
                                  Edit
                                </button>
                              ) : null}
                            </div>

                            {editing ? (
                              <div className="space-y-3">
                                <textarea
                                  value={draftGoals[section.key]}
                                  onChange={(event) =>
                                    setDraftGoals((current) => ({
                                      ...current,
                                      [section.key]: event.target.value,
                                    }))
                                  }
                                  rows={5}
                                  className="w-full resize-none rounded-xl border border-white/10 bg-stone-950/70 px-3 py-3 text-sm leading-6 text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-100/40"
                                  placeholder={`Write your ${section.title.toLowerCase()}...`}
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveGoal(section.key)}
                                    className="rounded-full bg-amber-100 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-950 transition hover:bg-amber-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-400 transition hover:border-white/25 hover:text-stone-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : goalText ? (
                              <p className="whitespace-pre-wrap text-base leading-7 text-stone-100">{goalText}</p>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-stone-300">
                                  This page is still unwritten.
                                </p>
                                <p className="text-sm leading-6 text-stone-500">
                                  Leave it open until the right sentence arrives.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                                Last reflection preview
                              </p>
                              <p className="text-sm leading-6 text-stone-300">
                                {reflectionPreview || "No reflection preview is available yet."}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-500">
                                Last reviewed
                              </p>
                              <p className="text-sm text-amber-100/80">{reviewedDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {saveMessage ? (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {saveMessage}
            </p>
          ) : null}

<section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-inner shadow-black/20">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-stone-500">
        Reminders
      </p>
      <p className="text-sm leading-6 text-stone-300">
        {enabledReminders.length
          ? `${enabledReminders.length} cadence reminder${enabledReminders.length === 1 ? "" : "s"} active.`
          : "All cadence reminders are quiet."}
      </p>
    </div>

    <div className="flex gap-3">
  {sections.map((section) => {
    const enabled = activeReminders[section.key];

    return (
      <button
        key={section.key}
        type="button"
        onClick={() =>
          setActiveReminders((prev) => ({
            ...prev,
            [section.key]: !prev[section.key],
          }))
        }
        className={`h-11 w-11 rounded-full border font-bold transition-all duration-300 cursor-pointer ${
          enabled
            ? "border-red-500/60 bg-red-500/20 text-red-300 shadow-[0_0_20px_rgba(220,38,38,.25)]"
            : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-500 hover:text-white"
        }`}
      >
        {section.mark}
      </button>
    );
  })}
</div>
  </div>
</section>

</div>
</div>
</div>
);
}