// 概念 AI 调度器
// 输入：用户问题 + 当前知识库 IR + 档位
// 输出：7 步流水线结果（结构化 + markdown）

import type { IRContainer } from './types';

export type ProfileLevel = 'light' | 'normal' | 'deep';

export interface PipelineStep {
  unit: string;          // 判断单元名
  layer: string;
  net_score: number;     // 来自 0.5 单元
  status: 'ok' | 'skip' | 'empty';
  summary: string;       // 一句话结果
  refs: string[];        // 引用到的概念/实例/规则名
  details: string[];     // 详细 bullet
}

export interface ConceptAIResult {
  question: string;
  profile: ProfileLevel;
  focus: { kind: 'concept' | 'entity' | 'subject' | 'none'; name: string } | null;
  steps: PipelineStep[];
  markdown: string;
}

// 档位 → 步骤数
const PROFILE_STEPS: Record<ProfileLevel, number> = {
  light: 2,
  normal: 4,
  deep: 7,
};

// 内置 7 步单元元数据（与 concept-ai-program.ts 对齐）
const PIPELINE = [
  { name: '概念识别', layer: '母体', net: 9 - 2 },
  { name: '属性补全', layer: '显性', net: 8 - 3 },
  { name: '关系推断', layer: '显性', net: 7 - 3 },
  { name: '不变量校验', layer: '显性', net: 9 - 4 },
  { name: '阶段定位', layer: '隐性', net: 8 - 3 },
  { name: '类比迁移', layer: '隐性', net: 7 - 4 },
  { name: '再生重组', layer: '微观', net: 9 - 5 },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

function findFocus(question: string, ir: IRContainer): ConceptAIResult['focus'] {
  const q = normalize(question);
  // 优先：实例名包含 → 概念名包含 → 主体名包含
  for (const e of ir.entities) {
    if (q.includes(normalize(e.name))) return { kind: 'entity', name: e.name };
  }
  for (const c of ir.concepts) {
    if (q.includes(normalize(c.name))) return { kind: 'concept', name: c.name };
  }
  for (const s of ir.subjects) {
    if (q.includes(normalize(s.name))) return { kind: 'subject', name: s.name };
  }
  // 反向：知识库名包含问题中某个长 token
  const tokens = question.split(/[\s,，。.?？!！:：、]+/).filter(t => t.length >= 2);
  for (const t of tokens) {
    const tn = normalize(t);
    for (const e of ir.entities) if (normalize(e.name).includes(tn)) return { kind: 'entity', name: e.name };
    for (const c of ir.concepts) if (normalize(c.name).includes(tn)) return { kind: 'concept', name: c.name };
    for (const s of ir.subjects) if (normalize(s.name).includes(tn)) return { kind: 'subject', name: s.name };
  }
  return null;
}

export function runConceptAI(
  question: string,
  ir: IRContainer | null,
  profile: ProfileLevel = 'normal',
): ConceptAIResult {
  const steps: PipelineStep[] = [];
  const maxSteps = PROFILE_STEPS[profile];

  if (!ir) {
    return {
      question,
      profile,
      focus: null,
      steps: [],
      markdown: '> 无知识库 IR，请先运行 CSL 代码。',
    };
  }

  const focus = findFocus(question, ir);

  // Step 1 — 概念识别
  if (focus) {
    steps.push({
      unit: '概念识别', layer: '母体', net_score: 7, status: 'ok',
      summary: `锚定 ${focus.kind === 'concept' ? '概念' : focus.kind === 'entity' ? '实例' : '主体'} 「${focus.name}」`,
      refs: [focus.name],
      details: [
        `知识库共有 ${ir.concepts.length} 个概念 / ${ir.entities.length} 个实例 / ${ir.subjects.length} 个主体`,
        `匹配方式：名称包含匹配`,
      ],
    });
  } else {
    steps.push({
      unit: '概念识别', layer: '母体', net_score: 7, status: 'empty',
      summary: '未在知识库中找到匹配概念',
      refs: [],
      details: ['提示：请在问题中提到一个已声明的概念名、实例名或主体名'],
    });
    return finalize(question, profile, focus, steps);
  }

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 2 — 属性补全
  const entity = focus.kind === 'entity' ? ir.entities.find(e => e.name === focus.name) : null;
  const concept = focus.kind === 'concept'
    ? ir.concepts.find(c => c.name === focus.name)
    : (entity ? ir.concepts.find(c => c.id === entity.concept_id) : null);
  if (concept) {
    const attrs = ir.attributes.filter(a => concept.attribute_ids.includes(a.id));
    const lines = attrs.map(a => {
      const val = entity ? entity.values[a.name] : undefined;
      const valStr = val !== undefined ? ` = ${JSON.stringify(val)}` : ' (未赋值)';
      const unit = a.unit ? ` [${a.unit}]` : '';
      return `${a.name}: ${a.value_type}${unit}${valStr}`;
    });
    steps.push({
      unit: '属性补全', layer: '显性', net_score: 5,
      status: attrs.length ? 'ok' : 'empty',
      summary: `共 ${attrs.length} 个属性${entity ? '（含当前取值）' : ''}`,
      refs: [concept.name],
      details: lines.length ? lines : ['该概念未声明属性'],
    });
  } else {
    steps.push({
      unit: '属性补全', layer: '显性', net_score: 5, status: 'skip',
      summary: '焦点未关联到概念，跳过',
      refs: [], details: [],
    });
  }

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 3 — 关系推断
  const focusEntId = entity?.id;
  const rels = focusEntId
    ? ir.relations.filter(r => r.source_id === focusEntId || r.target_id === focusEntId)
    : [];
  const relLines = rels.map(r => {
    const src = ir.entities.find(e => e.id === r.source_id)?.name ?? r.source_id;
    const tgt = ir.entities.find(e => e.id === r.target_id)?.name ?? r.target_id;
    return `${src} —[${r.name}]→ ${tgt}`;
  });
  steps.push({
    unit: '关系推断', layer: '显性', net_score: 4,
    status: rels.length ? 'ok' : 'empty',
    summary: `参与 ${rels.length} 条关系`,
    refs: rels.map(r => r.name),
    details: relLines.length ? relLines : ['焦点未参与任何关系边'],
  });

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 4 — 不变量校验
  const relevantRules = ir.rules.filter(r =>
    r.conditions.some(c => focus && (
      String(c.left).includes(focus.name) || String(c.right).includes(focus.name)
    ))
  );
  const allRules = relevantRules.length ? relevantRules : ir.rules.slice(0, 3);
  steps.push({
    unit: '不变量校验', layer: '显性', net_score: 5,
    status: allRules.length ? 'ok' : 'empty',
    summary: `${relevantRules.length ? '强相关' : '示意'} 规则 ${allRules.length} 条`,
    refs: allRules.map(r => r.name),
    details: allRules.length
      ? allRules.map(r => `规则「${r.name}」：${r.conditions.length} 条件 / ${r.actions.length} 动作`)
      : ['知识库无规则'],
  });

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 5 — 阶段定位
  const subject = focus.kind === 'subject'
    ? ir.subjects.find(s => s.name === focus.name)
    : ir.subjects.find(s => s.name === focus.name);
  if (subject && subject.current_stage) {
    const transitions = ir.transitions.filter(t => t.from_stage === subject.current_stage);
    steps.push({
      unit: '阶段定位', layer: '隐性', net_score: 5, status: 'ok',
      summary: `当前阶段「${subject.current_stage}」，可能转移 ${transitions.length} 条`,
      refs: [subject.current_stage, ...transitions.map(t => t.to_stage)],
      details: transitions.length
        ? transitions.map(t => `${t.from_stage} → ${t.to_stage}（触发：${t.trigger ? `${t.trigger.left} ${t.trigger.op} ${t.trigger.right}` : '无'}）`)
        : ['当前阶段无后继转移'],
    });
  } else {
    steps.push({
      unit: '阶段定位', layer: '隐性', net_score: 5, status: 'skip',
      summary: '焦点非主体或未声明阶段',
      refs: [], details: [],
    });
  }

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 6 — 类比迁移
  const chains = ir.correspondence_chains.filter(c => c.items.includes(focus.name));
  const tables = ir.mapping_tables.filter(t =>
    t.rows.some(r => r.items.includes(focus.name))
  );
  const peers: string[] = [];
  chains.forEach(c => c.items.filter(i => i !== focus.name).forEach(i => peers.push(`${c.name}: ${i}`)));
  tables.forEach(t => t.rows.forEach(r => {
    const idx = r.items.indexOf(focus.name);
    if (idx >= 0) {
      r.items.forEach((it, i) => { if (i !== idx) peers.push(`${t.name} / ${r.label}: ${it}`); });
    }
  }));
  steps.push({
    unit: '类比迁移', layer: '隐性', net_score: 3,
    status: peers.length ? 'ok' : 'empty',
    summary: `发现 ${peers.length} 个同位条目`,
    refs: peers.slice(0, 5),
    details: peers.length ? peers : ['焦点未出现在任何同位链或映射表中'],
  });

  if (steps.length >= maxSteps) return finalize(question, profile, focus, steps);

  // Step 7 — 再生重组
  const okCount = steps.filter(s => s.status === 'ok').length;
  const suggestions: string[] = [];
  if (entity) suggestions.push(`查看实例「${entity.name}」未赋值字段并补齐`);
  if (rels.length) suggestions.push(`沿 ${rels.length} 条关系边遍历邻接实体`);
  if (subject?.current_stage) suggestions.push(`触发条件评估，推进主体到下一阶段`);
  if (peers.length) suggestions.push(`类比同位条目，迁移结论到其他域`);
  if (allRules.length) suggestions.push(`运行规则集，看是否产生新标签或排除`);
  if (!suggestions.length) suggestions.push('知识库覆盖不足，建议补充该概念的实例与关系');

  steps.push({
    unit: '再生重组', layer: '微观', net_score: 4,
    status: okCount >= 3 ? 'ok' : 'empty',
    summary: okCount >= 3 ? `综合 ${okCount} 步有效结果，给出 ${suggestions.length} 条行动建议` : '有效步骤不足 3 步，建议保守',
    refs: [],
    details: suggestions.map((s, i) => `${'①②③④⑤⑥⑦⑧⑨'[i] ?? `${i + 1}.`} ${s}`),
  });

  return finalize(question, profile, focus, steps);
}

function finalize(
  question: string,
  profile: ProfileLevel,
  focus: ConceptAIResult['focus'],
  steps: PipelineStep[],
): ConceptAIResult {
  const md = renderMarkdown(question, profile, focus, steps);
  return { question, profile, focus, steps, markdown: md };
}

function renderMarkdown(
  question: string,
  profile: ProfileLevel,
  focus: ConceptAIResult['focus'],
  steps: PipelineStep[],
): string {
  const lines: string[] = [];
  lines.push(`# 概念 AI 推理报告`);
  lines.push(``);
  lines.push(`- **问题**：${question}`);
  lines.push(`- **档位**：${profile === 'light' ? '轻量问答' : profile === 'normal' ? '常规推理' : '深度推理'}`);
  lines.push(`- **焦点**：${focus ? `${focus.kind} / ${focus.name}` : '未识别'}`);
  lines.push(`- **执行步骤**：${steps.length} 步`);
  lines.push(``);
  steps.forEach((s, i) => {
    const tag = s.status === 'ok' ? '✓' : s.status === 'empty' ? '∅' : '⊘';
    lines.push(`## ${i + 1}. ${tag} ${s.unit} _(${s.layer} · 净分 ${s.net_score})_`);
    lines.push(``);
    lines.push(`**结果**：${s.summary}`);
    if (s.refs.length) lines.push(`**引用**：${s.refs.join(', ')}`);
    if (s.details.length) {
      lines.push(``);
      s.details.forEach(d => lines.push(`- ${d}`));
    }
    lines.push(``);
  });
  return lines.join('\n');
}
