"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadSkills } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";
import GoalsModal from "@/components/goals-modal";

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

  const [showGoals, setShowGoals] = useState(false);

  // HOLD STATE
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------
  // LOAD SKILL
  // -------------------------
  const refreshSkill = async () => {
    const { skills } = await loadSkills();
    const found = skills.find((s) => s.id === id);

    if (found) setSkill(found);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

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
  // SOUND
  // -------------------------
  const playSuccessSound = () => {
    const audio = new Audio("/sounds/rep-success.mp3");
    audio.volume = 0.6;
    audio.play();
  };

  // -------------------------
  // CORE REP LOGIC
  // -------------------------
  const triggerRep = async () => {
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

      playSuccessSound();
    }

    setUpdating(false);
    setHolding(false);
    setHoldProgress(0);
  };

  // -------------------------
  // HOLD HANDLERS
  // -------------------------
  const startHold = () => {
    if (updating) return;

    setHolding(true);
    setHoldProgress(0);

    const start = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / 1200, 1);

      setHoldProgress(progress);

      if (progress >= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        triggerRep();
      }
    }, 50);
  };

  const endHold = () => {
    setHolding(false);
    setHoldProgress(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

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

  const ring = 251; // circle circumference

  // -------------------------
  // UI
  // -------------------------
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-10">

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
            <p className="text-xs uppercase text-zinc-500">Skill</p>
            <h1 className="text-2xl font-bold">{skill.name}</h1>
          </div>

          <button
            onClick={() => setShowGoals(true)}
            className="border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:border-zinc-500 transition"
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

          <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* BIG REP BUTTON */}
        <div className="flex justify-center pt-6">
          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            disabled={updating}
            className="relative w-32 h-32 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center"
          >
            {/* RING */}
            <svg className="absolute w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="40"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="40"
                stroke="black"
                strokeWidth="6"
                fill="none"
                strokeDasharray={ring}
                strokeDashoffset={ring - holdProgress * ring}
              />
            </svg>

            <span className="z-10 text-xs">
              {holding ? "Stay locked in" : "+ REP"}
            </span>
          </button>
        </div>

        {/* MICRO TEXT */}
        <p className="text-center text-xs text-zinc-500">
          Hold 3 seconds = one execution of your process
        </p>

      </div>

      {/* GOALS MODAL */}
      <GoalsModal
        skill={skill}
        open={showGoals}
        onClose={() => setShowGoals(false)}
      />
    </main>
  );
}