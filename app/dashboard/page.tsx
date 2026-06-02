"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/dashboard/stat-card";
import { loadSkills } from "@/lib/skill-storage";
import type { Skill } from "@/types/skill";

function ProgressBar({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-sm text-gray-400">
          <span>{label}</span>
          <span className="font-mono">{Math.round(progress * 100)}%</span>
        </div>
      )}
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 1. Get logged-in user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Fetch profile — dashboard only reads, never creates
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // 3. No profile means onboarding was never completed → send them back
      if (!profile) {
        router.push("/");
        return;
      }

      // 4. Fetch skills
      const { skills: userSkills } = await loadSkills();
      setSkills(userSkills);

      setData(profile);
      setLoading(false);
    };

    init();
  }, [router]);

  // SAFE FALLBACKS (never crash UI)
  const displayName = data?.display_name ?? "Welcome";
  const username = data?.username ?? "user";

  const current_iteration = data?.current_iteration ?? 0;
  const target_goal = data?.target_goal ?? 1;
  const reps = data?.reps ?? 0;
  const streak = data?.streak ?? 0;

  const progress = target_goal > 0 ? current_iteration / target_goal : 0;
  const clampedProgress = Math.min(progress, 1);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-10 space-y-8">

        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-gray-400 font-mono">@{username}</p>
        </div>

        {/* PROGRESS */}
        <ProgressBar
          progress={clampedProgress}
          label={`Progress: ${current_iteration} / ${target_goal}`}
        />

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Reps" value={reps} hint="Total reps" />
          <StatCard label="Streak" value={streak} hint="Day streak" />
        </div>

        {/* SKILLS */}
        {skills.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide text-zinc-500">Skills</h2>
              <button className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1 hover:border-zinc-500 hover:text-zinc-200 transition-colors">+ Add Skill</button>
            </div>
            <div className="space-y-3">
              {skills.map((skill) => {
                const pct = skill.targetGoal > 0
                  ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
                  : 0;
                return (
                  <article
                    key={skill.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-100">{skill.name}</p>
                      <p className="text-sm text-zinc-400 font-mono">{pct}%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">
                      {skill.currentIteration.toLocaleString()} / {skill.targetGoal.toLocaleString()} reps
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}