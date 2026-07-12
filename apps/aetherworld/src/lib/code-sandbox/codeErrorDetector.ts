import type { CodeRunTargetFile, CodeErrorSummary } from "./codeRunRequestEngine";
import type { CodeErrorType } from "@/constants/code-sandbox/codeErrorTypes";

let counter = 0;
function newErrId(): string {
  counter += 1;
  return `err-${Date.now().toString(36)}-${counter}`;
}

function build(errorType: CodeErrorType, severity: CodeErrorSummary["severity"], title: string, explanation: string, affectedFiles: string[], causes: string[]): CodeErrorSummary {
  return { errorId: newErrId(), errorType, severity, title, explanation, affectedFiles, suspectedCauses: causes };
}

export function detectErrors(files: CodeRunTargetFile[], runnerMode: string): CodeErrorSummary[] {
  const errors: CodeErrorSummary[] = [];
  const paths = files.map((f) => f.path);

  if (runnerMode === "STATIC_HTML_RUNNER") {
    const html = files.find((f) => f.path.endsWith("index.html"));
    if (!html) {
      errors.push(build("MISSING_ENTRY_FILE", "HIGH", "缺少 index.html", "STATIC_HTML_RUNNER 需要入口 HTML 文件。", [], ["项目未生成 index.html"]));
    } else {
      const content = html.content;
      if (!/<!doctype\s+html>|<html/i.test(content)) {
        errors.push(build("INVALID_HTML", "MEDIUM", "缺少 <html> 根标签", "HTML 文档缺少根标签。", [html.path], ["代码生成不完整"]));
      }
      if (!/<body[\s>]/i.test(content)) {
        errors.push(build("INVALID_HTML", "MEDIUM", "缺少 <body>", "HTML 缺少 body 标签。", [html.path], []));
      }
      if (/<script[^>]*>[\s\S]*?(eval|document\.write)/i.test(content)) {
        errors.push(build("UNSAFE_SCRIPT", "CRITICAL", "包含危险脚本", "检测到 eval 或 document.write。", [html.path], ["代码不安全"]));
      }
      if (/name=["'](password|token|secret)["']/i.test(content)) {
        errors.push(build("SENSITIVE_INPUT", "MEDIUM", "敏感输入字段", "包含密码/令牌字段。", [html.path], ["建议改为 mock"]));
      }
    }
  }

  if (runnerMode === "SIMULATED_BUILD_RUNNER") {
    const pkg = files.find((f) => f.path.endsWith("package.json"));
    if (!pkg) errors.push(build("MISSING_PACKAGE_JSON", "HIGH", "缺少 package.json", "项目缺少 package.json。", [], ["项目未配置 npm 元数据"]));
    const hasEntry = files.some((f) => f.path === "src/main.tsx" || f.path === "src/main.ts" || f.path === "src/App.tsx" || f.path === "index.html");
    if (!hasEntry) errors.push(build("MISSING_ENTRY_FILE", "HIGH", "缺少 src/main.tsx 或入口", "未检测到入口文件。", [], []));

    for (const f of files) {
      if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;
      const importRegex = /from\s+["']((?:\.\.?\/|@\/)[^"']+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = importRegex.exec(f.content))) {
        const target = m[1];
        if (target.startsWith("./") || target.startsWith("../")) {
          const baseDir = f.path.split("/").slice(0, -1);
          const segs = target.split("/");
          for (const s of segs) {
            if (s === "..") baseDir.pop();
            else if (s !== ".") baseDir.push(s);
          }
          const resolved = baseDir.join("/");
          const exists = paths.some((p) =>
            p === resolved ||
            p === `${resolved}.ts` || p === `${resolved}.tsx` ||
            p === `${resolved}.js` || p === `${resolved}.jsx` ||
            p === `${resolved}/index.ts` || p === `${resolved}/index.tsx`
          );
          if (!exists) {
            errors.push(build("IMPORT_NOT_FOUND", "HIGH", `import 文件不存在：${target}`, `${f.path} 引用了不存在的模块 ${target}。`, [f.path], ["路径错误或文件未生成"]));
          }
        }
      }
      if (/export\s+default/.test(f.content) === false && /\/(App|main)\.tsx$/.test(f.path)) {
        errors.push(build("UNDEFINED_COMPONENT", "MEDIUM", `${f.path} 缺少 export default`, "入口文件缺少默认导出。", [f.path], []));
      }
    }
    const hasReadme = files.some((f) => /readme\.md/i.test(f.path));
    if (!hasReadme) errors.push(build("BUILD_CONFIG_MISSING", "LOW", "缺少 README.md", "项目缺少使用说明。", [], []));
  }

  return errors;
}

export function summarizeErrors(errors: CodeErrorSummary[]): CodeErrorSummary | undefined {
  if (errors.length === 0) return undefined;
  const sevOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const sorted = [...errors].sort((a, b) => sevOrder[b.severity] - sevOrder[a.severity]);
  const top = sorted[0];
  return {
    ...top,
    title: `${top.title}（共 ${errors.length} 项问题）`,
    explanation: errors.map((e) => `· [${e.severity}] ${e.title}`).join("\n"),
    affectedFiles: Array.from(new Set(errors.flatMap((e) => e.affectedFiles))),
    suspectedCauses: Array.from(new Set(errors.flatMap((e) => e.suspectedCauses))),
  };
}
