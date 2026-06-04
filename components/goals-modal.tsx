"use client";

import type { Skill } from "@/types/skill";

type Props = {
  skill: Skill;
  open: boolean;
  onClose: () => void;
};

export default function GoalsModal({ skill, open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Path</h2>
          <button onClick={onClose} className="text-zinc-400">
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-4">

          <div>
            <p className="text-xs text-zinc-500 uppercase">Weekly Action</p>
            <p>{skill.weeklyGoalText || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-500 uppercase">Monthly Outcome</p>
            <p>{skill.monthlyGoalText || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-500 uppercase">Quarterly Identity</p>
            <p>{skill.quarterlyGoalText || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-500 uppercase">Yearly Mastery</p>
            <p>{skill.yearlyGoalText || "-"}</p>
          </div>

        </div>
      </div>
    </div>
  );
}