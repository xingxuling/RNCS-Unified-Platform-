import { buildBuiltInManifests } from "./webXXMPackageManifestEngine";
import type {
  WebXXMPackageManifest,
  InstalledWebXXMCapability,
  WebXXMPackageCacheItem,
  WebXXMPackageLifecycleRecord,
} from "./webXXMStoreTypes";
import type { WebXXMPackageStatusId } from "@/constants/webxxm-store/webXXMPackageStatuses";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

const STORAGE_KEY = "aether.webxxm.store.v1";

interface StoreState {
  manifests: Record<string, WebXXMPackageManifest>;
  cache: Record<string, WebXXMPackageCacheItem>;
  installed: Record<string, InstalledWebXXMCapability>;
  lifecycle: WebXXMPackageLifecycleRecord[];
}

let STATE: StoreState | null = null;
const listeners = new Set<() => void>();

function load(): StoreState {
  if (STATE) return STATE;
  const seedManifests = buildBuiltInManifests();
  const initial: StoreState = {
    manifests: Object.fromEntries(seedManifests.map((m) => [m.packageId, m])),
    cache: {},
    installed: {},
    lifecycle: [],
  };
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const persisted = JSON.parse(raw) as Partial<StoreState>;
        // 始终以最新的内置 manifest 作为基础，再叠加用户状态
        if (persisted.manifests) {
          for (const [id, m] of Object.entries(persisted.manifests)) {
            if (initial.manifests[id]) {
              initial.manifests[id] = { ...initial.manifests[id], status: m.status };
            }
          }
        }
        if (persisted.cache)     initial.cache = persisted.cache;
        if (persisted.installed) initial.installed = persisted.installed;
        if (persisted.lifecycle) initial.lifecycle = persisted.lifecycle.slice(0, 200);
      }
    } catch {}
  }
  // 严格生命周期：所有能力包默认 AVAILABLE，必须由用户显式
  // 下载 → 安装 → 启用，平台才允许调用。不再做任何自动预启用。
  STATE = initial;
  return STATE;
}

function persist() {
  if (typeof window === "undefined" || !STATE) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch {}
  listeners.forEach((l) => l());
}

function makeInstalled(m: WebXXMPackageManifest, enabled: boolean): InstalledWebXXMCapability {
  const t = new Date().toISOString();
  return {
    capabilityId: m.capabilityId,
    packageId: m.packageId,
    version: m.version,
    enabled,
    callableBySequenceAi: enabled,
    callableByRuntimeSpine: enabled,
    callableByWebCapabilityRouter: enabled,
    providedCommands: m.providedCommands,
    providedRoutes: m.providedRoutes,
    providedObjectTypes: m.providedObjects,
    installedAt: t,
    enabledAt: enabled ? t : undefined,
  };
}

function setStatus(packageId: string, status: WebXXMPackageStatusId, reason?: string) {
  const s = load();
  const m = s.manifests[packageId];
  if (!m) return;
  m.status = { status, reason, lastChangedAt: new Date().toISOString() };
  m.updatedAt = m.status.lastChangedAt;
}

function appendLifecycle(packageId: string, action: WebXXMPackageLifecycleRecord["action"], status: string, reason?: string) {
  const s = load();
  s.lifecycle.unshift({
    recordId: `LC-${Date.now().toString(36)}-${s.lifecycle.length + 1}`,
    packageId, action, status, reason,
    createdAt: new Date().toISOString(),
  });
  if (s.lifecycle.length > 200) s.lifecycle.length = 200;
}

// ===== Public API =====

