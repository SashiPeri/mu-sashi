"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills } from "@/lib/skill-storage";
import type { ReviewPeriod, Skill } from "@/types/skill";

import GoalsModal from "@/components/goals-modal";
import { RepReminderPreferencesPanel } from "@/components/dashboard/rep-reminder-preferences";
import { ReviewCard } from "@/components/dashboard/review-card";
import RepCoreButton from "@/components/rep-core-button";

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [reviewOpenSignals, setReviewOpenSignals] = useState<Record<ReviewPeriod, number>>({
    weekly: 0,
    monthly: 0,
    quarterly: 0,
    yearly: 0,
  });

  // -------------------------
  // LOAD
  // -------------------------

  const refreshSkill = async () => {
    const { skills } = await loadSkills();
    const found = skills.find((s) => s.id === id);

    if (found) {
      setSkill(found);
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
  // REP COMPLETE
  // -------------------------

  const addRep = async () => {
    if (!skill || updating) return;

    setUpdating(true);

    const newValue = skill.currentIteration + 1;

    const { data, error } = await supabase
      .from("skills")
      .update({
        current_iteration: newValue,
      })
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

  const openReview = (period: ReviewPeriod) => {
    setReviewOpenSignals((current) => ({
      ...current,
      [period]: current[period] + 1,
    }));

    requestAnimationFrame(() => {
      document.getElementById("skill-reviews")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // -------------------------
  // LOADING
  // -------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </main>
    );
  }

  if (!skill) return null;

  const pct =
    skill.targetGoal > 0
      ? Math.min(
          100,
          Math.round(
            (skill.currentIteration / skill.targetGoal) * 100
          )
        )
      : 0;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        <div className="mx-auto max-w-2xl px-4 py-10 space-y-10">

          {/* BACK */}

          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Back to dashboard
          </button>

          {/* HEADER */}

          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs uppercase text-zinc-500">
                Skill
              </p>

              <h1 className="text-3xl font-bold">
                {skill.name}
              </h1>
            </div>

            <button
              onClick={() => setShowGoals(true)}
              className="border border-zinc-700 rounded-xl px-4 py-2 hover:border-indigo-400 transition"
            >
              View Goals
            </button>
          </div>

          {/* PROGRESS */}

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>
                {skill.currentIteration} / {skill.targetGoal}
              </span>

              <span>{pct}%</span>
            </div>

            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{
                  width: `${pct}%`,
                }}
              />
            </div>
          </div>

          {/* CORE ACTION */}

          <div className="flex justify-center pt-8">
            <RepCoreButton
              onComplete={addRep}
            />
          </div>

          {/* PHILOSOPHY */}

          <div className="text-center space-y-1">
            <p className="text-xs text-zinc-500">
              One rep. One execution.
            </p>

            <p className="text-xs text-zinc-600">
              Mastery is built one completed process at a time.
            </p>
          </div>

          <RepReminderPreferencesPanel
            skillId={skill.id}
            repCount={skill.currentIteration}
            onReview={openReview}
          />

          {/* REVIEWS */}

          <section id="skill-reviews" className="space-y-3 scroll-mt-6">
            <div className="space-y-1">
              <h2 className="text-xs uppercase tracking-wide text-zinc-500">
                Reviews
              </h2>
              <p className="text-xs leading-5 text-zinc-600">
                Weekly, monthly, quarterly, and yearly reflections are always available.
              </p>
            </div>

            <div className="space-y-3">
              <ReviewCard
                skillId={skill.id}
                period="weekly"
                lastReviewedAt={skill.lastWeeklyReviewAt}
                reminderEnabled={skill.enableWeeklyReminder}
                openSignal={reviewOpenSignals.weekly}
                onSaved={refreshSkill}
              />
              <ReviewCard
                skillId={skill.id}
                period="monthly"
                lastReviewedAt={skill.lastMonthlyReviewAt}
                reminderEnabled={skill.enableMonthlyReminder}
                openSignal={reviewOpenSignals.monthly}
                onSaved={refreshSkill}
              />
              <ReviewCard
                skillId={skill.id}
                period="quarterly"
                lastReviewedAt={skill.lastQuarterlyReviewAt}
                reminderEnabled={skill.enableQuarterlyReminder}
                openSignal={reviewOpenSignals.quarterly}
                onSaved={refreshSkill}
              />
              <ReviewCard
                skillId={skill.id}
                period="yearly"
                lastReviewedAt={skill.lastYearlyReviewAt}
                reminderEnabled={skill.enableYearlyReminder}
                openSignal={reviewOpenSignals.yearly}
                onSaved={refreshSkill}
              />
            </div>
          </section>

        </div>
      </main>

      <GoalsModal
        skill={skill}
        open={showGoals}
        onClose={() => setShowGoals(false)}
      />
    </>
  );
}
