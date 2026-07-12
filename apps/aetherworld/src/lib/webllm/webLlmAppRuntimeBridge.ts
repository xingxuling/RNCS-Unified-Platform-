export interface AppRuntimeWebLlmEnhancement {
  enhances: string[];
  notes: string[];
}

export function planAppRuntimeWebLlm(appType: string): AppRuntimeWebLlmEnhancement {
  return {
    enhances: ["idea expansion", "PRD", "architecture explanation", "index.html draft", "React draft", "README", "Codex Handoff Pack"],
    notes: [
      `App 类型：${appType}`,
      "WebLLM 仅补全语言/代码草案，不取代 App Runtime 规则层。",
      "草案必须经 App QA 与 Code Sandbox 检查。",
    ],
  };
}
