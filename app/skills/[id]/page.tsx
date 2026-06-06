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

const HOLD_DURATION = 2000;

const PERIODS: ReviewPeriod[] = ["weekly", "monthly", "quarterly", "yearly"];

const MICROCOPY = [
  "Mastery is built one repetition at a time.",
  "The work is the reward.",
  "You are becoming the person who does the work.",
  "Small actions. Massive identity.",
  "Discipline is freedom forged in repetition.",
];

/* -----------------------------
   SOUND
------------------------------*/
function playRepSound() {
  const audio = new Audio("/sounds/rep-success.mp3");
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

/* -----------------------------
   MASTER RING (unchanged style)
------------------------------*/
function MasteryRing({ pct }: { pct: number }) {
  return (
    <div className="relative w-36 h-36 mx-auto">
      {/* Progress Ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#7f1d1d ${pct}%, #18181b 0%)`,
        }}
      />

      {/* Inner Circle */}
      <div className="absolute inset-[5px] rounded-full bg-black border border-zinc-800" />

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-white leading-none">
          {pct}%
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
          progress
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
  const [dismissedPeriods, setDismissedPeriods] = useState<Set<ReviewPeriod>>(new Set());

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [repAdding, setRepAdding] = useState(false);

  const holdStart = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  /* -----------------------------
     LOAD SKILL
  ------------------------------*/
  const fetchSkill = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
     HOLD LOGIC
  ------------------------------*/
  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdStart.current = null;
    setIsHolding(false);
    setHoldProgress(0);
    doneRef.current = false;
  }, []);

  const startHold = useCallback(() => {
    if (repAdding) return;

    holdStart.current = performance.now();
    setIsHolding(true);
    doneRef.current = false;

    const tick = async () => {
      if (!holdStart.current) return;

      const elapsed = performance.now() - holdStart.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);

      setHoldProgress(progress);

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (doneRef.current) return;
      doneRef.current = true;

      setIsHolding(false);
      setHoldProgress(0);
      holdStart.current = null;

      if (!skill) return;

      setRepAdding(true);

      await addRep(skill.id);

      playRepSound(); // 🔊 SOUND ON SUCCESS

      setRepAdding(false);
      fetchSkill();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [repAdding, skill, fetchSkill]);

  /* -----------------------------
     DERIVED
  ------------------------------*/
  const pct =
    skill?.targetGoal
      ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
      : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto w-full max-w-md px-4 py-8 space-y-8">

          {/* HEADER */}
          <div className="flex justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-zinc-500"
            >
              ← Back
            </button>

            <button
              onClick={() => setShowGoals(true)}
              className="text-xs border border-zinc-800 px-3 py-1 rounded-full text-zinc-400"
            >
              Goals
            </button>
          </div>

          {/* TITLE */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">{skill!.name}</h1>
          </div>

          {/* 🔴 REP BUTTON (NOW ABOVE PROGRESS) */}
          <div className="relative flex flex-col items-center space-y-4">

  <div
    className="absolute w-72 h-72 rounded-full pointer-events-none"
    style={{
      background:
        "radial-gradient(circle, rgba(180,20,20,.18) 0%, rgba(180,20,20,.08) 40%, transparent 75%)",
      filter: "blur(35px)",
      animation: "forgeGlow 4s ease-in-out infinite",
    }}
  />
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={(e) => { e.preventDefault(); startHold(); }}
              onTouchEnd={cancelHold}
              disabled={repAdding}
             className="relative w-52 h-52 rounded-full flex items-center justify-center overflow-hidden border border-red-900 transition-all"
              style={{
                background: isHolding
                  ? "radial-gradient(circle at center, #b91c1c 0%, #450a0a 55%, #000 100%)"
                  : "radial-gradient(circle at center, #202020 0%, #090909 70%, #000 100%)",
              
                boxShadow: isHolding
                  ? `
                    0 0 25px rgba(220,38,38,.8),
                    0 0 60px rgba(220,38,38,.5),
                    0 0 120px rgba(220,38,38,.25),
                    inset 0 0 30px rgba(255,255,255,.08)
                  `
                  : `
                    0 0 12px rgba(220,38,38,.18),
                    inset 0 0 10px rgba(255,255,255,.03)
                  `,
              
                transform: isHolding ? "scale(.95)" : "scale(1)",
              
                transition:
                  "all .18s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {/* HOLD OVERLAY FILL */}
              {isHolding && (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `rgba(220,38,38,${holdProgress / 220})`,
                  }}
                />
              )}

              {/* CONTENT */}
              <div className="relative text-center">
                {repAdding ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : isHolding ? (
                  <>
                    <p className="text-2xl font-bold text-red-300">
                      {Math.round(holdProgress)}
                    </p>
                    <p className="text-[10px] text-red-200 uppercase">
                      forging
                    </p>
                  </>
                ) : (
                  <>
                    <p
  className="text-6xl font-black text-white"
  style={{
    textShadow: `
      0 0 10px rgba(255,255,255,.15),
      0 0 30px rgba(220,38,38,.25)
    `,
  }}
>
  +1
</p>
                    <p className="text-[10px] text-zinc-500 uppercase">
                      
                    </p>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* PROGRESS CARD */}
          {/* PROGRESS CARD */}
{/* PROGRESS CARD */}

<div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">

  <MasteryRing pct={pct} />

  <div className="h-[2px] bg-zinc-800 rounded-full overflow-hidden">
    <div
      className="h-full bg-red-800 transition-all duration-700"
      style={{
        width: `${pct}%`,
      }}
    />
  </div>

  <div className="grid grid-cols-2 gap-4">

    <div className="border border-zinc-800 rounded-xl py-4 text-center bg-black/20">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Reps
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">
        {skill!.currentIteration}
      </p>
    </div>

    <div className="border border-zinc-800 rounded-xl py-4 text-center bg-black/20">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Target
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">
        {skill!.targetGoal}
      </p>
    </div>

  </div>

</div>          {/* MICRO COPY */}
<p className="text-center text-base text-zinc-400 italic leading-relaxed px-5">
  {MICROCOPY[Math.floor(Math.random() * MICROCOPY.length)]}
</p>

        </div>
      </main>

      {/* MODALS */}
      <GoalsModal
        skill={skill!}
        open={showGoals}
        onClose={() => setShowGoals(false)}
      />

      {shouldShowReview(skill!, "weekly") && (
        <ReviewModal
          skillId={skill!.id}
          period="weekly"
          onSaved={fetchSkill}
          onDismiss={() => {}}
        />
      )}
    </>
  );
}