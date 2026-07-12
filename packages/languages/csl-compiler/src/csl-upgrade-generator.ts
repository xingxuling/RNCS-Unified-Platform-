// CSL 升级补丁生成器
// 输入：用户问题 + 当前 IR（特别是 CSL 自举示例里的"目标"型概念块）
// 输出：可以直接粘进代码库的 CSL 源码补丁 + 影响的代码模块清单
//
// 设计思路：
//   - 不真的修改 TS 源码（那需要 codegen 通道）
//   - 但产出"语法层补丁"：新关键字、新 AST 节点骨架、新原语示例
//   - 让用户拿着补丁手动落地，闭环"用 CSL 写 CSL 升级"

import type { IRContainer, ConceptBlockSpec } from './types';

export interface CSLPatch {
  /** 补丁标题 */
  title: string;
  /** 触发该补丁的目标概念块（通常是 kind = 目标） */
  trigger_block: string;
  /** 一句话描述补丁干什么 */
  intent: string;
  /** 估算的工程成本 0-100 */
  estimated_cost: number;
  /** 估算的产品价值 0-100 */
  estimated_value: number;
  /** 该补丁要新增/修改的代码模块 */
  affected_modules: Array<{
    file: string;
    engine: string;
    change_kind: '新增关键字' | '新增 AST 节点' | '新增 IR 字段' | '新增运行时校验' | '新增示例' | '新增 UI 面板';
    snippet: string;
  }>;
  /** 一段可粘贴的 CSL 源码补丁示例（用新原语写一段最小可运行片段） */
  csl_snippet: string;
  /** 升级判断器给出的结论：建议纳入 / 暂缓 / 拒绝 */
  verdict: '建议纳入' | '暂缓' | '拒绝';
  /** 判断理由 */
  rationale: string;
}

export interface CSLUpgradeReport {
  question: string;
  patches: CSLPatch[];
  /** 当前知识库中识别为"升级目标"的概念块名称列表 */
  detected_targets: string[];
  /** 综合建议（多补丁排序后的总结） */
  summary: string;
}

