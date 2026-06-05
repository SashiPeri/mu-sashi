export type PeriodGoals = {
  weekly: string;
  monthly: string;
  quarterly: string;
  yearly: string;
};

export type RepLogEntry = {
  id: string;
  skillId: string;
  note: string;
  created_at: string;
};

export type MasterySkillEntry = {
  id: string;
  name: string;
  targetGoal: number;
  currentIteration: number;
  periodGoals: PeriodGoals;
  created_at: string;
};

export type UserProfile = {
  displayName: string;
  username: string;
  activeSkillId: string;
  skills: MasterySkillEntry[];
  repLogs: RepLogEntry[];
  streakDays: number;
  updatedAt: string;
};

export const EMPTY_PERIOD_GOALS: PeriodGoals = {
  weekly: "",
  monthly: "",
  quarterly: "",
  yearly: "",
};

export function createSkillId(): string {
  return `skill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createRepLogId(): string {
  return `rep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
