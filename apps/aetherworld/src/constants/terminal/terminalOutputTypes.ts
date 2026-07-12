export type TerminalOutputType =
  | "TEXT"
  | "STRUCTURED"
  | "JSON"
  | "MARKDOWN"
  | "TRACE"
  | "TABLE"
  | "ERROR"
  | "WARNING"
  | "SUCCESS"
  | "EXPORT_READY";

export const TERMINAL_OUTPUT_TYPES: { id: TerminalOutputType; label: string }[] = [
  { id: "TEXT", label: "文本" },
  { id: "STRUCTURED", label: "结构化" },
  { id: "JSON", label: "JSON" },
  { id: "MARKDOWN", label: "Markdown" },
  { id: "TRACE", label: "调用链" },
  { id: "TABLE", label: "表格" },
  { id: "ERROR", label: "错误" },
  { id: "WARNING", label: "警告" },
  { id: "SUCCESS", label: "成功" },
  { id: "EXPORT_READY", label: "可导出" },
];

export interface TerminalOutput {
  id: string;
  type: TerminalOutputType;
  title?: string;
  content: string | object;
  trace?: object;
  safetyNotes?: string[];
  quickActions?: string[];
  createdAt: string;
}
