"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills, addRep } from "@/lib/skill-storage";
import { shouldShowReview, type Skill, type ReviewPeriod } from "@/types/skill";
import GoalsModal from "@/components/dashboard/goals-modal";
import { ReviewModal } from "@/components/dashboard/review-modal";

const PERIODS: ReviewPeriod[] = ["weekly", "monthly", "quarterly", "yearly"];
const HOLD_DURATION = 2000;

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

function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {particles.map((i) => {
        const size  = 1 + (i % 3);
        const left  = (i * 37 + 11) % 97;
        const delay = (i * 0.7) % 9;
        const dur   = 14 + (i % 8);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-indigo-400/10"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: "-4px",
              animation: `float-up ${dur}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0) translateX(0);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.6;  transform: scale(1.06); }
        }
        @keyframes hold-scale {
          from { transform: scale(1); }
          to   { transform: scale(0.96); }
        }
      `}</style>
    </div>
  );
}

function MasteryRing({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="7" />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SkillDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const id       = params.id as string;

  const [skill,   setSkill]   = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGoals, setShowGoals] = useState(false);
  const [dismissedPeriods, setDismissedPeriods] =
    useState<Set<ReviewPeriod>>(new Set());

  const [copyIdx, setCopyIdx] = useState(0);

  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding,    setIsHolding]    = useState(false);
  const [repAdding,    setRepAdding]    = useState(false);
  const [justFired,    setJustFired]    = useState(false);
  const holdStart    = useRef<number | null>(null);
  const rafRef       = useRef<number | null>(null);
  const completedRef = useRef(false);

  const fetchSkill = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { skills } = await loadSkills();
    const found = skills.find(s => s.id === id) ?? null;
    if (!found) { router.push("/dashboard"); return; }
    setSkill(found);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchSkill(); }, [fetchSkill]);

  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    holdStart.current    = null;
    completedRef.current = false;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (repAdding) return;
    completedRef.current = false;
    holdStart.current    = performance.now();
    setIsHolding(true);
    setHoldProgress(0);

    const tick = async () => {
      if (!holdStart.current) return;
      const elapsed  = performance.now() - holdStart.current;
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
      setJustFired(true);
      setTimeout(() => setJustFired(false), 600);

      await addRep(skill.id);
      setRepAdding(false);
      setCopyIdx(i => (i + 1) % MICROCOPY.length);
      setSkill(prev =>
        prev ? { ...prev, currentIteration: prev.currentIteration + 1 } : prev
      );
      fetchSkill();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [repAdding, skill, fetchSkill]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const activePeriods = skill
    ? PERIODS.filter(p => shouldShowReview(skill, p) && !dismissedPeriods.has(p))
    : [];
  const activeReviewPeriod = activePeriods[0] ?? null;
  const handleDismiss = (period: ReviewPeriod) =>
    setDismissedPeriods(prev => new Set(prev).add(period));

  const pct = skill && skill.targetGoal > 0
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-600 tracking-widest uppercase">Loading</p>
      </main>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#080810]" aria-hidden />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, #1a1040 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "48px 48px" }}
        aria-hidden
      />
      <Particles />

      <main className="relative min-h-screen text-white flex flex-col">
        <div className="mx-auto w-full max-w-md px-6 pt-10 pb-16 flex flex-col gap-10 flex-1">

          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 tracking-widest uppercase transition-colors"
            >
              ← Return
            </button>
            <button
              onClick={() => setShowGoals(true)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 tracking-widest uppercase transition-colors border border-zinc-800 hover:border-zinc-600 rounded-full px-4 py-1.5"
            >
              The Path
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
              Skill in practice
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              {skill!.name}
            </h1>
          </div>

          <div
            className="rounded-2xl border border-zinc-800/60 p-6 flex flex-col items-center gap-5"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="relative flex items-center justify-center">
              <MasteryRing pct={pct} />
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-zinc-100 leading-none">{pct}%</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 tracking-widest uppercase">Forged</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full">
              {[
                { label: "Reps",   value: skill!.currentIteration.toLocaleString() },
                { label: "Target", value: skill!.targetGoal.toLocaleString() },
                { label: "Left",   value: Math.max(0, skill!.targetGoal - skill!.currentIteration).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-3 py-3 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</p>
                  <p className="text-base font-semibold text-zinc-200 mt-0.5 font-mono">{value}</p>
                </div>
              ))}
            </div>

            <div className="w-full space-y-1.5">
              <div className="w-full h-[5px] rounded-full bg-zinc-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #a78bfa 100%)",
                    boxShadow: "0 0 8px rgba(139,92,246,0.6)",
                    transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-56 h-56 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
                  animation: "pulse-glow 3s ease-in-out infinite",
                }}
                aria-hidden
              />
              {isHolding && (
                <div
                  className="absolute w-64 h-64 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, rgba(99,102,241,${0.1 + holdProgress * 0.003}) 0%, transparent 70%)`,
                  }}
                  aria-hidden
                />
              )}

              <button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={(e) => { e.preventDefault(); startHold(); }}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                disabled={repAdding}
                className="relative w-44 h-44 rounded-full select-none overflow-hidden disabled:opacity-60"
                style={{
                  background: "linear-gradient(145deg, #1e1b4b 0%, #0f0f1a 60%, #1a1040 100%)",
                  border: isHolding
                    ? "1.5px solid rgba(139,92,246,0.7)"
                    : justFired
                    ? "1.5px solid rgba(167,139,250,0.9)"
                    : "1.5px solid rgba(99,102,241,0.3)",
                  boxShadow: isHolding
                    ? "0 0 32px rgba(99,102,241,0.4), inset 0 0 24px rgba(99,102,241,0.1)"
                    : "0 0 16px rgba(99,102,241,0.15), inset 0 0 8px rgba(99,102,241,0.04)",
                  transform: isHolding ? "scale(0.96)" : "scale(1)",
                  transition: "transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  WebkitUserSelect: "none",
                }}
              >
                {isHolding && (
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                    viewBox="0 0 176 176"
                    aria-hidden
                  >
                    <circle
                      cx="88" cy="88" r="84"
                      fill="none"
                      stroke="rgba(139,92,246,0.5)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 84}
                      strokeDashoffset={2 * Math.PI * 84 * (1 - holdProgress / 100)}
                      style={{ transition: "none" }}
                    />
                  </svg>
                )}

                <div className="relative flex flex-col items-center justify-center h-full gap-1">
                  {repAdding ? (
                    <div className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                  ) : isHolding ? (
                    <>
                      <span className="text-3xl font-bold text-violet-300">
                        {Math.round(holdProgress)}
                      </span>
                      <span className="text-[10px] text-violet-400/70 tracking-widest uppercase">Forging</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-zinc-100 leading-none">+1</span>
                      <span className="text-[11px] text-zinc-500 tracking-widest uppercase mt-0.5">Rep</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <p className="text-[11px] text-zinc-700 tracking-widest uppercase">
              Hold {HOLD_DURATION / 1000}s to forge
            </p>
          </div>

          <p
            key={copyIdx}
            className="text-center text-xs text-zinc-600 italic leading-relaxed px-4"
            style={{ animation: "fadeIn 0.6s ease forwards" }}
          >
            "{MICROCOPY[copyIdx]}"
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(4px);} to { opacity:1; transform:translateY(0);} }`}</style>
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