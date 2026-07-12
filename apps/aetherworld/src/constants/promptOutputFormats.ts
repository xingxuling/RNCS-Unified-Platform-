// 输出格式 · Prompt Output Formats
export type PromptOutputFormat =
  | "MARKDOWN_SPEC" | "CODE_DIFF" | "FILE_LIST" | "JSON_PLAN"
  | "STEP_LIST" | "MATRIX_TABLE" | "USER_COPY" | "MICROCOPY"
  | "EXEC_PROMPT" | "RESEARCH_REPORT";

export interface PromptOutputFormatMeta {
  key: PromptOutputFormat;
  cn: string;
  desc: string;
}

export const PROMPT_OUTPUT_FORMATS: Record<PromptOutputFormat, PromptOutputFormatMeta> = {
  MARKDOWN_SPEC:    { key: "MARKDOWN_SPEC",    cn: "Markdown 规格",  desc: "结构化产品 / 文档规格。" },
  CODE_DIFF:        { key: "CODE_DIFF",        cn: "代码改动",        desc: "面向工程的最小改动方案。" },
  FILE_LIST:        { key: "FILE_LIST",        cn: "文件清单",        desc: "新增 / 修改 / 删除文件列表。" },
  JSON_PLAN:        { key: "JSON_PLAN",        cn: "JSON 计划",       desc: "可被工具解析的结构化计划。" },
  STEP_LIST:        { key: "STEP_LIST",        cn: "步骤清单",        desc: "可执行的有序步骤。" },
  MATRIX_TABLE:     { key: "MATRIX_TABLE",     cn: "矩阵表格",        desc: "二维矩阵 / 对比表。" },
  USER_COPY:        { key: "USER_COPY",        cn: "用户文案",        desc: "面向最终用户的文案。" },
  MICROCOPY:        { key: "MICROCOPY",        cn: "极短提示",        desc: "按钮 / tooltip / 状态短文案。" },
  EXEC_PROMPT:      { key: "EXEC_PROMPT",      cn: "可执行提示词",    desc: "可直接投喂给 Lovable / GPT 等工具。" },
  RESEARCH_REPORT:  { key: "RESEARCH_REPORT",  cn: "研究报告",        desc: "白皮书 / 论文 / 长篇分析。" },
};
