import type { VersionLeapLevel } from "@/constants/version-leap/versionLeapLevels";
import { ruleForLevel } from "@/constants/version-leap/versionSemverRules";
import type { VersionClassification } from "./versionTypeClassifier";

export interface VersionNumberSuggestion {
  currentVersion: string;
  suggestedVersion: string;
  alternativeVersions: string[];
  reason: string;
  releaseName?: string;
}

const RELEASE_NAMES: Record<VersionLeapLevel, string[]> = {
  PATCH: ["Stabilization Patch", "Maintenance Patch"],
  MINOR: ["Interface Stabilization Release", "Quick Start Refresh"],
  MAJOR: ["Text Evolution Release", "Engine Expansion Release"],
  LEAP: ["Governance Core Release", "World Engine Leap Release", "Version Leap Release"],
  GENERATION: ["Aetherworld OS Foundation Release", "Private Beta Candidate", "Next Generation Release"],
};

function parseSemver(v: string): { x: number; y: number; z: number; suffix: string } {
  const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?(.*)$/.exec(v.trim());
  if (!m) return { x: 1, y: 0, z: 0, suffix: "" };
  return { x: +m[1], y: +m[2], z: +(m[3] ?? 0), suffix: m[4] ?? "" };
}

export function suggestVersionNumber(
  currentVersion: string,
  level: VersionLeapLevel,
  classification: VersionClassification,
  releaseChannel: "internal" | "advanced" | "public" | "founder" = "internal",
): VersionNumberSuggestion {
  const { x, y, z, suffix } = parseSemver(currentVersion);
  const channelTag =
    releaseChannel === "public" ? " Beta" :
    releaseChannel === "founder" ? " Founder" :
    releaseChannel === "advanced" ? " RC" : suffix.trim() || "";

  let next = `v${x}.${y}.${z + 1}${channelTag}`;
  const alts: string[] = [];

  switch (level) {
    case "PATCH":
      next = `v${x}.${y}.${z + 1}${channelTag}`;
      alts.push(`v${x}.${y}.${z + 1}`);
      break;
    case "MINOR":
      next = `v${x}.${y + 1}.0${channelTag}`;
      alts.push(`v${x}.${y + 1}.0`);
      break;
    case "MAJOR":
      next = `v${x + 1}.0.0${channelTag}`;
      alts.push(`v${x}.${y + 1}.0-leap.1`);
      break;
    case "LEAP":
      next = `v${x + 1}.0.0-leap.1`;
      alts.push(`v${x + 1}.0.0 RC`, `v${x}.${y + 1}.0-leap.1`);
      break;
    case "GENERATION":
      next = `v${x + 1}.0.0`;
      alts.push(`v${x + 1}.0.0 Private Beta`, "vNext Generation");
      break;
  }

  const releaseName = RELEASE_NAMES[level][0];
  const reason = `${ruleForLevel(level).description}; releaseType=${classification.releaseType}`;

  return { currentVersion, suggestedVersion: next, alternativeVersions: alts, reason, releaseName };
}

export function listReleaseNames(level: VersionLeapLevel): string[] {
  return RELEASE_NAMES[level];
}
