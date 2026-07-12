// CSL Workspace — 最小持久化模型
// MVP-2 Phase 6:工作区 / 快照 / 最近打开 三个 schema
// MVP-2 Phase 8 (P2):增加 lockState + origin —— 导入对象的锁定与来源追踪

import type { GrammarVersion } from '../versions/registry';
import type { VersionStamps } from '../version-stamps';
import type { CompatVerdict } from './compat';

export const WORKSPACE_SCHEMA_VERSION = 2; // P2: bumped for lockState/origin
export const SNAPSHOT_SCHEMA_VERSION = 1;
export const RECENT_SCHEMA_VERSION = 2; // P6: 加 bucket/version/lockState/originKind
export const META_SCHEMA_VERSION = 1;

export const MAX_SOURCE_BYTES = 256 * 1024;
export const MAX_SNAPSHOTS_PER_WORKSPACE = 20;
export const MAX_RECENT_ENTRIES = 10;

/** P2:工作区锁定状态 — 编辑器/运行/导出/保存均需检查此字段 */
export type WorkspaceLockState = 'editable' | 'read_only' | 'incompatible';

/** P2:工作区来源 */
export interface WorkspaceOrigin {
  kind: 'local' | 'imported_csl' | 'imported_bundle';
  /** 导入对象自带的版本指纹(若有) */
  importedStamps?: VersionStamps;
  /** 导入时的兼容判定 */
  compatVerdict?: CompatVerdict;
  /** 兼容判定的 reasons,用于 UI 解释为何被锁 */
  compatReasons?: string[];
  /** 主要提示(中文,UI 直接显示) */
  primaryHint?: string;
  /** 导入源描述,例如原 bundle workspaceName / 文件名 */
  sourceLabel?: string;
  importedAt?: string;
}

export interface Workspace {
  schemaVersion: number;
  id: string;
  name: string;
  cslVersion: GrammarVersion;
  source: string;
  createdAt: string;
  updatedAt: string;
  snapshotIds: string[];
  lastBuildStamps?: VersionStamps & { stampedAt: string };
  /** P2:锁定态 — 默认 editable */
  lockState?: WorkspaceLockState;
  /** P2:来源 — 默认 local */
  origin?: WorkspaceOrigin;
}

export interface DiagnosticSnapshot {
  schemaVersion: number;
  id: string;
  workspaceId: string;
  takenAt: string;
  cslVersion: GrammarVersion;
  sourceHash: string;
  summary: {
    parseOk: boolean;
    irNodeCount: number;
    oseBlocked: boolean;
    blockCount: number;
    warnCount: number;
  };
  topMessages: string[];
  trigger: 'manual' | 'auto';
  versionStamps?: VersionStamps;
}

export interface RecentEntry {
  workspaceId: string;
  name: string;
  lastOpenedAt: string;
  /** P6: 升级字段 — 旧记录可缺失,UI 需做 fallback */
  cslVersion?: GrammarVersion;
  lockState?: WorkspaceLockState;
  originKind?: WorkspaceOrigin['kind'];
  sourceLabel?: string;
}

export interface WorkspaceIndex {
  schemaVersion: number;
  ids: string[];
  activeId: string | null;
}

export interface StorageMeta {
  schemaVersion: number;
  lastMigrationAt: string | null;
}
