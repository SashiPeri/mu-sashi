"use client";

import { useMemo, useState } from "react";

import { PremiumButton } from "@/components/ui/premium-button";
import { PremiumField } from "@/components/ui/premium-field";
import { nextRepRequiresVerbalization } from "@/lib/mastery-rules";
import { logRep } from "@/lib/user-storage";
import type { MasterySkillEntry } from "@/types/mastery";

type LogRepPanelProps = {
  skill: MasterySkillEntry;
  onLogged: () => void;
};

export function LogRepPanel({ skill, onLogged }: LogRepPanelProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresReflection = useMemo(
    () => nextRepRequiresVerbalization(skill.currentIteration),
    [skill.currentIteration]
  );

  const nextRepNumber = skill.currentIteration + 1;

  const handleLogRep = () => {
    setError(null);
    setIsSubmitting(true);

    const result = logRep({ skillId: skill.id, note });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNote("");
    onLogged();
  };

  return (
    <section className="rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-amber-200/80">Log a rep</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Next rep: #{nextRepNumber.toLocaleString()}
            {requiresReflection ? " · reflection required" : " · reflection optional"}
          </p>
        </div>
        <span className="text-xl text-zinc-600">記</span>
      </div>

      <div className="mt-4">
        <PremiumField
          id="verbalize"
          label={requiresReflection ? "Verbalize your experience (required)" : "Verbalize your experience (optional)"}
          hint={
            requiresReflection
              ? `Every 10 reps you must reflect. Rep ${nextRepNumber} needs your words.`
              : "Capture what you practiced, felt, or learned."
          }
        >
          <textarea
            id="verbalize"
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required={requiresReflection}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600"
            placeholder="What did you do in this iteration?"
          />
        </PremiumField>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4">
        <PremiumButton onClick={handleLogRep} disabled={isSubmitting} className="!w-full">
          {isSubmitting ? "Recording…" : "Record rep"}
        </PremiumButton>
      </div>
    </section>
  );
}
