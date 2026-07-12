export interface DocsVersion {
  versionId: string;
  version: string;
  createdAt: string;
  summary: string;
  changedDocs: string[];
  relatedSystemVersion: string;
  relatedConstantVersion?: string;
  relatedConstitutionVersion?: string;
}

export const DOCS_VERSIONS: DocsVersion[] = [
  {
    versionId: "v_0_1_0",
    version: "0.1.0",
    createdAt: "2026-05-24",
    summary: "Learning Docs Engine 首个版本：教程注册表、模块文档、FAQ、术语表、技术手册、文档审计。",
    changedDocs: ["ALL"],
    relatedSystemVersion: "Aetherworld v0.2",
    relatedConstantVersion: "Constant Universe v0.2",
    relatedConstitutionVersion: "System Constitution v0.2",
  },
];

let staleReasons: string[] = [];

export function getCurrentDocsVersion(): DocsVersion {
  return DOCS_VERSIONS[DOCS_VERSIONS.length - 1];
}

export function listDocsVersions(): DocsVersion[] {
  return [...DOCS_VERSIONS];
}

export function markDocsStale(reason: string): void {
  if (!staleReasons.includes(reason)) staleReasons.push(reason);
}

export function getStaleReasons(): string[] {
  return [...staleReasons];
}

export function clearStale(): void {
  staleReasons = [];
}

export const STALE_TRIGGERS = [
  "ENGINE_REGISTRY_CHANGE",
  "UI_ROUTE_CHANGE",
  "QUICK_START_CHANGE",
  "USAGE_EXAMPLES_CHANGE",
  "ENCYCLOPEDIA_CHANGE",
  "CONSTITUTION_CHANGE",
  "CONSTANTS_CHANGE",
  "SUBJECT_MODE_CHANGE",
  "EXPORT_FORMAT_CHANGE",
  "SAFETY_RULES_CHANGE",
] as const;
