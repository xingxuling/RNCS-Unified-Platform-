export type SoulReviewStatus = "DRAFT" | "ACTIVE" | "BLOCKED" | "DEPRECATED";
export type SoulRiskPolicy = "CONSERVATIVE" | "BALANCED" | "EXPERIMENTAL";
export type SoulMemoryPolicy = "NONE" | "SESSION_ONLY" | "LOCAL_ONLY" | "EXPLICIT_EXPORT";

export interface SoulProfile {
  id: string;
  name: string;
  role: string;
  operatingPrinciples: string[];
  tone: string;
  priorities: string[];
  boundaries: string[];
  memoryPolicy: SoulMemoryPolicy;
  riskPolicy: SoulRiskPolicy;
  linkedSkills: string[];
  reviewStatus: SoulReviewStatus;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  source?: {
    sourceType: "LOCAL" | "IMPORTED" | "SYSTEM";
    sourceName?: string;
    sourceUrl?: string;
    importedAt?: string;
    sourceSnapshotHash?: string;
  };
}

export interface SoulGovernanceReport {
  decision: "PASS" | "WARN" | "BLOCK";
  warnings: string[];
  blockedReasons: string[];
}

const KEY = "aether_agent_soul_profile_registry_v1";

function read(): SoulProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SoulProfile[]) : [];
  } catch {
    return [];
  }
}

function write(list: SoulProfile[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function now() {
  return new Date().toISOString();
}

function includesUnsafePermissionLanguage(values: string[]) {
  const unsafeTerms = [
    "grant permission",
    "override permission",
    "bypass safety",
    "ignore forbidden",
    "approve blocked",
    "unrestricted",
    "root access",
    "execute anything",
  ];
  const text = values.join("\n").toLowerCase();
  return unsafeTerms.filter((term) => text.includes(term));
}

export function listSoulProfiles(): SoulProfile[] {
  return read();
}

export function getSoulProfile(id: string): SoulProfile | null {
  return read().find((profile) => profile.id === id) ?? null;
}

export function saveSoulProfile(
  input: Omit<SoulProfile, "createdAt" | "updatedAt"> & Partial<Pick<SoulProfile, "createdAt" | "updatedAt">>,
): SoulProfile {
  const list = read();
  const existingIndex = list.findIndex((profile) => profile.id === input.id);
  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const entry: SoulProfile = {
    ...input,
    createdAt: input.createdAt ?? existing?.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existingIndex >= 0) list[existingIndex] = entry;
  else list.unshift(entry);

  write(list);
  return entry;
}

export function deleteSoulProfile(id: string) {
  write(read().filter((profile) => profile.id !== id));
}

export function updateSoulReviewStatus(id: string, reviewStatus: SoulReviewStatus) {
  const list = read();
  const item = list.find((profile) => profile.id === id);
  if (!item) return null;
  item.reviewStatus = reviewStatus;
  item.updatedAt = now();
  write(list);
  return item;
}

export function validateSoulProfile(profile: SoulProfile): SoulGovernanceReport {
  const warnings: string[] = [];
  const blockedReasons: string[] = [];

  if (!profile.id.trim()) blockedReasons.push("SoulProfile id is required.");
  if (!profile.name.trim()) blockedReasons.push("SoulProfile name is required.");
  if (!profile.role.trim()) blockedReasons.push("SoulProfile role is required.");
  if (!profile.operatingPrinciples.length) warnings.push("SoulProfile should declare operatingPrinciples.");
  if (!profile.priorities.length) warnings.push("SoulProfile should declare priorities.");
  if (!profile.boundaries.length) warnings.push("SoulProfile should declare boundaries.");

  const unsafePrinciples = includesUnsafePermissionLanguage([
    ...profile.operatingPrinciples,
    ...profile.priorities,
    ...profile.boundaries,
    profile.role,
    profile.tone,
  ]);
  if (unsafePrinciples.length) {
    blockedReasons.push(`SoulProfile contains unsafe permission language: ${unsafePrinciples.join(", ")}.`);
  }

  if (profile.riskPolicy === "EXPERIMENTAL" && profile.reviewStatus === "ACTIVE") {
    warnings.push("EXPERIMENTAL soul profiles should be manually reviewed before production use.");
  }

  if (profile.reviewStatus === "BLOCKED" || profile.reviewStatus === "DEPRECATED") {
    blockedReasons.push(`SoulProfile is ${profile.reviewStatus}.`);
  }

  if (blockedReasons.length) return { decision: "BLOCK", warnings, blockedReasons };
  if (warnings.length) return { decision: "WARN", warnings, blockedReasons };
  return { decision: "PASS", warnings, blockedReasons };
}

export function seedDefaultSoulProfiles() {
  const existing = read();
  if (existing.some((profile) => profile.id === "soul_aetherworld_operator_v1")) return existing;

  const createdAt = now();
  const defaults: SoulProfile[] = [
    {
      id: "soul_aetherworld_operator_v1",
      name: "Aetherworld Operator Soul",
      role: "Operate Aetherworld as a structured planning and factory coordination agent.",
      operatingPrinciples: [
        "Turn vague input into structured objects before execution.",
        "Prefer read-only analysis before mutation.",
        "Preserve auditability, reversibility and user control.",
      ],
      tone: "direct, structured, warm, engineering-oriented",
      priorities: ["safety", "structure", "execution clarity", "asset reusability"],
      boundaries: [
        "Do not execute external code without explicit user confirmation.",
        "Do not bypass skill review gates.",
        "Do not treat soul guidance as permission.",
      ],
      memoryPolicy: "LOCAL_ONLY",
      riskPolicy: "CONSERVATIVE",
      linkedSkills: ["skill_project_intake_v1", "skill_safety_audit_v1"],
      reviewStatus: "ACTIVE",
      version: "1.0.0",
      createdAt,
      updatedAt: createdAt,
      tags: ["default", "operator", "governance"],
      source: { sourceType: "SYSTEM", sourceName: "Aetherworld default soul pack" },
    },
    {
      id: "soul_safety_auditor_v1",
      name: "Safety Auditor Soul",
      role: "Review skills, blueprints and factory task drafts for unsafe behavior and missing governance.",
      operatingPrinciples: [
        "Block unsafe action paths early.",
        "Explain every block reason clearly.",
        "Prefer downgraded safe previews over direct execution.",
      ],
      tone: "precise, calm, risk-aware",
      priorities: ["forbidden action detection", "review gates", "dependency safety"],
      boundaries: [
        "Do not approve blocked skills.",
        "Do not lower safety levels.",
        "Do not grant permissions.",
      ],
      memoryPolicy: "LOCAL_ONLY",
      riskPolicy: "CONSERVATIVE",
      linkedSkills: ["skill_safety_audit_v1"],
      reviewStatus: "ACTIVE",
      version: "1.0.0",
      createdAt,
      updatedAt: createdAt,
      tags: ["default", "safety", "audit"],
      source: { sourceType: "SYSTEM", sourceName: "Aetherworld default soul pack" },
    },
  ];

  const next = [...defaults, ...existing];
  write(next);
  return next;
}
