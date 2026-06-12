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

function getTier(pct: number): 0 | 1 | 2 | 3 | 4 {
  if (pct < 20)  return 0;
  if (pct < 40)  return 1;
  if (pct < 60)  return 2;
  if (pct < 80)  return 3;
  return 4;
}

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

function DojoScene({
  pct, charge, forged,
}: {
  pct: number; charge: number; forged: boolean;
}) {
  const tier = getTier(pct);
  const c    = charge / 100;

  const moonY      = 140 - tier * 12;
  const moonR      = 22 + tier * 1.5;
  const moonBaseR  = tier >= 3 ? 160 : 220;
  const moonBaseG  = tier >= 3 ? 30  : 80;
  const moonBaseB  = tier >= 3 ? 30  : 80;
  const moonR_val  = Math.round(moonBaseR + c * (255 - moonBaseR));
  const moonG_val  = Math.round(moonBaseG * (1 - c * 0.7));
  const moonB_val  = Math.round(moonBaseB * (1 - c * 0.8));
  const moonColor  = `rgb(${moonR_val},${moonG_val},${moonB_val})`;
  const moonOpacity = 0.55 + tier * 0.08 + c * 0.2;

  const gateOpacity    = tier < 1 ? 0 : Math.min(1, (tier - 1) * 0.5 + 0.25);
  const lanternOpacity = tier < 2 ? 0 : Math.min(1, (tier - 2) * 0.5 + 0.2);
  const lanternWarmth  = tier >= 3 ? 0.7 : 0.35;
  const mistCharge     = c * 0.6;
  const farMtnFill     = tier >= 2 ? "#1a1a1a" : "#141414";

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#050508" />
          <stop offset="60%"  stopColor="#0a0a12" />
          <stop offset="100%" stopColor="#0f0f0f" />
        </linearGradient>
        <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={moonColor} stopOpacity={0.18 + c * 0.12} />
          <stop offset="100%" stopColor={moonColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0a0a0a" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id="chargeMist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={`rgb(${80 + Math.round(c*60)},10,10)`} stopOpacity="0" />
          <stop offset="60%"  stopColor={`rgb(${100 + Math.round(c*60)},15,15)`} stopOpacity={mistCharge * 0.5} />
          <stop offset="100%" stopColor={`rgb(${120 + Math.round(c*60)},20,20)`} stopOpacity={mistCharge} />
        </linearGradient>
        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#c04010" stopOpacity={lanternWarmth} />
          <stop offset="100%" stopColor="#c04010" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pathFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a1a1a" stopOpacity={0.15 + tier * 0.06} />
          <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="500" fill="url(#sky)" />

      <ellipse
        cx="200" cy={moonY}
        rx={moonR * 3.5} ry={moonR * 3.5}
        fill="url(#moonHalo)"
        style={{ transition: "all 1.2s ease-out" }}
      />
      <circle
        cx="200" cy={moonY} r={moonR}
        fill={moonColor} opacity={moonOpacity}
        style={{ transition: "all 0.3s ease-out" }}
      />

      <path
        d="M0,260 L60,180 L120,220 L180,155 L240,200 L300,160 L360,195 L400,170 L400,280 L0,280 Z"
        fill={farMtnFill}
        style={{ transition: "fill 2s ease-out" }}
      />
      <path
        d="M0,310 L80,230 L160,275 L220,215 L280,265 L340,225 L400,250 L400,330 L0,330 Z"
        fill="#0e0e0e"
      />

      <rect x="0" y="270" width="400" height="120" fill="url(#mist)" />

      <path
        d="M185,340 L155,500 M215,340 L245,500"
        stroke="#1a1a1a" strokeWidth="1"
        opacity={0.2 + tier * 0.07} fill="none"
        style={{ transition: "opacity 1.5s ease-out" }}
      />
      <rect x="155" y="340" width="90" height="160" fill="url(#pathFade)" />

      <g opacity={gateOpacity} style={{ transition: "opacity 2s ease-out" }}>
        <rect x="172" y="295" width="5" height="60" fill="#1c1c1c" />
        <rect x="223" y="295" width="5" height="60" fill="#1c1c1c" />
        <rect x="162" y="290" width="76" height="5" fill="#1c1c1c" />
        <rect x="170" y="304" width="60" height="3" fill="#1c1c1c" />
        <path d="M162,290 L158,286 M238,290 L242,286" stroke="#1c1c1c" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      <g opacity={lanternOpacity} style={{ transition: "opacity 2s ease-out" }}>
        <ellipse cx="164" cy="313" rx="14" ry="14" fill="url(#lanternGlow)" />
        <ellipse cx="236" cy="313" rx="14" ry="14" fill="url(#lanternGlow)" />
        <rect x="160" y="308" width="8" height="10" rx="1" fill="#3a1a08" opacity="0.9" />
        <rect x="232" y="308" width="8" height="10" rx="1" fill="#3a1a08" opacity="0.9" />
        <line x1="164" y1="304" x2="164" y2="308" stroke="#1c1c1c" strokeWidth="0.8" />
        <line x1="236" y1="304" x2="236" y2="308" stroke="#1c1c1c" strokeWidth="0.8" />
      </g>

      <rect x="0" y="0" width="400" height="500" fill="url(#chargeMist)" style={{ transition: "all 0.06s linear" }} />
      <rect x="0" y="400" width="400" height="100" fill="#050505" opacity="0.7" />
    </svg>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r    = 48;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg viewBox="0 0 112 112" className="w-28 h-28" aria-label={`${pct}% complete`}>
      <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle
        cx="56" cy="56" r={r}
        fill="none" stroke="rgba(180,30,30,0.7)" strokeWidth="1"
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

  const c           = charge / 100;
  const uiOpacity   = 1 - c * 0.75;
  const repScale    = 1 + c * 0.1;
  const buttonScale = isHolding ? (0.96 + c * 0.02) : forged ? 1.02 : 1;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-32 h-[1px] bg-zinc-900 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-8 bg-zinc-700 animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @keyframes burst {
          0%   { opacity: 0.8; }
          50%  { opacity: 1;   }
          100% { opacity: 0;   }
        }
        @keyframes rep-pop {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.15); }
          100% { transform: scale(1);    }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes burst   { 0%,100% { opacity:0; } }
          @keyframes rep-pop { 0%,100% { transform:scale(1); } }
        }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden">
        <DojoScene pct={pct} charge={charge} forged={forged} />
      </div>

      {forged && (
        <div
          className="pointer-events-none fixed inset-0 z-30"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(153,27,27,0.22) 0%, transparent 70%)",
            animation: `burst ${FORGE_DURATION}ms ease-out forwards`,
          }}
        />
      )}

      <main className="relative z-10 min-h-screen text-white overflow-hidden">
        <div className="max-w-md mx-auto px-6 py-10 flex flex-col min-h-screen">

          <div
            className="flex items-center justify-between mb-auto"
            style={{ opacity: uiOpacity, transition: "opacity 0.08s linear", pointerEvents: isHolding ? "none" : "auto" }}
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => setShowGoals(true)}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300 border border-zinc-800/60 hover:border-zinc-700 px-3 py-1.5 rounded-md transition-all duration-150 backdrop-blur-sm bg-black/20"
            >
              Goals
            </button>
          </div>

          <div
            className="pt-16 pb-8 space-y-6"
            style={{ opacity: uiOpacity, transition: "opacity 0.08s linear" }}
          >
            <div>
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Skill</p>
              <h1 className="text-xl text-zinc-200">{skill!.name}</h1>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <ProgressRing pct={pct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-mono text-zinc-300 tabular-nums leading-none">{pct}%</p>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="h-[1px] bg-white/5 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%`, background: "rgba(180,30,30,0.6)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Logged</p>
                    <p className="text-base font-mono text-zinc-300 tabular-nums">{skill!.currentIteration.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm border border-white/5 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Remaining</p>
                    <p className="text-base font-mono text-zinc-300 tabular-nums">{repsLeft.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6 pb-8">

            <div
              style={{
                transform: `scale(${repScale})`,
                transition: isHolding ? "transform 0.08s linear" : "transform 0.4s ease-out",
                animation: forged ? `rep-pop ${FORGE_DURATION * 0.6}ms cubic-bezier(0.2,0,0,1) forwards` : undefined,
              }}
            >
              <p
                className="text-5xl font-mono tabular-nums leading-none text-center"
                style={{
                  color: c > 0.15
                    ? `rgba(255,${Math.round(220 - c * 180)},${Math.round(200 - c * 200)},1)`
                    : "rgba(228,228,231,0.9)",
                  transition: "color 0.1s linear",
                  textShadow: c > 0.4 ? `0 0 ${Math.round(c * 32)}px rgba(180,30,30,${c * 0.5})` : "none",
                }}
              >
                {skill!.currentIteration.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mt-2 text-center">reps</p>
            </div>

            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={(e) => { e.preventDefault(); startHold(); }}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              disabled={repAdding}
              aria-label="Hold to log a rep"
              className="relative w-40 h-40 rounded-full flex items-center justify-center select-none disabled:opacity-40 focus-visible:outline-none"
              style={{
                border: `1px solid ${c > 0.05 ? `rgba(180,30,30,${0.25 + c * 0.6})` : "rgba(255,255,255,0.07)"}`,
                background: c > 0.05 ? `rgba(80,10,10,${c * 0.25})` : "rgba(0,0,0,0.3)",
                backdropFilter: "blur(8px)",
                transform: `scale(${buttonScale})`,
                boxShadow: c > 0.25 ? `0 0 ${Math.round(c * 50)}px rgba(140,20,20,${c * 0.3}) inset, 0 0 ${Math.round(c * 30)}px rgba(140,20,20,${c * 0.15})` : "none",
                transition: isHolding
                  ? "border-color 0.08s linear, background 0.08s linear, box-shadow 0.08s linear, transform 0.08s linear"
                  : "border-color 0.6s ease-in, background 0.6s ease-in, box-shadow 0.6s ease-in, transform 0.3s ease-out",
              }}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 120 120" aria-hidden>
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke={`rgba(180,30,30,${0.35 + c * 0.55})`}
                  strokeWidth={0.8 + c * 2.2}
                  strokeLinecap="butt"
                  strokeDasharray={`${2 * Math.PI * 54 * c} ${2 * Math.PI * 54}`}
                  style={{ transition: isHolding ? "none" : "stroke-dasharray 0.5s ease-in, stroke 0.5s ease-in" }}
                />
              </svg>

              <div className="flex flex-col items-center gap-1 pointer-events-none relative z-10">
                {repAdding ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-red-800 border-t-transparent animate-spin" />
                ) : charge >= 99 || forged ? (
                  <>
                    <span className="text-xl font-mono text-red-200/80 leading-none">+1</span>
                    <span className="text-[8px] font-mono text-red-900/60 uppercase tracking-widest">forged</span>
                  </>
                ) : isHolding ? (
                  <>
                    <span className="text-xl font-mono tabular-nums leading-none" style={{ color: `rgba(240,100,80,${0.5 + c * 0.5})` }}>
                      {Math.round(charge)}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: `rgba(180,60,50,${0.4 + c * 0.4})` }}>
                      charging
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-mono text-zinc-500 leading-none">+1</span>
                    <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">rep</span>
                  </>
                )}
              </div>
            </button>

            <p
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: `rgba(${c > 0.2 ? "160,60,50" : "63,63,70"},${1 - c * 0.5})`, transition: "color 0.1s linear" }}
            >
              {isHolding ? "release to cancel" : `Hold ${HOLD_DURATION / 1000}s to record`}
            </p>
          </div>

          <p
            className="text-center text-[10px] font-mono text-zinc-700 leading-relaxed pb-6"
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