/** 把概念块名映射到推断的引擎/文件 */
function inferAffectedModule(target: ConceptBlockSpec): {
  engine: string;
  files: string[];
} {
  const def = (target.definition || '') + ' ' + (target.display_name || '');
  // 启发式：根据定义里的关键词决定影响哪些模块
  const hits: Array<{ engine: string; file: string }> = [];
  if (/关键字|词法|token/i.test(def)) hits.push({ engine: '词法引擎', file: 'src/csl/lexer.ts' });
  if (/原语|语法|AST|节点/i.test(def)) {
    hits.push({ engine: '语法引擎', file: 'src/csl/parser.ts' });
    hits.push({ engine: 'IR引擎', file: 'src/csl/types.ts' });
  }
  if (/IR|折叠|派生|引用/i.test(def)) hits.push({ engine: 'IR引擎', file: 'src/csl/ir-builder.ts' });
  if (/校验|规则|运行时|阶段|推进/i.test(def)) hits.push({ engine: '运行时引擎', file: 'src/csl/runtime.ts' });
  if (/示例|演示|演化/i.test(def)) hits.push({ engine: '示例引擎', file: 'src/csl/examples.ts' });
  if (/面板|UI|视图|Tab/i.test(def)) hits.push({ engine: 'UI引擎', file: 'src/components/csl/' });
  if (/跨知识库|联邦|联合推理|多 IR/i.test(def)) {
    hits.push({ engine: 'IR引擎', file: 'src/csl/types.ts' });
    hits.push({ engine: '运行时引擎', file: 'src/csl/runtime.ts' });
  }
  if (/自举|元程序|自身|自我/i.test(def)) {
    hits.push({ engine: '示例引擎', file: 'src/csl/csl-self-upgrade-example.ts' });
  }
  if (hits.length === 0) hits.push({ engine: '语法引擎', file: 'src/csl/parser.ts' });

  // 去重
  const seen = new Set<string>();
  const dedup = hits.filter(h => {
    const k = `${h.engine}|${h.file}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  });
  return {
    engine: dedup.map(h => h.engine).join(' / '),
    files: dedup.map(h => h.file),
  };
}

/** 从概念块定义里抽取一个"原语名"候选（取第一个 2-4 字的词） */
function extractPrimitiveName(target: ConceptBlockSpec): string {
  const text = target.display_name + ' ' + target.definition;
  const m = text.match(/[\u4e00-\u9fa5]{2,4}/g);
  if (!m) return '新原语';
  // 偏好以"块/表/链/层/域/规/则"等结尾的词
  const preferred = m.find(w => /块|表|链|层|域|图|网|核/.test(w[w.length - 1]));
  return preferred || m[0];
}

/** 根据一个"目标"型概念块生成补丁 */
function generatePatchForTarget(target: ConceptBlockSpec, ir: IRContainer): CSLPatch {
  const mod = inferAffectedModule(target);
  const primitive = extractPrimitiveName(target);
  const keyword = primitive;

  // 估值：复用概念块自身置信度 + 关联命题数
  const linkedProps = ir.proposition_blocks.filter(p =>
    p.subject === target.name || p.object === target.name
  );
  const linkedRels = ir.relation_blocks.filter(r =>
    r.source === target.name || r.target === target.name
  );
  const evidenceWeight = Math.min(100, linkedProps.length * 15 + linkedRels.length * 10);
  const value = Math.round(target.confidence * 60 + evidenceWeight * 0.4);
  const cost = Math.min(100, mod.files.length * 18 + 25);

  const verdict: CSLPatch['verdict'] =
    value - cost >= 25 ? '建议纳入' :
    value - cost >= 0  ? '暂缓' : '拒绝';

  const rationale =
    verdict === '建议纳入' ? `价值 ${value} − 代价 ${cost} = +${value - cost}，证据充分（${linkedProps.length} 命题 / ${linkedRels.length} 关系），可纳入下一个版本` :
    verdict === '暂缓'     ? `价值 ${value} − 代价 ${cost} = ${value - cost}，可先在示例层面探索，等证据更充分再升级语法` :
                              `价值 ${value} 低于代价 ${cost}，建议拒绝或重新拆分`;

  // 生成各模块补丁片段
  const affected: CSLPatch['affected_modules'] = [];
  for (const file of mod.files) {
    if (file.endsWith('lexer.ts')) {
      affected.push({
        file, engine: '词法引擎', change_kind: '新增关键字',
        snippet:
`// src/csl/lexer.ts —— 在 KEYWORDS Set 中追加
'${keyword}',
// 同时考虑该原语字段所需的辅助关键字（如必要）`,
      });
    } else if (file.endsWith('parser.ts')) {
      affected.push({
        file, engine: '语法引擎', change_kind: '新增 AST 节点',
        snippet:
`// src/csl/parser.ts —— 在顶层 dispatch 中追加分支
case '${keyword}': return this.parse${primitive}();

// 新方法骨架
private parse${primitive}(): ${primitive}DeclNode {
  const start = this.advance();
  const name = this.expect('IDENTIFIER').value;
  const fields = this.parseEngineFieldsBlock();
  return {
    type: '${primitive}Decl', name, fields,
    source_span: { line_start: start.line, line_end: start.line },
  };
}`,
      });
    } else if (file.endsWith('types.ts')) {
      affected.push({
        file, engine: 'IR引擎', change_kind: '新增 IR 字段',
        snippet:
`// src/csl/types.ts —— 追加 AST + IR 类型
export interface ${primitive}DeclNode {
  type: '${primitive}Decl';
  name: string;
  fields: Record<string, unknown>;
  source_span: { line_start: number; line_end: number };
}

export interface ${primitive}Spec {
  id: string;
  name: string;
  // TODO: 把 fields 折叠为业务字段
}

// 别忘了在 IRContainer 里加：
// ${primitive.toLowerCase()}_blocks: ${primitive}Spec[];`,
      });
    } else if (file.endsWith('ir-builder.ts')) {
      affected.push({
        file, engine: 'IR引擎', change_kind: '新增 IR 字段',
        snippet:
`// src/csl/ir-builder.ts —— 在 buildIR 的 switch 里追加
case '${primitive}Decl': {
  const n = node as ${primitive}DeclNode;
  ir.${primitive.toLowerCase()}_blocks.push({
    id: makeId(), name: n.name,
    // 折叠 n.fields → 业务字段
  });
  break;
}`,
      });
    } else if (file.endsWith('runtime.ts')) {
      affected.push({
        file, engine: '运行时引擎', change_kind: '新增运行时校验',
        snippet:
`// src/csl/runtime.ts —— 在 validateIR 中追加
for (const x of ir.${primitive.toLowerCase()}_blocks) {
  // TODO: 例如检查必填字段、引用解析、阈值边界
  if (!x.name) warnings.push(\`${primitive} 缺少名称\`);
}`,
      });
    } else if (file.endsWith('examples.ts')) {
      affected.push({
        file, engine: '示例引擎', change_kind: '新增示例',
        snippet:
`// src/csl/examples.ts —— 在 EXAMPLES 数组追加
{
  id: '${primitive.toLowerCase()}-demo',
  name: '${primitive} 演示',
  description: '${target.definition.slice(0, 40)}...',
  code: \`${keyword} 示例X { /* TODO */ }\`,
},`,
      });
    } else {
      affected.push({
        file, engine: 'UI引擎', change_kind: '新增 UI 面板',
        snippet:
`// ${file} —— 新建一个 ${primitive}Panel.tsx
// 在 CSLPlayground.tsx 的 TabsList 中追加：
// <TabsTrigger value="${primitive.toLowerCase()}" className="text-xs h-7">${primitive}</TabsTrigger>
// 然后在 TabsContent 里渲染 <${primitive}Panel ir={ir} />`,
      });
    }
  }

  // 一段可运行的 CSL 源码片段（用新原语写一个最小例子）
  const cslSnippet =
