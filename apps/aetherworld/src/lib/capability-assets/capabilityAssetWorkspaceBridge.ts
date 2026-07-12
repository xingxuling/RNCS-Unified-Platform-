// Capability Asset · Workspace 桥（仅生成对象草案，本轮不真正写库）
import type {
  CapabilityAssetManifest,
  CapabilityAssetPackage,
  CapabilityAssetScanReport,
} from "./capabilityAssetTypes";

export type CapabilityWorkspaceObjectType =
  | "CAPABILITY_ASSET_REPORT"
  | "CAPABILITY_PACKAGE_DRAFT"
  | "CAPABILITY_MANIFEST"
  | "STORE_DRAFT";

export interface CapabilityWorkspaceArtifact {
  objectType: CapabilityWorkspaceObjectType;
  title: string;
  summary: string;
  dataJson: Record<string, unknown>;
  createdAt: string;
}

export function buildCapabilityReportArtifact(report: CapabilityAssetScanReport): CapabilityWorkspaceArtifact {
  return {
    objectType: "CAPABILITY_ASSET_REPORT",
    title: `能力资产扫描报告 · ${report.scannedAt.slice(0, 19).replace("T", " ")}`,
    summary: `内部 ${report.totals.internal} / 外部 ${report.totals.external} / 用户 ${report.totals.user}；可售 ${report.totals.sellable}，待审 ${report.totals.needsReview}，阻断 ${report.totals.blocked}。`,
    dataJson: report as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  };
}

export function buildCapabilityPackageArtifact(pkg: CapabilityAssetPackage): CapabilityWorkspaceArtifact {
  return {
    objectType: "CAPABILITY_PACKAGE_DRAFT",
    title: `能力包草案 · ${pkg.cnName}`,
    summary: `${pkg.sourceType} / ${pkg.packageType} · 风险 ${pkg.riskLevel} · 安全 ${pkg.safetyStatus}`,
    dataJson: pkg as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  };
}

export function buildCapabilityManifestArtifact(m: CapabilityAssetManifest): CapabilityWorkspaceArtifact {
  return {
    objectType: "CAPABILITY_MANIFEST",
    title: `能力 Manifest · ${m.packageId}`,
    summary: `${m.sourceType} / ${m.packageType} · 安装方式 ${m.installMode}`,
    dataJson: m as unknown as Record<string, unknown>,
    createdAt: new Date().toISOString(),
  };
}

export function buildStoreDraftArtifact(pkg: CapabilityAssetPackage): CapabilityWorkspaceArtifact {
  return {
    objectType: "STORE_DRAFT",
    title: `商店草稿 · ${pkg.cnName}`,
    summary: `${pkg.sourceType} / ${pkg.packageType} · 状态 ${pkg.assetStatus}`,
    dataJson: { packageId: pkg.id, packageType: pkg.packageType, sourceType: pkg.sourceType, status: pkg.assetStatus },
    createdAt: new Date().toISOString(),
  };
}
