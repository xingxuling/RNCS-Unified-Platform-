import type { CodeErrorSummary, CodeRepairSuggestion } from "./codeRunRequestEngine";

let counter = 0;
function id(): string {
  counter += 1;
  return `sug-${Date.now().toString(36)}-${counter}`;
}

const TEMPLATES: Record<string, Omit<CodeRepairSuggestion, "suggestionId" | "affectedFiles" | "errorType">> = {
  MISSING_ENTRY_FILE: { title: "创建入口文件", explanation: "建议生成 index.html 或 src/main.tsx 作为运行入口。", suggestedActions: ["让 App Runtime 重新生成入口", "或手动添加最小 index.html"], confidence: 0.85, canAutoPatch: true, requiresHumanReview: false },
  MISSING_PACKAGE_JSON: { title: "生成 package.json", explanation: "项目需要 package.json 描述依赖与脚本。", suggestedActions: ["生成最小 package.json", "声明 vite + react 依赖"], confidence: 0.8, canAutoPatch: true, requiresHumanReview: false },
  IMPORT_NOT_FOUND: { title: "修复 import 路径或补齐文件", explanation: "import 指向的文件不存在，需补文件或修改路径。", suggestedActions: ["创建缺失文件", "或修改 import 路径"], confidence: 0.7, canAutoPatch: false, requiresHumanReview: true },
  UNDEFINED_COMPONENT: { title: "定义组件或补 export default", explanation: "入口或被引用组件缺少定义/默认导出。", suggestedActions: ["补充 export default", "或移除未使用引用"], confidence: 0.65, canAutoPatch: true, requiresHumanReview: false },
  INVALID_HTML: { title: "修复 HTML 结构", explanation: "HTML 缺少 html/body 等关键结构。", suggestedActions: ["重写 index.html 框架"], confidence: 0.9, canAutoPatch: true, requiresHumanReview: false },
  UNSAFE_SCRIPT: { title: "移除危险脚本并阻断", explanation: "检测到 eval / document.write 等危险用法。", suggestedActions: ["移除危险脚本", "运行将被 BLOCK"], confidence: 0.95, canAutoPatch: false, requiresHumanReview: true },
  SENSITIVE_INPUT: { title: "改为 mock 字段或脱敏", explanation: "包含 password/token 等敏感字段。", suggestedActions: ["改为占位字段", "添加隐私说明"], confidence: 0.8, canAutoPatch: false, requiresHumanReview: true },
  BUILD_CONFIG_MISSING: { title: "补齐构建配置", explanation: "缺少 README / vite config 等基础配置。", suggestedActions: ["生成 README 草案", "补齐 vite.config"], confidence: 0.75, canAutoPatch: true, requiresHumanReview: false },
  PREVIEW_UNAVAILABLE: { title: "改用其他 Runner", explanation: "当前 Runner 无法预览，可改用 EXTERNAL_CODEX_RUNNER。", suggestedActions: ["切换 Runner Mode"], confidence: 0.6, canAutoPatch: false, requiresHumanReview: true },
  EXTERNAL_API_UNSAFE: { title: "审查外部 API 调用", explanation: "检测到不受控的外部 API。", suggestedActions: ["移除或加白名单"], confidence: 0.6, canAutoPatch: false, requiresHumanReview: true },
  DEPENDENCY_RISK: { title: "审查依赖安全", explanation: "依赖项需要审查。", suggestedActions: ["人工 review"], confidence: 0.55, canAutoPatch: false, requiresHumanReview: true },
  UNDEFINED_VARIABLE: { title: "声明缺失变量", explanation: "代码引用了未定义变量。", suggestedActions: ["补声明", "或移除引用"], confidence: 0.6, canAutoPatch: false, requiresHumanReview: true },
  UNKNOWN_ERROR: { title: "需要人工排查", explanation: "未能自动识别错误类型。", suggestedActions: ["人工检查日志"], confidence: 0.3, canAutoPatch: false, requiresHumanReview: true },
};

export function generateRepairSuggestions(errors: CodeErrorSummary[]): CodeRepairSuggestion[] {
  return errors.map((e) => {
    const t = TEMPLATES[e.errorType] || TEMPLATES.UNKNOWN_ERROR;
    return {
      suggestionId: id(),
      title: t.title,
      explanation: `${t.explanation}\n相关：${e.title}`,
      suggestedActions: t.suggestedActions,
      confidence: t.confidence,
      affectedFiles: e.affectedFiles,
      errorType: e.errorType,
      canAutoPatch: t.canAutoPatch,
      requiresHumanReview: t.requiresHumanReview,
    };
  });
}
