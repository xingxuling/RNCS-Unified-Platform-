import type { CodeRepairSuggestion, CodePatchDraft } from "./codeRunRequestEngine";

let counter = 0;
function id(): string {
  counter += 1;
  return `patch-${Date.now().toString(36)}-${counter}`;
}

export function generatePatchDrafts(suggestions: CodeRepairSuggestion[]): CodePatchDraft[] {
  return suggestions.map((s) => {
    const file = s.affectedFiles[0] || "unknown";
    const isAdd = s.errorType === "MISSING_ENTRY_FILE" || s.errorType === "MISSING_PACKAGE_JSON" || s.errorType === "BUILD_CONFIG_MISSING";
    const isUnsafe = s.errorType === "UNSAFE_SCRIPT" || s.errorType === "SENSITIVE_INPUT";
    const patchType: CodePatchDraft["patchType"] = isAdd ? "FILE_ADD" : isUnsafe ? "HANDOFF_PATCH" : "TEXT_REPLACEMENT";
    return {
      patchId: id(),
      patchType,
      affectedFile: file,
      beforeSummary: `当前：${s.errorType || "ISSUE"} — ${file}`,
      afterSummary: `建议：${s.title}`,
      patchContent: [
        `// Patch Draft (v0.2 不直接写入文件)`,
        `// 目标文件：${file}`,
        `// 建议动作：`,
        ...s.suggestedActions.map((a) => `// · ${a}`),
        ``,
        `// === before ===`,
        `// ${s.explanation.split("\n").slice(0, 2).join(" / ")}`,
        ``,
        `// === after ===`,
        `// ${s.title}`,
      ].join("\n"),
      requiresHumanReview: s.requiresHumanReview ?? true,
      safetyNotes: [
        "v0.2 仅生成草案，不直接写入文件",
        ...(isUnsafe ? ["高风险修复，必须人工审查"] : []),
      ],
    };
  });
}
