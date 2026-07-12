// Constitutional Amendment Engine
import { CONSTITUTION_VERSION } from "./constitutionRegistry";
import { AMENDMENT_RULES } from "@/constants/constitution/amendmentRules";

export { AMENDMENT_RULES };

export interface ConstitutionVersion {
  versionId: string;
  version: string;
  createdAt: string;
  summary: string;
  changedArticles: string[];
  founderApproved: boolean;
  migrationNotes: string[];
}

export const CONSTITUTION_VERSIONS: ConstitutionVersion[] = [
  { versionId: "cn-v0-1-0", version: "0.1.0", createdAt: "2026-04-01T00:00:00Z",
    summary: "v0.1：基础宪法说明文档", changedArticles: ["A001"], founderApproved: true, migrationNotes: ["初版"] },
  { versionId: "cn-v0-2-0", version: CONSTITUTION_VERSION, createdAt: "2026-05-24T00:00:00Z",
    summary: "v0.2：升级为最高治理层，含主体主权/Founder/常数/引擎/知识/世界/货币/输出/隐私/安全/回验/修订 14 类条款",
    changedArticles: ["A001", "A010", "A020", "A025", "A030", "A040", "A050", "A060", "A070", "A080", "A090", "A100", "A110", "A120", "A130"],
    founderApproved: true,
    migrationNotes: ["所有引擎输出需带 constitutionalStatus；CRITICAL 违规必须 block"] },
];

export function getCurrentConstitutionVersion(): ConstitutionVersion {
  return CONSTITUTION_VERSIONS[CONSTITUTION_VERSIONS.length - 1];
}

export function diffConstitutionVersions(a: string, b: string) {
  const vA = CONSTITUTION_VERSIONS.find((v) => v.version === a);
  const vB = CONSTITUTION_VERSIONS.find((v) => v.version === b);
  return {
    versionA: a, versionB: b,
    summaryA: vA?.summary ?? "未找到", summaryB: vB?.summary ?? "未找到",
    changedA: vA?.changedArticles ?? [], changedB: vB?.changedArticles ?? [],
  };
}
