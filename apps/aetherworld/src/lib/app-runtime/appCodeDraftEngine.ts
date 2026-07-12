import type { AppCodeFile, AppRequirementObject, AppArchitectureObject, AppFileTreeObject } from "./appProjectObjectEngine";

function htmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildIndexHtml(name: string, req: AppRequirementObject): string {
  const features = req.mvpFeatures.map(f => `<li><strong>${htmlEscape(f.title)}</strong> — ${htmlEscape(f.userValue)}</li>`).join("\n      ");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${htmlEscape(name)} · Aether App Runtime Draft</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#0b0b0f; color:#eae6d8; max-width:720px; margin:0 auto; padding:32px 20px; line-height:1.6; }
  h1 { font-size:22px; letter-spacing:.02em; }
  .tag { display:inline-block; font-size:11px; padding:2px 8px; border:1px solid #514a2f; border-radius:999px; color:#c9b27a; margin-bottom:12px; }
  ul { padding-left:20px; }
  .card { border:1px solid #2a2620; border-radius:8px; padding:16px; margin-top:16px; background:#13110d; }
  button { background:#c9b27a; color:#0b0b0f; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; }
  .muted { color:#8a8475; font-size:12px; }
</style>
</head>
<body>
  <div class="tag">Aether App Runtime v0.1 · Draft Preview</div>
  <h1>${htmlEscape(name)}</h1>
  <p>${htmlEscape(req.productSummary)}</p>
  <div class="card">
    <h2 style="font-size:14px;margin:0 0 8px;">MVP 功能</h2>
    <ul>
      ${features}
    </ul>
  </div>
  <div class="card">
    <h2 style="font-size:14px;margin:0 0 8px;">操作示例</h2>
    <button onclick="document.getElementById('out').textContent='已触发 MVP 主操作（草案）'">运行主操作</button>
    <p id="out" class="muted" style="margin-top:8px;">点击按钮查看草案行为</p>
  </div>
  <p class="muted" style="margin-top:24px;">该页面由 Aether App Runtime 生成，仅为草案预览，不代表生产部署。</p>
</body>
</html>`;
}

function buildReactApp(name: string, req: AppRequirementObject): string {
  return `import { useState } from "react";

export default function App() {
  const [active, setActive] = useState<string | null>(null);
  const features = ${JSON.stringify(req.mvpFeatures.map(f => ({ id: f.featureId, title: f.title, value: f.userValue })), null, 2)};
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, color: "#eae6d8", background: "#0b0b0f", minHeight: "100vh", fontFamily: "system-ui" }}>
      <div style={{ fontSize: 11, color: "#c9b27a", letterSpacing: ".15em" }}>AETHER APP RUNTIME · DRAFT</div>
      <h1 style={{ fontSize: 22 }}>${name.replace(/"/g, '\\"')}</h1>
      <p style={{ color: "#8a8475" }}>${req.productSummary.replace(/"/g, '\\"').slice(0, 120)}</p>
      <ul>
        {features.map(f => (
          <li key={f.id} onClick={() => setActive(f.id)} style={{ cursor: "pointer", padding: 8, borderBottom: "1px solid #2a2620" }}>
            <strong>{f.title}</strong> — <span style={{ color: "#8a8475" }}>{f.value}</span>
          </li>
        ))}
      </ul>
      {active && <div style={{ marginTop: 16, padding: 12, border: "1px solid #2a2620" }}>已选中：{active}</div>}
    </div>
  );
}
`;
}

function buildMainTsx(): string {
  return `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
`;
}

function buildIndexCss(): string {
  return `:root { color-scheme: dark; }
body { margin: 0; background: #0b0b0f; color: #eae6d8; font-family: system-ui; }
`;
}

function buildPackageJson(name: string): string {
  return JSON.stringify({
    name: name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 32) || "aether-app-draft",
    private: true,
    version: "0.1.0",
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    devDependencies: { vite: "^7.0.0", typescript: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" },
  }, null, 2);
}

function buildReadme(name: string, req: AppRequirementObject): string {
  return `# ${name}

> 由 Aether App Runtime v0.1 生成的草案项目。**非生产部署。**

## 概述
${req.productSummary}

## MVP 功能
${req.mvpFeatures.map(f => `- **${f.title}** — ${f.userValue}`).join("\n")}

## Non-goals
${req.nonGoals.map(n => `- ${n}`).join("\n")}

## 继续开发
- 可交付给 Codex / Cursor / Lovable 继续完善。
- 不要删除现有结构，按 MVP 增量补全即可。
`;
}

function buildPrdMd(name: string, req: AppRequirementObject): string {
  return `# Product Requirements · ${name}

${req.productSummary}

## 目标用户
${req.targetUsers.map(u => `- ${u}`).join("\n")}

## User Stories
${req.userStories.map(s => `- ${s}`).join("\n")}

## MVP Features
${req.mvpFeatures.map(f => `### ${f.title} (${f.priority})\n- 价值：${f.userValue}\n- 验收：\n${f.acceptanceCriteria.map(a => `  - ${a}`).join("\n")}`).join("\n\n")}

## Non-goals
${req.nonGoals.map(n => `- ${n}`).join("\n")}
`;
}

function buildArchMd(name: string, arch: AppArchitectureObject): string {
  return `# Architecture · ${name}

- Framework Target: \`${arch.frameworkTarget}\`

## Pages
${arch.pageMap.map(p => `- \`${p.route}\` — ${p.title}：${p.purpose}`).join("\n")}

## Components
${arch.componentMap.map(c => `- **${c.name}** — ${c.responsibility}`).join("\n")}

## State
${arch.stateModel.stateFields.map(s => `- ${s}`).join("\n")}

## Risks
${arch.risks.map(r => `- ${r}`).join("\n")}
`;
}

function buildCodexTaskMd(name: string, req: AppRequirementObject): string {
  return `# Codex Task · ${name}

## 目标
基于 PRD / Architecture / 现有文件，继续完善 MVP 功能，使应用可在浏览器中正常使用。

## 不可破坏
- 不要重写现有业务逻辑
- 不要删除现有文件结构
- 不要引入未声明依赖

## TODO
${req.mvpFeatures.map(f => `- [ ] 实现 **${f.title}** 并满足验收：${f.acceptanceCriteria[0]}`).join("\n")}

## 验收
- \`npm run dev\` 可启动
- 主要功能可点击、可见反馈
- README 与实际行为一致
`;
}

function buildQaChecklistMd(name: string): string {
  return `# QA Checklist · ${name}

- [ ] 主页可加载
- [ ] MVP 每个功能均可操作
- [ ] 空状态、错误状态、加载状态有处理
- [ ] 控制台无报错
- [ ] 没有收集敏感信息
- [ ] 没有执行危险脚本
- [ ] 没有声称已部署生产
`;
}

export function generateAppCodeDraft(
  projectId: string,
  name: string,
  req: AppRequirementObject,
  arch: AppArchitectureObject,
  tree: AppFileTreeObject,
): AppCodeFile[] {
  const now = new Date().toISOString();
  const fileMap: Record<string, () => string> = {
    "index.html": () => arch.frameworkTarget === "SINGLE_HTML" ? buildIndexHtml(name, req) :
      `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>${name}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    "src/App.tsx":   () => buildReactApp(name, req),
    "src/main.tsx":  () => buildMainTsx(),
    "src/index.css": () => buildIndexCss(),
    "src/styles.css":() => buildIndexCss(),
    "package.json":  () => buildPackageJson(name),
    "README.md":     () => buildReadme(name, req),
    "app/page.tsx":  () => buildReactApp(name, req),
    "PRODUCT_REQUIREMENTS.md": () => buildPrdMd(name, req),
    "ARCHITECTURE.md":         () => buildArchMd(name, arch),
    "CODEX_TASK.md":           () => buildCodexTaskMd(name, req),
    "QA_CHECKLIST.md":         () => buildQaChecklistMd(name),
  };

  return tree.files.map((f, i) => {
    const builder = fileMap[f.path];
    const content = builder ? builder() : `// ${f.path} — ${f.purpose}\n`;
    const lang = f.fileType === "TSX" ? "tsx" : f.fileType === "HTML" ? "html" : f.fileType === "CSS" ? "css" : f.fileType === "JSON" ? "json" : f.fileType === "MD" ? "markdown" : "text";
    return {
      fileId: `file-${projectId}-${i}`,
      path: f.path,
      language: lang,
      content,
      purpose: f.purpose,
      editable: true,
      generatedAt: now,
    };
  });
}
