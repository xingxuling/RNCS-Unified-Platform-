// 开源架构吸收 · 安全策略
// 严格禁止自动执行 / 自动安装 / 自动上传 / 自动复制源码 / 绕过 license。
// 这是一个声明式策略：所有写入路径必须先调用此处校验。

export interface SafetyDecision {
  allowed: boolean;
  reasons: string[];
  mustWarn: string[];
}

export const FORBIDDEN_ACTIONS = [
  "AUTO_EXECUTE_EXTERNAL_CODE",
  "AUTO_INSTALL_DEPENDENCIES",
  "AUTO_RUN_SHELL",
  "AUTO_SCAN_LOCAL_FILESYSTEM",
  "AUTO_UPLOAD_SOURCE",
  "AUTO_COPY_SOURCE_INTO_PROJECT",
  "AUTO_BYPASS_LICENSE",
  "AUTO_ENABLE_HIGH_PRIVILEGE_PLUGIN",
] as const;
export type ForbiddenAction = typeof FORBIDDEN_ACTIONS[number];

export const STANDARD_WARNINGS = [
  "请人工核对开源许可证（License）。",
  "本分析为结构化建议，不构成法律意见。",
  "高风险代码必须先经人工确认。",
  "运行外部代码前必须进入 Code Sandbox / Local Gateway 安全策略。",
];

export function checkAction(action: string): SafetyDecision {
  if ((FORBIDDEN_ACTIONS as readonly string[]).includes(action)) {
    return {
      allowed: false,
      reasons: [`动作「${action}」被开源架构吸收安全策略禁止。`],
      mustWarn: STANDARD_WARNINGS,
    };
  }
  return { allowed: true, reasons: [], mustWarn: STANDARD_WARNINGS };
}

export function safetyHeaderForAnalysis(): string[] {
  return STANDARD_WARNINGS;
}
