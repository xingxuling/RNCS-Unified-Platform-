import type { CodeRunTargetFile, CodeRunLog } from "./codeRunRequestEngine";
import { createLogger } from "./codeRunLogEngine";

export interface StaticHtmlRunOutput {
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
  previewHtml?: string;
  logs: CodeRunLog[];
}

export function runStaticHtml(files: CodeRunTargetFile[]): StaticHtmlRunOutput {
  const log = createLogger("STATIC_HTML_RUNNER");
  log.system("Static HTML Runner started.");
  const html = files.find((f) => f.path.endsWith("index.html"));
  if (!html) {
    log.error("未找到 index.html。");
    return { status: "FAIL", logs: log.logs };
  }
  const content = html.content;
  let status: StaticHtmlRunOutput["status"] = "PASS";

  if (!/<!doctype\s+html>|<html/i.test(content)) { log.warn("HTML 缺少根标签。"); status = "WARN"; }
  if (!/<body[\s>]/i.test(content)) { log.warn("HTML 缺少 body。"); status = "WARN"; }
  if (!/<script/i.test(content) && !/<style/i.test(content)) log.info("无脚本与样式，纯静态页面。");
  if (/(eval\s*\(|document\.write)/i.test(content)) { log.error("检测到危险脚本调用，阻断运行。"); status = "BLOCKED"; }
  if (/name=["'](password|token|secret)["']/i.test(content)) { log.warn("存在敏感输入字段。"); if (status === "PASS") status = "WARN"; }

  log.info(`预览模式：iframe sandbox`);
  log.system("Static HTML Runner finished.");
  return { status, previewHtml: status === "BLOCKED" ? undefined : content, logs: log.logs };
}
