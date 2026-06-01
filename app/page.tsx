"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createSkill } from "@/lib/skill-storage";

import { OnboardingForm } from "@/components/onboarding-form";
import { MusashiBackground } from "@/components/ui/musashi-background";
import { MAX_SKILLS, MIN_TARGET_GOAL } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not logged in
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // Existing user → dashboard
      if (profile) {
        router.push("/dashboard");
        return;
      }

      // New user → onboarding
      setUser(user);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  return (
    <MusashiBackground>
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8 sm:max-w-2xl sm:px-8 sm:py-12">

        <header className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-200/60">
            Onboarding
          </p>

          <div className="flex items-end justify-between border-b border-zinc-800/80 pb-5">
            <div>
              <h1 className="bg-gradient-to-r from-amber-100 via-zinc-100 to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Mu-sashi 10K
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                Up to {MAX_SKILLS} skills.{" "}
                {MIN_TARGET_GOAL.toLocaleString()}–10,000 reps each.
                Reflection every 10 reps.
              </p>
            </div>

            <span className="font-serif text-3xl text-amber-200/40 sm:text-4xl">
              無
            </span>
          </div>
        </header>

        <OnboardingForm
          onSubmit={async (payload) => {
            // 1. Create profile row
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                display_name: payload.displayName,
                username: payload.username,
                reps: 0,
                streak: 0,
                current_iteration: 0,
                target_goal: payload.targetGoal,
              });

            if (profileError) {
              console.error(profileError);
              alert(profileError.message);
              return;
            }

            // 2. Create first skill row
            const { error: skillError } = await createSkill({
              name: payload.skillName,
              targetGoal: payload.targetGoal,
            });

            if (skillError) {
              console.error(skillError);
              alert(skillError);
              return;
            }

            // 3. Both succeeded → enter the app
            router.push("/dashboard");
          }}
        />
      </section>
    </MusashiBackground>
  );
}
