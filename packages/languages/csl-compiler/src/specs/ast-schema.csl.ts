// CSL 自举规格 #3：ast-schema.csl
// 用 v0.8 子集描述 CSL 自身（v0.8 + v0.9）的 AST 节点定义
// 加载后产出：SpecRegistry.astNodes
//
// 字段记法约定：
//   字段列表 = "name:type, name:type, ..." 用单字符串承载，避免依赖 v0.9 列表语法
//   类型可写：文本/数值/标识符/节点[]/节点

export const AST_SCHEMA_CSL = `// ===== CSL 自举规格 · ast-schema =====
// 元类型：AST 节点（ASTNode）— 描述一个语法树节点的形态

概念 AST节点 {
  属性 节点名: 文本
  属性 所属特性: 文本       // 引用 Feature.编号；空字符串表示 v0.8 核心
  属性 字段列表: 文本       // 形如 "name:文本, body:节点[]"
  属性 顶层声明: 文本       // "true" 表示可以出现在 Program.body 顶层
  属性 描述: 文本
}

// ============== v0.8 核心节点 ==============

实例 N_PROGRAM 属于 AST节点 {
  节点名 = "Program"
  所属特性 = ""
  字段列表 = "body:节点[]"
  顶层声明 = "false"
  描述 = "程序根节点"
}

实例 N_CONCEPT_DECL 属于 AST节点 {
  节点名 = "ConceptDecl"
  所属特性 = ""
  字段列表 = "name:文本, parent:文本, body:节点[]"
  顶层声明 = "true"
  描述 = "概念声明"
}

实例 N_ENTITY_DECL 属于 AST节点 {
  节点名 = "EntityDecl"
  所属特性 = ""
  字段列表 = "name:文本, concept:文本, body:节点[]"
  顶层声明 = "true"
  描述 = "实例声明"
}

实例 N_ATTRIBUTE_DECL 属于 AST节点 {
  节点名 = "AttributeDecl"
  所属特性 = ""
  字段列表 = "name:文本, value_type:文本, type_args:对象"
  顶层声明 = "false"
  描述 = "属性声明（嵌在概念体内）"
}

实例 N_INVARIANT_DECL 属于 AST节点 {
  节点名 = "InvariantDecl"
  所属特性 = ""
  字段列表 = "name:文本, scope:文本, clauses:节点[]"
  顶层声明 = "true"
  描述 = "不变量块"
}

实例 N_RULE_DECL 属于 AST节点 {
  节点名 = "RuleDecl"
  所属特性 = ""
  字段列表 = "name:文本, conditions:节点[], actions:节点[], priority:文本"
  顶层声明 = "true"
  描述 = "规则块"
}

实例 N_EVIDENCE_DECL 属于 AST节点 {
  节点名 = "EvidenceDecl"
  所属特性 = ""
  字段列表 = "name:文本, source:文本, snippet:文本, supports:文本[]"
  顶层声明 = "true"
  描述 = "证据锚点"
}

实例 N_CONDITION_EXPR 属于 AST节点 {
  节点名 = "ConditionExpr"
  所属特性 = ""
  字段列表 = "left:文本, op:文本, right:任意"
  顶层声明 = "false"
  描述 = "条件表达式：left op right"
}

实例 N_ACTION_EXPR 属于 AST节点 {
  节点名 = "ActionExpr"
  所属特性 = ""
  字段列表 = "action_type:文本, payload:对象"
  顶层声明 = "false"
  描述 = "动作表达式：mark/exclude/return/call"
}

// ============== v0.9 扩展节点 ==============

实例 N_FUNCTION_DECL 属于 AST节点 {
  节点名 = "FunctionDecl"
  所属特性 = "functions"
  字段列表 = "name:文本, params:文本[], body:节点[]"
  顶层声明 = "true"
  描述 = "函数声明"
}

实例 N_IF_EXPR 属于 AST节点 {
  节点名 = "IfExpr"
  所属特性 = "conditionals"
  字段列表 = "condition:节点, then_branch:节点[], else_if_branches:节点[], else_branch:节点[]"
  顶层声明 = "false"
  描述 = "如果/否则如果/否则"
}

实例 N_CALL_EXPR 属于 AST节点 {
  节点名 = "FunctionCallExpr"
  所属特性 = "call"
  字段列表 = "name:文本, args:文本[]"
  顶层声明 = "false"
  描述 = "函数调用表达式"
}

实例 N_TEMPLATE_DECL 属于 AST节点 {
  节点名 = "TemplateDecl"
  所属特性 = "templates"
  字段列表 = "name:文本, type_params:文本[], body:节点[]"
  顶层声明 = "true"
  描述 = "模板声明"
}

实例 N_TEMPLATE_EXPAND 属于 AST节点 {
  节点名 = "TemplateExpand"
  所属特性 = "expand"
  字段列表 = "template_name:文本, type_args:文本[], target_name:文本"
  顶层声明 = "true"
  描述 = "模板展开"
}

实例 N_SUBJECT_DECL 属于 AST节点 {
  节点名 = "SubjectDecl"
  所属特性 = "subjects"
  字段列表 = "name:文本, current_stage:文本, attributes:对象"
  顶层声明 = "true"
  描述 = "主体声明"
}

实例 N_STAGE_DECL 属于 AST节点 {
  节点名 = "StageDecl"
  所属特性 = "sovereignty_stages"
  字段列表 = "name:文本, index:数值, keywords:文本[], description:文本"
  顶层声明 = "true"
  描述 = "主权阶段"
}

实例 N_TRANSITION_DECL 属于 AST节点 {
  节点名 = "TransitionDecl"
  所属特性 = "stage_transitions"
  字段列表 = "name:文本, from_stage:文本, to_stage:文本, trigger:节点"
  顶层声明 = "true"
  描述 = "阶段转移"
}

实例 N_COMPILER_LAYER 属于 AST节点 {
  节点名 = "CompilerLayerDecl"
  所属特性 = "compiler_layers"
  字段列表 = "name:文本, level:文本, inputs:文本[], outputs:文本[]"
  顶层声明 = "true"
  描述 = "编译层"
}

实例 N_REGENERATION 属于 AST节点 {
  节点名 = "RegenerationDecl"
  所属特性 = "regeneration_events"
  字段列表 = "name:文本, subject_ref:文本, failure:文本, diagnosis:文本, recompose:文本, new_version:文本"
  顶层声明 = "true"
  描述 = "再生事件"
}

实例 N_SIGNAL 属于 AST节点 {
  节点名 = "SignalDecl"
  所属特性 = "signals"
  字段列表 = "name:文本, kind:文本, intensity:数值, description:文本"
  顶层声明 = "true"
  描述 = "信号声明"
}

// === 不变量：节点 schema 自一致 ===

不变量 节点名必填 {
  条件 节点名 ≠ ""
}

不变量 字段列表必填 {
  条件 字段列表 ≠ ""
}

证据 ast_来源 {
  来源 = "src/csl/types.ts ASTNodeType 联合类型"
  原文 = "本规格文件直接对应 types.ts 中的 ASTNode 子类型"
  支持 = N_PROGRAM, N_FUNCTION_DECL, N_SUBJECT_DECL
}
`;