export function subscribeStore(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export function listManifests(): WebXXMPackageManifest[] {
  return Object.values(load().manifests).sort((a, b) => a.packageId.localeCompare(b.packageId));
}
export function getManifest(packageId: string): WebXXMPackageManifest | undefined {
  return load().manifests[packageId];
}
export function listInstalled(): InstalledWebXXMCapability[] {
  return Object.values(load().installed);
}
export function getInstalled(packageId: string): InstalledWebXXMCapability | undefined {
  return load().installed[packageId];
}
export function listLifecycle(packageId?: string): WebXXMPackageLifecycleRecord[] {
  const s = load();
  return packageId ? s.lifecycle.filter((r) => r.packageId === packageId) : s.lifecycle;
}

export interface LifecycleResult { ok: boolean; status: WebXXMPackageStatusId; reason?: string; }

export function downloadPackage(packageId: string): LifecycleResult {
  const s = load();
  const m = s.manifests[packageId];
  if (!m) return { ok: false, status: "BROKEN", reason: "未找到能力包" };
  if (m.status.status === "BLOCKED") return { ok: false, status: "BLOCKED", reason: m.status.reason };
  setStatus(packageId, "DOWNLOADING");
  s.cache[packageId] = {
    packageId, version: m.version, manifest: m,
    packageFiles: { "manifest.json": m, "modelSpec.json": { capabilityId: m.capabilityId } },
    downloadedAt: new Date().toISOString(),
    checksumStatus: "PASS",
  };
  setStatus(packageId, "DOWNLOADED");
  appendLifecycle(packageId, "DOWNLOAD", "DOWNLOADED");
  persist();
  return { ok: true, status: "DOWNLOADED" };
}

export function installPackage(packageId: string, opts: { autoEnable?: boolean } = {}): LifecycleResult {
  const s = load();
  const m = s.manifests[packageId];
  if (!m) return { ok: false, status: "BROKEN", reason: "未找到能力包" };
  if (m.status.status === "BLOCKED") return { ok: false, status: "BLOCKED", reason: m.status.reason };
  // 严格：必须先下载完成（DOWNLOADED）才能安装
  if (m.status.status !== "DOWNLOADED" && m.status.status !== "INSTALLED" && m.status.status !== "ENABLED" && m.status.status !== "DISABLED") {
    return { ok: false, status: m.status.status, reason: "请先下载能力包后再安装" };
  }
  setStatus(packageId, "INSTALLING");
  s.installed[packageId] = makeInstalled(m, false);
  setStatus(packageId, "INSTALLED");
  appendLifecycle(packageId, "INSTALL", "INSTALLED");
  persist();
  if (opts.autoEnable) return enablePackage(packageId);
  return { ok: true, status: "INSTALLED" };
}

export function enablePackage(packageId: string): LifecycleResult {
  const s = load();
  const m = s.manifests[packageId];
  if (!m) return { ok: false, status: "BROKEN", reason: "未找到能力包" };
  // 严格：必须先安装（INSTALLED 或 DISABLED）才能启用
  if (!s.installed[packageId]) {
    return { ok: false, status: m.status.status, reason: "请先安装能力包后再启用" };
  }
  const inst = s.installed[packageId];
  inst.enabled = true;
  inst.enabledAt = new Date().toISOString();
  inst.callableBySequenceAi = true;
  inst.callableByRuntimeSpine = true;
  inst.callableByWebCapabilityRouter = true;
  setStatus(packageId, "ENABLED");
  appendLifecycle(packageId, "ENABLE", "ENABLED");
  persist();
  return { ok: true, status: "ENABLED" };
}

export function disablePackage(packageId: string): LifecycleResult {
  const s = load();
  const inst = s.installed[packageId];
  if (!inst) return { ok: false, status: "INSTALLED", reason: "未安装" };
  inst.enabled = false;
  inst.callableBySequenceAi = false;
  inst.callableByRuntimeSpine = false;
  inst.callableByWebCapabilityRouter = false;
  setStatus(packageId, "DISABLED");
  appendLifecycle(packageId, "DISABLE", "DISABLED");
  persist();
  return { ok: true, status: "DISABLED" };
}

export function uninstallPackage(packageId: string): LifecycleResult {
  const s = load();
  delete s.installed[packageId];
  delete s.cache[packageId];
  setStatus(packageId, "UNINSTALLED");
  appendLifecycle(packageId, "UNINSTALL", "UNINSTALLED");
  persist();
  // 还原为 AVAILABLE 以便再次下载
  setStatus(packageId, "AVAILABLE");
  persist();
  return { ok: true, status: "AVAILABLE" };
}

export function updatePackage(packageId: string): LifecycleResult {
  const s = load();
  const m = s.manifests[packageId];
  if (!m) return { ok: false, status: "BROKEN", reason: "未找到能力包" };
  m.version = bumpPatch(m.version);
  appendLifecycle(packageId, "UPDATE", "UPDATED", `→ ${m.version}`);
  if (s.installed[packageId]) s.installed[packageId].version = m.version;
  setStatus(packageId, s.installed[packageId]?.enabled ? "ENABLED" : "INSTALLED");
  persist();
  return { ok: true, status: m.status.status };
}

export function blockPackage(packageId: string, reason: string): LifecycleResult {
  setStatus(packageId, "BLOCKED", reason);
  appendLifecycle(packageId, "BLOCK", "BLOCKED", reason);
  persist();
  return { ok: false, status: "BLOCKED", reason };
}

function bumpPatch(v: string) {
  const [a, b, c] = v.split(".").map(Number);
  return `${a}.${b}.${(c || 0) + 1}`;
}

// ===== Callable lookup (used by routers) =====

export function getCallableCapability(capabilityId: WebCapabilityId): InstalledWebXXMCapability | undefined {
  const all = listInstalled().filter((i) => i.capabilityId === capabilityId);
  return all.find((i) => i.enabled);
}

export type CapabilityLifecycleStage =
  | "NOT_DOWNLOADED"
  | "DOWNLOADED"
  | "INSTALLED"
  | "ENABLED"
  | "DISABLED"
  | "BLOCKED"
  | "BROKEN";

export interface CapabilityCallableReport {
  capabilityId: WebCapabilityId;
  installed: boolean;
  enabled: boolean;
  downloadRequired: boolean;
  installRequired: boolean;
  enableRequired: boolean;
  lifecycleStage: CapabilityLifecycleStage;
  storeRoute: string;
  packageId?: string;
  message?: string;
}

export function checkCapabilityCallable(capabilityId: WebCapabilityId): CapabilityCallableReport {
  const s = load();
  const manifest = Object.values(s.manifests).find((m) => m.capabilityId === capabilityId);
  const inst = listInstalled().find((i) => i.capabilityId === capabilityId);
  const pkgId = manifest?.packageId ?? capabilityId.toLowerCase().replace(/_/g, "-");
  const status = manifest?.status.status ?? "AVAILABLE";
  const base = { capabilityId, packageId: pkgId };

  if (status === "BLOCKED") {
    return {
      ...base,
      installed: false, enabled: false,
      downloadRequired: false, installRequired: false, enableRequired: false,
      lifecycleStage: "BLOCKED",
      storeRoute: `/webxxm-package/${pkgId}`,
      message: `${capabilityId} 已被阻断：${manifest?.status.reason ?? "请查看阻断原因。"}`,
    };
  }
  if (status === "BROKEN") {
    return {
      ...base,
      installed: false, enabled: false,
      downloadRequired: false, installRequired: false, enableRequired: false,
      lifecycleStage: "BROKEN",
      storeRoute: `/webxxm-package/${pkgId}`,
      message: `${capabilityId} 能力包损坏，请前往商店查看。`,
    };
  }
  if (!inst) {
    // 未安装。再细分：未下载 vs 已下载
    if (status === "DOWNLOADED") {
      return {
        ...base,
        installed: false, enabled: false,
        downloadRequired: false, installRequired: true, enableRequired: true,
        lifecycleStage: "DOWNLOADED",
        storeRoute: `/webxxm-install/${pkgId}`,
        message: `「${manifest?.chineseName ?? capabilityId}」已下载，但尚未安装。`,
      };
    }
    return {
      ...base,
      installed: false, enabled: false,
      downloadRequired: true, installRequired: true, enableRequired: true,
      lifecycleStage: "NOT_DOWNLOADED",
      storeRoute: `/webxxm-package/${pkgId}`,
      message: `「${manifest?.chineseName ?? capabilityId}」尚未下载，请前往能力商店下载。`,
    };
  }
  if (!inst.enabled) {
    return {
      ...base,
      installed: true, enabled: false,
      downloadRequired: false, installRequired: false, enableRequired: true,
      lifecycleStage: status === "DISABLED" ? "DISABLED" : "INSTALLED",
      storeRoute: `/webxxm-package/${inst.packageId}`,
      message: `「${manifest?.chineseName ?? capabilityId}」已安装但未启用，请先启用。`,
    };
  }
  return {
    ...base,
    installed: true, enabled: true,
    downloadRequired: false, installRequired: false, enableRequired: false,
    lifecycleStage: "ENABLED",
    storeRoute: `/webxxm-package/${inst.packageId}`,
  };
}
