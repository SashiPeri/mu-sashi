  "use client";

  import { useMemo, useState } from "react";

  import { PremiumButton } from "@/components/ui/premium-button";
  import { PremiumField } from "@/components/ui/premium-field";
  import {
    MAX_SKILLS,
    MAX_TARGET_GOAL,
    MIN_TARGET_GOAL,
    REPS_TO_UNLOCK_NEW_SKILL,
  } from "@/lib/constants";
  import { isValidTargetGoal } from "@/lib/mastery-rules";
  import type { OnboardingPayload } from "@/lib/user-storage";
  import { EMPTY_PERIOD_GOALS, type PeriodGoals } from "@/types/mastery";

  type OnboardingFormProps = {
    onSubmit: (payload: OnboardingPayload) => void;
  };

  export function OnboardingForm({ onSubmit }: OnboardingFormProps) {
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [skillName, setSkillName] = useState("");
    const [targetGoal, setTargetGoal] = useState(String(MAX_TARGET_GOAL));
    const [showPeriodGoals, setShowPeriodGoals] = useState(false);
    const [periodGoals, setPeriodGoals] = useState<PeriodGoals>({ ...EMPTY_PERIOD_GOALS });
    const [error, setError] = useState<string | null>(null);

    const goalNumber = Number(targetGoal);
    const goalValid = isValidTargetGoal(goalNumber);

    const goalLabel = useMemo(() => {
      if (!goalValid) return `Choose between ${MIN_TARGET_GOAL.toLocaleString()} and ${MAX_TARGET_GOAL.toLocaleString()} reps`;
      return `${goalNumber.toLocaleString()} deliberate reps toward mastery`;
    }, [goalNumber, goalValid]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!displayName.trim()) {
        setError("Your name is required.");
        return;
      }
      if (!username.trim()) {
        setError("Choose a username — something memorable and a little quirky.");
        return;
      }
      if (!skillName.trim()) {
        setError("Name the skill you are mastering.");
        return;
      }
      if (!goalValid) {
        setError(`Mastery goal must be between ${MIN_TARGET_GOAL.toLocaleString()} and ${MAX_TARGET_GOAL.toLocaleString()}.`);
        return;
      }

      onSubmit({
        displayName: displayName.trim(),
        username: username.trim(),
        skillName: skillName.trim(),
        targetGoal: goalNumber,
        periodGoals,
      });
    };

    const updatePeriodGoal = (key: keyof PeriodGoals, value: string) => {
      setPeriodGoals((prev) => ({ ...prev, [key]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col gap-7">
        <PremiumField id="display-name" label="Name" hint="How we greet you on the path.">
          <input
            id="display-name"
            required
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
            placeholder="Sashi"
          />
        </PremiumField>

        <PremiumField
          id="username"
          label="Username"
          hint="Your dojo handle — playful, sharp, unmistakably yours."
        >
          <input
            id="username"
            required
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value
                  .toLowerCase()
                  .replace(/\s+/g, "")
              )
            }
            className="w-full bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
            placeholder="e.g. inkedronin, midnightkata"
          />
        </PremiumField>

        <PremiumField
          id="skill-name"
          label="Define your mastery skill"
          hint={`Up to ${MAX_SKILLS} skills total. Unlock another after ${REPS_TO_UNLOCK_NEW_SKILL.toLocaleString()} reps on any skill.`}
        >
          <input
            id="skill-name"
            required
            type="text"
            value={skillName}
            onChange={(event) => setSkillName(event.target.value)}
            className="w-full bg-transparent text-lg font-medium text-zinc-100 outline-none placeholder:text-zinc-600"
            placeholder="e.g. Kendo footwork, Rust systems design, brush lettering"
          />
        </PremiumField>

        {skillName.trim() ? (
          <section className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4">
            <button
              type="button"
              onClick={() => setShowPeriodGoals((open) => !open)}
              className="flex w-full items-center justify-between text-left text-sm text-zinc-300"
            >
              <span>Optional cadence goals</span>
              <span className="text-xs text-zinc-500">{showPeriodGoals ? "Hide" : "Add weekly → yearly"}</span>
            </button>
            {showPeriodGoals ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["weekly", "monthly", "quarterly", "yearly"] as const).map((period) => (
                  <label key={period} className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500">{period}</span>
                    <input
                      type="text"
                      value={periodGoals[period]}
                      onChange={(event) => updatePeriodGoal(period, event.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-300/40"
                      placeholder={`${period} intention`}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <PremiumField id="target-goal" label="Set mastery goal" hint={goalLabel}>
          <div className="space-y-3">
            <input
              id="target-goal"
              required
              type="range"
              min={MIN_TARGET_GOAL}
              max={MAX_TARGET_GOAL}
              step={100}
              value={goalValid ? goalNumber : MAX_TARGET_GOAL}
              onChange={(event) => setTargetGoal(event.target.value)}
              className="w-full accent-amber-200"
            />
            <input
              type="number"
              min={MIN_TARGET_GOAL}
              max={MAX_TARGET_GOAL}
              step={100}
              value={targetGoal}
              onChange={(event) => setTargetGoal(event.target.value)}
              className="w-full bg-transparent text-3xl font-semibold tracking-tight text-amber-50 outline-none"
            />
          </div>
        </PremiumField>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <footer className="pt-1">
          <PremiumButton type="submit" className="!w-full">
            Begin the path
          </PremiumButton>
        </footer>
      </form>
    );
  }
