export interface CodeSandboxSafetyRule {
  id: string;
  rule: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
}

export const CODE_SANDBOX_SAFETY_RULES: CodeSandboxSafetyRule[] = [
  { id: "CS-001", rule: "禁止真实执行危险系统命令", severity: "CRITICAL" },
  { id: "CS-002", rule: "禁止读取本地设备文件（.ssh / .env / cookies / 密码）", severity: "CRITICAL" },
  { id: "CS-003", rule: "禁止自动写入用户本地文件系统", severity: "CRITICAL" },
  { id: "CS-004", rule: "禁止自动部署或公开发布", severity: "CRITICAL" },
  { id: "CS-005", rule: "禁止上传用户数据到外部服务", severity: "CRITICAL" },
  { id: "CS-006", rule: "v0.2 默认只生成 Patch Draft，不直接写入文件", severity: "FAIL" },
  { id: "CS-007", rule: "高风险 Patch 必须人工确认", severity: "FAIL" },
  { id: "CS-008", rule: "禁止伪装真实执行结果", severity: "FAIL" },
  { id: "CS-009", rule: "命令命中黑名单必须 BLOCK", severity: "CRITICAL" },
  { id: "CS-010", rule: "运行链路必须生成可审计的 Run Log", severity: "WARN" },
];

export const CODE_SANDBOX_SAFETY_FOOTER =
  "Aether Code Sandbox Bridge v0.2 用于对 App Runtime 生成的代码草案进行受控预览、模拟构建、错误检测、修复建议、Patch 草案和外部工具交接。v0.2 默认不执行真实系统命令，不读取本地设备，不写入用户文件，不部署项目，不上传用户数据。所有危险命令、敏感信息读取、自动删除、自动部署和绕过 QA 的行为都会被阻断。";
