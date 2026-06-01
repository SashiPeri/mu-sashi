import {
  MAX_SKILLS,
  MAX_TARGET_GOAL,
  MIN_TARGET_GOAL,
  REPS_TO_UNLOCK_NEW_SKILL,
  VERBALIZE_EVERY_N_REPS,
} from "@/lib/constants";
import type { MasterySkillEntry, UserProfile } from "@/types/mastery";

export function clampTargetGoal(value: number): number {
  return Math.min(MAX_TARGET_GOAL, Math.max(MIN_TARGET_GOAL, Math.floor(value)));
}

export function isValidTargetGoal(value: number): boolean {
  return Number.isFinite(value) && value >= MIN_TARGET_GOAL && value <= MAX_TARGET_GOAL;
}

export function canAddAnotherSkill(skills: MasterySkillEntry[]): boolean {
  if (skills.length >= MAX_SKILLS) return false;
  if (skills.length === 0) return true;
  return skills.some((skill) => skill.currentIteration >= REPS_TO_UNLOCK_NEW_SKILL);
}

export function getActiveSkill(profile: UserProfile): MasterySkillEntry | null {
  return profile.skills.find((skill) => skill.id === profile.activeSkillId) ?? profile.skills[0] ?? null;
}

export function nextRepRequiresVerbalization(currentIteration: number): boolean {
  const nextRep = currentIteration + 1;
  return nextRep > 0 && nextRep % VERBALIZE_EVERY_N_REPS === 0;
}

export function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
