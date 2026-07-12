// Capability Asset · 资产化流水线 Runtime
// Detect → Classify → Safety Scan → Ownership Check → Package Draft → Manifest → Store Card → Review Gate → Workspace Save → Store Draft
import { scanInternalCapabilityCandidates } from "./internalCapabilityScanner";
import { scanExternalCapabilityCandidates } from "./externalCapabilityScanner";
import { scanUserCapabilityCandidates } from "./userCapabilityScanner";
import { buildPackageFromCandidate } from "./capabilityAssetPackageBuilder";
import { buildManifest, manifestToJson } from "./capabilityAssetManifestBuilder";
import type {
  CapabilityAssetCandidate,
  CapabilityAssetManifest,
  CapabilityAssetPackage,
  CapabilityAssetScanReport,
  CapabilitySourceType,
} from "./capabilityAssetTypes";

const memoryStore: {
  packages: CapabilityAssetPackage[];
  manifests: CapabilityAssetManifest[];
  storeDrafts: { packageId: string; createdAt: string }[];
} = { packages: [], manifests: [], storeDrafts: [] };

export function runCapabilityAssetScan(): CapabilityAssetScanReport {
  const internal = scanInternalCapabilityCandidates();
  const external = scanExternalCapabilityCandidates();
  const user = scanUserCapabilityCandidates();
  const all = [...internal, ...external, ...user];
  return {
    scannedAt: new Date().toISOString(),
    internal,
    external,
    user,
    totals: {
      internal: internal.length,
      external: external.length,
      user: user.length,
      sellable: all.filter((c) => c.shouldAssetizeNow && c.sourceType !== "USER_CAPABILITY").length,
      needsReview: all.filter((c) => c.shouldRequireReview).length,
      blocked: all.filter((c) => c.safetyStatus === "BLOCK").length,
    },
  };
}

export interface PackageDraftResult {
  pkg: CapabilityAssetPackage;
  manifest: CapabilityAssetManifest;
  manifestJson: string;
}

export function createPackageDraft(candidate: CapabilityAssetCandidate): PackageDraftResult {
  const pkg = buildPackageFromCandidate(candidate);
  const manifest = buildManifest(pkg);
  memoryStore.packages.push(pkg);
  memoryStore.manifests.push(manifest);
  // 高风险 / 阻断不进 Store Draft
  if (pkg.assetStatus === "DRAFT" || pkg.assetStatus === "READY") {
    memoryStore.storeDrafts.push({ packageId: pkg.id, createdAt: new Date().toISOString() });
  }
  return { pkg, manifest, manifestJson: manifestToJson(manifest) };
}

export function listPackages(): CapabilityAssetPackage[] {
  return [...memoryStore.packages];
}

export function listStoreDrafts(): { packageId: string; createdAt: string }[] {
  return [...memoryStore.storeDrafts];
}

export function findCandidate(report: CapabilityAssetScanReport, id: string): CapabilityAssetCandidate | undefined {
  return [...report.internal, ...report.external, ...report.user].find((c) => c.id === id);
}

export function bySource(
  report: CapabilityAssetScanReport,
  source: CapabilitySourceType,
): CapabilityAssetCandidate[] {
  if (source === "INTERNAL_CAPABILITY") return report.internal;
  if (source === "EXTERNAL_CAPABILITY") return report.external;
  return report.user;
}
