"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/dashboard/stat-card";

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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 1. Get logged-in user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setData(null);
        setLoading(false);
        return;
      }

      // 2. Fetch profile
      let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // 3. If profile does NOT exist → create it
      if (!profile) {
        const baseUsername =
          user.email?.split("@")[0]?.toLowerCase() ?? "user";

        const newProfile = {
          id: user.id,
          display_name: user.email?.split("@")[0] ?? "User",
          username: baseUsername,
          current_iteration: 0,
          target_goal: 1,
          reps: 0,
          streak: 0,
        };

        const { data: inserted } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        profile = inserted;
      }

      setData(profile);
      setLoading(false);
    };

    init();
  }, []);

  // SAFE FALLBACKS (never crash UI)
  const displayName = data?.display_name ?? "Welcome";
  const username = data?.username ?? "user";

  const current_iteration = data?.current_iteration ?? 0;
  const target_goal = data?.target_goal ?? 1;
  const reps = data?.reps ?? 0;
  const streak = data?.streak ?? 0;

  const progress =
    target_goal > 0 ? current_iteration / target_goal : 0;

  const clampedProgress = Math.min(progress, 1);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
      <div className="bg-gray-900/90 rounded-xl p-8 shadow-xl space-y-8 w-full max-w-md">

        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {displayName}
          </h1>
          <p className="text-gray-400 font-mono">
            @{username}
          </p>
        </div>

        {/* PROGRESS */}
        <ProgressBar
          progress={clampedProgress}
          label={`Progress: ${current_iteration} / ${target_goal}`}
        />

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard label="Reps" value={reps} hint="Total reps" />
          <StatCard label="Streak" value={streak} hint="Day streak" />
        </div>
      </div>
    </main>
  );
}