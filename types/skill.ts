export type SkillRow = {
  id: string;
  user_id: string;
  name: string;
  current_iteration: number;
  target_goal: number;
  created_at: string;

  // Legacy numeric goals (keep for backwards compatibility)
  weekly_goal?: number | null;
  monthly_goal?: number | null;
  quarterly_goal?: number | null;
  yearly_goal?: number | null;

  // Narrative goals
  weekly_goal_text?: string | null;
  monthly_goal_text?: string | null;
  quarterly_goal_text?: string | null;
  yearly_goal_text?: string | null;

  // Weekly review system
  weekly_review?: string | null;
  carry_weekly_goal?: boolean | null;
  last_review_date?: string | null;
};

export type Skill = {
  id: string;
  userId: string;
  name: string;
  currentIteration: number;
  targetGoal: number;
  createdAt: string;

  // Legacy numeric goals
  weeklyGoal?: number;
  monthlyGoal?: number;
  quarterlyGoal?: number;
  yearlyGoal?: number;

  // Narrative goals
  weeklyGoalText?: string;
  monthlyGoalText?: string;
  quarterlyGoalText?: string;
  yearlyGoalText?: string;

  // Weekly review system
  weeklyReview?: string;
  carryWeeklyGoal?: boolean;
  lastReviewDate?: string;
};

export function skillFromRow(row: SkillRow): Skill {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    currentIteration: row.current_iteration,
    targetGoal: row.target_goal,
    createdAt: row.created_at,

    // Legacy numeric goals
    weeklyGoal: row.weekly_goal ?? 0,
    monthlyGoal: row.monthly_goal ?? 0,
    quarterlyGoal: row.quarterly_goal ?? 0,
    yearlyGoal: row.yearly_goal ?? 0,

    // Narrative goals
    weeklyGoalText: row.weekly_goal_text ?? "",
    monthlyGoalText: row.monthly_goal_text ?? "",
    quarterlyGoalText: row.quarterly_goal_text ?? "",
    yearlyGoalText: row.yearly_goal_text ?? "",

    // Weekly review system
    weeklyReview: row.weekly_review ?? "",
    carryWeeklyGoal: row.carry_weekly_goal ?? true,
    lastReviewDate: row.last_review_date ?? "",
  };
}

export function skillToRow(skill: Skill): Partial<SkillRow> {
  return {
    id: skill.id,
    user_id: skill.userId,
    name: skill.name,
    current_iteration: skill.currentIteration,
    target_goal: skill.targetGoal,
    created_at: skill.createdAt,

    weekly_goal: skill.weeklyGoal,
    monthly_goal: skill.monthlyGoal,
    quarterly_goal: skill.quarterlyGoal,
    yearly_goal: skill.yearlyGoal,

    weekly_goal_text: skill.weeklyGoalText,
    monthly_goal_text: skill.monthlyGoalText,
    quarterly_goal_text: skill.quarterlyGoalText,
    yearly_goal_text: skill.yearlyGoalText,

    weekly_review: skill.weeklyReview,
    carry_weekly_goal: skill.carryWeeklyGoal,
    last_review_date: skill.lastReviewDate,
  };
}