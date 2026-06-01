import { supabase } from "@/lib/supabase";
import { skillFromRow, type Skill, type SkillRow } from "@/types/skill";

export async function loadSkills(): Promise<{
  skills: Skill[];
  error: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { skills: [], error: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { skills: [], error: error.message };
  }

  return {
    skills: (data as SkillRow[]).map(skillFromRow),
    error: null,
  };
}

export async function createSkill(payload: {
  name: string;
  targetGoal: number;
}): Promise<{ skill: Skill | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { skill: null, error: "Not authenticated." };
  }

  const name = payload.name.trim();
  if (!name) {
    return { skill: null, error: "Skill name is required." };
  }

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

  if (error) {
    return { skill: null, error: error.message };
  }

  return { skill: skillFromRow(data as SkillRow), error: null };
}