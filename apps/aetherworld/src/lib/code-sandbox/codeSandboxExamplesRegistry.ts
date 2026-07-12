import type { CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";

export interface CodeSandboxExample {
  id: string;
  title: string;
  description: string;
  runnerMode: CodeSandboxMode;
  scenarioIdea: string;
  expectedErrorTypes: string[];
  expectedStatus: "PASS" | "WARN" | "FAIL" | "BLOCKED" | "SIMULATED";
}

export const CODE_SANDBOX_EXAMPLES: CodeSandboxExample[] = [
  { id: "ex-1", title: "番茄钟 HTML 静态运行",         description: "对番茄钟 index.html 执行 STATIC_HTML_RUNNER。", runnerMode: "STATIC_HTML_RUNNER",     scenarioIdea: "做一个番茄钟网页，专注 25 分钟、休息 5 分钟。", expectedErrorTypes: [],                       expectedStatus: "PASS" },
  { id: "ex-2", title: "React App 模拟构建",            description: "对 React 草案执行 SIMULATED_BUILD_RUNNER。",   runnerMode: "SIMULATED_BUILD_RUNNER", scenarioIdea: "做一个待办事项 App，使用 React。",               expectedErrorTypes: [],                       expectedStatus: "SIMULATED" },
  { id: "ex-3", title: "缺 App.tsx 触发 IMPORT_NOT_FOUND", description: "import './App' 但 App.tsx 缺失。",          runnerMode: "SIMULATED_BUILD_RUNNER", scenarioIdea: "做一个仪表盘 App，缺少 App.tsx。",                expectedErrorTypes: ["IMPORT_NOT_FOUND"],     expectedStatus: "FAIL" },
  { id: "ex-4", title: "缺 package.json",                description: "项目缺少 package.json。",                       runnerMode: "SIMULATED_BUILD_RUNNER", scenarioIdea: "做一个静态站点但忘了 package.json。",            expectedErrorTypes: ["MISSING_PACKAGE_JSON"], expectedStatus: "FAIL" },
  { id: "ex-5", title: "HTML 结构错误",                  description: "缺少 html / body 标签。",                       runnerMode: "STATIC_HTML_RUNNER",     scenarioIdea: "用半成品 HTML 测试预览。",                       expectedErrorTypes: ["INVALID_HTML"],         expectedStatus: "WARN" },
  { id: "ex-6", title: "包含敏感 password 字段",         description: "检测 password input 并 WARN。",                  runnerMode: "STATIC_HTML_RUNNER",     scenarioIdea: "做一个登录页面演示。",                            expectedErrorTypes: ["SENSITIVE_INPUT"],      expectedStatus: "WARN" },
  { id: "ex-7", title: "危险脚本触发 BLOCK",            description: "检测 eval / document.write 并阻断。",            runnerMode: "STATIC_HTML_RUNNER",     scenarioIdea: "测试 HTML 含 eval(...) 的情况。",                expectedErrorTypes: ["UNSAFE_SCRIPT"],        expectedStatus: "BLOCKED" },
  { id: "ex-8", title: "失败运行生成 Codex 修复包",      description: "FAIL 状态自动生成 Codex Repair Pack。",          runnerMode: "EXTERNAL_CODEX_RUNNER",  scenarioIdea: "把失败的 App 草案交给 Codex 修复。",              expectedErrorTypes: [],                       expectedStatus: "SIMULATED" },
];
