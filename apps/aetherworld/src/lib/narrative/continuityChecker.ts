export interface ContinuityCheck {
  characterConsistency: string[];
  loreConsistency: string[];
  timelineIssues: string[];
  unresolvedHooks: string[];
  contradictionWarnings: string[];
  suggestedFixes: string[];
}

export function checkContinuity(input: {
  currentText: string;
  previousTexts?: string[];
  characterNames?: string[];
  knownLoreTerms?: string[];
}): ContinuityCheck {
  const out: ContinuityCheck = {
    characterConsistency: [],
    loreConsistency: [],
    timelineIssues: [],
    unresolvedHooks: [],
    contradictionWarnings: [],
    suggestedFixes: [],
  };
  const all = (input.previousTexts ?? []).join("\n") + "\n" + input.currentText;
  for (const name of input.characterNames ?? []) {
    if (name && !input.currentText.includes(name)) {
      out.characterConsistency.push(`角色「${name}」在当前文本未出现，请确认主线`);
    }
  }
  for (const term of input.knownLoreTerms ?? []) {
    const aliasHint = new RegExp(`${term}[^\\s，。]{0,4}`, "g");
    const matches = all.match(aliasHint);
    if (matches && new Set(matches).size > 2) {
      out.loreConsistency.push(`术语「${term}」可能存在多种叫法`);
    }
  }
  if (/(伏笔|埋钩|稍后|下一章)/.test(input.currentText)) {
    out.unresolvedHooks.push("文本提到了未来钩子，确认它们已被登记到主线");
  }
  if (out.characterConsistency.length || out.loreConsistency.length) {
    out.suggestedFixes.push("回到角色档案 / 世界术语表对齐命名与设定");
  }
  return out;
}
