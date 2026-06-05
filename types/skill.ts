// ─────────────────────────────────────────────────────────────────────────────
// DB row — mirrors the skills table columns exactly (snake_case)
// ─────────────────────────────────────────────────────────────────────────────

export type SkillRow = {
  id: string;
  user_id: string;
  name: string;
  current_iteration: number;
  target_goal: number;
  created_at: string;
  // reminder flags
  enable_weekly_reminder: boolean;
  enable_monthly_reminder: boolean;
  enable_quarterly_reminder: boolean;
  enable_yearly_reminder: boolean;
  // last review timestamps
  last_weekly_review_at: string | null;
  last_monthly_review_at: string | null;
  last_quarterly_review_at: string | null;
  last_yearly_review_at: string | null;
  // carry-forward
  carry_weekly_goal: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// App-layer type — camelCase, used everywhere outside lib/skill-storage.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Skill = {
  id: string;
  userId: string;
  name: string;
  currentIteration: number;
  targetGoal: number;
  created_at: string;
  // reminder flags
  enableWeeklyReminder: boolean;
  enableMonthlyReminder: boolean;
  enableQuarterlyReminder: boolean;
  enableYearlyReminder: boolean;
  // last review timestamps
  lastWeeklyReviewAt: string | null;
  lastMonthlyReviewAt: string | null;
  lastQuarterlyReviewAt: string | null;
  lastYearlyReviewAt: string | null;
  // carry-forward
  carryWeeklyGoal: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Review period
// ─────────────────────────────────────────────────────────────────────────────

export type ReviewPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

// ─────────────────────────────────────────────────────────────────────────────
// Conversion helper
// ─────────────────────────────────────────────────────────────────────────────

export function skillFromRow(row: SkillRow): Skill {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    currentIteration: row.current_iteration,
    targetGoal: row.target_goal,
    created_at: row.created_at,
    enableWeeklyReminder: row.enable_weekly_reminder ?? true,
    enableMonthlyReminder: row.enable_monthly_reminder ?? true,
    enableQuarterlyReminder: row.enable_quarterly_reminder ?? true,
    enableYearlyReminder: row.enable_yearly_reminder ?? true,
    lastWeeklyReviewAt: row.last_weekly_review_at ?? null,
    lastMonthlyReviewAt: row.last_monthly_review_at ?? null,
    lastQuarterlyReviewAt: row.last_quarterly_review_at ?? null,
    lastYearlyReviewAt: row.last_yearly_review_at ?? null,
    carryWeeklyGoal: row.carry_weekly_goal ?? false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Period boundary helpers
// All use local time so the review prompt matches the user's lived experience.
// ─────────────────────────────────────────────────────────────────────────────

function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day;
  return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function startOfCurrentQuarter(): Date {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
}

function startOfCurrentYear(): Date {
  return new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
}

function isBeforePeriodStart(ts: string | null, start: Date): boolean {
  if (!ts) return true;
  return new Date(ts) < start;
}

export function shouldShowReview(skill: Skill, period: ReviewPeriod): boolean {
  switch (period) {
    case "weekly":
      return (
        skill.enableWeeklyReminder &&
        isBeforePeriodStart(skill.lastWeeklyReviewAt, startOfCurrentWeek())
      );
    case "monthly":
      return (
        skill.enableMonthlyReminder &&
        isBeforePeriodStart(skill.lastMonthlyReviewAt, startOfCurrentMonth())
      );
    case "quarterly":
      return (
        skill.enableQuarterlyReminder &&
        isBeforePeriodStart(skill.lastQuarterlyReviewAt, startOfCurrentQuarter())
      );
    case "yearly":
      return (
        skill.enableYearlyReminder &&
        isBeforePeriodStart(skill.lastYearlyReviewAt, startOfCurrentYear())
      );
  }
}