export interface WebKnowledgeExample {
  id: string;
  title: string;
  intent: string;
  description: string;
}
export const WEB_KNOWLEDGE_EXAMPLES: WebKnowledgeExample[] = [
  { id: "ex1", title: "检索 App Runtime 相关知识", intent: "做一个番茄钟网页应用", description: "走 App Runtime 计算法路径。" },
  { id: "ex2", title: "检索 Code Sandbox 相关知识", intent: "修复一段 React 代码错误", description: "走 Code Sandbox 计算法路径。" },
  { id: "ex3", title: "选择 App Runtime Calculus", intent: "生成一个待办网页", description: "意图匹配 APP_RUNTIME_CALCULUS。" },
  { id: "ex4", title: "选择 Code Sandbox Calculus", intent: "patch 这个 TypeScript 错误", description: "意图匹配 CODE_SANDBOX_CALCULUS。" },
  { id: "ex5", title: "为代码任务注入 NO_DANGEROUS_CODE", intent: "运行一段构建脚本", description: "自动注入 NO_DANGEROUS_CODE。" },
  { id: "ex6", title: "为世界任务注入 VIRTUAL_NOT_REALITY", intent: "推演世界主题曲", description: "自动注入 VIRTUAL_NOT_REALITY。" },
  { id: "ex7", title: "为本地 AI 任务注入 NO_VENDOR_LOCK_IN", intent: "用本地 WebLLM 生成 README", description: "注入防卡脖子常数。" },
  { id: "ex8", title: "检测 stale knowledge", intent: "查看哪些知识已过期", description: "Stale 检测面板。" },
  { id: "ex9", title: "检测知识冲突", intent: "查看同源多版本冲突", description: "Conflict 检测器。" },
  { id: "ex10", title: "WebLKM → WebLCM → WebLLM 链", intent: "把番茄钟想法走完整链路", description: "三体 + 概念 + 语言。" },
  { id: "ex11", title: "WebCM 计算法路线生成", intent: "缺什么 → 跃迁 → App Runtime", description: "多计算法组合路线。" },
  { id: "ex12", title: "WebCoM 常数违背检测", intent: "rm -rf 是否允许？", description: "触发 NO_DANGEROUS_CODE。" },
];
