export type CodeSandboxMode =
  | "STATIC_HTML_RUNNER"
  | "SIMULATED_BUILD_RUNNER"
  | "EXTERNAL_CODEX_RUNNER"
  | "EXTERNAL_CURSOR_RUNNER"
  | "FUTURE_REAL_SANDBOX";

export interface CodeSandboxModeInfo {
  mode: CodeSandboxMode;
  title: string;
  titleEn: string;
  description: string;
  enabled: boolean;
  notes: string[];
}

export const CODE_SANDBOX_MODES: CodeSandboxModeInfo[] = [
  {
    mode: "STATIC_HTML_RUNNER",
    title: "静态 HTML 运行",
    titleEn: "Static HTML Runner",
    description: "对 App Runtime 生成的 index.html 进行 iframe 预览与基础检查。",
    enabled: true,
    notes: ["仅运行单文件 HTML", "iframe 沙箱预览", "不执行系统命令"],
  },
  {
    mode: "SIMULATED_BUILD_RUNNER",
    title: "模拟构建运行",
    titleEn: "Simulated Build Runner",
    description: "对 React / TSX 项目模拟 build / lint / typecheck，不真实执行命令。",
    enabled: true,
    notes: ["不真实执行 npm/pnpm/yarn", "静态分析文件树与 import", "生成模拟日志"],
  },
  {
    mode: "EXTERNAL_CODEX_RUNNER",
    title: "Codex 修复包",
    titleEn: "External Codex Runner",
    description: "把代码 + 错误摘要打包为 Codex Prompt，交由外部 Codex 执行 dry-run。",
    enabled: true,
    notes: ["不调用真实 Codex API", "生成 Prompt 与 Contract", "要求 Codex dry-run"],
  },
  {
    mode: "EXTERNAL_CURSOR_RUNNER",
    title: "Cursor 修复包",
    titleEn: "External Cursor Runner",
    description: "生成给 Cursor 的文件级修复上下文与说明。",
    enabled: true,
    notes: ["生成文件编辑上下文", "包含修复说明与测试建议"],
  },
  {
    mode: "FUTURE_REAL_SANDBOX",
    title: "真实沙箱（保留）",
    titleEn: "Future Real Sandbox",
    description: "Real sandbox execution is reserved for future version.",
    enabled: false,
    notes: ["v0.2 未启用", "等待 Docker / E2B 接入"],
  },
];

export function getSandboxMode(mode: CodeSandboxMode): CodeSandboxModeInfo {
  return CODE_SANDBOX_MODES.find((m) => m.mode === mode) || CODE_SANDBOX_MODES[0];
}
