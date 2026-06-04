import { supabase } from "@/lib/supabase";
import { skillFromRow, type Skill, type SkillRow, type ReviewPeriod } from "@/types/skill";

// ─────────────────────────────────────────────────────────────────────────────
// loadSkills
// ─────────────────────────────────────────────────────────────────────────────

export async function loadSkills(): Promise<{
  skills: Skill[];
  error: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { skills: [], error: "Not authenticated." };

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return { skills: [], error: error.message };

  return {
    skills: (data as SkillRow[]).map(skillFromRow),
    error: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createSkill
// ─────────────────────────────────────────────────────────────────────────────

export async function createSkill(payload: {
  name: string;
  targetGoal: number;
}): Promise<{ skill: Skill | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { skill: null, error: "Not authenticated." };

  const name = payload.name.trim();
  if (!name) return { skill: null, error: "Skill name is required." };

  const { data, error } = await supabase
    .from("skills")
    .insert({
      user_id: user.id,
      name,
      target_goal: payload.targetGoal,
      current_iteration: 0,
    })
    .select()
    .single();

  if (error) return { skill: null, error: error.message };

  return { skill: skillFromRow(data as SkillRow), error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveReview
// Inserts into skill_reviews and updates last_*_review_at on skills.
// For weekly reviews also persists carry_weekly_goal.
// ─────────────────────────────────────────────────────────────────────────────

export async function saveReview(payload: {
  skillId: string;
  period: ReviewPeriod;
  review: string;
  carryWeeklyGoal?: boolean;
}): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const now = new Date().toISOString();
  const lastCol = `last_${payload.period}_review_at` as const;

  // 1. Insert the review row
  const { error: insertError } = await supabase
    .from("skill_reviews")
    .insert({
      skill_id: payload.skillId,
      user_id: user.id,
      period: payload.period,
      review: payload.review.trim(),
    });

  if (insertError) return { error: insertError.message };

  // 2. Update timestamp (+ carry_weekly_goal if weekly)
  const skillUpdate: Record<string, unknown> = { [lastCol]: now };
  if (payload.period === "weekly" && payload.carryWeeklyGoal !== undefined) {
    skillUpdate.carry_weekly_goal = payload.carryWeeklyGoal;
  }

  const { error: updateError } = await supabase
    .from("skills")
    .update(skillUpdate)
    .eq("id", payload.skillId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  return { error: null };
}