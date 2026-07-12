import { EXAMPLE_USER_TYPES, getUserType } from "@/constants/exampleUserTypes";
import { isBeginnerMode } from "@/constants/onboardingUserStates";

export function resolveDefaultUserType(opts: { founder?: boolean } = {}): string {
  if (opts.founder) return "FOUNDER_USER";
  if (typeof window !== "undefined" && isBeginnerMode()) return "BEGINNER_USER";
  return "DEEP_MODE_USER";
}

export { EXAMPLE_USER_TYPES, getUserType };
