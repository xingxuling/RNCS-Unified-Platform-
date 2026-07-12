// CSL 自举规格 #7：projection-protocol.csl
// 用 v0.8 子集表达 CSL → Web 全栈投影协议 v1
// 加载方式：tokenize → parse → buildIR → SpecRegistry.projectionTargets / projectionFields

export const PROJECTION_PROTOCOL_CSL = `// ===== CSL 自举规格 · projection-protocol =====
// 元目标：声明 IR 节点投影到前端 / 后端 / 共享 / 跳过
// 当前版本：v1（仅 Web,React-TS + Node-TS）

// ---------- 元类型 1：投影目标 ----------

概念 投影目标 {
  属性 编号: 文本           // frontend / backend / shared / skipped
  属性 中文名: 文本
  属性 描述: 文本
}

实例 T_FRONTEND 属于 投影目标 {
  编号 = "frontend"
  中文名 = "前端"
  描述 = "投影为 React + TypeScript 组件"
}

实例 T_BACKEND 属于 投影目标 {
  编号 = "backend"
  中文名 = "后端"
  描述 = "投影为 Node + TypeScript handler 函数"
}

实例 T_SHARED 属于 投影目标 {
  编号 = "shared"
  中文名 = "共享"
  描述 = "前后端都需消费此节点"
}

实例 T_SKIPPED 属于 投影目标 {
  编号 = "skipped"
  中文名 = "跳过"
  描述 = "本轮 Phase 1 不投影,留给后续阶段"
}

// ---------- 元类型 2：投影映射 ----------

概念 投影映射 {
  属性 IR键: 文本           // ir.* 容器键名
  属性 投影到: 文本         // 引用 投影目标.编号
  属性 用途: 文本
  属性 阶段: 文本           // Phase 1 / Phase 2 / experimental
}

// === Phase 1 真投影 ===

实例 M_CONCEPTS 属于 投影映射 {
  IR键 = "concepts"
  投影到 = "shared"
  用途 = "前端表单字段定义 + 后端入参 schema"
  阶段 = "Phase 1"
}

实例 M_ENTITIES 属于 投影映射 {
  IR键 = "entities"
  投影到 = "frontend"
  用途 = "表单默认值与示例数据"
  阶段 = "Phase 1"
}

实例 M_INVARIANTS 属于 投影映射 {
  IR键 = "invariants"
  投影到 = "backend"
  用途 = "后端校验函数（clauses → JS 表达式）"
  阶段 = "Phase 1"
}

实例 M_RULES 属于 投影映射 {
  IR键 = "rules"
  投影到 = "shared"
  用途 = "后端规则评估 + 前端结果槽展示"
  阶段 = "Phase 1"
}

实例 M_EVIDENCES 属于 投影映射 {
  IR键 = "evidences"
  投影到 = "skipped"
  用途 = "本轮不投影,仅作为规格元数据"
  阶段 = "Phase 1"
}

// === Phase 2 占位 ===

实例 M_SUBJECTS 属于 投影映射 {
  IR键 = "subjects"
  投影到 = "skipped"
  用途 = "占位：Phase 2 投影为前端主体卡片 + 后端阶段状态机"
  阶段 = "Phase 2"
}

实例 M_STAGES 属于 投影映射 {
  IR键 = "stages"
  投影到 = "skipped"
  用途 = "占位：Phase 2 投影为前端阶段时间线"
  阶段 = "Phase 2"
}

实例 M_FUNCTIONS 属于 投影映射 {
  IR键 = "functions"
  投影到 = "skipped"
  用途 = "占位：Phase 2 投影为前端工具函数与后端 helper"
  阶段 = "Phase 2"
}

// ---------- 元类型 3：投影字段 ----------

概念 投影字段 {
  属性 编号: 文本
  属性 协议: 文本           // FrontendProjection / BackendProjection
  属性 字段名: 文本
  属性 类型: 文本
  属性 描述: 文本
}

// Frontend Projection v1 字段
实例 FP_COMPONENT_NAME 属于 投影字段 {
  编号 = "fp.componentName"
  协议 = "FrontendProjection"
  字段名 = "componentName"
  类型 = "string"
  描述 = "生成的 React 组件名（PascalCase）"
}

实例 FP_FORM_FIELDS 属于 投影字段 {
  编号 = "fp.formFields"
  协议 = "FrontendProjection"
  字段名 = "formFields"
  类型 = "FormField[]"
  描述 = "表单字段列表,从主概念属性派生"
}

实例 FP_ENDPOINT 属于 投影字段 {
  编号 = "fp.submitEndpoint"
  协议 = "FrontendProjection"
  字段名 = "submitEndpoint"
  类型 = "string"
  描述 = "提交目标 API 路径,与后端 endpoint 对齐"
}

// Backend Projection v1 字段
实例 BP_HANDLER_NAME 属于 投影字段 {
  编号 = "bp.handlerName"
  协议 = "BackendProjection"
  字段名 = "handlerName"
  类型 = "string"
  描述 = "Node handler 导出函数名"
}

实例 BP_INPUT_SCHEMA 属于 投影字段 {
  编号 = "bp.inputSchema"
  协议 = "BackendProjection"
  字段名 = "inputSchema"
  类型 = "Record<string, 'string'|'number'>"
  描述 = "POST 入参类型 schema,从主概念属性派生"
}

实例 BP_INVARIANT_CHECKS 属于 投影字段 {
  编号 = "bp.invariantChecks"
  协议 = "BackendProjection"
  字段名 = "invariantChecks"
  类型 = "InvariantCheck[]"
  描述 = "不变量校验函数列表,clauses 翻译为 JS 表达式"
}

实例 BP_RULE_EVALUATIONS 属于 投影字段 {
  编号 = "bp.ruleEvaluations"
  协议 = "BackendProjection"
  字段名 = "ruleEvaluations"
  类型 = "RuleEvaluation[]"
  描述 = "规则评估列表,命中收集标记标签"
}

// ---------- 不变量 ----------

不变量 IR键必填 {
  条件 IR键 ≠ ""
}

不变量 投影目标必填 {
  条件 投影到 ≠ ""
}

// ---------- 规则 ----------

规则 检查_Phase1激活 {
  条件 候选 ∈ 投影映射 且 候选.阶段 = "Phase 1"
  动作 标记 "本轮真投影"
}

规则 检查_未来阶段 {
  条件 候选 ∈ 投影映射 且 候选.投影到 = "skipped"
  动作 标记 "占位,后续阶段接入"
}

// ---------- 证据 ----------

证据 协议设计出处 {
  来源 = "Full-Stack Mother Language Mode 实施会话"
  原文 = "让同一份 CSL + .cslapp 规格,投影出前端 React 代码 + 后端 Node/TS handler 代码"
  支持 = M_CONCEPTS, M_INVARIANTS, M_RULES
}

证据 边界声明 {
  来源 = "Phase 1 范围控制"
  原文 = "本轮只做 Web 全栈,不做桌面/移动壳;只做前端代码生成与浏览器内运行,不启真 Node 进程"
  支持 = T_FRONTEND, T_BACKEND
}
`;
