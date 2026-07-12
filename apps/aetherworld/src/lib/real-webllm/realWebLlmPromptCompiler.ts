// Prompt 编译：禁止泄漏 Full60 / Founder-only / 密钥等
export interface CompiledPromptInput {
  userInput: string;
  systemHint?: string;
  knowledgeSummary?: string;
  calculusRoute?: string;
  constants?: string;
  conceptChain?: string;
  objectSummary?: string;
  outputFormat?: string;
}

const SYSTEM_BASE = `你是 Aetherworld 的浏览器本地 WebLLM 辅助层。
你不是最终裁决者。
你必须服从计算法结构、常数约束、QA 和系统宪法。
你不能声称模拟结果是真实执行。
你不能绕过能力包安装机制。
你不能生成危险命令。
你不能泄漏隐私数据。
请使用中文回答。`;

const FORBIDDEN_PATTERNS = [
  /Full60[_\s]?raw/i,
  /founder[\-_\s]?only/i,
  /api[_\s]?key/i,
  /secret/i,
  /token=/i,
  /password\s*[:=]/i,
];

function sanitize(s?: string): string {
  if (!s) return "";
  let out = s;
  for (const re of FORBIDDEN_PATTERNS) {
    out = out.replace(re, "[已脱敏]");
  }
  return out.slice(0, 4000);
}

export function compileRealWebLlmPrompt(input: CompiledPromptInput) {
  const sys = [SYSTEM_BASE, input.systemHint && sanitize(input.systemHint)]
    .filter(Boolean)
    .join("\n");

  const ctxParts: string[] = [];
  if (input.knowledgeSummary) ctxParts.push("【知识摘要】" + sanitize(input.knowledgeSummary));
  if (input.calculusRoute) ctxParts.push("【计算法路线】" + sanitize(input.calculusRoute));
  if (input.constants) ctxParts.push("【常数约束】" + sanitize(input.constants));
  if (input.conceptChain) ctxParts.push("【概念链】" + sanitize(input.conceptChain));
  if (input.objectSummary) ctxParts.push("【当前对象】" + sanitize(input.objectSummary));
  if (input.outputFormat) ctxParts.push("【输出要求】" + sanitize(input.outputFormat));

  const userText =
    (ctxParts.length ? ctxParts.join("\n") + "\n\n" : "") +
    "【用户输入】" + sanitize(input.userInput);

  return [
    { role: "system" as const, content: sys },
    { role: "user" as const, content: userText },
  ];
}
