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

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { skills } = await loadSkills();
      const found = skills.find(s => s.id === id) ?? null;

      if (!found) {
        router.push("/dashboard");
        return;
      }

      setSkill(found);
      setLoading(false);
    };

    init();
  }, [id, router]);

  const pct = skill && skill.targetGoal > 0
    ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
    : 0;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-8">

        {/* BACK */}
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to dashboard
        </button>

        {/* SKILL NAME */}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Skill</p>
          <h1 className="text-2xl font-bold text-zinc-100">{skill!.name}</h1>
        </div>

        {/* PROGRESS BAR */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span className="font-mono">
              {skill!.currentIteration.toLocaleString()} / {skill!.targetGoal.toLocaleString()} reps
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Current Reps</p>
            <p className="text-2xl font-bold text-zinc-100">
              {skill!.currentIteration.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Target Goal</p>
            <p className="text-2xl font-bold text-zinc-100">
              {skill!.targetGoal.toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}