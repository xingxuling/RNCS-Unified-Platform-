// CSL 自举规格 #2：feature-map.csl
// 用 v0.8 子集声明所有 feature flag 及其归属版本、状态、影响范围
// 加载后产出：SpecRegistry.features
//
// Phase 2.3 后续:状态语义升级
//   active     = 已在 dispatch 中真正生效(parser/runtime 接通)
//   preview    = 已接入但仍在打磨(可被 spec-driven dispatch 关闭)
//   experimental = 仅注册占位,parser/runtime 尚未真接
//   disabled   = 显式关闭(spec-driven dispatch 会从词表中剔除)

export const FEATURE_MAP_CSL = `// ===== CSL 自举规格 · feature-map =====
// 元类型：特性（Feature）— 一个可独立开关的语法/语义能力

概念 特性 {
  属性 编号: 文本           // functions / subjects / mapping_tables ...
  属性 中文名: 文本
  属性 所属版本: 文本       // 引用 Version.编号
  属性 状态: 文本           // active / preview / experimental / disabled
  属性 影响层: 文本         // lexer / parser / ir / runtime / ui
  属性 描述: 文本
}

// === v0.9 已实装(active):函数族 + 主体系统 ===

实例 F_FUNCTIONS 属于 特性 {
  编号 = "functions"
  中文名 = "函数"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+runtime"
  描述 = "函数声明与执行：函数 名(参数) { 体 };Phase 2.3 已接派生字段"
}

实例 F_CONDITIONALS 属于 特性 {
  编号 = "conditionals"
  中文名 = "条件分支"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+runtime"
  描述 = "如果/则/否则/否则如果"
}

实例 F_CALL 属于 特性 {
  编号 = "call"
  中文名 = "调用"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+runtime"
  描述 = "在规则动作或函数体内显式调用函数"
}

实例 F_TEMPLATES 属于 特性 {
  编号 = "templates"
  中文名 = "模板"
  所属版本 = "v0.9"
  状态 = "preview"
  影响层 = "parser+ir"
  描述 = "参数化概念模板:已 parse,投影未消费"
}

实例 F_EXPAND 属于 特性 {
  编号 = "expand"
  中文名 = "展开"
  所属版本 = "v0.9"
  状态 = "preview"
  影响层 = "parser+ir"
  描述 = "实例化模板为具体概念:已 parse,投影未消费"
}

实例 F_SUBJECTS 属于 特性 {
  编号 = "subjects"
  中文名 = "主体"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+ir+runtime"
  描述 = "可承载阶段与属性的主体单元(Phase 2.1 已接 stage 视图)"
}

实例 F_SOV_STAGES 属于 特性 {
  编号 = "sovereignty_stages"
  中文名 = "主权阶段"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+ir"
  描述 = "12 主权轮回阶段定义"
}

实例 F_TRANSITIONS 属于 特性 {
  编号 = "stage_transitions"
  中文名 = "阶段转移"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+ir+runtime"
  描述 = "阶段转移：从 A 到 B 触发 条件"
}

实例 F_COMPILER_LAYERS 属于 特性 {
  编号 = "compiler_layers"
  中文名 = "编译层"
  所属版本 = "v0.9"
  状态 = "preview"
  影响层 = "parser+ir"
  描述 = "潜流/浮现/编译/校权/定轨/生成/对接 七层(已 parse,未投影)"
}

实例 F_REGEN 属于 特性 {
  编号 = "regeneration_events"
  中文名 = "再生事件"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+ir+runtime"
  描述 = "失配-诊断-重组-新版本(Phase 2.1 已接)"
}

实例 F_SIGNALS 属于 特性 {
  编号 = "signals"
  中文名 = "信号"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "parser+ir+runtime"
  描述 = "前语言/张力/象征/概念冲动等输入信号(Phase 2.1 已接 stage 触发)"
}

// === Phase 2.3 第一梯队接入(active/preview):升档自 experimental ===

实例 F_CONCEPT_BLOCKS 属于 特性 {
  编号 = "concept_blocks"
  中文名 = "概念块"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "概念级 AI 长期记忆块(Phase 2.3 已接 blocks 视图);spec-driven dispatch 试点开关"
}

实例 F_PROP_BLOCKS 属于 特性 {
  编号 = "proposition_blocks"
  中文名 = "命题块"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "命题块（断言/假设/结论）;Phase 2.3 已接 blocks 视图边"
}

实例 F_REL_BLOCKS 属于 特性 {
  编号 = "relation_blocks"
  中文名 = "关系块"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "关系块（因果/对立/包含）;Phase 2.3 已接 blocks 视图边"
}

实例 F_MAPPING 属于 特性 {
  编号 = "mapping_tables"
  中文名 = "映射表"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "多列同位映射表(Phase 2.3 已接 mapping 视图)"
}

实例 F_SEALING 属于 特性 {
  编号 = "sealing"
  中文名 = "封口"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "总数封口：sum === total 校验(Phase 2.3 已接硬阻塞)"
}

实例 F_COLOC 属于 特性 {
  编号 = "colocation_chains"
  中文名 = "同位链"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "跨域同位映射链(Phase 2.3 已接,断裂触发硬阻塞)"
}

实例 F_DOMAIN_EXP 属于 特性 {
  编号 = "domain_expansion"
  中文名 = "域展开"
  所属版本 = "v0.9"
  状态 = "active"
  影响层 = "lexer+parser+ir+projection"
  描述 = "母法五值 × 应用域 × 五因 递归展开(Phase 2.3 已接)"
}

// === experimental 占位（注册但 parser 不真接） ===

实例 F_UNITS 属于 特性 {
  编号 = "units"
  中文名 = "单元"
  所属版本 = "experimental"
  状态 = "experimental"
  影响层 = "parser+ir"
  描述 = "判断 OS 的最小操作单元"
}

实例 F_ESTABLISH 属于 特性 {
  编号 = "establishment"
  中文名 = "编制"
  所属版本 = "experimental"
  状态 = "experimental"
  影响层 = "parser+ir"
  描述 = "单元集合编制"
}

实例 F_TRADEOFFS 属于 特性 {
  编号 = "tradeoffs"
  中文名 = "权衡"
  所属版本 = "experimental"
  状态 = "experimental"
  影响层 = "parser+ir+runtime"
  描述 = "价值分/代价分权衡评估"
}

实例 F_ENGINES 属于 特性 {
  编号 = "engines"
  中文名 = "引擎"
  所属版本 = "experimental"
  状态 = "experimental"
  影响层 = "parser+ir"
  描述 = "数字文明母体引擎"
}

实例 F_MODULES 属于 特性 {
  编号 = "modules"
  中文名 = "模块"
  所属版本 = "experimental"
  状态 = "experimental"
  影响层 = "parser+ir"
  描述 = "引擎下挂模块"
}

// === v1.0 规划中 ===

实例 F_OSE 属于 特性 {
  编号 = "ose_governance"
  中文名 = "OSE 治理"
  所属版本 = "v1.0"
  状态 = "preview"
  影响层 = "runtime+ui"
  描述 = "认知约束治理层:Phase 1.5/2.0/2.1/2.3 共 14 hook 已接入投影管线"
}

实例 F_BOOTSTRAP 属于 特性 {
  编号 = "spec_driven_dispatch"
  中文名 = "规格驱动 dispatch"
  所属版本 = "v1.0"
  状态 = "preview"
  影响层 = "lexer+parser+runtime"
  描述 = "v1 最小主链:disabled feature 自动从 V09 词表中剔除(已对 concept_blocks 试点)"
}

// === 不变量：feature 表自一致 ===

不变量 编号必填 {
  条件 编号 ≠ ""
}

不变量 影响层必填 {
  条件 影响层 ≠ ""
}

// === 规则：active 必须挂在 v0.9 或 v1.0 上 ===

规则 检查_active特性 {
  条件 候选 ∈ 特性
  且 候选.状态 = "active"
  动作 标记 "已在 dispatch 中生效"
}

规则 检查_disabled特性 {
  条件 候选 ∈ 特性
  且 候选.状态 = "disabled"
  动作 标记 "spec-driven dispatch 将剔除其词表"
}

证据 v09_范围 {
  来源 = "Phase 2.3 收尾会话"
  原文 = "v0.9 实装 11 项 + 第一梯队 7 项均升档为 active/preview;experimental 仅留 5 项占位"
  支持 = F_FUNCTIONS, F_SUBJECTS, F_CONCEPT_BLOCKS, F_MAPPING
}

证据 spec_driven_dispatch_v1 {
  来源 = "spec-driven dispatch v1 启动"
  原文 = "feature 状态真正掌权:dispatch 启动时读 SpecRegistry,disabled feature 自动从 V09 词表剔除;以 concept_blocks 为试点"
  支持 = F_BOOTSTRAP
}
`;
