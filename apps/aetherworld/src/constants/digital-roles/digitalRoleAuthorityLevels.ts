export type DigitalRoleAuthorityLevel =
  | "OBSERVE_ONLY"
  | "SUGGEST"
  | "PLAN"
  | "DESIGN"
  | "GENERATE"
  | "MODIFY_DRAFT"
  | "QA_BLOCK"
  | "GOVERNANCE_BLOCK"
  | "FOUNDER_ONLY";

export const DIGITAL_ROLE_AUTHORITY_LEVELS: DigitalRoleAuthorityLevel[] = [
  "OBSERVE_ONLY",
  "SUGGEST",
  "PLAN",
  "DESIGN",
  "GENERATE",
  "MODIFY_DRAFT",
  "QA_BLOCK",
  "GOVERNANCE_BLOCK",
  "FOUNDER_ONLY",
];

export const PUBLIC_ALLOWED_AUTHORITIES: DigitalRoleAuthorityLevel[] = [
  "OBSERVE_ONLY",
  "SUGGEST",
  "PLAN",
  "GENERATE",
];
