import { DEFAULT_ONBOARDING_DATA, type OnboardingData } from "@/types/onboarding";
const STORAGE_KEY = "mu_sashi_onboarding_v1";

function parseStoredData(raw: string): OnboardingData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingData>;
    if (
      typeof parsed.userName !== "string" ||
      typeof parsed.masterySkill !== "string" ||
      typeof parsed.targetGoal !== "number" ||
      typeof parsed.currentIteration !== "number" ||
      typeof parsed.streakDays !== "number" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    return {
      userName: parsed.userName,
      masterySkill: parsed.masterySkill as OnboardingData["masterySkill"],
      targetGoal: parsed.targetGoal,
      currentIteration: parsed.currentIteration,
      streakDays: parsed.streakDays,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function loadOnboardingData(): OnboardingData {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_DATA;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_ONBOARDING_DATA;
  const parsed = parseStoredData(raw);
  return parsed ?? DEFAULT_ONBOARDING_DATA;
}

export function saveOnboardingData(
  payload: Pick<OnboardingData, "userName" | "masterySkill" | "targetGoal">
): OnboardingData {
  const completeData: OnboardingData = {
    ...DEFAULT_ONBOARDING_DATA,
    ...payload,
    targetGoal: Math.max(1, Math.floor(payload.targetGoal)),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completeData));
  }

  return completeData;
}
