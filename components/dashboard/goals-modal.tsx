"use client";

import { useState } from "react";
import { saveGoals } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";

type GoalsModalProps = {
  skill: Skill;
  onClose: () => void;
  onSaved: () => void;
};

const GOAL_FIELDS = [
  {
    key: "weeklyGoalText" as const,
    dbKey: "weeklyGoalText" as const,
    label: "Weekly Action",
    philosophy: "Action",
    placeholder: "What actions are completely under your control this week?",
  },
  {
    key: "monthlyGoalText" as const,
    dbKey: "monthlyGoalText" as const,
    label: "Monthly Outcome",
    philosophy: "Outcome",
    placeholder: "If your weekly actions are executed consistently, what outcome should happen this month?",
  },
  {
    key: "quarterlyGoalText" as const,
    dbKey: "quarterlyGoalText" as const,
    label: "Quarterly Identity",
    philosophy: "Identity",
    placeholder: "Who are you becoming over the next 90 days?",
  },
  {
    key: "yearlyGoalText" as const,
    dbKey: "yearlyGoalText" as const,
    label: "Yearly Mastery",
    philosophy: "Mastery",
    placeholder: "What craft or mastery are you building over the next year?",
  },
] as const;

export function GoalsModal({ skill, onClose, onSaved }: GoalsModalProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [weekly, setWeekly] = useState(skill.weeklyGoalText ?? "");
  const [monthly, setMonthly] = useState(skill.monthlyGoalText ?? "");
  const [quarterly, setQuarterly] = useState(skill.quarterlyGoalText ?? "");
  const [yearly, setYearly] = useState(skill.yearlyGoalText ?? "");

  const values = { weeklyGoalText: weekly, monthlyGoalText: monthly, quarterlyGoalText: quarterly, yearlyGoalText: yearly };
  const setters = { weeklyGoalText: setWeekly, monthlyGoalText: setMonthly, quarterlyGoalText: setQuarterly, yearlyGoalText: setYearly };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const { error } = await saveGoals({
      skillId: skill.id,
      weeklyGoalText: weekly,
      monthlyGoalText: monthly,
      quarterlyGoalText: quarterly,
      yearlyGoalText: yearly,
    });

    setSaving(false);
    if (error) { setSaveError(error); return; }
    setEditing(false);
    onSaved();
  };

  const handleCancel = () => {
    setWeekly(skill.weeklyGoalText ?? "");
    setMonthly(skill.monthlyGoalText ?? "");
    setQuarterly(skill.quarterlyGoalText ?? "");
    setYearly(skill.yearlyGoalText ?? "");
    setEditing(false);
    setSaveError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700/60 bg-zinc-950 p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-zinc-100">Your Goals</h2>
            <p className="text-xs text-zinc-500">{skill.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none mt-0.5" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {GOAL_FIELDS.map((field) => (
            <div key={field.key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{field.label}</p>
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{field.philosophy}</span>
              </div>
              {editing ? (
                <textarea
                  value={values[field.key]}
                  onChange={(e) => setters[field.key](e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 resize-none"
                />
              ) : (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {values[field.key] || <span className="text-zinc-600 italic">{field.placeholder}</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {saveError && <p className="text-xs text-rose-400">{saveError}</p>}

        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? "Saving…" : "Save Goals"}
            </button>
            <button onClick={handleCancel} className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="flex-1 bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white transition-colors">
              Edit Goals
            </button>
            <button onClick={onClose} className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}