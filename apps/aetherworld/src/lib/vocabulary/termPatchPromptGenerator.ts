import type { VocabularyTerm } from "./vocabularyRegistry";

/** 生成可粘贴给 Lovable / Codex 的词条修订 Prompt。 */
export function generateTermPatchPrompt(term: VocabularyTerm, instruction: string): string {
  return [
    `# 词条修订 Prompt`,
    `术语: ${term.chineseTerm} (${term.englishTerm})`,
    `分类: ${term.category}`,
    `系统层: ${term.systemLayer}`,
    `当前一句话: ${term.shortDefinition}`,
    `当前普通解释: ${term.plainDefinition}`,
    `当前专业解释: ${term.technicalDefinition}`,
    `安全边界: ${term.safetyBoundary}`,
    ``,
    `请按以下指令修订：${instruction}`,
    `约束：不得把虚构内容写成现实事实，不得把数列货币写成现实货币，不得把常数宇宙写成现实物理定律，不得把系统宪法写成现实法律。`,
  ].join("\n");
}
