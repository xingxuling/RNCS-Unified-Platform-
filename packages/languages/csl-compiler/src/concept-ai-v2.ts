// 概念 AI v2 — 基于 0.7 三块（概念块/命题块/关系块）的本地概念级 AI 调度器
//
// 与 v1 的区别：
//   v1 = 7 步流水线（临时结构，每次重算）
//   v2 = 4 阶段（检索 → 装配 → 判断 → 输出），全部围绕长期记忆三块运行
//
// 设计来源：本地概念级 AI 架构草案 v1 第六/七/八/九章

import type {
  IRContainer, ConceptBlockSpec, PropositionBlockSpec, RelationBlockSpec,
} from './types';
import { federation, DEFAULT_LIBRARY } from './federation';

export type V2Profile = 'recall' | 'judge' | 'plan';

export interface V2RetrievedBlock {
  block: ConceptBlockSpec;
  /** 检索得分：name 完全匹配 = 100，包含 = 60，邻接命中 = 30 */
  score: number;
  hit_reason: string;
}

export interface V2Stage {
  name: string;
  status: 'ok' | 'empty' | 'skip';
  summary: string;
  bullets: string[];
}

export interface ConceptAIV2Result {
  question: string;
  profile: V2Profile;
  retrieved: V2RetrievedBlock[];
  related_propositions: PropositionBlockSpec[];
  related_relations: RelationBlockSpec[];
  stages: V2Stage[];
  /** 给出的可执行/可追问建议 */
  suggestions: string[];
}

