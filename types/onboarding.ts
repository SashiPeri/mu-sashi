export type MasterySkill = "writing" | "coding" | "fitness" | "music";

export type OnboardingData = {
  userName: string;
  masterySkill: MasterySkill;
  targetGoal: number;
  currentIteration: number;
  streakDays: number;
  updatedAt: string;
};

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  userName: "",
  masterySkill: "writing",
  targetGoal: 10000,
  currentIteration: 0,
  streakDays: 0,
  updatedAt: new Date(0).toISOString(),
};
