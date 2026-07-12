// CSL Workspace — 业务管理层
// MVP-2 Phase 6 + P2:CRUD / 快照 / bundle 导入 / 锁定

import type { GrammarVersion } from '../versions/registry';
import type { CSLResult } from '../versions/dispatch';
import {
  WORKSPACE_SCHEMA_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  MAX_SOURCE_BYTES,
  type Workspace,
  type DiagnosticSnapshot,
  type WorkspaceLockState,
  type WorkspaceOrigin,
} from './types';
import { currentStamps, type VersionStamps } from '../version-stamps';
import {
  loadIndex, saveIndex,
  loadWorkspace, saveWorkspace, deleteWorkspace as storeDeleteWorkspace, listWorkspaces,
  saveSnapshot, listSnapshots, deleteSnapshot,
  loadRecent, pushRecent, pruneRecentAgainstIndex,
  loadMeta,
} from './storage';
import type { ParsedBundle } from './bundle-import';

// 重新导出常用读取
export {
  loadWorkspace, listWorkspaces,
  listSnapshots, deleteSnapshot,
  loadRecent, pruneRecentAgainstIndex,
  loadMeta,
};

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'ws_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 简单 djb2 hash,用于源码去重判断 */
function hashSource(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h |= 0;
  }
  return 'h' + (h >>> 0).toString(16);
}

export interface CreateWorkspaceOptions {
  name?: string;
  cslVersion?: GrammarVersion;
  source?: string;
  /** P2:导入路径专用 */
  origin?: WorkspaceOrigin;
  lockState?: WorkspaceLockState;
}

export function createWorkspace(opts: CreateWorkspaceOptions = {}): Workspace {
  const now = new Date().toISOString();
  const w: Workspace = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    id: uuid(),
    name: opts.name?.trim() || '未命名工作区',
    cslVersion: opts.cslVersion ?? 'v0.8',
    source: opts.source ?? '',
    createdAt: now,
    updatedAt: now,
    snapshotIds: [],
    lockState: opts.lockState ?? 'editable',
    origin: opts.origin ?? { kind: 'local' },
  };
  if (w.source.length > MAX_SOURCE_BYTES) {
    throw new Error(`源码超出 ${MAX_SOURCE_BYTES} 字节上限`);
  }
  saveWorkspace(w);
  const idx = loadIndex();
  if (!idx.ids.includes(w.id)) idx.ids.push(w.id);
  if (!idx.activeId) idx.activeId = w.id;
  saveIndex(idx);
  return w;
}

/**
 * P2:从已解析的 bundle 创建 workspace
 *   - compatible → editable
 *   - read_only  → read_only(可查看,不可改 source / 不可重新导出当前版本产物)
 *   - incompatible 在 importBundleZip 阶段就抛出,不会到这里
 */
export function importBundleAsWorkspace(parsed: ParsedBundle, sourceLabel?: string): Workspace {
  const verdict = parsed.verdict;
  const lockState: WorkspaceLockState = verdict === 'compatible' ? 'editable' : 'read_only';
  const origin: WorkspaceOrigin = {
    kind: 'imported_bundle',
    importedStamps: parsed.manifest.versionStamps,
    compatVerdict: verdict,
    compatReasons: parsed.compat.reasons,
    primaryHint: parsed.compat.primaryHint,
    sourceLabel: sourceLabel ?? parsed.manifest.workspace?.name ?? '导入运行包',
    importedAt: new Date().toISOString(),
  };
  const baseName = parsed.manifest.workspace?.name || sourceLabel || '导入运行包';
  const name = verdict === 'read_only' ? `${baseName}(只读)` : baseName;
  return createWorkspace({
    name,
    cslVersion: parsed.manifest.cslVersion,
    source: parsed.source,
    origin,
    lockState,
  });
}

/** P2:锁定状态便捷查询 */
export function isWorkspaceEditable(w: Workspace | null | undefined): boolean {
  if (!w) return false;
  return (w.lockState ?? 'editable') === 'editable';
}

export function getWorkspaceLockState(w: Workspace | null | undefined): WorkspaceLockState {
  return w?.lockState ?? 'editable';
}


export function setActiveWorkspace(id: string): Workspace | null {
  const w = loadWorkspace(id);
  if (!w) return null;
  const idx = loadIndex();
  idx.activeId = id;
  saveIndex(idx);
  pushRecent({
    workspaceId: id,
    name: w.name,
    lastOpenedAt: new Date().toISOString(),
    cslVersion: w.cslVersion,
    lockState: w.lockState ?? 'editable',
    originKind: w.origin?.kind ?? 'local',
    sourceLabel: w.origin?.sourceLabel,
  });
  return w;
}

export function getActiveWorkspace(): Workspace | null {
  const idx = loadIndex();
  if (!idx.activeId) return null;
  return loadWorkspace(idx.activeId);
}

export function renameWorkspace(id: string, name: string): void {
  const w = loadWorkspace(id);
  if (!w) return;
  w.name = name.trim() || w.name;
  saveWorkspace(w);
}

