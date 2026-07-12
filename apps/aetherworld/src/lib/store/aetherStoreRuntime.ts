import { toast } from "sonner";
import type {
  AetherStoreItem,
  AetherStoreItemType,
} from "./aetherStoreTypes";
import type { AetherStoreCategoryId } from "@/constants/store/storeCategories";
import type { AetherStoreItemStatus } from "@/constants/store/storeItemStatuses";
import {
  listManifests,
  listInstalled,
  subscribeStore as subscribeWebXXM,
  downloadPackage as downloadWebXXM,
  installPackage as installWebXXM,
  enablePackage as enableWebXXM,
  disablePackage as disableWebXXM,
  uninstallPackage as uninstallWebXXM,
  updatePackage as updateWebXXM,
} from "@/lib/webxxm-store/webXXMPackageRegistry";
import {
  subscribeStoreRegistry,
  getLocalStatus,
  setLocalStatus,
  recordTransaction,
} from "./aetherStoreRegistry";

// ===== 非 WebXXM 内置条目（模型 / 模板 / 世界 / 主题 / 插件等占位） =====

const NOW = new Date().toISOString();

function baseItem(partial: Partial<AetherStoreItem> & {
  itemId: string;
  itemType: AetherStoreItemType;
  category: AetherStoreCategoryId;
  name: string;
  chineseName: string;
  description: string;
}): AetherStoreItem {
  return {
    version: "0.1.0",
    author: "Aetherworld Official",
    source: "BUILT_IN",
    status: "AVAILABLE",
    priceType: "FREE",
    licenseType: "Aetherworld Built-in License",
    permissions: [],
    dependencies: [],
    providedRoutes: [],
    providedCommands: [],
    providedObjectTypes: [],
    qaStatus: "PASS",
    riskLevel: "LOW",
    tags: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

const BUILT_IN_NON_WEBXXM: AetherStoreItem[] = [
  // 模型
  baseItem({
    itemId: "model-webllm",
    itemType: "CORE_MODEL_PACKAGE",
    category: "MODEL",
    name: "WebLLM",
    chineseName: "语言模型",
    description: "本地浏览器内运行的语言模型，用于问答、写作、代码草案与剧情生成。",
    tags: ["核心", "本地推理"],
    permissions: [{ permissionId: "use-webgpu", name: "WebGPU 访问", chineseName: "使用 WebGPU", description: "在浏览器中运行本地推理。", riskLevel: "MEDIUM" }],
    detailRoute: "/core-model",
  }),
  baseItem({
    itemId: "model-weblcm",
    itemType: "CORE_MODEL_PACKAGE",
    category: "MODEL",
    name: "WebLCM",
    chineseName: "概念模型",
    description: "概念抽取、概念链与上下文压缩，作为系统语义中枢。",
    tags: ["核心", "概念"],
    detailRoute: "/core-model",
  }),
  baseItem({
    itemId: "model-weblkm",
    itemType: "CORE_MODEL_PACKAGE",
    category: "MODEL",
    name: "WebLKM",
    chineseName: "知识模型",
    description: "本地知识索引、检索与证据链，为所有能力提供知识底座。",
    tags: ["核心", "知识"],
    detailRoute: "/core-model",
  }),

  // 知识
  baseItem({
    itemId: "knowledge-constants-core",
    itemType: "KNOWLEDGE_PACKAGE",
    category: "KNOWLEDGE",
    name: "Core Constants Pack",
    chineseName: "核心常数包",
    description: "数学、物理、化学、生物等基础常数与计算法。",
    tags: ["常数", "计算法"],
  }),
  baseItem({
    itemId: "knowledge-vocab-core",
    itemType: "KNOWLEDGE_PACKAGE",
    category: "KNOWLEDGE",
    name: "Core Vocabulary Pack",
    chineseName: "核心词汇包",
    description: "通识词汇、领域术语与简易释义。",
  }),

  // 世界
  baseItem({
    itemId: "world-aether-seed",
    itemType: "WORLD_PACKAGE",
    category: "WORLD",
    name: "Aether Seed World",
    chineseName: "以太初始世界",
    description: "Aetherworld 内置世界设定、势力与初始 NPC 集合。",
    tags: ["世界", "NPC"],
  }),

  // 应用模板
  baseItem({
    itemId: "app-template-todo",
    itemType: "APP_TEMPLATE_PACKAGE",
    category: "APP_TEMPLATE",
    name: "Todo App Template",
    chineseName: "待办应用模板",
    description: "最小化 App Runtime 模板：列表、新增、完成、本地持久化。",
  }),

  // 代码模板
  baseItem({
    itemId: "code-template-react-card",
    itemType: "CODE_TEMPLATE_PACKAGE",
    category: "CODE_TEMPLATE",
    name: "React Card Component",
    chineseName: "React 卡片组件模板",
    description: "可复用的卡片组件模板，含 Props、变体与样式约定。",
  }),

  // 创作
  baseItem({
    itemId: "music-story-suno-prompt",
    itemType: "MUSIC_STORY_TEMPLATE_PACKAGE",
    category: "MUSIC_STORY",
    name: "Suno Prompt Pack",
    chineseName: "Suno 提示词模板包",
    description: "歌词、曲风、声线方向的结构化提示词模板。",
  }),

  // 主题
  baseItem({
    itemId: "theme-deep-night",
    itemType: "UI_THEME_PACKAGE",
    category: "UI_THEME",
    name: "Deep Night Theme",
    chineseName: "深夜主题",
    description: "深色基底 + 微弱青蓝点缀的克制主题。",
  }),

  // 插件
  baseItem({
    itemId: "plugin-export-markdown",
    itemType: "PLUGIN_PACKAGE",
    category: "PLUGIN",
    name: "Markdown Exporter",
    chineseName: "Markdown 导出器",
    description: "把工作区对象导出为 Markdown 文档。",
  }),

  // 资产 / 可交易（占位）
  baseItem({
    itemId: "asset-sample-paid-world",
    itemType: "WORLD_PACKAGE",
    category: "TRADEABLE",
    name: "Sample Premium World",
    chineseName: "示例付费世界包",
    description: "示例：付费世界包。当前交易功能预留中，不可购买。",
    priceType: "PAID",
    price: 99,
    currency: "AETHER",
    status: "PURCHASE_REQUIRED",
    source: "MARKETPLACE",
    tags: ["示例", "预留"],
  }),
];

// ===== WebXXM 适配 → AetherStoreItem =====

function webxxmManifestToItem(m: ReturnType<typeof listManifests>[number]): AetherStoreItem {
  const installed = listInstalled().find((i) => i.packageId === m.packageId);
  const status: AetherStoreItemStatus = installed?.enabled
    ? "ENABLED"
    : (m.status.status as AetherStoreItemStatus);
  return {
    itemId: `cap-${m.packageId}`,
    itemType: "WEBXXM_CAPABILITY_PACKAGE",
    category: "CAPABILITY",
    name: m.name,
    chineseName: m.chineseName,
    version: m.version,
    description: m.description,
    author: m.author,
    source: m.source === "BUILT_IN_REGISTRY" ? "BUILT_IN" : "OFFICIAL",
    status,
    priceType: "FREE",
    licenseType: "Aetherworld Capability License",
    permissions: m.permissions.map((p) => ({
      permissionId: p.permissionId,
      name: p.name,
      chineseName: p.name,
      description: p.description,
      riskLevel: p.riskLevel,
    })),
    dependencies: m.dependencies.map((d) => ({
      dependencyId: d.dependencyId,
      dependencyType: d.type,
      dependencyName: d.dependencyId,
      required: d.required,
      minVersion: d.minVersion,
    })),
    providedRoutes: m.providedRoutes,
    providedCommands: m.providedCommands,
    providedObjectTypes: m.providedObjects,
    qaStatus: m.status.status === "BLOCKED" ? "BLOCKED" : "PASS",
    riskLevel: "LOW",
    tags: ["能力", m.packageType],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    backingPackageId: m.packageId,
    detailRoute: `/webxxm-package/${m.packageId}`,
  };
}

function getNonWebXXMItem(template: AetherStoreItem): AetherStoreItem {
  const overridden = getLocalStatus(template.itemId);
  return overridden ? { ...template, status: overridden } : template;
}

// ===== Public API =====

export function subscribeAetherStore(l: () => void): () => void {
  const a = subscribeWebXXM(l);
  const b = subscribeStoreRegistry(l);
  return () => { a(); b(); };
}

export function listAllItems(): AetherStoreItem[] {
  const cap = listManifests().map(webxxmManifestToItem);
  const others = BUILT_IN_NON_WEBXXM.map(getNonWebXXMItem);
  return [...cap, ...others];
}

export function getItem(itemId: string): AetherStoreItem | undefined {
  return listAllItems().find((i) => i.itemId === itemId);
}

export function listByCategory(category: AetherStoreCategoryId): AetherStoreItem[] {
  const all = listAllItems();
  return category === "ALL" ? all : all.filter((i) => i.category === category);
}

export function searchItems(q: string): AetherStoreItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return listAllItems();
  return listAllItems().filter((i) =>
    i.chineseName.toLowerCase().includes(s) ||
    i.name.toLowerCase().includes(s) ||
    i.description.toLowerCase().includes(s) ||
    i.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export function listNeedsAttention(): AetherStoreItem[] {
  return listAllItems().filter((i) =>
    i.status === "DOWNLOADED" ||
    i.status === "INSTALLED" ||
    i.status === "UPDATE_AVAILABLE" ||
    i.status === "BROKEN" ||
    i.status === "BLOCKED"
  );
}

export function listInstalledItems(): AetherStoreItem[] {
  return listAllItems().filter((i) =>
    i.status === "INSTALLED" || i.status === "ENABLED" || i.status === "DISABLED"
  );
}

// ===== 生命周期统一入口 =====

export interface StoreLifecycleResult {
  ok: boolean;
  status: AetherStoreItemStatus;
  reason?: string;
}

function nonWebXXMTransition(
  itemId: string,
  expected: AetherStoreItemStatus[],
  next: AetherStoreItemStatus,
  failReason: string,
): StoreLifecycleResult {
  const cur = getLocalStatus(itemId) ?? "AVAILABLE";
  if (!expected.includes(cur)) {
    return { ok: false, status: cur, reason: failReason };
  }
  setLocalStatus(itemId, next);
  return { ok: true, status: next };
}

export function storeDownload(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.priceType !== "FREE" && item.status !== "PURCHASED") {
    return { ok: false, status: "PURCHASE_REQUIRED", reason: "需要先完成购买。" };
  }
  if (item.backingPackageId) {
    const r = downloadWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  const r = nonWebXXMTransition(itemId, ["AVAILABLE", "UNINSTALLED", "PURCHASED"], "DOWNLOADED", "当前状态不可下载。");
  if (r.ok) toast.success(`已下载「${item.chineseName}」，还需要安装。`);
  return r;
}

export function storeInstall(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.backingPackageId) {
    const r = installWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  const r = nonWebXXMTransition(itemId, ["DOWNLOADED"], "INSTALLED", "请先下载。");
  if (r.ok) toast.success(`已安装「${item.chineseName}」，还需要启用。`);
  return r;
}

export function storeEnable(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.backingPackageId) {
    const r = enableWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  const r = nonWebXXMTransition(itemId, ["INSTALLED", "DISABLED"], "ENABLED", "请先安装。");
  if (r.ok) toast.success(`已启用「${item.chineseName}」，现在可以使用。`);
  return r;
}

export function storeDisable(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.backingPackageId) {
    const r = disableWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  return nonWebXXMTransition(itemId, ["ENABLED"], "DISABLED", "未启用。");
}

export function storeUninstall(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.backingPackageId) {
    const r = uninstallWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  setLocalStatus(itemId, "AVAILABLE");
  return { ok: true, status: "AVAILABLE" };
}

export function storeUpdate(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.backingPackageId) {
    const r = updateWebXXM(item.backingPackageId);
    return { ok: r.ok, status: r.status as AetherStoreItemStatus, reason: r.reason };
  }
  toast.info(`「${item.chineseName}」已是最新版本。`);
  return { ok: true, status: item.status };
}

export function storePurchase(itemId: string): StoreLifecycleResult {
  const item = getItem(itemId);
  if (!item) return { ok: false, status: "BROKEN", reason: "未找到条目。" };
  if (item.priceType === "FREE") {
    return { ok: true, status: item.status };
  }
  // v1：交易功能预留中，不接真实支付
  recordTransaction({
    itemId: item.itemId,
    buyerUserId: "local",
    transactionType: "PURCHASE",
    amount: item.price,
    currency: item.currency,
    status: "PENDING",
    note: "交易功能预留中，未接入真实支付。",
  });
  toast.warning("交易功能预留中，当前不可购买。");
  return { ok: false, status: item.status, reason: "交易功能预留中。" };
}
