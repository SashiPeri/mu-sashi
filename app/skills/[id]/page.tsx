"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills, addRep } from "@/lib/skill-storage";
import {
  shouldShowReview,
  type Skill,
  type ReviewPeriod,
} from "@/types/skill";
import GoalsModal from "@/components/dashboard/goals-modal";
import { ReviewModal } from "@/components/dashboard/review-modal";

const PERIODS: ReviewPeriod[] = ["weekly", "monthly", "quarterly", "yearly"];
const HOLD_DURATION = 2000;

/* -----------------------------
   MICRO COPY (UNCHANGED)
------------------------------*/
const MICROCOPY = [
  "Mastery is built one repetition at a time.",
  "The work is the reward.",
  "You are becoming the person who does the work.",
  "Small actions. Massive identity.",
  "Thousands of quiet victories.",
  "The grind is the path.",
  "Discipline is freedom forged in repetition.",
  "One more. Always one more.",
  "The sword is sharpened by use.",
];

/* -----------------------------
   SIMPLE MASTER RING (DASHBOARD STYLE)
------------------------------*/
function MasteryRing({ pct }: { pct: number }) {
  return (
    <div className="relative w-24 h-24 rounded-full border border-zinc-800 bg-zinc-900/40 flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#7f1d1d ${pct}%, transparent 0%)`,
          opacity: 0.7,
        }}
      />
      <div className="relative text-center">
        <p className="text-lg font-bold text-zinc-100">{pct}%</p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
          Progress
        </p>
      </div>
    </div>
  );
}

/* -----------------------------
   PAGE
------------------------------*/
export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  const [showGoals, setShowGoals] = useState(false);
  const [dismissedPeriods, setDismissedPeriods] = useState<
    Set<ReviewPeriod>
  >(new Set());

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [repAdding, setRepAdding] = useState(false);

  const holdStart = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  /* -----------------------------
     LOAD SKILL (UNCHANGED LOGIC)
  ------------------------------*/
  const fetchSkill = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return router.push("/login");

    const { skills } = await loadSkills();
    const found = skills.find((s) => s.id === id) ?? null;

    if (!found) return router.push("/dashboard");

    setSkill(found);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  /* -----------------------------
     HOLD LOGIC (UNCHANGED)
  ------------------------------*/
  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdStart.current = null;
    completedRef.current = false;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (repAdding) return;

    completedRef.current = false;
    holdStart.current = performance.now();
    setIsHolding(true);

    const tick = async () => {
      if (!holdStart.current) return;

      const elapsed = performance.now() - holdStart.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);

      setHoldProgress(progress);

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (completedRef.current) return;
      completedRef.current = true;

      setIsHolding(false);
      setHoldProgress(0);
      holdStart.current = null;

      if (!skill) return;

      setRepAdding(true);

      await addRep(skill.id);

      setRepAdding(false);
      fetchSkill();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [repAdding, skill, fetchSkill]);

  /* -----------------------------
     DERIVED VALUES
  ------------------------------*/
  const pct =
    skill && skill.targetGoal > 0
      ? Math.min(
          100,
          Math.round((skill.currentIteration / skill.targetGoal) * 100)
        )
      : 0;

  const activePeriods = skill
    ? PERIODS.filter(
        (p) => shouldShowReview(skill, p) && !dismissedPeriods.has(p)
      )
    : [];

  const activeReviewPeriod = activePeriods[0] ?? null;

  const handleDismiss = (period: ReviewPeriod) =>
    setDismissedPeriods((prev) => new Set(prev).add(period));

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  /* -----------------------------
     UI (DASHBOARD STYLE SYSTEM)
  ------------------------------*/
  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-md px-4 py-8 space-y-8">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              ← Back
            </button>

            <button
              onClick={() => setShowGoals(true)}
              className="text-xs border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 hover:text-white"
            >
              Goals
            </button>
          </div>

          {/* TITLE */}
          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              Skill
            </p>
            <h1 className="text-2xl font-semibold text-white">
              {skill!.name}
            </h1>
          </div>

          {/* STATS CARD */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">

            <div className="flex justify-center">
              <MasteryRing pct={pct} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border border-zinc-800 bg-black/40 rounded-lg py-2">
                <p className="text-[10px] text-zinc-500">Reps</p>
                <p className="text-sm">{skill!.currentIteration}</p>
              </div>

              <div className="border border-zinc-800 bg-black/40 rounded-lg py-2">
                <p className="text-[10px] text-zinc-500">Target</p>
                <p className="text-sm">{skill!.targetGoal}</p>
              </div>

              <div className="border border-zinc-800 bg-black/40 rounded-lg py-2">
                <p className="text-[10px] text-zinc-500">Left</p>
                <p className="text-sm">
                  {skill!.targetGoal - skill!.currentIteration}
                </p>
              </div>
            </div>
          </div>

          {/* HOLD BUTTON */}
          <div className="flex flex-col items-center space-y-3">

            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={(e) => {
                e.preventDefault();
                startHold();
              }}
              onTouchEnd={cancelHold}
              disabled={repAdding}
              className="w-40 h-40 rounded-full border border-red-900 bg-zinc-900 flex items-center justify-center select-none"
            >
              {repAdding ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent animate-spin rounded-full" />
              ) : isHolding ? (
                <span className="text-xl text-red-400">
                  {Math.round(holdProgress)}
                </span>
              ) : (
                <span className="text-3xl font-bold text-white">+1</span>
              )}
            </button>

            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
              Hold to add rep
            </p>
          </div>

          {/* MICRO COPY */}
          <p className="text-center text-xs text-zinc-500 italic">
            {MICROCOPY[Math.floor(Math.random() * MICROCOPY.length)]}
          </p>
        </div>
      </main>

      {/* MODALS (UNCHANGED LOGIC) */}
      <GoalsModal
        skill={skill!}
        open={showGoals}
        onClose={() => setShowGoals(false)}
      />

      {activeReviewPeriod && (
        <ReviewModal
          key={activeReviewPeriod}
          skillId={skill!.id}
          period={activeReviewPeriod}
          onSaved={fetchSkill}
          onDismiss={() => handleDismiss(activeReviewPeriod)}
        />
      )}
    </>
  );
}