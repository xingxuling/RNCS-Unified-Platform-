// CSL 全栈投影 — Projection Registry
// 明确每类 IR 节点投影到哪一侧（前端 / 后端 / 共享）
// 当前阶段的"软对齐"：仅作为信息性元数据，未来可由 projection-protocol.csl 驱动

export type ProjectionTarget = 'frontend' | 'backend' | 'shared' | 'skipped';

export interface ProjectionMapping {
  irKey: string;            // ir.* 容器键
  target: ProjectionTarget;
  description: string;
}

/**
 * 当前真投影的映射表
 * 仅覆盖 v0.8 的 5 个核心容器 + v0.9 视图/服务（占位）
 */
export const PROJECTION_REGISTRY: ProjectionMapping[] = [
  { irKey: 'concepts',        target: 'shared',   description: '前端表单字段 + 后端入参 schema' },
  { irKey: 'entities',        target: 'frontend', description: '前端示例数据（默认值填充）' },
  { irKey: 'invariants',      target: 'backend',  description: '后端校验函数' },
  { irKey: 'rules',           target: 'shared',   description: '后端执行 + 前端结果槽展示' },
  { irKey: 'evidences',       target: 'skipped',  description: '本轮不投影,仅作为元数据' },

  // v0.9 主体系统(Phase 2.1 接入)
  { irKey: 'subjects',        target: 'shared',   description: '前端时间线展示 + 后端 stage handler 默认阶段' },
  { irKey: 'stages',          target: 'shared',   description: '前端阶段时间线 + 后端转移判定参考' },
  { irKey: 'transitions',     target: 'backend',  description: 'stage handler 的核心:输入信号 → 输出新阶段' },
  { irKey: 'compiler_layers', target: 'skipped',  description: '占位,Phase 2.2 接入' },
  { irKey: 'regenerations',   target: 'shared',   description: '前端再生事件预览 + 后端转移命中时回传名单' },
  { irKey: 'signals',         target: 'frontend', description: '前端可注入信号清单(下拉 + 强度调节)' },
  { irKey: 'functions',       target: 'shared',   description: 'Phase 2.3 接入:前端派生字段调用 + 后端独立 handler' },
  { irKey: 'templates',       target: 'skipped',  description: '占位,Phase 2 接入' },

  // —— Phase 2.3:第一梯队接入投影 ——
  // 概念级 AI v2 三块
  { irKey: 'concept_blocks',         target: 'frontend', description: '概念块网络节点(blocks 视图)' },
  { irKey: 'proposition_blocks',     target: 'frontend', description: '命题边(blocks 视图)' },
  { irKey: 'relation_blocks',        target: 'frontend', description: '关系边(blocks 视图)' },
  // 太一道法经四件套
  { irKey: 'mapping_tables',         target: 'shared', description: '映射矩阵展示 + OSE 错位边界检查' },
  { irKey: 'closures',               target: 'shared', description: '封口和值校验 + OSE 未闭合检查' },
  { irKey: 'correspondence_chains',  target: 'shared', description: '同位链对齐展示 + OSE 断裂检查' },
  { irKey: 'domain_expansions',      target: 'shared', description: '域展开五因矩阵 + OSE 完整性检查' },
];

export function summarizeRegistry() {
  return {
    frontend: PROJECTION_REGISTRY.filter(m => m.target === 'frontend' || m.target === 'shared').map(m => m.irKey),
    backend:  PROJECTION_REGISTRY.filter(m => m.target === 'backend'  || m.target === 'shared').map(m => m.irKey),
    shared:   PROJECTION_REGISTRY.filter(m => m.target === 'shared').map(m => m.irKey),
    skipped:  PROJECTION_REGISTRY.filter(m => m.target === 'skipped').map(m => m.irKey),
  };
}
