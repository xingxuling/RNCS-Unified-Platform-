// P11 — Viewer 状态持久化
//
// 目标:让 Viewer 不仅能打开,还能"记住上次怎么看"。
//
// 持久化字段(刻意保持小且非破坏性):
//   - lastObjectKey: object|<id> 或 ws|<id>
//   - from: 来源壳标识 (showcase/compare/recent/workspace/direct)
//   - compatPanelOpen: compat 详情是否展开过(此处只记录用户偏好,
//     真实开关仍由 IncompatibilityDetailsPanel 内部 Dialog 控制)
//   - scrollY: 上次滚动位置
//   - section: 上次最后查看的分区(预留,viewer 当前是单页)
//
// 纪律:
//   - 本模块只读写一个 localStorage key,不污染 workspace / showcase 已有 schema
//   - 对象不存在时 → 安全降级:不抛错,返回 null,由调用方决定回到默认入口
//   - 仅记录"看的状态",不修改对象本身

const STORAGE_KEY = 'csl:viewer:state:v1';

export type ViewerFrom = 'showcase' | 'workspace' | 'compare' | 'recent' | 'viewer' | 'direct';

export interface ViewerPersistedState {
  /** "object|<id>" 或 "ws|<id>" */
  lastObjectKey: string;
  from: ViewerFrom;
  compatPanelOpen?: boolean;
  scrollY?: number;
  section?: string;
  /** 写入时间戳,便于调试 */
  ts: number;
}

function isValid(x: unknown): x is ViewerPersistedState {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.lastObjectKey === 'string'
      && typeof o.from === 'string'
      && typeof o.ts === 'number';
}

export function makeObjectKey(kind: 'object' | 'ws', id: string): string {
  return `${kind}|${id}`;
}

export function parseObjectKey(key: string): { kind: 'object' | 'ws'; id: string } | null {
  const i = key.indexOf('|');
  if (i <= 0) return null;
  const kind = key.slice(0, i);
  const id = key.slice(i + 1);
  if ((kind !== 'object' && kind !== 'ws') || !id) return null;
  return { kind, id };
}

export function loadViewerState(): ViewerPersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return isValid(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveViewerState(s: Omit<ViewerPersistedState, 'ts'>): void {
  try {
    const full: ViewerPersistedState = { ...s, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // 静默 — 持久化失败不应影响 viewer 主链
  }
}

export function clearViewerState(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

/**
 * 给上层一个"可恢复 URL 参数"的工具 — 不直接执行 navigate,只返回参数对象。
 * 调用方决定是否真的恢复(避免在 URL 已显式给出参数时被覆盖)。
 */
export function deriveRestoreParams(s: ViewerPersistedState): Record<string, string> | null {
  const parsed = parseObjectKey(s.lastObjectKey);
  if (!parsed) return null;
  const params: Record<string, string> = { from: s.from };
  if (parsed.kind === 'ws') params.ws = parsed.id;
  else params.object = parsed.id;
  return params;
}