export function updateWorkspaceSource(id: string, source: string, cslVersion?: GrammarVersion): void {
  if (source.length > MAX_SOURCE_BYTES) {
    throw new Error(`源码超出 ${MAX_SOURCE_BYTES} 字节上限,请拆分`);
  }
  const w = loadWorkspace(id);
  if (!w) return;
  // P2:read_only / incompatible 工作区禁止改 source
  const lock = w.lockState ?? 'editable';
  if (lock !== 'editable') {
    throw new Error(`工作区当前为「${lock === 'read_only' ? '只读' : '不兼容'}」状态,无法保存修改。请先「另存为新工作区」。`);
  }
  w.source = source;
  if (cslVersion) w.cslVersion = cslVersion;
  saveWorkspace(w);
}

/** P2:把当前 read_only 工作区另存为新的可编辑工作区 */
export function forkAsEditable(id: string, newName?: string): Workspace | null {
  const src = loadWorkspace(id);
  if (!src) return null;
  return createWorkspace({
    name: newName || `${src.name} (副本)`,
    cslVersion: src.cslVersion,
    source: src.source,
    lockState: 'editable',
    origin: { kind: 'local', sourceLabel: `从「${src.name}」另存`, importedAt: new Date().toISOString() },
  });
}

export function removeWorkspace(id: string): void {
  storeDeleteWorkspace(id);
}

// ---------- 快照 ----------

/** 从 CSLResult 派生快照摘要 */
export function buildSnapshotFromResult(
  workspaceId: string,
  source: string,
  cslVersion: GrammarVersion,
  result: CSLResult,
  trigger: 'manual' | 'auto' = 'manual',
): DiagnosticSnapshot {
  const ir = result.ir;
  const guardLog = result.guardLog || [];
  // GuardLog 当前 schema 未带 severity,统一视为 block(被拦截即阻断)
  const blockCount = guardLog.length;
  const warnCount = 0;
  const oseBlocked = blockCount > 0 || !!result.error;

  const topMessages: string[] = [];
  if (result.error) topMessages.push(result.error);
  for (const g of guardLog.slice(0, 5)) {
    if (topMessages.length >= 5) break;
    topMessages.push(`[${g.policyId}] ${g.reason}`);
  }

  // MVP-2 Phase 7:从 IR._meta 派生 stamps,未构建出 IR 时回退 currentStamps
  const irMeta: any = (ir as any)?._meta;
  const stamps: VersionStamps = irMeta
    ? {
        grammarVersion: cslVersion,
        specVersion: Number.parseInt(irMeta.specVersion, 10) || currentStamps(cslVersion).specVersion,
        compilerVersion: irMeta.compilerVersion || currentStamps(cslVersion).compilerVersion,
        osePolicyVersion: Number.parseInt(irMeta.osePolicyVersion, 10) || currentStamps(cslVersion).osePolicyVersion,
      }
    : currentStamps(cslVersion);

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    id: uuid(),
    workspaceId,
    takenAt: new Date().toISOString(),
    cslVersion,
    sourceHash: hashSource(source),
    summary: {
      parseOk: !result.error && !!ir,
      irNodeCount: ir ? countIRNodes(ir) : 0,
      oseBlocked,
      blockCount,
      warnCount,
    },
    topMessages,
    trigger,
    versionStamps: stamps,
  };
}

/** MVP-2 Phase 7:把成功 build 的 stamps 写回 workspace.lastBuildStamps */
export function stampWorkspaceBuild(workspaceId: string, stamps: VersionStamps): void {
  const w = loadWorkspace(workspaceId);
  if (!w) return;
  w.lastBuildStamps = { ...stamps, stampedAt: new Date().toISOString() };
  saveWorkspace(w);
}

function countIRNodes(ir: any): number {
  let n = 0;
  for (const k of ['concepts','instances','invariants','rules','evidences','functions','subjects','stages','transitions','signals','regenerations']) {
    if (Array.isArray(ir[k])) n += ir[k].length;
  }
  return n;
}

export function recordSnapshot(snap: DiagnosticSnapshot): void {
  saveSnapshot(snap);
}

// ---------- 自动快照节流 ----------

const AUTO_SNAPSHOT_THROTTLE_MS = 30_000;
const lastAutoSnapshotAt = new Map<string, number>();

/** 节流后的自动快照入口;符合间隔才落库 */
export function maybeAutoSnapshot(
  workspaceId: string,
  source: string,
  cslVersion: GrammarVersion,
  result: CSLResult,
): DiagnosticSnapshot | null {
  const now = Date.now();
  const last = lastAutoSnapshotAt.get(workspaceId) ?? 0;
  if (now - last < AUTO_SNAPSHOT_THROTTLE_MS) return null;
  lastAutoSnapshotAt.set(workspaceId, now);
  const snap = buildSnapshotFromResult(workspaceId, source, cslVersion, result, 'auto');
  recordSnapshot(snap);
  return snap;
}
