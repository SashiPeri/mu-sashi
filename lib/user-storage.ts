import { canAddAnotherSkill, clampTargetGoal } from "@/lib/mastery-rules";
import {
  createRepLogId,
  createSkillId,
  EMPTY_PERIOD_GOALS,
  type MasterySkillEntry,
  type PeriodGoals,
  type RepLogEntry,
  type UserProfile,
} from "@/types/mastery";

const STORAGE_KEY = "mu_sashi_profile_v2";
const LEGACY_KEY = "mu_sashi_onboarding_v1";

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  username: "",
  activeSkillId: "",
  skills: [],
  repLogs: [],
  streakDays: 0,
  updatedAt: new Date(0).toISOString(),
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseProfile(raw: string): UserProfile | null {
  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;

    if (
      typeof parsed.displayName !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.activeSkillId !== "string" ||
      !Array.isArray(parsed.skills) ||
      !Array.isArray(parsed.repLogs) ||
      typeof parsed.streakDays !== "number" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return parsed as UserProfile;
  } catch {
    return null;
  }
}

function persistProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

// ─────────────────────────────────────────────
// Legacy migration
// ─────────────────────────────────────────────

function migrateLegacyProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;

  try {
    const legacy = JSON.parse(raw) as {
      userName?: string;
      masterySkill?: string;
      targetGoal?: number;
      currentIteration?: number;
      streakDays?: number;
    };

    const skillName =
      legacy.masterySkill === "writing"
        ? "Writing"
        : legacy.masterySkill === "coding"
        ? "Coding"
        : legacy.masterySkill === "fitness"
        ? "Fitness"
        : legacy.masterySkill === "music"
        ? "Music"
        : "Mastery";

    const skillId = createSkillId();

    const profile: UserProfile = {
      displayName: legacy.userName ?? "",
      username: "",
      activeSkillId: skillId,
      skills: [
        {
          id: skillId,
          name: skillName,
          targetGoal: clampTargetGoal(legacy.targetGoal ?? 10000),
          currentIteration: legacy.currentIteration ?? 0,
          periodGoals: { ...EMPTY_PERIOD_GOALS },
          created_at: new Date().toISOString(),
        },
      ],
      repLogs: [],
      streakDays: legacy.streakDays ?? 0,
      updatedAt: new Date().toISOString(),
    };

    persistProfile(profile);
    window.localStorage.removeItem(LEGACY_KEY);

    return profile;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Core API
// ─────────────────────────────────────────────

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return migrateLegacyProfile() ?? DEFAULT_PROFILE;
  }

  return parseProfile(raw) ?? DEFAULT_PROFILE;
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  const next: UserProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  persistProfile(next);
  return next;
}

// ─────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────

export type OnboardingPayload = {
  displayName: string;
  username: string;
  skillName: string;
  targetGoal: number;
  periodGoals: PeriodGoals;
};

export function completeOnboarding(payload: OnboardingPayload): UserProfile {
  const skillId = createSkillId();

  const newSkill: MasterySkillEntry = {
    id: skillId,
    name: payload.skillName.trim(),
    targetGoal: clampTargetGoal(payload.targetGoal),
    currentIteration: 0,
    periodGoals: payload.periodGoals,
    created_at: new Date().toISOString(),
  };

  const profile: UserProfile = {
    displayName: payload.displayName.trim(),
    username: payload.username.trim(),
    activeSkillId: skillId,
    skills: [newSkill],
    repLogs: [],
    streakDays: 0,
    updatedAt: new Date().toISOString(),
  };

  return saveUserProfile(profile);
}

// ─────────────────────────────────────────────
// Reps
// ─────────────────────────────────────────────

export function logRep(params: {
  skillId: string;
  note: string;
}): { profile: UserProfile; error?: string } {
  const profile = loadUserProfile();

  const skill = profile.skills.find((s) => s.id === params.skillId);
  if (!skill) {
    return { profile, error: "Skill not found." };
  }

  const note = params.note.trim();
  const requiresReflection = (skill.currentIteration + 1) % 10 === 0;

  if (requiresReflection && !note) {
    return {
      profile,
      error: `Rep ${skill.currentIteration + 1} requires reflection.`,
    };
  }

  const updatedSkills = profile.skills.map((s) =>
    s.id === skill.id
      ? { ...s, currentIteration: s.currentIteration + 1 }
      : s
  );

  const logs = [...profile.repLogs];

  if (note) {
    logs.unshift({
      id: createRepLogId(),
      skillId: skill.id,
      note,
      created_at: new Date().toISOString(),
    });
  }

  const updated = saveUserProfile({
    ...profile,
    skills: updatedSkills,
    repLogs: logs.slice(0, 200),
    activeSkillId: skill.id,
  });

  return { profile: updated };
}

// ─────────────────────────────────────────────
// Skills
// ─────────────────────────────────────────────

export function addSkill(payload: {
  name: string;
  targetGoal: number;
  periodGoals: PeriodGoals;
}): { profile: UserProfile; error?: string } {
  const profile = loadUserProfile();

  if (profile.skills.length >= 6) {
    return { profile, error: "Maximum of 6 mastery skills reached." };
  }

  if (profile.skills.length > 0 && !canAddAnotherSkill(profile.skills)) {
    return {
      profile,
      error: "Reach 6,000 reps on any skill to unlock next slot.",
    };
  }

  const skillId = createSkillId();

  const newSkill: MasterySkillEntry = {
    id: skillId,
    name: payload.name.trim(),
    targetGoal: clampTargetGoal(payload.targetGoal),
    currentIteration: 0,
    periodGoals: payload.periodGoals,
    created_at: new Date().toISOString(),
  };

  const updated = saveUserProfile({
    ...profile,
    skills: [...profile.skills, newSkill],
    activeSkillId: skillId,
  });

  return { profile: updated };
}

export function setActiveSkill(skillId: string): UserProfile {
  const profile = loadUserProfile();

  if (!profile.skills.some((s) => s.id === skillId)) {
    return profile;
  }

  return saveUserProfile({
    ...profile,
    activeSkillId: skillId,
  });
}