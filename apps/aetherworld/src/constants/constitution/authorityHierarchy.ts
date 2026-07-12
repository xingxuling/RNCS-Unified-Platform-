// System Constitution v0.2 — Authority Hierarchy
export type AuthorityActor =
  | "PUBLIC_USER" | "ADVANCED_USER" | "REAL_SUBJECT_USER"
  | "FULL60_USER" | "FOUNDER" | "SYSTEM" | "CONSTITUTION";

export const AUTHORITY_ORDER: AuthorityActor[] = [
  "CONSTITUTION", "SYSTEM", "FOUNDER", "FULL60_USER",
  "REAL_SUBJECT_USER", "ADVANCED_USER", "PUBLIC_USER",
];

export interface AuthorityRule {
  actor: AuthorityActor;
  chineseName: string;
  canRead: string[];
  canWrite: string[];
  canExport: string[];
  canLock: string[];
  forbiddenActions: string[];
}

export const AUTHORITY_HIERARCHY: AuthorityRule[] = [
  {
    actor: "CONSTITUTION", chineseName: "系统宪法",
    canRead: ["*"], canWrite: ["*"], canExport: ["*"], canLock: ["*"],
    forbiddenActions: ["自我废除核心安全原则"],
  },
  {
    actor: "SYSTEM", chineseName: "系统内部",
    canRead: ["*"], canWrite: ["constants:experimental", "metadata:*", "stale_flags"],
    canExport: ["*"], canLock: ["safety", "privacy", "currency"],
    forbiddenActions: ["违反宪法 Founder Locked 条款"],
  },
  {
    actor: "FOUNDER", chineseName: "创始人",
    canRead: ["*", "founder_trace"],
    canWrite: ["constants:experimental", "world_canon", "engine_registry", "constitution_amendments"],
    canExport: ["full_system_report", "founder_trace"],
    canLock: ["constants:any", "articles:any", "canon"],
    forbiddenActions: [
      "绕过隐私提示", "关闭核心 Safety", "金融化数列货币",
      "把虚拟世界标为现实", "删审计不留痕", "让普通用户无提示使用 Founder-only 数据",
    ],
  },
  {
    actor: "FULL60_USER", chineseName: "Full60 深度主体",
    canRead: ["self:full60", "self:light20", "self:demo", "public"],
    canWrite: ["self:full60", "self:settings"],
    canExport: ["self:full60_with_warning"], canLock: [],
    forbiddenActions: ["读取他人 Full60", "上传 Full60 至公开"],
  },
  {
    actor: "REAL_SUBJECT_USER", chineseName: "真实主体（Light20）",
    canRead: ["self:light20", "self:demo", "public"],
    canWrite: ["self:light20", "self:settings"],
    canExport: ["self:light20_with_warning"], canLock: [],
    forbiddenActions: ["读取他人主体", "公开私有数据"],
  },
  {
    actor: "ADVANCED_USER", chineseName: "高阶用户",
    canRead: ["public", "advanced_panels"], canWrite: ["self:settings"],
    canExport: ["public_outputs"], canLock: [],
    forbiddenActions: ["改 Founder Locked", "关闭 Safety", "金融化货币"],
  },
  {
    actor: "PUBLIC_USER", chineseName: "普通用户",
    canRead: ["public", "demo"], canWrite: ["self:settings:minimal"],
    canExport: ["public_outputs"], canLock: [],
    forbiddenActions: ["改任何常数/宪法", "看 Founder Trace", "看 Founder-only 数据"],
  },
];

export function compareAuthority(a: AuthorityActor, b: AuthorityActor): number {
  return AUTHORITY_ORDER.indexOf(a) - AUTHORITY_ORDER.indexOf(b);
}

export function isHigherOrEqual(a: AuthorityActor, b: AuthorityActor): boolean {
  return compareAuthority(a, b) <= 0;
}
