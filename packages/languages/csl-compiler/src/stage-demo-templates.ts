// CSL P3 — 阶段流程引擎演示壳：内置三个最小演示模板
//
// 纪律:
//   - 仅承担"演示数据"职责,不承担编译/治理逻辑
//   - 模板源码必须可被 runCSL 完整解析,演示价值靠真实编译结果驱动
//   - 三个模板各自命中一个差异点:正常推进 / 治理阻断 / 旧版本只读

import type { GrammarVersion } from './versions/registry';

export type DemoHighlight =
  | 'normal_advance'        // 流程能推进,OSE pass
  | 'governance_blocked'    // 治理层阻断 transition
  | 'read_only_legacy';     // 老版本对象,read_only 锁定

export interface StageDemoTemplate {
  id: string;
  name: string;
  /** 一句话定位 — 让外部用户立刻看到差异点 */
  tagline: string;
  /** 这个 demo 想突出什么 */
  highlight: DemoHighlight;
  /** 模板对应的语法版本 */
  version: GrammarVersion;
  /** 演示场景下,期望用户看到的关键事实 */
  expectations: string[];
  /** CSL 源码 */
  code: string;
  /** P3:模拟"导入旧版本只读对象"时使用,真实 read_only 由 workspace.lockState 决定 */
  simulateReadOnly?: boolean;
}

// ---------- Demo A:正常可推进流程 ----------

const DEMO_A_NORMAL = `// ===== Demo A:正常可推进流程 =====
// 主体在「借权」阶段,触发条件「边界感 > 50」满足
// 阶段引擎应判定:可单步推进至「摄权」,OSE pass

主权阶段 借权 { 序号 = 2, 关键词 = (借壳, 依附), 描述 = "依附他人框架" }
主权阶段 摄权 { 序号 = 6, 关键词 = (收权, 中枢), 描述 = "形成自身秩序中心" }
主权阶段 定权 { 序号 = 11, 关键词 = (稳定, 体系), 描述 = "新主权稳定为秩序中枢" }

阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }
阶段转移 摄到定 { 从 摄权 到 定权 触发 体系成熟度 > 70 }

主体 创业者A {
  当前阶段 = 借权
  边界感 = 75
  体系成熟度 = 85
}

证据 来源 {
  来源 = "P3 演示模板 A"
  原文 = "条件满足 → 单步可推进 → 治理无拦截 → 自动预演贯通终点"
  支持 = 创业者A
}
`;

// ---------- Demo B:治理阻断流程 ----------
//
// 这里的关键不是"条件不满足",而是 OSE 层主动拦截:
// 我们故意构造一个 transition 指向"未声明的目标阶段",
// 触发 OSE 的 stageReachability / target_undefined 类阻断。
// runtime 主路径会输出 oseVerdict.blocked = true,
// stage-engine 的 enforce 会把 halt_reason 改为 'governance_blocked'。

const DEMO_B_BLOCKED = `// ===== Demo B:治理阻断流程 =====
// 故意构造缺陷:阶段转移指向未声明的目标阶段「真权」
// → OSE policy 命中 → RuntimeGuard 阻断 transition
// → 用户能看到:谁在拦、为什么拦、怎么修

主权阶段 借权 { 序号 = 2, 关键词 = (借壳, 依附), 描述 = "依附他人框架" }
主权阶段 摄权 { 序号 = 6, 关键词 = (收权, 中枢), 描述 = "形成自身秩序中心" }

// ⚠ 目标阶段「真权」未在上方声明 — 治理层将识别为 stage_undefined
阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }
阶段转移 摄到真 { 从 摄权 到 真权 触发 觉察度 > 60 }

主体 待审主体 {
  当前阶段 = 借权
  边界感 = 75
  觉察度 = 80
}

证据 阻断说明 {
  来源 = "P3 演示模板 B"
  原文 = "治理层应识别未声明的目标阶段并阻断推进,而不是盲目放行"
  支持 = 待审主体
}
`;

// ---------- Demo C:旧版本只读流程 ----------
//
// Demo C 在 UI 上以"模拟导入旧版本运行包"的形式展示:
// - workspace 模拟 read_only
// - 编辑器禁止编辑
// - 不能导出当前版本运行包
// - 但可以查看、运行、解释、另存
//
// 源码本身使用 v0.8 基础语法,确保跨版本兼容,模拟"老 bundle 还能跑"。

const DEMO_C_READONLY = `// ===== Demo C:旧版本只读流程(模拟从老运行包导入) =====
// 此对象标记为 read_only,可查看 / 可运行 / 不可编辑 / 不可重新导出当前版本产物
// 真实场景:从 v0.8 老 bundle 导入到 v0.9 系统,版本指纹不一致 → 锁为只读

主权阶段 借权 { 序号 = 2, 关键词 = (借壳, 依附), 描述 = "依附他人框架" }
主权阶段 摄权 { 序号 = 6, 关键词 = (收权, 中枢), 描述 = "形成自身秩序中心" }

阶段转移 借到摄 { 从 借权 到 摄权 触发 边界感 > 50 }

主体 老主体 {
  当前阶段 = 借权
  边界感 = 60
}

证据 旧版来源 {
  来源 = "P3 演示模板 C — 模拟旧版本运行包"
  原文 = "对象可被加载、可被解释,但因版本指纹不匹配而被锁定为只读"
  支持 = 老主体
}
`;

export const STAGE_DEMO_TEMPLATES: StageDemoTemplate[] = [
  {
    id: 'demo-a-normal',
    name: 'A · 正常可推进',
    tagline: '主体在合法路径上,治理层放行,可一步步走到终点',
    highlight: 'normal_advance',
    version: 'v0.9',
    expectations: [
      '至少 1 个主体当前阶段已定义',
      '存在 ready 状态的候选转移',
      'halt_reason ≠ governance_blocked',
      'OSE 总状态:pass(或仅 warn)',
    ],
    code: DEMO_A_NORMAL,
  },
  {
    id: 'demo-b-blocked',
    name: 'B · 治理阻断',
    tagline: '阶段转移指向未声明的阶段 → 治理层主动阻断,不是盲目放行',
    highlight: 'governance_blocked',
    version: 'v0.9',
    expectations: [
      '阶段转移目标「真权」未声明',
      'OSE 报告应出现 stage 相关 block',
      '主体 halt_reason = governance_blocked',
      'governance[] 数组非空,含 policyId / reason / fixHint',
    ],
    code: DEMO_B_BLOCKED,
  },
  {
    id: 'demo-c-readonly',
    name: 'C · 旧版只读',
    tagline: '模拟从旧 bundle 导入:可看 / 可解释 / 不能改 / 不能直接出当前版本产物',
    highlight: 'read_only_legacy',
    version: 'v0.8',
    expectations: [
      '编辑器为只读态(光标 / 输入被禁)',
      '导出运行包按钮在演示壳中被禁用',
      '可"另存为可编辑"创建新工作区',
      '版本身份显示为 v0.8 旧版,与当前系统版本对照可见',
    ],
    code: DEMO_C_READONLY,
    simulateReadOnly: true,
  },
];

export function getDemoTemplate(id: string): StageDemoTemplate | null {
  return STAGE_DEMO_TEMPLATES.find(t => t.id === id) ?? null;
}
