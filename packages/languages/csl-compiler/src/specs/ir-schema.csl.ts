// CSL 自举规格 #4：ir-schema.csl
// 用 v0.8 子集描述 CSL 自身的 IR 容器结构
// 加载后产出：SpecRegistry.irTypes

export const IR_SCHEMA_CSL = `// ===== CSL 自举规格 · ir-schema =====
// 元类型：IR 类型（IRType）— 描述 IRContainer 中的一类记录

概念 IR类型 {
  属性 类型名: 文本           // 例：ConceptNode / EntitySpec / RuleSpec
  属性 容器键: 文本           // IRContainer 上的字段名（concepts/entities/rules ...）
  属性 所属特性: 文本         // 空字符串=v0.8 核心
  属性 字段列表: 文本         // "id:文本, name:文本, ..."
  属性 描述: 文本
}

// ============== v0.8 核心 IR ==============

实例 IR_CONCEPT 属于 IR类型 {
  类型名 = "ConceptNode"
  容器键 = "concepts"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, parent_id:文本, attribute_ids:文本[], invariant_ids:文本[]"
  描述 = "概念节点"
}

实例 IR_ENTITY 属于 IR类型 {
  类型名 = "EntityNode"
  容器键 = "entities"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, concept_id:文本, values:对象, relation_ids:文本[], evidence_ids:文本[]"
  描述 = "实例节点（含值绑定）"
}

实例 IR_ATTRIBUTE 属于 IR类型 {
  类型名 = "AttributeSpec"
  容器键 = "attributes"
  所属特性 = ""
  字段列表 = "id:文本, owner_id:文本, name:文本, value_type:文本, unit:文本, enum_values:文本[]"
  描述 = "属性规格"
}

实例 IR_INVARIANT 属于 IR类型 {
  类型名 = "InvariantSpec"
  容器键 = "invariants"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, scope_id:文本, clauses:对象[]"
  描述 = "不变量规格"
}

实例 IR_RULE 属于 IR类型 {
  类型名 = "RuleSpec"
  容器键 = "rules"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, conditions:对象[], actions:对象[], priority:文本"
  描述 = "规则规格"
}

实例 IR_EVIDENCE 属于 IR类型 {
  类型名 = "EvidenceAnchor"
  容器键 = "evidences"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, source:文本, snippet:文本, supports:文本[]"
  描述 = "证据锚点"
}

实例 IR_RELATION 属于 IR类型 {
  类型名 = "RelationEdge"
  容器键 = "relations"
  所属特性 = ""
  字段列表 = "id:文本, name:文本, source_id:文本, target_id:文本, evidence_ids:文本[]"
  描述 = "关系边"
}

// ============== v0.9 扩展 IR ==============

实例 IR_FUNCTION 属于 IR类型 {
  类型名 = "FunctionSpec"
  容器键 = "functions"
  所属特性 = "functions"
  字段列表 = "id:文本, name:文本, params:文本[], body:对象[]"
  描述 = "函数规格（含 IfClause/ActionSpec 体）"
}

实例 IR_TEMPLATE 属于 IR类型 {
  类型名 = "TemplateSpec"
  容器键 = "templates"
  所属特性 = "templates"
  字段列表 = "id:文本, name:文本, type_params:文本[], body_ast:对象[]"
  描述 = "模板规格（保留原 AST 体用于展开）"
}

实例 IR_SUBJECT 属于 IR类型 {
  类型名 = "SubjectSpec"
  容器键 = "subjects"
  所属特性 = "subjects"
  字段列表 = "id:文本, name:文本, current_stage:文本, attributes:对象"
  描述 = "主体规格"
}

实例 IR_STAGE 属于 IR类型 {
  类型名 = "StageSpec"
  容器键 = "stages"
  所属特性 = "sovereignty_stages"
  字段列表 = "id:文本, name:文本, index:数值, keywords:文本[], description:文本"
  描述 = "主权阶段规格"
}

实例 IR_TRANSITION 属于 IR类型 {
  类型名 = "TransitionSpec"
  容器键 = "transitions"
  所属特性 = "stage_transitions"
  字段列表 = "id:文本, name:文本, from_stage:文本, to_stage:文本, trigger:对象"
  描述 = "阶段转移规格"
}

实例 IR_COMPILER_LAYER 属于 IR类型 {
  类型名 = "CompilerLayerSpec"
  容器键 = "compiler_layers"
  所属特性 = "compiler_layers"
  字段列表 = "id:文本, name:文本, level:文本, inputs:文本[], outputs:文本[]"
  描述 = "编译层规格"
}

实例 IR_REGENERATION 属于 IR类型 {
  类型名 = "RegenerationSpec"
  容器键 = "regenerations"
  所属特性 = "regeneration_events"
  字段列表 = "id:文本, name:文本, subject_ref:文本, failure:文本, diagnosis:文本, recompose:文本, new_version:文本"
  描述 = "再生事件规格"
}

实例 IR_SIGNAL 属于 IR类型 {
  类型名 = "SignalSpec"
  容器键 = "signals"
  所属特性 = "signals"
  字段列表 = "id:文本, name:文本, kind:文本, intensity:数值, description:文本"
  描述 = "信号规格"
}

// === 不变量 ===

不变量 容器键必填 {
  条件 容器键 ≠ ""
}

不变量 类型名必填 {
  条件 类型名 ≠ ""
}

证据 ir_来源 {
  来源 = "src/csl/types.ts IRContainer 接口"
  原文 = "本规格直接镜像 IRContainer 字段，作为 schema 自描述源"
  支持 = IR_CONCEPT, IR_FUNCTION, IR_SUBJECT
}
`;
