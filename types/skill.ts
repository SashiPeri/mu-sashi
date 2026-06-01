export type SkillRow = {
    id: string;
    user_id: string;
    name: string;
    current_iteration: number;
    target_goal: number;
    created_at: string;
  };
  
  export type Skill = {
    id: string;
    userId: string;
    name: string;
    currentIteration: number;
    targetGoal: number;
    createdAt: string;
  };
  
  export function skillFromRow(row: SkillRow): Skill {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      currentIteration: row.current_iteration,
      targetGoal: row.target_goal,
      createdAt: row.created_at,
    };
  }