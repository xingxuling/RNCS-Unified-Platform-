import { VOCABULARY_REGISTRY, type VocabularyTerm } from "./vocabularyRegistry";
import type { TermRelation, TermRelationTypeId } from "@/constants/vocabulary/termRelationTypes";

/** 基于 relatedTerms 与显式规则构建关系图。 */
export function buildTermRelations(): TermRelation[] {
  const rels: TermRelation[] = [];
  let n = 0;
  const add = (from: string, to: string, type: TermRelationTypeId, explanation = "") => {
    if (!VOCABULARY_REGISTRY.find((t) => t.termId === from)) return;
    if (!VOCABULARY_REGISTRY.find((t) => t.termId === to)) return;
    rels.push({ relationId: `r_${++n}`, fromTermId: from, toTermId: to, relationType: type, explanation, strength: 1 });
  };

  // 从 relatedTerms 自动派生 USED_BY 弱关系
  for (const term of VOCABULARY_REGISTRY) {
    for (const rt of term.relatedTerms ?? []) add(term.termId, rt, "USED_BY", "自动派生关联");
  }

  // 显式的“不能混淆”
  add("sequence-currency", "internal-value", "MUST_NOT_CONFUSE_WITH", "数列货币不可等同现实货币");
  add("constant-universe", "digit-constants", "MUST_NOT_CONFUSE_WITH", "常数宇宙不是现实物理常数表");
  add("system-constitution", "constitutional-compliance", "MUST_NOT_CONFUSE_WITH", "系统宪法不是现实法律");
  add("world-simulation", "validation", "MUST_NOT_CONFUSE_WITH", "世界模拟不是现实预测");
  add("full60", "demo-mode", "MUST_NOT_CONFUSE_WITH", "Full60 不是 Demo");

  // 治理关系
  add("mother-sequence", "subject-sequence-firewall", "GOVERNED_BY", "母体数列受防火墙保护");
  add("reality-data-calibration", "subject-sequence-firewall", "DEPENDS_ON", "校准依赖防火墙隔离");
  add("text-dynamic-update-engine", "vocabulary", "DEPENDS_ON", "文案依赖词汇");
  add("learning-docs", "vocabulary", "DEPENDS_ON", "教程依赖词汇");
  add("calculus-universe-encyclopedia", "calculus-universe", "EXPLAINS", "百科解释总集");

  return rels;
}

export function getRelationsForTerm(termId: string): TermRelation[] {
  return buildTermRelations().filter((r) => r.fromTermId === termId || r.toTermId === termId);
}

export function getRelatedTerms(termId: string): VocabularyTerm[] {
  const ids = new Set<string>();
  for (const r of getRelationsForTerm(termId)) {
    ids.add(r.fromTermId === termId ? r.toTermId : r.fromTermId);
  }
  return VOCABULARY_REGISTRY.filter((t) => ids.has(t.termId));
}
