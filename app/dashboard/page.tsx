"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/dashboard/stat-card";
import { loadSkills, createSkill } from "@/lib/skill-storage";
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

  // Add skill form state
  const [showForm, setShowForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newTargetGoal, setNewTargetGoal] = useState("10000");

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/");
        return;
      }

      const { skills: userSkills } = await loadSkills();
      setSkills(userSkills);

      setData(profile);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleCreate = async () => {
    const { skill, error } = await createSkill({
      name: newSkillName,
      targetGoal: Number(newTargetGoal),
    });
    if (error || !skill) {
      alert(error);
      return;
    }
    const { skills: freshSkills } = await loadSkills();
    setSkills(freshSkills);
    setNewSkillName("");
    setNewTargetGoal("10000");
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setNewSkillName("");
    setNewTargetGoal("10000");
  };

  // SAFE FALLBACKS
  const displayName = data?.display_name ?? "Welcome";
  const username = data?.username ?? "user";
  const current_iteration = data?.current_iteration ?? 0;
  const target_goal = data?.target_goal ?? 1;
  const reps = data?.reps ?? 0;
  const streak = data?.streak ?? 0;
  const progress = target_goal > 0 ? current_iteration / target_goal : 0;
  const clampedProgress = Math.min(progress, 1);
  const maxAllowedSkills = 3 + skills.filter(s => s.currentIteration >= 6000).length;

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

            {/* SECTION HEADER */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-wide text-zinc-500">Skills</h2>
              {skills.length < maxAllowedSkills ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  + Add Skill
                </button>
              ) : (
                <p className="text-xs text-zinc-500">
                  Skill limit reached. Reach 6000 reps on a skill to unlock another slot.
                </p>
              )}
            </div>

            {/* ADD SKILL FORM */}
            {showForm && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. Chess endgames"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Target Goal
                  </label>
                  <input
                    type="number"
                    value={newTargetGoal}
                    onChange={(e) => setNewTargetGoal(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreate} className="flex-1 bg-zinc-100 text-zinc-900 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white transition-colors">
                    Create
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg px-3 py-2 text-sm hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SKILL CARDS */}
            <div className="space-y-3">
              {skills.map((skill) => {
                const pct = skill.targetGoal > 0
                  ? Math.min(100, Math.round((skill.currentIteration / skill.targetGoal) * 100))
                  : 0;
                return (
                  <Link key={skill.id} href={`/skills/${skill.id}`}>
                  <article
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3 cursor-pointer hover:border-zinc-600 transition-colors"
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
                  </Link>
                );
              })}
            </div>

          </section>
        )}

      </div>
    </main>
  );
}