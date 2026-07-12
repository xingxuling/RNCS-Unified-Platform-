import type { VersionLeapLevel } from "./versionLeapLevels";

export interface SemverBumpRule {
  level: VersionLeapLevel;
  bump: "patch" | "minor" | "major" | "leap-tag" | "generation";
  description: string;
}

export const VERSION_SEMVER_RULES: SemverBumpRule[] = [
  { level: "PATCH",      bump: "patch",      description: "vX.Y.Z → vX.Y.(Z+1)" },
  { level: "MINOR",      bump: "minor",      description: "vX.Y.Z → vX.(Y+1).0" },
  { level: "MAJOR",      bump: "major",      description: "vX.Y.Z → v(X+1).0.0" },
  { level: "LEAP",       bump: "leap-tag",   description: "v(X+1).0.0-leap.N 或 vNext RC" },
  { level: "GENERATION", bump: "generation", description: "v(X+1).0.0 Generation / vNext" },
];

export function ruleForLevel(level: VersionLeapLevel): SemverBumpRule {
  return VERSION_SEMVER_RULES.find((r) => r.level === level)!;
}
