"use client";

import { useState } from "react";
import { saveReview } from "@/lib/skill-storage";
import type { ReviewPeriod } from "@/types/skill";

const PERIOD_CONFIG: Record<ReviewPeriod, { label: string; placeholder: string }> = {
  weekly: {
    label: "week",
    placeholder: "What worked? What didn't? What will you improve next week?",
  },
  monthly: {
    label: "month",
    placeholder: "What outcomes happened this month? What should change next month?",
  },
  quarterly: {
    label: "quarter",
    placeholder: "How has your identity changed? What habits define you now?",
  },
  yearly: {
    label: "year",
    placeholder: "What did you become this year? What craft have you built?",
  },
};

type ReviewModalProps = {
  skillId: string;
  period: ReviewPeriod;
  onSaved: () => void;
  onDismiss: () => void;
};

export function ReviewModal({ skillId, period, onSaved, onDismiss }: ReviewModalProps) {
  const config = PERIOD_CONFIG[period];

  const [expanded, setExpanded] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [carryGoal, setCarryGoal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!reviewText.trim()) return;
    setSaving(true);
    setSaveError(null);

    const { error } = await saveReview({
      skillId,
      period,
      review: reviewText,
      carryWeeklyGoal: period === "weekly" ? carryGoal : undefined,
    });

    setSaving(false);
    if (error) { setSaveError(error); return; }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-950 p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-zinc-100">Your {config.label} has ended.</p>
          <p className="text-sm text-zinc-400">Would you like to review your progress?</p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Reflection is optional. Musashi only reminds you. Mastery is your decision.
          </p>
        </div>

        {expanded && (
          <div className="space-y-4">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={config.placeholder}
              rows={4}
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500 resize-none"
            />
            {period === "weekly" && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={carryGoal}
                  onChange={(e) => setCarryGoal(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
                />
                <span className="text-xs text-zinc-400">Carry this week's Action Goal into next week</span>
              </label>
            )}
            {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
          </div>
        )}

        <div className="flex gap-2">
          {expanded ? (
            <>
              <button onClick={handleSave} disabled={saving || !reviewText.trim()} className="flex-1 bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? "Saving…" : "Save Review"}
              </button>
              <button onClick={() => setExpanded(false)} className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                Back
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setExpanded(true)} className="flex-1 bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white transition-colors">
                Review Now
              </button>
              <button onClick={onDismiss} className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                Maybe Later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}