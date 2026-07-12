// Capability Asset · Record / MSL / Analytics 桥（轻量版，仅生成结构化事件描述）
import type {
  CapabilityAssetPackage,
  CapabilityAssetScanReport,
} from "./capabilityAssetTypes";

export interface CapabilityRecordEvent {
  recordType: "CAPABILITY_ASSET_SCAN" | "PACKAGE_DRAFT_CREATED" | "STORE_DRAFT_CREATED";
  title: string;
  summary: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export function recordScanEvent(report: CapabilityAssetScanReport): CapabilityRecordEvent {
  return {
    recordType: "CAPABILITY_ASSET_SCAN",
    title: "能力资产扫描",
    summary: `内部 ${report.totals.internal} / 外部 ${report.totals.external} / 用户 ${report.totals.user}`,
    createdAt: new Date().toISOString(),
    data: { totals: report.totals },
  };
}

export function recordPackageDraftEvent(pkg: CapabilityAssetPackage): CapabilityRecordEvent {
  return {
    recordType: "PACKAGE_DRAFT_CREATED",
    title: `能力包草案 · ${pkg.cnName}`,
    summary: `${pkg.sourceType} / ${pkg.packageType}`,
    createdAt: new Date().toISOString(),
    data: { id: pkg.id, sourceType: pkg.sourceType, packageType: pkg.packageType, status: pkg.assetStatus },
  };
}

export function recordStoreDraftEvent(pkg: CapabilityAssetPackage): CapabilityRecordEvent {
  return {
    recordType: "STORE_DRAFT_CREATED",
    title: `商店草稿 · ${pkg.cnName}`,
    summary: `${pkg.sourceType} / ${pkg.packageType}`,
    createdAt: new Date().toISOString(),
    data: { id: pkg.id, status: pkg.assetStatus },
  };
}

export interface CapabilityMslFrame {
  frameType: "MSL::CAPABILITY_ASSETIZATION";
  sourceType: string;
  packageType: string;
  risk: string;
  status: "SUCCESS" | "WARN" | "BLOCKED";
  raw: string;
}

export function buildMslFrame(pkg: CapabilityAssetPackage): CapabilityMslFrame {
  const status: CapabilityMslFrame["status"] =
    pkg.safetyStatus === "BLOCK" ? "BLOCKED" :
    pkg.safetyStatus === "PASS" ? "SUCCESS" : "WARN";
  return {
    frameType: "MSL::CAPABILITY_ASSETIZATION",
    sourceType: pkg.sourceType,
    packageType: pkg.packageType,
    risk: pkg.riskLevel,
    status,
    raw: `MSL::CAPABILITY_ASSETIZATION @sourceType=${pkg.sourceType} @packageType=${pkg.packageType} @risk=${pkg.riskLevel} @status=${status}`,
  };
}

export interface CapabilityAnalyticsSnapshot {
  takenAt: string;
  internalCandidates: number;
  externalCandidates: number;
  userCandidates: number;
  sellable: number;
  needsReview: number;
  blocked: number;
  draftsCreated: number;
}

export function buildAnalyticsSnapshot(
  report: CapabilityAssetScanReport,
  draftsCreated: number,
): CapabilityAnalyticsSnapshot {
  return {
    takenAt: new Date().toISOString(),
    internalCandidates: report.totals.internal,
    externalCandidates: report.totals.external,
    userCandidates: report.totals.user,
    sellable: report.totals.sellable,
    needsReview: report.totals.needsReview,
    blocked: report.totals.blocked,
    draftsCreated,
  };
}
