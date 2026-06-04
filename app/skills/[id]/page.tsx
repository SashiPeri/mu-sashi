"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // -------------------------
  // STATE
  // -------------------------
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState("");
  const [carryForward, setCarryForward] = useState(true);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showMonthlyReview, setShowMonthlyReview] = useState(false);
  const [showQuarterlyReview, setShowQuarterlyReview] = useState(false);
  const [showYearlyReview, setShowYearlyReview] = useState(false);
  const [goals, setGoals] = useState({
    weeklyText: "",
    monthlyText: "",
  quarterlyText: "",
  yearlyText: "",
  });

  // -------------------------
  // LOAD SKILL
  // -------------------------
  const refreshSkill = async () => {
    const { skills } = await loadSkills();

    const found = skills.find((s) => s.id === id);

    console.log("Loaded skills:", skills);
    console.log("Found skill:", found);

    if (found) {
      setSkill(found);

      setGoals({
        weeklyText: found.weeklyGoalText ?? "",
        monthlyText: found.monthlyGoalText ?? "",
        quarterlyText: found.quarterlyGoalText ?? "",
        yearlyText: found.yearlyGoalText ?? "",
      
      });
      setWeeklyReview(found.weeklyReview ?? "");
    setCarryForward(found.carryWeeklyGoal ?? true);
    }
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      await refreshSkill();
      setLoading(false);
    };

    init();
  }, [id, router]);

  // -------------------------
  // ALIGNMENT CONFIG
  // -------------------------
  

 
  // -------------------------
  // SAVE GOALS
  // -------------------------
  const saveGoals = async () => {
    if (!skill) return;
  
    setUpdating(true);
  
    const { error } = await supabase
      .from("skills")
      .update({
        weekly_goal_text: goals.weeklyText,
        monthly_goal_text: goals.monthlyText,
        quarterly_goal_text: goals.quarterlyText,
        yearly_goal_text: goals.yearlyText,
      
        weekly_review: weeklyReview,
        carry_weekly_goal: carryForward,
      })
      .eq("id", skill.id);
  
    setUpdating(false);
  
    if (!error) {
      setEditMode(false);
      await refreshSkill();
    }
  };
  // -------------------------
  // +1 REP
  // -------------------------
  const addRep = async () => {
    if (!skill || updating) return;

    setUpdating(true);

    const newValue = skill.currentIteration + 1;

    const { data, error } = await supabase
      .from("skills")
      .update({ current_iteration: newValue })
      .eq("id", skill.id)
      .select()
      .single();

    if (!error && data) {
      setSkill({
        ...skill,
        currentIteration: data.current_iteration,
      });
    }

    setUpdating(false);
};

// -------------------------
// LOADING


  // -------------------------
  // LOADING
  // -------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!skill) return null;

  const pct =
    skill.targetGoal > 0
      ? Math.min(
          100,
          Math.round((skill.currentIteration / skill.targetGoal) * 100)
        )
      : 0;

  // -------------------------
  // UI
  // -------------------------
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-8">

        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← Back to dashboard
        </button>

        {/* HEADER */}
        <div>
          <p className="text-xs uppercase text-zinc-500">Skill</p>
          <h1 className="text-2xl font-bold">{skill.name}</h1>
        </div>

        {/* PROGRESS */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>
              {skill.currentIteration} / {skill.targetGoal}
            </span>
            <span>{pct}%</span>
          </div>

          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* GOALS */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase text-zinc-500">
              Alignment Goals
            </h2>

            <button
              onClick={editMode ? saveGoals : () => setEditMode(true)}
              className="text-xs text-zinc-400 hover:text-zinc-200"
              disabled={updating}
            >
              {editMode ? "Save" : "Edit"}
            </button>
          </div>
         
          <div className="space-y-4">

  {/* WEEKLY */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
    <p className="text-zinc-500 text-xs uppercase mb-2">
      Weekly Action
    </p>

    {editMode ? (
      <textarea
        rows={3}
        value={goals.weeklyText}
        onChange={(e) =>
          setGoals({
            ...goals,
            weeklyText: e.target.value,
          })
        }
        placeholder="What actions will you take this week that are completely under your control?"
        className="w-full bg-zinc-800 rounded-lg p-3 text-sm"
      />
    ) : (
      <p className="text-zinc-200">
        {goals.weeklyText || "Define your weekly action"}
      </p>
    )}
  </div>

  {/* MONTHLY */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
    <p className="text-zinc-500 text-xs uppercase mb-2">
      Monthly Outcome
    </p>

    {editMode ? (
      <textarea
        rows={3}
        value={goals.monthlyText}
        onChange={(e) =>
          setGoals({
            ...goals,
            monthlyText: e.target.value,
          })
        }
        placeholder="If your weekly actions are executed consistently, what outcome should happen this month?"
        className="w-full bg-zinc-800 rounded-lg p-3 text-sm"
      />
    ) : (
      <p className="text-zinc-200">
        {goals.monthlyText || "Define your monthly outcome"}
      </p>
    )}
  </div>

  {/* QUARTERLY */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
    <p className="text-zinc-500 text-xs uppercase mb-2">
      Quarterly Identity
    </p>

    {editMode ? (
      <textarea
        rows={3}
        value={goals.quarterlyText}
        onChange={(e) =>
          setGoals({
            ...goals,
            quarterlyText: e.target.value,
          })
        }
        placeholder="Who are you becoming over the next 90 days?"
        className="w-full bg-zinc-800 rounded-lg p-3 text-sm"
      />
    ) : (
      <p className="text-zinc-200">
        {goals.quarterlyText || "Define your quarterly identity"}
      </p>
    )}
  </div>

  {/* YEARLY */}
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
    <p className="text-zinc-500 text-xs uppercase mb-2">
      Yearly Mastery
    </p>

    {editMode ? (
      <textarea
        rows={3}
        value={goals.yearlyText}
        onChange={(e) =>
          setGoals({
            ...goals,
            yearlyText: e.target.value,
          })
        }
        placeholder="What are you mastering over the next year?"
        className="w-full bg-zinc-800 rounded-lg p-3 text-sm"
      />
    ) : (
      <p className="text-zinc-200">
        {goals.yearlyText || "Define your yearly mastery"}
      </p>
    )}
  </div>

</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
  <p className="text-zinc-500 text-xs uppercase mb-2">
    Weekly Review
  </p>

  <textarea
    rows={4}
    value={weeklyReview}
    onChange={(e) => setWeeklyReview(e.target.value)}
    placeholder="What worked? What didn't? What will you improve next week?"
    className="w-full bg-zinc-800 rounded-lg p-3 text-sm"
  />

  <label className="flex items-center gap-2 mt-4 text-sm text-zinc-300">
    <input
      type="checkbox"
      checked={carryForward}
      onChange={(e) => setCarryForward(e.target.checked)}
    />

    Carry this week's Action Goal into next week
  </label>
</div>
        {/* +1 REP */}
        <button
          onClick={addRep}
          disabled={updating}
          className="w-full bg-white text-black py-3 rounded-xl"
        >
          {updating ? "Updating..." : "+1 Rep"}
        </button>

      </div>
    </main>
  );
}