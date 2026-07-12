import type { WebXXMPackageStatusId } from "@/constants/webxxm-store/webXXMPackageStatuses";
import type { WebXXMPackageType } from "@/constants/webxxm-store/webXXMPackageTypes";
import type { WebXXMPackageSource } from "@/constants/webxxm-store/webXXMPackageSources";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

export interface WebXXMPackageDependency {
  dependencyId: string;
  type: "WEBLKM" | "WEBCM" | "WEBCOM" | "WEBLCM" | "WEBLLM" | "WEBLWM" | "APP_RUNTIME" | "CODE_SANDBOX" | "QA" | "WORKSPACE" | "OTHER_WEBXXM";
  required: boolean;
  minVersion?: string;
}

export interface WebXXMPackagePermission {
  permissionId: string;
  name: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiredFor: string[];
}

export interface WebXXMPackageStatus {
  status: WebXXMPackageStatusId;
  reason?: string;
  lastChangedAt: string;
}

export interface WebXXMPackageManifest {
  packageId: string;
  capabilityId: WebCapabilityId;
  name: string;
  chineseName: string;
  version: string;
  description: string;
  author: string;
  packageType: WebXXMPackageType;
  source: WebXXMPackageSource;
  requiredAetherVersion: string;
  dependencies: WebXXMPackageDependency[];
  permissions: WebXXMPackagePermission[];
  providedObjects: string[];
  providedCommands: string[];
  providedRoutes: string[];
  runtimeAdapters: string[];
  qaRules: string[];
  safetyRules: string[];
  installSize?: string;
  checksum?: string;
  signatureStatus: "SIGNED" | "UNSIGNED" | "LOCAL_TRUSTED" | "UNKNOWN";
  status: WebXXMPackageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InstalledWebXXMCapability {
  capabilityId: WebCapabilityId;
  packageId: string;
  version: string;
  enabled: boolean;
  callableBySequenceAi: boolean;
  callableByRuntimeSpine: boolean;
  callableByWebCapabilityRouter: boolean;
  providedCommands: string[];
  providedRoutes: string[];
  providedObjectTypes: string[];
  installedAt: string;
  enabledAt?: string;
}

export interface WebXXMPackageCacheItem {
  packageId: string;
  version: string;
  manifest: WebXXMPackageManifest;
  packageFiles: Record<string, unknown>;
  downloadedAt: string;
  checksumStatus: "PASS" | "WARN" | "UNKNOWN";
}

export interface WebXXMPackageLifecycleRecord {
  recordId: string;
  packageId: string;
  action: "DOWNLOAD" | "INSTALL" | "ENABLE" | "DISABLE" | "UPDATE" | "UNINSTALL" | "BLOCK";
  status: string;
  reason?: string;
  createdAt: string;
}
