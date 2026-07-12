// Multi-World Network Engine - v0.7 main orchestrator.
import type {
  AgentMigrationRecord,
  CrossWorldCanonState,
  CrossWorldRelation,
  MultiWorldEvent,
  MultiWorldSnapshot,
  NetworkMode,
  RegisteredWorld,
  SubjectMode,
  WorldConflict,
  WorldFederationState,
  WorldPortal,
  WorldSyncState,
  WorldTransferRecord,
  WorldTravelState,
} from "./types";
import { shortId } from "./types";
import { buildDemoWorldRegistry, ensureMaxWorlds } from "./worldRegistryEngine";
import { createPortal } from "./worldPortalEngine";
import { deriveAllRelations } from "./crossWorldRelationEngine";
import { buildCrossWorldCanon } from "./crossWorldCanonEngine";
import { generateMultiWorldEvent, limitEventsPerTick } from "./multiWorldEventEngine";
import { formFederation } from "./worldFederationEngine";
import { detectConflicts } from "./worldConflictEngine";
import { buildSyncState } from "./worldSyncEngine";
import { createMultiWorldSnapshot } from "./multiWorldSnapshotEngine";
import { evaluateMultiWorldSafety, getSafetyBoundaryText } from "./multiWorldSafetyGuard";
import { MULTI_WORLD_EXPORT_TARGETS } from "@/constants/sequence-world/multiverse/multiWorldExportTargets";

export interface MultiWorldNetworkInput {
  subjectMode: SubjectMode;
  userId?: string;
  sourceWorldId?: string;
  targetWorldId?: string;
  activeWorldIds?: string[];
  networkMode?: NetworkMode;
  action?: string;
  mslProgram?: string;
  maxWorlds?: number;
  existingWorlds?: RegisteredWorld[];
}

export interface MultiWorldNetworkResult {
  networkId: string;
  networkMode: NetworkMode;
  worlds: RegisteredWorld[];
  portals: WorldPortal[];
  crossWorldRelations: CrossWorldRelation[];
  userTravelState?: WorldTravelState;
  transfers: WorldTransferRecord[];
  agentMigrations: AgentMigrationRecord[];
  crossWorldCanon: CrossWorldCanonState;
  multiWorldEvents: MultiWorldEvent[];
  federation?: WorldFederationState;
  conflicts: WorldConflict[];
  syncState: WorldSyncState;
  snapshots: MultiWorldSnapshot[];
  exportOptions: string[];
  safetyNotes: string[];
}

export function runMultiWorldNetwork(input: MultiWorldNetworkInput): MultiWorldNetworkResult {
  const networkMode: NetworkMode =
    input.networkMode ??
    (input.subjectMode === "FOUNDER"
      ? "FOUNDER_MULTIVERSE"
      : input.subjectMode === "DEMO"
      ? "DEMO"
      : "PERSONAL_MULTIVERSE");
  const networkId = shortId("net");
  const maxWorlds = input.maxWorlds ?? 7;
  const worlds = (input.existingWorlds && input.existingWorlds.length > 0 ? input.existingWorlds : buildDemoWorldRegistry()).slice(0, maxWorlds);

  const portals: WorldPortal[] = [];
  for (let i = 0; i + 1 < Math.min(worlds.length, 4); i++) {
    const res = createPortal({
      fromWorld: worlds[i],
      toWorld: worlds[i + 1],
      portalType: i === 0 ? "TWO_WAY_PORTAL" : i === 1 ? "DREAM_PORTAL" : "STORY_GATE",
    });
    if (res.portal) portals.push(res.portal);
  }

  const relations = deriveAllRelations(worlds);
  const canon = buildCrossWorldCanon(worlds);
  const events = limitEventsPerTick(
    [generateMultiWorldEvent(worlds, "PORTAL_OPENING")].filter(Boolean) as MultiWorldEvent[],
  );
  const federation = formFederation({ worlds, relations }) ?? undefined;
  const conflicts = detectConflicts(worlds, portals, canon);
  const syncState = buildSyncState(networkId, worlds, conflicts);
  const snapshot = createMultiWorldSnapshot({ networkId, worlds, portals, relations, federation, conflicts });

  const safety = evaluateMultiWorldSafety(worlds, portals, [], maxWorlds);
  const safetyNotes = [
    getSafetyBoundaryText(),
    ...safety.results.filter((r) => !r.passed).map((r) => `[${r.rule.severity}] ${r.rule.label}：${r.detail ?? r.rule.description}`),
  ];
  if (ensureMaxWorlds(worlds, maxWorlds).allowed === false) {
    safetyNotes.push("已达 maxWorlds 上限，禁止继续创建世界。");
  }

  return {
    networkId,
    networkMode,
    worlds,
    portals,
    crossWorldRelations: relations,
    transfers: [],
    agentMigrations: [],
    crossWorldCanon: canon,
    multiWorldEvents: events,
    federation,
    conflicts,
    syncState,
    snapshots: [snapshot],
    exportOptions: MULTI_WORLD_EXPORT_TARGETS.map((t) => t.id),
    safetyNotes,
  };
}

export function listExampleMultiWorldPrograms(): { title: string; prompt: string }[] {
  return [
    { title: "创建个人多世界网络", prompt: "给我创建一个多世界网络。" },
    { title: "注册两个世界并生成门户", prompt: "注册两个世界，然后在它们之间生成门户。" },
    { title: "用户从世界 A 进入世界 B", prompt: "让我从当前世界进入另一个世界。" },
    { title: "NPC 迁移到另一个世界", prompt: "把这个 NPC 迁移到另一个世界。" },
    { title: "检查跨世界正典冲突", prompt: "检查多世界正典冲突。" },
    { title: "生成世界联邦", prompt: "为现有世界生成一个联邦。" },
    { title: "运行多世界事件", prompt: "运行一次多世界事件。" },
    { title: "压缩为剧情圣经", prompt: "把多世界网络压缩成剧情圣经。" },
    { title: "导出 Godot 多世界 Runtime", prompt: "导出 Godot 多世界 Runtime JSON。" },
    { title: "导出 Three.js 世界门户图", prompt: "导出 Three.js 世界门户图。" },
  ];
}