`// ===== 新原语「${keyword}」演示（建议加入 v0.8 示例库）=====
${keyword} 示例_${target.name} {
  类型 = "${target.kind}"
  定义 = "${target.definition.slice(0, 60)}"
  来源 = "由 CSL 自举升级器自动生成"
  // TODO: 补充该原语特有的字段
}

// 配合一条命题块说明该原语解决什么
命题块 p_${target.name}_动机 {
  主语 = 示例_${target.name}
  谓语 = "解决"
  宾语 = "${target.display_name}"
  断言 = "成立"
  来源 = "升级判断器输出"
  置信度 = ${(target.confidence).toFixed(2)}
}`;

  return {
    title: `补丁：实现「${target.display_name}」`,
    trigger_block: target.name,
    intent: target.definition || target.display_name,
    estimated_cost: cost,
    estimated_value: value,
    affected_modules: affected,
    csl_snippet: cslSnippet,
    verdict,
    rationale,
  };
}

/**
 * 主入口：基于问题 + IR，识别"升级目标"型概念块并产出补丁
 *
 * 识别规则：
 *  1) 优先取 kind = '目标' 或 '元概念' 的概念块
 *  2) 用问题里的 token 过滤（提到的优先）
 *  3) 最多产出 3 条补丁，按 value-cost 降序
 */
export function generateUpgradePatches(
  question: string,
  ir: IRContainer | null,
): CSLUpgradeReport {
  if (!ir || ir.concept_blocks.length === 0) {
    return {
      question,
      patches: [],
      detected_targets: [],
      summary: '当前知识库无概念块，无法生成升级补丁。请加载「CSL 自举 v1」示例后再试。',
    };
  }

  const targets = ir.concept_blocks.filter(c => c.kind === '目标' || c.kind === '元概念');
  if (targets.length === 0) {
    return {
      question,
      patches: [],
      detected_targets: [],
      summary: '当前知识库中未声明 kind = 目标 或 元概念 的概念块，升级器没有可处理的目标。建议在 CSL 中声明：概念块 v0.8_xxx { 类型 = "目标" ... }',
    };
  }

  // 用问题里的 token 给目标加权
  const tokens = question.split(/[\s,，。.?？!！:：、；;()（）]+/).filter(t => t.length >= 2);
  const scored = targets.map(t => {
    let bonus = 0;
    for (const tk of tokens) {
      if (t.name.includes(tk) || t.display_name.includes(tk) || (t.definition && t.definition.includes(tk))) {
        bonus += 20;
      }
    }
    return { target: t, bonus };
  });

  // 排序：bonus 优先，再按 confidence
  scored.sort((a, b) =>
    (b.bonus - a.bonus) || (b.target.confidence - a.target.confidence)
  );
  const picked = scored.slice(0, 3);

  const patches = picked.map(s => generatePatchForTarget(s.target, ir));
  patches.sort((a, b) => (b.estimated_value - b.estimated_cost) - (a.estimated_value - a.estimated_cost));

  const accepted = patches.filter(p => p.verdict === '建议纳入');
  const summary = accepted.length > 0
    ? `共生成 ${patches.length} 条补丁，其中 ${accepted.length} 条建议纳入。最优补丁：${accepted[0].title}（净值 +${accepted[0].estimated_value - accepted[0].estimated_cost}）。`
    : `共生成 ${patches.length} 条补丁，但全部被升级判断器标为「暂缓」或「拒绝」。建议先补充对应概念块的命题/关系以提升证据权重。`;

  return {
    question,
    patches,
    detected_targets: targets.map(t => t.name),
    summary,
  };
}
