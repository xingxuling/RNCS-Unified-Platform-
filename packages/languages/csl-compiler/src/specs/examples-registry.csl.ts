// CSL 自举规格 #5：examples-registry.csl
// 用 v0.8 子集声明所有内置示例的版本绑定与可运行状态
// 加载后产出：SpecRegistry.examples（与代码层 EXAMPLES 数组对齐）

export const EXAMPLES_REGISTRY_CSL = `// ===== CSL 自举规格 · examples-registry =====
// 元类型：示例（Example）— 一份内置 CSL 程序的元数据

概念 示例 {
  属性 编号: 文本             // 与代码层 EXAMPLES.id 对齐
  属性 名称: 文本
  属性 所属版本: 文本         // 引用 Version.编号
  属性 依赖特性: 文本         // 逗号分隔的 Feature.编号 列表
  属性 状态: 文本             // runnable / disabled / experimental
  属性 灰显: 文本             // "true" / "false"
  属性 说明: 文本
}

// ============== v0.8 stable ==============

实例 EX_MATERIAL 属于 示例 {
  编号 = "material"
  名称 = "材料科学（基础）"
  所属版本 = "v0.8"
  依赖特性 = ""
  状态 = "runnable"
  灰显 = "false"
  说明 = "v0.8 默认示例：概念/实例/不变量/规则/证据"
}

实例 EX_LEGAL 属于 示例 {
  编号 = "legal"
  名称 = "法律条款"
  所属版本 = "v0.8"
  依赖特性 = ""
  状态 = "runnable"
  灰显 = "false"
  说明 = "合同适用性判断（不含函数）"
}

实例 EX_RECIPE 属于 示例 {
  编号 = "recipe"
  名称 = "食谱推荐"
  所属版本 = "v0.8"
  依赖特性 = ""
  状态 = "runnable"
  灰显 = "false"
  说明 = "食材匹配与菜品标记"
}

// ============== v0.9 ==============

实例 EX_V09_FN 属于 示例 {
  编号 = "v09-functions"
  名称 = "v0.9 · 函数 + 模板"
  所属版本 = "v0.9"
  依赖特性 = "functions, conditionals, templates, expand"
  状态 = "runnable"
  灰显 = "false"
  说明 = "函数/条件/模板/展开 第一批"
}

实例 EX_V09_STAGES 属于 示例 {
  编号 = "v09-stages"
  名称 = "v0.9 · 主体 + 阶段"
  所属版本 = "v0.9"
  依赖特性 = "subjects, sovereignty_stages, stage_transitions, compiler_layers, signals, regeneration_events"
  状态 = "runnable"
  灰显 = "false"
  说明 = "主体/主权阶段/阶段转移/编译层/信号/再生事件"
}

实例 EX_MEDICAL 属于 示例 {
  编号 = "medical"
  名称 = "医学诊断"
  所属版本 = "v0.9"
  依赖特性 = "functions, conditionals"
  状态 = "runnable"
  灰显 = "false"
  说明 = "函数 + 条件分支"
}

实例 EX_SOV 属于 示例 {
  编号 = "sovereignty"
  名称 = "主权轮回 v1"
  所属版本 = "v0.9"
  依赖特性 = "subjects, sovereignty_stages, stage_transitions"
  状态 = "runnable"
  灰显 = "false"
  说明 = "12 阶段 + 阶段转移"
}

实例 EX_COMPILER 属于 示例 {
  编号 = "compiler"
  名称 = "潜意识编译层"
  所属版本 = "v0.9"
  依赖特性 = "compiler_layers, signals"
  状态 = "runnable"
  灰显 = "false"
  说明 = "编译层 + 信号"
}

实例 EX_AIE 属于 示例 {
  编号 = "aie"
  名称 = "AIE 再生引擎"
  所属版本 = "v0.9"
  依赖特性 = "regeneration_events, stage_transitions"
  状态 = "runnable"
  灰显 = "false"
  说明 = "再生事件 + 阶段转移"
}

// ============== experimental（disabled） ==============

实例 EX_TAIYI 属于 示例 {
  编号 = "taiyi"
  名称 = "太一道法经 v1"
  所属版本 = "experimental"
  依赖特性 = "mapping_tables, sealing, colocation_chains, domain_expansion"
  状态 = "disabled"
  灰显 = "true"
  说明 = "映射表/封口/同位链/域展开"
}

实例 EX_DUHENG 属于 示例 {
  编号 = "duheng"
  名称 = "杜衡界 v1"
  所属版本 = "experimental"
  依赖特性 = "units, establishment, tradeoffs"
  状态 = "disabled"
  灰显 = "true"
  说明 = "单元/编制/权衡"
}

实例 EX_CONCEPTAI 属于 示例 {
  编号 = "conceptai"
  名称 = "概念 AI v1"
  所属版本 = "experimental"
  依赖特性 = "functions"
  状态 = "disabled"
  灰显 = "true"
  说明 = "基于函数原语"
}

实例 EX_CIVMATRIX 属于 示例 {
  编号 = "civmatrix"
  名称 = "数字文明母体 v1"
  所属版本 = "experimental"
  依赖特性 = "engines, modules"
  状态 = "disabled"
  灰显 = "true"
  说明 = "引擎/模块"
}

实例 EX_LOCALAI 属于 示例 {
  编号 = "localai"
  名称 = "本地概念级 AI v2"
  所属版本 = "experimental"
  依赖特性 = "concept_blocks, proposition_blocks, relation_blocks"
  状态 = "disabled"
  灰显 = "true"
  说明 = "概念块/命题块/关系块"
}

实例 EX_SELFUPGRADE 属于 示例 {
  编号 = "selfupgrade"
  名称 = "CSL 自举 v3"
  所属版本 = "experimental"
  依赖特性 = ""
  状态 = "disabled"
  灰显 = "true"
  说明 = "元程序原语"
}

// ============== Phase 2.4 · 投影示例 (ProjectionPanel demos) ==============
// 与 src/csl/projection/demo-source.ts DEMO_REGISTRY 1:1 对齐
// 任一缺失即 error,Playground 与 ProjectionPanel 共用同一规格主权

概念 投影示例 {
  属性 编号: 文本             // 与 DEMO_REGISTRY[].id 对齐
  属性 名称: 文本
  属性 所属版本: 文本
  属性 状态: 文本             // runnable / disabled
  属性 说明: 文本
}

实例 PD_MATERIAL_INSIGHT 属于 投影示例 {
  编号 = "material-insight"
  名称 = "Material Insight Demo"
  所属版本 = "v0.8"
  状态 = "runnable"
  说明 = "数值字段 + 数学比较 + 不变量 + 规则"
}

实例 PD_ROLE_ACCESS 属于 投影示例 {
  编号 = "role-access-audit"
  名称 = "Role Access Audit Demo"
  所属版本 = "v0.8"
  状态 = "runnable"
  说明 = "字符串字段 + 相等/不等判定"
}

实例 PD_SUBJECT_STAGE 属于 投影示例 {
  编号 = "subject-stage"
  名称 = "Subject Stage Demo"
  所属版本 = "v0.9"
  状态 = "runnable"
  说明 = "主体 + 阶段 + 转移 + 信号 + 再生事件 (stage 视图)"
}

实例 PD_FUNCTION_GRADING 属于 投影示例 {
  编号 = "function-grading"
  名称 = "Function Grading Demo"
  所属版本 = "v0.9"
  状态 = "runnable"
  说明 = "函数原语 + 派生字段 (concept calculation)"
}

实例 PD_CONCEPT_BLOCKS 属于 投影示例 {
  编号 = "concept-blocks"
  名称 = "Concept Blocks Demo"
  所属版本 = "v0.9"
  状态 = "runnable"
  说明 = "概念块/命题块/关系块 (blocks 视图)"
}

实例 PD_MAPPING_TABLE 属于 投影示例 {
  编号 = "mapping-table"
  名称 = "Mapping Table Demo"
  所属版本 = "v0.9"
  状态 = "runnable"
  说明 = "映射表/封口/同位链/域展开 (mapping 视图)"
}

// === 不变量：示例编号必填 ===

不变量 编号必填 {
  条件 编号 ≠ ""
}

// === 规则：v0.8 示例不应声明 v0.9 特性依赖 ===

规则 检查_v08纯净 {
  条件 候选 ∈ 示例
  且 候选.所属版本 = "v0.8"
  且 候选.依赖特性 ≠ ""
  动作 标记 "v0.8 示例不应依赖任何 feature flag"
}

证据 双向对齐 {
  来源 = "src/csl/examples.ts EXAMPLES 数组"
  原文 = "本规格文件与代码层 EXAMPLES 数组的 id/version/requiredFeatures 字段一一对齐"
  支持 = EX_MATERIAL, EX_V09_FN, EX_V09_STAGES
}
`;
