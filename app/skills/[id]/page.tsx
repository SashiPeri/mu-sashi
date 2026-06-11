"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills, addRep } from "@/lib/skill-storage";
import { shouldShowReview, type Skill, type ReviewPeriod } from "@/types/skill";
import GoalsModal from "@/components/dashboard/goals-modal";
import { ReviewModal } from "@/components/dashboard/review-modal";

const HOLD_DURATION  = 1200;
const FORGE_DURATION = 800;
const PERIODS: ReviewPeriod[] = ["weekly", "monthly", "quarterly", "yearly"];

const MICROCOPY = [
  "Mastery is built one repetition at a time.",
  "The work is the reward.",
  "You are becoming the person who does the work.",
  "Small actions. Massive identity.",
  "Discipline is freedom forged in repetition.",
];

function playRepSound() {
  try {
    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
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
        fill="none" stroke="#7f1d1d" strokeWidth="5"
        strokeLinecap="butt"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 56 56)"
        style={{ transition: "stroke-dasharray 0.6s ease-out" }}
      />
    </svg>
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

  const [charge,    setCharge]    = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [repAdding, setRepAdding] = useState(false);
  const [forged,    setForged]    = useState(false);

  const holdStart  = useRef<number | null>(null);
  const rafRef     = useRef<number | null>(null);
  const doneRef    = useRef(false);
  const forgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setCharge(0);
  }, []);

  const startHold = useCallback(() => {
    if (repAdding) return;
    holdStart.current = performance.now();
    doneRef.current   = false;
    setIsHolding(true);
    setCharge(0);

    const tick = async () => {
      if (!holdStart.current) return;
      const elapsed  = performance.now() - holdStart.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setCharge(progress);

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (doneRef.current) return;
      doneRef.current = true;
      holdStart.current = null;
      if (!skill) return;

      setRepAdding(true);
      await addRep(skill.id);
      playRepSound();
      setRepAdding(false);
      setIsHolding(false);

      setForged(true);
      if (forgeTimer.current) clearTimeout(forgeTimer.current);
      forgeTimer.current = setTimeout(() => {
        setForged(false);
        setCharge(0);
      }, FORGE_DURATION);

      setCopyIdx((i) => (i + 1) % MICROCOPY.length);
      fetchSkill();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [repAdding, skill, fetchSkill]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (forgeTimer.current) clearTimeout(forgeTimer.current);
    };
  }, []);

  const activePeriods = skill
    ? PERIODS.filter((p) => shouldShowReview(skill, p) && !dismissedPeriods.has(p))
    : [];
  const activeReviewPeriod = activePeriods[0] ?? null;
  const handleDismiss = (p: ReviewPeriod) =>
    setDismissedPeriods((prev) => new Set(prev).add(p));

  const pct      = skill?.targetGoal
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;
  const repsLeft = skill ? Math.max(0, skill.targetGoal - skill.currentIteration) : 0;

  const c            = charge / 100;
  const uiOpacity    = 1 - c * 0.85;
  const repScale     = 1 + c * 0.12;
  const buttonScale  = isHolding ? (0.96 + c * 0.02) : forged ? 1.02 : 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-48 h-[1px] bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-12 bg-zinc-700 animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @keyframes burst {
          0%   { opacity: 0.9; }
          40%  { opacity: 1;   }
          100% { opacity: 0;   }
        }
        @keyframes rep-pop {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.18); }
          100% { transform: scale(1);    }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes burst   { 0%,100% { opacity:0; } }
          @keyframes rep-pop { 0%,100% { transform:scale(1); } }
        }
      `}</style>

      {/* RISING CRIMSON ENERGY */}
      <div
        className="pointer-events-none fixed inset-0 z-20"
        aria-hidden
        style={{
          background: `linear-gradient(to top,
            rgba(120,20,20,${0.55 * c}) 0%,
            rgba(100,15,15,${0.42 * c}) 30%,
            rgba(80,10,10,${0.28 * c}) 60%,
            rgba(60,5,5,${0.10 * c}) 85%,
            transparent 100%
          )`,
          clipPath: `inset(${100 - charge}% 0 0 0)`,
          transition: isHolding
            ? "clip-path 0.05s linear, background 0.05s linear"
            : forged
            ? "clip-path 0.0s, background 0.0s"
            : "clip-path 0.6s ease-in, background 0.6s ease-in",
        }}
      />

      {/* BURST FLASH */}
      {forged && (
        <div
          className="pointer-events-none fixed inset-0 z-30"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 80% 70% at 50% 55%, rgba(153,27,27,0.28) 0%, transparent 70%)",
            animation: `burst ${FORGE_DURATION}ms ease-out forwards`,
          }}
        />
      )}

      <main className="relative min-h-screen bg-black text-white overflow-hidden">
        <div className="max-w-lg mx-auto px-6 py-10 space-y-10">

          {/* NAV */}
          <div
            className="flex items-center justify-between"
            style={{
              opacity: uiOpacity,
              transition: "opacity 0.08s linear",
              pointerEvents: isHolding ? "none" : "auto",
            }}
          >
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

          {/* TITLE */}
          <div style={{ opacity: uiOpacity, transition: "opacity 0.08s linear" }}>
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Skill</p>
            <h1 className="text-xl text-zinc-100">{skill!.name}</h1>
          </div>

          {/* PROGRESS */}
          <div style={{ opacity: uiOpacity, transition: "opacity 0.08s linear" }}>
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
                  <div className="h-full bg-red-900 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-zinc-900 rounded-xl bg-zinc-950 px-4 py-3 text-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Logged</p>
                    <p className="text-lg font-mono text-zinc-200 tabular-nums">{skill!.currentIteration.toLocaleString()}</p>
                  </div>
                  <div className="border border-zinc-900 rounded-xl bg-zinc-950 px-4 py-3 text-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-1">Remaining</p>
                    <p className="text-lg font-mono text-zinc-300 tabular-nums">{repsLeft.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REP COUNT + BUTTON — stays above overlay */}
          <div
            className="relative flex flex-col items-center gap-6"
            style={{
              zIndex: 25,
              transform: `scale(${repScale})`,
              transition: isHolding ? "transform 0.08s linear" : "transform 0.4s ease-out",
            }}
          >
            {/* large rep count */}
            <div
              style={{
                animation: forged ? `rep-pop ${FORGE_DURATION * 0.6}ms cubic-bezier(0.2,0,0,1) forwards` : undefined,
              }}
            >
              <p
                className="text-5xl font-mono tabular-nums leading-none text-center"
                style={{
                  color: c > 0.1
                    ? `rgba(255,${Math.round(255 - c * 200)},${Math.round(255 - c * 230)},1)`
                    : "rgba(212,212,216,0.9)",
                  transition: "color 0.08s linear",
                  textShadow: c > 0.3
                    ? `0 0 ${Math.round(c * 40)}px rgba(180,30,30,${c * 0.6})`
                    : "none",
                }}
              >
                {skill!.currentIteration.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mt-2 text-center">reps</p>
            </div>

            {/* HOLD BUTTON */}
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={(e) => { e.preventDefault(); startHold(); }}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              disabled={repAdding}
              aria-label="Hold to log a rep"
              className="relative w-44 h-44 rounded-full flex items-center justify-center select-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900"
              style={{
                border: `1px solid ${c > 0.05 ? `rgba(180,30,30,${0.3 + c * 0.6})` : "rgba(63,63,70,0.5)"}`,
                background: c > 0.05 ? `rgba(100,15,15,${c * 0.18})` : "transparent",
                transform: `scale(${buttonScale})`,
                boxShadow: c > 0.2 ? `0 0 ${Math.round(c * 60)}px rgba(140,20,20,${c * 0.35}) inset` : "none",
                transition: isHolding
                  ? "border-color 0.08s linear, background 0.08s linear, box-shadow 0.08s linear, transform 0.08s linear"
                  : "border-color 0.5s ease-in, background 0.5s ease-in, box-shadow 0.5s ease-in, transform 0.3s ease-out",
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 120 120"
                aria-hidden
              >
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={`rgba(180,30,30,${0.4 + c * 0.5})`}
                  strokeWidth={1 + c * 2}
                  strokeLinecap="butt"
                  strokeDasharray={`${2 * Math.PI * 54 * c} ${2 * Math.PI * 54}`}
                  style={{ transition: isHolding ? "none" : "stroke-dasharray 0.5s ease-in" }}
                />
              </svg>

              <div className="flex flex-col items-center gap-1 pointer-events-none relative z-10">
                {repAdding ? (
                  <div className="w-4 h-4 rounded-full border border-red-800 border-t-transparent animate-spin" />
                ) : charge >= 99 || forged ? (
                  <>
                    <span className="text-2xl font-mono text-red-200 leading-none">+1</span>
                    <span className="text-[9px] font-mono text-red-800 uppercase tracking-widest">forged</span>
                  </>
                ) : isHolding ? (
                  <>
                    <span
                      className="text-2xl font-mono tabular-nums leading-none"
                      style={{ color: `rgba(248,100,100,${0.5 + c * 0.5})` }}
                    >
                      {Math.round(charge)}
                    </span>
                    <span
                      className="text-[9px] font-mono uppercase tracking-widest"
                      style={{ color: `rgba(180,80,80,${0.4 + c * 0.4})` }}
                    >
                      charging
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-mono text-zinc-400 leading-none">+1</span>
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">rep</span>
                  </>
                )}
              </div>
            </button>

            <p
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{
                color: `rgba(${c > 0.2 ? "180,80,80" : "63,63,70"},${1 - c * 0.6})`,
                transition: "color 0.08s linear, opacity 0.08s linear",
              }}
            >
              {isHolding ? "release to cancel" : `Hold ${HOLD_DURATION / 1000}s to record`}
            </p>
          </div>

          {/* MICROCOPY */}
          <p
            className="text-center text-[11px] leading-relaxed px-6 text-zinc-600"
            style={{ opacity: uiOpacity, transition: "opacity 0.08s linear" }}
          >
            {MICROCOPY[copyIdx]}
          </p>

        </div>
      </main>

      <GoalsModal skill={skill!} open={showGoals} onClose={() => setShowGoals(false)} />

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