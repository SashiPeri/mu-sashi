"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills, addRep } from "@/lib/skill-storage";
import { shouldShowReview, type Skill, type ReviewPeriod } from "@/types/skill";
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

function playRepSound() {
  const audio = new Audio("/sounds/rep-success.mp3");
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

function ProgressRing({ pct }: { pct: number }) {
  const r    = 48;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);

  return (
    <svg viewBox="0 0 112 112" className="w-28 h-28" aria-label={`${pct}% complete`}>
      <circle cx="56" cy="56" r={r} fill="none" stroke="#18181b" strokeWidth="5" />
      <circle
        cx="56" cy="56" r={r}
        fill="none"
        stroke="#7f1d1d"
        strokeWidth="5"
        strokeLinecap="butt"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 56 56)"
        style={{ transition: "stroke-dasharray 0.6s ease-out" }}
      />
    </svg>
  );
}

function HoldButton({
  isHolding, repAdding, holdProgress, onStart, onCancel,
}: {
  isHolding: boolean; repAdding: boolean; holdProgress: number;
  onStart: () => void; onCancel: () => void;
}) {
  const r    = 54;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={onStart}
        onMouseUp={onCancel}
        onMouseLeave={onCancel}
        onTouchStart={(e) => { e.preventDefault(); onStart(); }}
        onTouchEnd={onCancel}
        onTouchCancel={onCancel}
        disabled={repAdding}
        aria-label="Hold to log a rep"
        className="relative w-44 h-44 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center select-none transition-all duration-150 ease-out hover:border-zinc-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900"
        style={{
          transform: isHolding ? "scale(0.96)" : "scale(1)",
          borderColor: isHolding ? "rgba(127,29,29,0.8)" : undefined,
        }}
      >
        {isHolding && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 120 120"
            aria-hidden
          >
            <circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke="rgba(127,29,29,0.8)"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeDasharray={`${circ * (holdProgress / 100)} ${circ}`}
              style={{ transition: "none" }}
            />
          </svg>
        )}

        <div className="flex flex-col items-center gap-1 pointer-events-none">
          {repAdding ? (
            <div className="w-4 h-4 rounded-full border-2 border-red-900 border-t-transparent animate-spin" />
          ) : isHolding ? (
            <>
              <span className="text-2xl font-mono text-red-400 tabular-nums leading-none">
                {Math.round(holdProgress)}
              </span>
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">holding</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-mono text-zinc-300 leading-none">+1</span>
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">rep</span>
            </>
          )}
        </div>
      </button>

      <p className="text-[10px] font-mono text-zinc-800 uppercase tracking-widest">
        Hold {HOLD_DURATION / 1000}s to record
      </p>
    </div>
  );
}

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [skill,   setSkill]   = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  const [showGoals,        setShowGoals]        = useState(false);
  const [dismissedPeriods, setDismissedPeriods] = useState<Set<ReviewPeriod>>(new Set());
  const [copyIdx,          setCopyIdx]          = useState(0);

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding,    setIsHolding]    = useState(false);
  const [repAdding,    setRepAdding]    = useState(false);
  const holdStart = useRef<number | null>(null);
  const rafRef    = useRef<number | null>(null);
  const doneRef   = useRef(false);

  const fetchSkill = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const { skills } = await loadSkills();
    const found = skills.find((s) => s.id === id) ?? null;
    if (!found) return router.push("/dashboard");
    setSkill(found);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchSkill(); }, [fetchSkill]);

  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdStart.current = null;
    doneRef.current   = false;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (repAdding) return;
    holdStart.current = performance.now();
    doneRef.current   = false;
    setIsHolding(true);

    const tick = async () => {
      if (!holdStart.current) return;
      const elapsed  = performance.now() - holdStart.current;
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
      playRepSound();
      setRepAdding(false);
      setCopyIdx((i) => (i + 1) % MICROCOPY.length);
      fetchSkill();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [repAdding, skill, fetchSkill]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const activePeriods = skill
    ? PERIODS.filter((p) => shouldShowReview(skill, p) && !dismissedPeriods.has(p))
    : [];
  const activeReviewPeriod = activePeriods[0] ?? null;
  const handleDismiss = (p: ReviewPeriod) =>
    setDismissedPeriods((prev) => new Set(prev).add(p));

  const pct = skill?.targetGoal
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;

  const repsLeft = skill ? Math.max(0, skill.targetGoal - skill.currentIteration) : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-48 h-[1px] bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-12 bg-zinc-700 animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(400%) } }`}</style>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-lg mx-auto px-6 py-10 space-y-10">

          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => setShowGoals(true)}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md transition-all duration-150"
            >
              Goals
            </button>
          </div>

          <div>
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Skill</p>
            <h1 className="text-xl text-zinc-100">{skill!.name}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <ProgressRing pct={pct} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-base font-mono text-zinc-200 tabular-nums leading-none">{pct}%</p>
                  <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest mt-0.5">done</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="h-[1px] bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-red-900 transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-900 rounded-xl bg-zinc-950 px-4 py-3 text-center">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Logged</p>
                  <p className="text-lg font-mono text-zinc-200 tabular-nums">
                    {skill!.currentIteration.toLocaleString()}
                  </p>
                </div>
                <div className="border border-zinc-900 rounded-xl bg-zinc-950 px-4 py-3 text-center">
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-lg font-mono text-zinc-200 tabular-nums">
                    {repsLeft.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <HoldButton
              isHolding={isHolding}
              repAdding={repAdding}
              holdProgress={holdProgress}
              onStart={startHold}
              onCancel={cancelHold}
            />
          </div>

          <p className="text-center text-[11px] text-zinc-700 leading-relaxed px-6">
            {MICROCOPY[copyIdx]}
          </p>

        </div>
      </main>

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