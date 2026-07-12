// Constant Universe v0.2 — Versioning Engine
import { CONSTANT_UNIVERSE_VERSION, CONSTANT_REGISTRY } from "./constantRegistry";

export interface ConstantVersion {
  versionId: string;
  version: string;
  createdAt: string;
  summary: string;
  changedConstants: string[];
  migrationNotes: string[];
  founderApproved: boolean;
}

export const CONSTANT_VERSIONS: ConstantVersion[] = [
  {
    versionId: "cu-v0-1-0",
    version: "0.1.0",
    createdAt: "2026-04-01T00:00:00Z",
    summary: "Constant Universe v0.1：数字含义与解释辅助",
    changedConstants: ["DIGIT_*"],
    migrationNotes: ["初版数字常数登记"],
    founderApproved: true,
  },
  {
    versionId: "cu-v0-2-0",
    version: CONSTANT_UNIVERSE_VERSION,
    createdAt: "2026-05-24T00:00:00Z",
    summary: "v0.2：升级为系统级底层常数注册、版本、审计、冲突检测、权重、阈值、风险与跨引擎一致性治理层",
    changedConstants: [
      "全部数字常数纳入唯一注册表",
      "新增 DOMAIN/ENGINE_WEIGHT/THRESHOLD/RISK/WORLD_*/PRESENTATION/COMPRESSION/VALIDATION/SUBJECT_MODE/SAFETY 类别",
      "Founder Locked 标记",
      "CURRENCY_NON_FINANCIAL_LOCKS",
    ],
    migrationNotes: [
      "MSL/SequenceAI/WorldEngine 必须从注册表读取常数",
      "输出 metadata 增加 constantUniverseVersion",
    ],
    founderApproved: true,
  },
];

export function getCurrentVersion(): ConstantVersion {
  return CONSTANT_VERSIONS[CONSTANT_VERSIONS.length - 1];
}

export function diffVersions(a: string, b: string): {
  versionA: string; versionB: string; constantCountA: number; constantCountB: number;
  notes: string[];
} {
  const vA = CONSTANT_VERSIONS.find((v) => v.version === a);
  const vB = CONSTANT_VERSIONS.find((v) => v.version === b);
  return {
    versionA: a, versionB: b,
    constantCountA: vA ? vA.changedConstants.length : 0,
    constantCountB: vB ? vB.changedConstants.length : 0,
    notes: [
      vA ? `A(${a}): ${vA.summary}` : `A(${a}): 未找到`,
      vB ? `B(${b}): ${vB.summary}` : `B(${b}): 未找到`,
      `当前注册表常数总数: ${CONSTANT_REGISTRY.length}`,
    ],
  };
}
