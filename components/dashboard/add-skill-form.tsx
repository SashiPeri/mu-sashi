"use client";

import { useState } from "react";

import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumField } from "@/components/ui/premium-field";
import { MAX_TARGET_GOAL, MIN_TARGET_GOAL } from "@/lib/constants";
import { isValidTargetGoal } from "@/lib/mastery-rules";
import { addSkill } from "@/lib/user-storage";
import { EMPTY_PERIOD_GOALS } from "@/types/mastery";

type AddSkillFormProps = {
  onAdded: () => void;
};

export function AddSkillForm({ onAdded }: AddSkillFormProps) {
  const [name, setName] = useState("");
  const [targetGoal, setTargetGoal] = useState(String(MAX_TARGET_GOAL));
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const goal = Number(targetGoal);
    if (!name.trim()) {
      setError("Name your new skill.");
      return;
    }
    if (!isValidTargetGoal(goal)) {
      setError(`Goal must be ${MIN_TARGET_GOAL.toLocaleString()}–${MAX_TARGET_GOAL.toLocaleString()}.`);
      return;
    }

    const result = addSkill({ name, targetGoal: goal, periodGoals: { ...EMPTY_PERIOD_GOALS } });
    if (result.error) {
      setError(result.error);
      return;
    }

    setName("");
    setError(null);
    onAdded();
  };

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4 space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Add another mastery skill</h3>
      <PremiumField id="new-skill" label="Skill name">
        <input
          id="new-skill"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full bg-transparent text-sm text-zinc-100 outline-none"
          placeholder="New discipline"
        />
      </PremiumField>
      <PremiumField id="new-goal" label="Target reps">
        <input
          id="new-goal"
          type="number"
          min={MIN_TARGET_GOAL}
          max={MAX_TARGET_GOAL}
          value={targetGoal}
          onChange={(event) => setTargetGoal(event.target.value)}
          className="w-full bg-transparent text-xl font-semibold text-zinc-100 outline-none"
        />
      </PremiumField>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <PremiumButton onClick={handleAdd}>Unlock next skill slot</PremiumButton>
    </section>
  );
}
