// CSL 自举规格 #8：ose-protocol.csl
// 用 v0.8 子集声明 OSE 治理 hook 的协议层
// 与代码侧 src/csl/projection/ose-bridge.ts 做软对齐
// 加载方式：tokenize → parse → buildIR → SpecRegistry.oseHooks
//
// Phase 2.3 收尾:补齐 Phase 2.0 / 2.1 / 2.3 共 10 个 active hook

export const OSE_PROTOCOL_CSL = `// ===== CSL 自举规格 · ose-protocol =====
// 元目标：声明 OSE 治理切面的协议层骨架
// 当前版本：v3(覆盖 Phase 1.5 / 2.0 / 2.1 / 2.3 共 14 个 hook)

// ---------- 元类型 1：OSE 切面 ----------

概念 OSE切面 {
  属性 编号: 文本
  属性 中文名: 文本
  属性 描述: 文本
}

实例 A_PROBLEM_DEF 属于 OSE切面 {
  编号 = "problemDefinition"
  中文名 = "问题定义"
  描述 = "检查投影输入是否成立(manifest / 主概念 / 字段)"
}

实例 A_STRUCT_CONSIST 属于 OSE切面 {
  编号 = "structuralConsistency"
  中文名 = "结构一致性"
  描述 = "检查前后端字段集合与表达式引用是否对齐"
}

实例 A_RISKS 属于 OSE切面 {
  编号 = "risks"
  中文名 = "风险提示"
  描述 = "对受限投影 / 恒真规则 / 越界目标显式告警"
}

实例 A_ASSUMPTIONS 属于 OSE切面 {
  编号 = "assumptions"
  中文名 = "假设显式化"
  描述 = "把投影管线的关键假设写进 diagnostics"
}

实例 A_ROUTING 属于 OSE切面 {
  编号 = "routing"
  中文名 = "路由治理"
  描述 = "Phase 2.0:多视图/多 endpoint 路由对齐"
}

实例 A_SUBJECT_SYS 属于 OSE切面 {
  编号 = "subjectSystem"
  中文名 = "主体系统治理"
  描述 = "Phase 2.1/2.2:主体/阶段/信号/再生事件合法性与硬阻塞"
}

实例 A_TIER1_SYNTAX 属于 OSE切面 {
  编号 = "tier1Syntax"
  中文名 = "第一梯队语法治理"
  描述 = "Phase 2.3:函数风险 / 块完整性 / 边界完整性"
}

// ---------- 元类型 2：OSE 治理钩子 ----------

概念 OSE治理钩子 {
  属性 编号: 文本           // 与代码侧 OSEReport 字段名一一对应
  属性 切面: 文本
  属性 阶段: 文本           // Phase 1.5 / 2.0 / 2.1 / 2.2 / 2.3 / planned
  属性 状态: 文本           // active / planned / disabled
  属性 接入点: 文本         // 代码侧函数名
  属性 严重性: 文本         // pass / warn / block / block_with_fix_hint —— 治理级别由规格层决定
  属性 描述: 文本
}

// === Phase 1.5 ===

实例 H_PROBLEM_DEF 属于 OSE治理钩子 {
  编号 = "problemDefinition"
  切面 = "problemDefinition"
  阶段 = "Phase 1.5"
  状态 = "active"
  接入点 = "checkProblemDefinition"
  严重性 = "warn"
  描述 = "manifest / primaryConcept / formFields 缺失时产出 error 或 warn"
}

实例 H_STRUCT_CONSIST 属于 OSE治理钩子 {
  编号 = "structuralConsistency"
  切面 = "structuralConsistency"
  阶段 = "Phase 1.5"
  状态 = "active"
  接入点 = "checkStructuralConsistency"
  严重性 = "warn"
  描述 = "前端字段集合 vs 后端 inputSchema vs 表达式引用三方对齐"
}

实例 H_RISKS 属于 OSE治理钩子 {
  编号 = "risks"
  切面 = "risks"
  阶段 = "Phase 1.5"
  状态 = "active"
  接入点 = "raiseRisks"
  严重性 = "warn"
  描述 = "声明当前为浏览器内解释执行 / 未启完整 OSE / 恒真规则告警"
}

实例 H_ASSUMPTIONS 属于 OSE治理钩子 {
  编号 = "assumptions"
  切面 = "assumptions"
  阶段 = "Phase 1.5"
  状态 = "active"
  接入点 = "surfaceAssumptions"
  严重性 = "pass"
  描述 = "把 web/单主概念/浏览器 handler/最小子集翻译等假设显式化"
}

// === Phase 2.0:路由治理 ===

实例 H_ROUTE_CONSIST 属于 OSE治理钩子 {
  编号 = "routeConsistency"
  切面 = "routing"
  阶段 = "Phase 2.0"
  状态 = "active"
  接入点 = "checkRouteConsistency"
  严重性 = "warn"
  描述 = "视图 ↔ endpoint 对齐(warn 级)"
}

实例 H_MULTI_CONCEPT 属于 OSE治理钩子 {
  编号 = "multiConceptCoverage"
  切面 = "routing"
  阶段 = "Phase 2.0"
  状态 = "active"
  接入点 = "checkMultiConceptCoverage"
  严重性 = "warn"
  描述 = "每个视图的主概念是否声明 + 是否在 .csl 中存在"
}

实例 H_DEAD_ROUTE 属于 OSE治理钩子 {
  编号 = "deadRouteDetection"
  切面 = "routing"
  阶段 = "Phase 2.0"
  状态 = "active"
  接入点 = "checkDeadRoute"
  严重性 = "warn"
  描述 = "入口视图路径必须可路由(warn)"
}

// === Phase 2.1/2.2:主体系统治理 ===

实例 H_STAGE_LEGAL 属于 OSE治理钩子 {
  编号 = "stageLegality"
  切面 = "subjectSystem"
  阶段 = "Phase 2.2"
  状态 = "active"
  接入点 = "checkStageLegality"
  严重性 = "block"
  描述 = "主体当前阶段 / 转移引用 / 视图主体绑定 → error 触发硬阻塞"
}

实例 H_TRANSITION_COMPLETE 属于 OSE治理钩子 {
  编号 = "transitionCompleteness"
  切面 = "subjectSystem"
  阶段 = "Phase 2.1"
  状态 = "active"
  接入点 = "checkTransitionCompleteness"
  严重性 = "warn"
  描述 = "转移引用 / 触发条件 / 阶段可达性(warn)"
}

实例 H_SIGNAL_VALID 属于 OSE治理钩子 {
  编号 = "signalValidity"
  切面 = "subjectSystem"
  阶段 = "Phase 2.1"
  状态 = "active"
  接入点 = "checkSignalValidity"
  严重性 = "warn"
  描述 = "僵尸信号 / 未声明引用 / 强度缺失(warn)"
}

实例 H_REGEN_ISOLATED 属于 OSE治理钩子 {
  编号 = "regenerationIsolation"
  切面 = "subjectSystem"
  阶段 = "Phase 2.1"
  状态 = "active"
  接入点 = "checkRegenerationIsolation"
  严重性 = "warn"
  描述 = "再生事件主体绑定 / 字段完整(warn)"
}

// === Phase 2.3:第一梯队治理 ===

实例 H_FUNC_RISK 属于 OSE治理钩子 {
  编号 = "functionRisk"
  切面 = "tier1Syntax"
  阶段 = "Phase 2.3"
  状态 = "active"
  接入点 = "checkFunctionRisk"
  严重性 = "block"
  描述 = "调用未定义函数 / 参数数量不匹配 → block;空函数体 / 自递归 → warn"
}

实例 H_BLOCK_INTEG 属于 OSE治理钩子 {
  编号 = "blockIntegrity"
  切面 = "tier1Syntax"
  阶段 = "Phase 2.3"
  状态 = "active"
  接入点 = "checkBlockIntegrity"
  严重性 = "block_with_fix_hint"
  描述 = "命题/关系块悬空引用 → block_with_fix_hint;孤立块 → warn"
}

实例 H_BOUND_INTEG 属于 OSE治理钩子 {
  编号 = "boundaryIntegrity"
  切面 = "tier1Syntax"
  阶段 = "Phase 2.3"
  状态 = "active"
  接入点 = "checkBoundaryIntegrity"
  严重性 = "block_with_fix_hint"
  描述 = "映射表错位 / 封口未闭合 / 同位链断裂 → block_with_fix_hint;域展开五因不齐 → warn"
}

// === Phase 2.5:裁决层升级 ===

实例 H_STAGE_REACH 属于 OSE治理钩子 {
  编号 = "stageReachability"
  切面 = "subjectSystem"
  阶段 = "Phase 2.5"
  状态 = "active"
  接入点 = "checkStageReachability"
  严重性 = "block_with_fix_hint"
  描述 = "主体初始阶段未声明 / 转移目标未声明 / 阶段不可达 → block 系列"
}

实例 H_MAPPING_COVERAGE 属于 OSE治理钩子 {
  编号 = "mappingCoverage"
  切面 = "tier1Syntax"
  阶段 = "Phase 2.5"
  状态 = "active"
  接入点 = "checkMappingCoverage"
  严重性 = "block_with_fix_hint"
  描述 = "映射表未声明域 → block_with_fix_hint;空条目 → warn"
}

// === planned 占位 ===

实例 H_FALSE_ANSWER 属于 OSE治理钩子 {
  编号 = "falseAnswerInterception"
  切面 = "structuralConsistency"
  阶段 = "planned"
  状态 = "planned"
  接入点 = "(未实现)"
  严重性 = "pass"
  描述 = "占位:错题真答拦截,需要规则引擎支持"
}

实例 H_VAR_LEAK 属于 OSE治理钩子 {
  编号 = "variableLayerCheck"
  切面 = "structuralConsistency"
  阶段 = "planned"
  状态 = "planned"
  接入点 = "(未实现)"
  严重性 = "pass"
  描述 = "占位:变量漏层检查,需要 IR 层级元数据"
}

实例 H_OUTPUT_BOUND 属于 OSE治理钩子 {
  编号 = "outputBoundary"
  切面 = "risks"
  阶段 = "planned"
  状态 = "planned"
  接入点 = "(未实现)"
  严重性 = "pass"
  描述 = "占位:输出边界管理,防止高密度错误伪装为正确结果"
}

// ---------- 不变量 ----------

不变量 钩子编号必填 {
  条件 编号 != ""
}

不变量 切面必声明 {
  条件 切面 != ""
}

// ---------- 规则 ----------

规则 检查_active钩子 {
  条件 候选 ∈ OSE治理钩子 且 候选.状态 = "active"
  动作 标记 "已接入投影管线,需与代码侧 OSEReport 字段对齐"
}

规则 检查_planned钩子 {
  条件 候选 ∈ OSE治理钩子 且 候选.状态 = "planned"
  动作 标记 "占位,留待后续接入"
}

// ---------- 证据 ----------

证据 协议出处 {
  来源 = "Phase 1.5 → 2.3 累积"
  原文 = "OSE 14 hook 已全部进入 projection pipeline 并产出 diagnostics"
  支持 = H_PROBLEM_DEF, H_STAGE_LEGAL, H_BLOCK_INTEG
}

证据 软对齐边界 {
  来源 = "工程纪律:协议层先于实现层稳定"
  原文 = "本规格仅声明 hook 协议;mismatch 只产 warn 不 fail build"
  支持 = H_FALSE_ANSWER, H_OUTPUT_BOUND
}
`;