const PROFILE_LABEL: Record<V2Profile, string> = {
  recall: '检索（只回忆）',
  judge: '判断（回忆 + 命题校验）',
  plan: '行动（回忆 + 校验 + 行动建议）',
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

/** 检索：返回与问题相关的概念块（按得分排序，最多 5 条） */
function retrieve(question: string, ir: IRContainer): V2RetrievedBlock[] {
  const q = normalize(question);
  const tokens = question.split(/[\s,，。.?？!！:：、；;()（）]+/).filter(t => t.length >= 2);
  const hits = new Map<string, V2RetrievedBlock>();

  for (const c of ir.concept_blocks) {
    const nName = normalize(c.name);
    const nDisp = normalize(c.display_name);
    let score = 0;
    let reason = '';
    if (q === nName || q === nDisp) { score = 100; reason = '名称完全匹配'; }
    else if (q.includes(nName) || q.includes(nDisp)) { score = 80; reason = '问题包含名称'; }
    else if (nName.length >= 2 && (q.includes(nName) || nName.includes(q))) { score = 60; reason = '名称模糊匹配'; }
    else {
      for (const t of tokens) {
        if (normalize(t) === nName || normalize(t) === nDisp) { score = 70; reason = `命中关键词「${t}」`; break; }
      }
      if (score === 0 && c.definition) {
        for (const t of tokens) {
          if (c.definition.includes(t)) { score = 35; reason = `定义包含「${t}」`; break; }
        }
      }
    }
    if (score > 0) hits.set(c.name, { block: c, score, hit_reason: reason });
  }

  // 邻接扩散：把已命中块的相邻概念也加入（弱权）
  const expansion: V2RetrievedBlock[] = [];
  for (const h of hits.values()) {
    for (const n of h.block.neighbors) {
      if (hits.has(n)) continue;
      const nb = ir.concept_blocks.find(c => c.name === n);
      if (nb) expansion.push({ block: nb, score: 25, hit_reason: `${h.block.name} 的相邻概念` });
    }
  }
  for (const e of expansion) if (!hits.has(e.block.name)) hits.set(e.block.name, e);

  return [...hits.values()].sort((a, b) => b.score - a.score).slice(0, 5);
}

export function runConceptAIV2(
  question: string,
  ir: IRContainer | null,
  profile: V2Profile = 'judge',
  libraries: string[] = [DEFAULT_LIBRARY],
): ConceptAIV2Result {
  // 0.8 — 联邦索引钩子：把当前 IR 同步进默认库，供未来跨库扩展。
  // 当前实现仍以传入的 ir 为主检索源，仅在 federation 中预热占位。
  if (ir) federation.register(DEFAULT_LIBRARY, ir, '当前编辑器 IR');
  void libraries; // reserved for cross-library expansion
  const empty: ConceptAIV2Result = {
    question, profile,
    retrieved: [], related_propositions: [], related_relations: [],
    stages: [], suggestions: [],
  };

  if (!ir) return { ...empty, stages: [{ name: '前置检查', status: 'empty', summary: '无 IR，请先运行 CSL 代码', bullets: [] }] };
  if (ir.concept_blocks.length === 0) {
    return { ...empty, stages: [{
      name: '前置检查', status: 'empty',
      summary: '当前知识库未声明任何「概念块」',
      bullets: ['请加载示例「本地概念级 AI v2」或自行声明 概念块/命题块/关系块'],
    }] };
  }

  const stages: V2Stage[] = [];
  const suggestions: string[] = [];

  // 阶段 1 — 检索
  const retrieved = retrieve(question, ir);
  stages.push({
    name: '阶段 1 · 检索',
    status: retrieved.length ? 'ok' : 'empty',
    summary: retrieved.length
      ? `命中 ${retrieved.length} 个概念块（最高分 ${retrieved[0].score}）`
      : '未命中任何概念块',
    bullets: retrieved.length
      ? retrieved.map(r => `${r.block.name} [${r.block.kind}] · ${r.score} 分 · ${r.hit_reason}`)
      : ['提示：在问题中提到一个已声明的概念块名称或其相邻概念'],
  });

  if (retrieved.length === 0) {
    return { ...empty, stages, suggestions: ['补充该领域的概念块', '降低问题中的领域专有名词，使用同义词'] };
  }

  // 阶段 2 — 装配（命题 + 关系）
  const focusNames = new Set(retrieved.map(r => r.block.name));
  const relatedProps = ir.proposition_blocks.filter(p =>
    focusNames.has(p.subject) || focusNames.has(p.object)
  );
  const relatedRels = ir.relation_blocks.filter(r =>
    focusNames.has(r.source) || focusNames.has(r.target)
  );

  stages.push({
    name: '阶段 2 · 装配',
    status: (relatedProps.length || relatedRels.length) ? 'ok' : 'empty',
    summary: `命题 ${relatedProps.length} 条 / 关系 ${relatedRels.length} 条`,
    bullets: [
      ...relatedProps.slice(0, 4).map(p => `命题「${p.name}」: ${p.subject} ${p.predicate} ${p.object}（置信 ${p.confidence}）`),
      ...relatedRels.slice(0, 4).map(r => `关系「${r.name}」: ${r.source} —[${r.kind}·${r.strength}]→ ${r.target}`),
      ...(relatedProps.length === 0 && relatedRels.length === 0 ? ['焦点概念尚未挂任何命题/关系，建议补充'] : []),
    ],
  });

  // 阶段 3 — 判断（仅 judge / plan 档位）
  if (profile === 'judge' || profile === 'plan') {
    const lowConf = [
      ...relatedProps.filter(p => p.confidence < 0.6).map(p => `命题「${p.name}」置信度 ${p.confidence} 偏低`),
      ...retrieved.filter(r => r.block.confidence < 0.6).map(r => `概念块「${r.block.name}」置信度 ${r.block.confidence} 偏低`),
    ];
    const unresolved = [
      ...relatedProps.filter(p => !p.resolved).map(p => `命题「${p.name}」引用未声明概念：${p.missing_refs.join('、')}`),
      ...relatedRels.filter(r => !r.resolved).map(r => `关系「${r.name}」引用未声明概念：${r.missing_refs.join('、')}`),
    ];
    const boundaries = retrieved.filter(r => r.block.failure_boundary).map(r =>
      `${r.block.name} 失效边界：${r.block.failure_boundary}`
    );

    const judgeBullets = [...boundaries, ...lowConf, ...unresolved];
    stages.push({
      name: '阶段 3 · 判断',
      status: judgeBullets.length ? 'ok' : 'empty',
      summary: judgeBullets.length
        ? `发现 ${boundaries.length} 条边界提醒 / ${lowConf.length} 条低置信 / ${unresolved.length} 条未解析引用`
        : '未发现边界冲突或低置信项',
      bullets: judgeBullets.length ? judgeBullets : ['本次判断未触发警告'],
    });
  } else {
    stages.push({ name: '阶段 3 · 判断', status: 'skip', summary: '当前档位为「检索」，跳过判断', bullets: [] });
  }

  // 阶段 4 — 输出（仅 plan 档位生成行动建议）
  if (profile === 'plan') {
    if (retrieved[0].block.scope) suggestions.push(`核心适用范围：${retrieved[0].block.scope}`);
    for (const r of retrieved.slice(0, 2)) {
      if (r.block.core_propositions.length) {
        suggestions.push(`回顾「${r.block.name}」核心命题：${r.block.core_propositions.join(' / ')}`);
      }
    }
    const causalRels = relatedRels.filter(rr => rr.kind === '因果' || rr.kind === '派生');
    if (causalRels.length) {
      for (const cr of causalRels.slice(0, 2)) {
        suggestions.push(`沿「${cr.kind}」链推进：${cr.source} → ${cr.target}`);
      }
    }
    const blocked = relatedRels.filter(rr => rr.kind === '约束' || rr.kind === '对立');
    if (blocked.length) {
      suggestions.push(`留意 ${blocked.length} 条约束/对立关系，行动前需评估`);
    }
    if (suggestions.length === 0) suggestions.push('知识库覆盖不足，建议先补充该焦点的命题/关系');

    stages.push({
      name: '阶段 4 · 输出',
      status: 'ok',
      summary: `生成 ${suggestions.length} 条行动建议`,
      bullets: suggestions,
    });
  } else {
    stages.push({ name: '阶段 4 · 输出', status: 'skip', summary: '非「行动」档位，仅输出回忆与判断', bullets: [] });
  }

  return { question, profile, retrieved, related_propositions: relatedProps, related_relations: relatedRels, stages, suggestions };
}

export function profileLabel(p: V2Profile): string {
  return PROFILE_LABEL[p];
}
