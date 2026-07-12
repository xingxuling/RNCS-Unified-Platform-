// CSL Diff — Projection diff (占位最小实现)
// MVP-2 Phase 7
//
// projection 由 UI 触发独立缓存,CSLResult 不直接挂 projection。
// MVP 不在 dual build 中重跑 projection,本模块仅给出 unavailable 状态。
// 第二轮:dual build 接 projectDemo 结果后填实。

export interface ProjectionDiff {
  status: 'ok' | 'left_failed' | 'right_failed' | 'unavailable';
  views: { added: string[]; removed: string[]; changed: string[] };
  endpoints: { added: string[]; removed: string[]; changed: string[] };
  manifestChanged: boolean;
}

export function diffProjection(): ProjectionDiff {
  return {
    status: 'unavailable',
    views: { added: [], removed: [], changed: [] },
    endpoints: { added: [], removed: [], changed: [] },
    manifestChanged: false,
  };
}
