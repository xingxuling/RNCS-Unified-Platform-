export interface AppQaRule {
  id: string;
  title: string;
  severity: "INFO" | "WARN" | "FAIL" | "CRITICAL";
  description: string;
}

export const APP_QA_RULES: AppQaRule[] = [
  { id: "QA-001", title: "项目名存在",     severity: "WARN",     description: "项目必须有清晰的名字" },
  { id: "QA-002", title: "MVP 范围明确",   severity: "WARN",     description: "必须列出 MVP 核心功能" },
  { id: "QA-003", title: "文件树非空",     severity: "FAIL",     description: "必须生成文件树" },
  { id: "QA-004", title: "入口文件存在",   severity: "FAIL",     description: "必须有入口文件" },
  { id: "QA-005", title: "README 存在",    severity: "WARN",     description: "应包含 README" },
  { id: "QA-006", title: "HTML 闭合",      severity: "FAIL",     description: "HTML 标签需正确闭合" },
  { id: "QA-007", title: "React import 完整", severity: "FAIL",  description: "React 草案不能缺 import" },
  { id: "QA-008", title: "无未定义变量",   severity: "WARN",     description: "不引用未定义变量" },
  { id: "QA-009", title: "无危险脚本",     severity: "CRITICAL", description: "不得执行危险脚本" },
  { id: "QA-010", title: "无敏感信息收集", severity: "CRITICAL", description: "不得收集密码 / token" },
  { id: "QA-011", title: "未过度复杂",     severity: "WARN",     description: "MVP 应保持轻量" },
  { id: "QA-012", title: "验收标准齐全",   severity: "WARN",     description: "每个 MVP 功能应有验收标准" },
  { id: "QA-013", title: "导出包就绪",     severity: "INFO",     description: "可生成导出包" },
  { id: "QA-014", title: "可保存 Workspace", severity: "INFO",   description: "项目应可保存到工作区" },
  { id: "QA-015", title: "可继续 Codex 开发", severity: "INFO",  description: "应可生成 Codex 任务包" },
];
