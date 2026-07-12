// CSL 全栈投影 — Demo 源码常量
// 一份 .csl(业务规格) + 一份 .cslapp(应用本体) 拼接
import { SUBJECT_STAGE_CSL, SUBJECT_STAGE_CSLAPP, SUBJECT_STAGE_FULL_SOURCE } from '../examples/v09-subject-stage-app';
import { FUNCTION_GRADING_CSL, FUNCTION_GRADING_CSLAPP, FUNCTION_GRADING_FULL_SOURCE } from '../examples/v09-function-grading';
import { CONCEPT_BLOCKS_CSL, CONCEPT_BLOCKS_CSLAPP, CONCEPT_BLOCKS_FULL_SOURCE } from '../examples/v09-concept-blocks';
import { MAPPING_TABLE_CSL, MAPPING_TABLE_CSLAPP, MAPPING_TABLE_FULL_SOURCE } from '../examples/v09-mapping-table';

// ============================================================
// Demo 1: Material Insight — 数值域 + 数学比较
// ============================================================

export const MATERIAL_CSL = `// ===== material.csl =====
// 业务概念 + 不变量 + 规则,纯 v0.8 子集

概念 材料 {
  属性 名称: 文本
  属性 密度: 数值
  属性 导电率: 数值
}

不变量 密度有效 {
  条件 密度 > 0
}

不变量 导电率有效 {
  条件 导电率 >= 0
}

规则 导电优秀 {
  条件 候选 ∈ 材料 且 候选.导电率 > 1000000
  动作 标记 "导电优秀"
}

规则 导电不足 {
  条件 候选 ∈ 材料 且 候选.导电率 < 1000
  动作 标记 "导电不足"
}
`;

export const MATERIAL_CSLAPP = `// ===== material-insight.cslapp =====
// 应用本体,用 v0.8 概念+实例 表达
// 「概念 应用」是 .cslapp 约定的元概念

概念 应用 {
  属性 名称: 文本
  属性 版本: 文本
  属性 入口视图: 文本
  属性 目标环境: 文本
  属性 前端框架: 文本
  属性 后端框架: 文本
  属性 包含规格: 文本
}

实例 MaterialInsight 属于 应用 {
  名称 = "Material Insight Demo"
  版本 = "0.1"
  入口视图 = "材料评估页"
  目标环境 = "web"
  前端框架 = "react-ts"
  后端框架 = "node-ts"
  包含规格 = "material.csl"
}
`;

export const MATERIAL_INSIGHT_FULL_SOURCE =
  MATERIAL_CSL + '\n' + MATERIAL_CSLAPP;

// ============================================================
// Demo 2: Role Access Audit — 字符串域 + 等值/不等判定
// 选择动机: 与材料 demo 的"数值阈值"完全不同 ——
//   字段为字符串、规则用相等/不等、不变量用非空 (转化为 != ""),
//   证明投影协议不依赖数值领域。
// ============================================================

export const ROLE_CSL = `// ===== role.csl =====
// 角色访问审计 - 字符串域 + 相等判定,与材料 demo 形成对照

概念 访问请求 {
  属性 用户: 文本
  属性 角色: 文本
  属性 资源: 文本
  属性 操作: 文本
  属性 环境: 文本
}

不变量 用户必填 {
  条件 用户 != ""
}

不变量 角色必填 {
  条件 角色 != ""
}

不变量 资源必填 {
  条件 资源 != ""
}

规则 管理员放行 {
  条件 候选 ∈ 访问请求 且 候选.角色 = "管理员"
  动作 标记 "允许"
}

规则 访客写入拦截 {
  条件 候选 ∈ 访问请求 且 候选.角色 = "访客" 且 候选.操作 = "写入"
  动作 标记 "拒绝"
}

规则 生产环境删除拦截 {
  条件 候选 ∈ 访问请求 且 候选.环境 = "生产" 且 候选.操作 = "删除"
  动作 标记 "高危拦截"
}

规则 员工只读放行 {
  条件 候选 ∈ 访问请求 且 候选.角色 = "员工" 且 候选.操作 = "读取"
  动作 标记 "允许"
}
`;

export const ROLE_CSLAPP = `// ===== role-access-audit.cslapp =====

概念 应用 {
  属性 名称: 文本
  属性 版本: 文本
  属性 入口视图: 文本
  属性 目标环境: 文本
  属性 前端框架: 文本
  属性 后端框架: 文本
  属性 包含规格: 文本
}

实例 RoleAccessAudit 属于 应用 {
  名称 = "Role Access Audit Demo"
  版本 = "0.1"
  入口视图 = "访问审计页"
  目标环境 = "web"
  前端框架 = "react-ts"
  后端框架 = "node-ts"
  包含规格 = "role.csl"
}
`;

export const ROLE_ACCESS_FULL_SOURCE = ROLE_CSL + '\n' + ROLE_CSLAPP;

// ============================================================
// 注册表
// ============================================================

export interface DemoSpec {
  id: string;
  name: string;
  cslSource: string;
  cslappSource: string;
  fullSource: string;
  description: string;
}

export const DEMO_REGISTRY: DemoSpec[] = [
  {
    id: 'material-insight',
    name: 'Material Insight Demo',
    cslSource: MATERIAL_CSL,
    cslappSource: MATERIAL_CSLAPP,
    fullSource: MATERIAL_INSIGHT_FULL_SOURCE,
    description: '材料导电率评估 — 数值字段 + 数学比较 + 2 不变量 + 2 规则',
  },
  {
    id: 'role-access-audit',
    name: 'Role Access Audit Demo',
    cslSource: ROLE_CSL,
    cslappSource: ROLE_CSLAPP,
    fullSource: ROLE_ACCESS_FULL_SOURCE,
    description: '角色访问审计 — 字符串字段 + 相等/不等判定 + 3 不变量 + 4 规则',
  },
  {
    id: 'subject-stage',
    name: 'Subject Stage Demo (主体状态机)',
    cslSource: SUBJECT_STAGE_CSL,
    cslappSource: SUBJECT_STAGE_CSLAPP,
    fullSource: SUBJECT_STAGE_FULL_SOURCE,
    description: 'Phase 2.1 · 创业者主权阶段 — 主体 + 3 阶段 + 2 转移 + 2 信号 + 1 再生事件,使用 stage 模式视图',
  },
  {
    id: 'function-grading',
    name: 'Function Grading Demo (概念计算型)',
    cslSource: FUNCTION_GRADING_CSL,
    cslappSource: FUNCTION_GRADING_CSLAPP,
    fullSource: FUNCTION_GRADING_FULL_SOURCE,
    description: 'Phase 2.3 · 函数原语 — 学生分数 + 评级() 函数派生标签,演示概念计算型应用',
  },
  {
    id: 'concept-blocks',
    name: 'Concept Blocks Demo (多块式判断)',
    cslSource: CONCEPT_BLOCKS_CSL,
    cslappSource: CONCEPT_BLOCKS_CSLAPP,
    fullSource: CONCEPT_BLOCKS_FULL_SOURCE,
    description: 'Phase 2.3 · 概念块/命题块/关系块 — 主权-代理-边界 最小知识网络',
  },
  {
    id: 'mapping-table',
    name: 'Mapping Table Demo (跨域映射推演)',
    cslSource: MAPPING_TABLE_CSL,
    cslappSource: MAPPING_TABLE_CSLAPP,
    fullSource: MAPPING_TABLE_FULL_SOURCE,
    description: 'Phase 2.3 · 映射表 + 封口 + 同位链 + 域展开 — 五行五因跨域映射',
  },
];
