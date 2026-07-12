// CSL 全栈投影 — 导出 / Scaffold 产物化
// Phase 1.7:把 projectionResult 落成可下载的工程产物
//
// 工程纪律:
//   1. 这是 projection result 的下游能力,不反向污染 pipeline
//   2. 仅依赖浏览器 API + jszip,不依赖任何后端
//   3. 每份产物可单独导出,zip 是聚合视图

import JSZip from 'jszip';
import type { ProjectionResult } from './types';
import type { DemoSpec } from './demo-source';
import { buildNodeScaffold } from './node-scaffold';

// ---------- 公共工具 ----------

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 释放在下一个 tick,避免某些浏览器在 click 前回收
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadText(text: string, filename: string, mime = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

// ---------- 各类元数据 ----------

interface ScaffoldMeta {
  generatedAt: string;
  generator: 'CSL Projection Pipeline v1';
  phase: 'Phase 1.7';
  demo: { id: string; name: string; description: string };
  manifest: ProjectionResult['manifest'];
}

function buildScaffoldMeta(demo: DemoSpec, result: ProjectionResult): ScaffoldMeta {
  return {
    generatedAt: new Date().toISOString(),
    generator: 'CSL Projection Pipeline v1',
    phase: 'Phase 1.7',
    demo: { id: demo.id, name: demo.name, description: demo.description },
    manifest: result.manifest,
  };
}

function buildFrontendMeta(result: ProjectionResult) {
  return {
    componentName: result.frontend.componentName,
    pageTitle: result.frontend.pageTitle,
    primaryConcept: result.frontend.primaryConcept,
    submitEndpoint: result.frontend.submitEndpoint,
    formFields: result.frontend.formFields,
    ruleResultLabels: result.frontend.ruleResultLabels,
    invariantResultLabels: result.frontend.invariantResultLabels,
  };
}

function buildBackendMeta(result: ProjectionResult) {
  return {
    handlerName: result.backend.handlerName,
    endpoint: result.backend.endpoint,
    inputSchema: result.backend.inputSchema,
    invariantChecks: result.backend.invariantChecks,
    ruleEvaluations: result.backend.ruleEvaluations,
  };
}

function buildReadme(demo: DemoSpec, result: ProjectionResult): string {
  return `# ${result.manifest.name} — CSL Scaffold

> 由 CSL Projection Pipeline (Phase 1.7) 自动导出
> 生成时间: ${new Date().toISOString()}

## 来源 Demo
- **id**: ${demo.id}
- **name**: ${demo.name}
- **描述**: ${demo.description}

## 应用本体
- 版本: ${result.manifest.version}
- 入口视图: ${result.manifest.entryView}
- 目标: ${result.manifest.target} · ${result.manifest.frontendFramework} · ${result.manifest.backendFramework}
- 包含规格: ${result.manifest.includedSpecs.join(', ') || '(未声明)'}

## 目录说明

\`\`\`
.
├── app-manifest.json              # 应用本体(从 .cslapp 解出)
├── README.md                      # 本文件
├── frontend/
│   ├── generated-app.tsx          # React + TS 前端(主表单组件)
│   └── projection-meta.json       # 前端投影协议元数据(字段/端点/标签)
├── backend/
│   ├── generated-handler.ts       # Node + TS handler(校验 + 规则)
│   └── projection-meta.json       # 后端投影协议元数据(schema/checks/rules)
├── diagnostics/
│   ├── projection-diagnostics.json  # 投影 pipeline 诊断
│   └── ose-report.json              # OSE 治理 4-hook 报告
└── source/
    ├── original.csl               # 原始业务规格
    └── original.cslapp            # 原始应用本体规格
\`\`\`

## 当前状态
- ✅ 前后端均由同一份 .csl + .cslapp 投影而来
- ✅ OSE 4 hook 已运行,详见 \`diagnostics/ose-report.json\`
- ⚠️ 仅适合本地阅读 / 复查 / 二次开发起点,不是即装即用 npm 工程
- ⚠️ generated-handler.ts 当前为浏览器内解释执行版本,真 Node 进程需自行包装 (express/fastify)

## 如何使用
1. 阅读 \`source/\` 复查原始规格意图
2. 阅读 \`*/projection-meta.json\` 复查投影协议是否符合预期
3. \`generated-app.tsx\` 与 \`generated-handler.ts\` 可作为前后端起点拷贝到目标工程
4. 任何修改请先回到 .csl 源,而非直接改 generated-* 文件,以保持源-投影一致
`;
}

// ---------- 单文件导出 ----------

export function exportFrontend(demo: DemoSpec, result: ProjectionResult) {
  downloadText(result.frontendSource, `${demo.id}.frontend.tsx`, 'text/plain;charset=utf-8');
}

export function exportBackend(demo: DemoSpec, result: ProjectionResult) {
  downloadText(result.backendSource, `${demo.id}.handler.ts`, 'text/plain;charset=utf-8');
}

export function exportDiagnostics(demo: DemoSpec, result: ProjectionResult) {
  const payload = {
    diagnostics: result.diagnostics,
    oseReport: result.oseReport ?? null,
  };
  downloadText(
    JSON.stringify(payload, null, 2),
    `${demo.id}.diagnostics.json`,
    'application/json;charset=utf-8',
  );
}

// ---------- Zip Scaffold 导出 ----------

export async function exportScaffoldZip(demo: DemoSpec, result: ProjectionResult): Promise<void> {
  const zip = new JSZip();
  const meta = buildScaffoldMeta(demo, result);

  // 顶层
  zip.file('app-manifest.json', JSON.stringify(result.manifest, null, 2));
  zip.file('README.md', buildReadme(demo, result));
  zip.file('scaffold-meta.json', JSON.stringify(meta, null, 2));

  // 前端
  const frontendDir = zip.folder('frontend')!;
  frontendDir.file('generated-app.tsx', result.frontendSource);
  frontendDir.file('projection-meta.json', JSON.stringify(buildFrontendMeta(result), null, 2));

  // 后端
  const backendDir = zip.folder('backend')!;
  backendDir.file('generated-handler.ts', result.backendSource);
  backendDir.file('projection-meta.json', JSON.stringify(buildBackendMeta(result), null, 2));

  // 诊断
  const diagDir = zip.folder('diagnostics')!;
  diagDir.file('projection-diagnostics.json', JSON.stringify(result.diagnostics, null, 2));
  diagDir.file('ose-report.json', JSON.stringify(result.oseReport ?? null, null, 2));

  // 源码
  const srcDir = zip.folder('source')!;
  srcDir.file('original.csl', demo.cslSource);
  srcDir.file('original.cslapp', demo.cslappSource);

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${demo.id}-scaffold.zip`);
}

// ---------- Node 服务 zip(Phase 1.8) ----------

/** 导出最小 Node + TS API scaffold(可 npm i && npm run dev) */
export async function exportNodeServiceZip(demo: DemoSpec, result: ProjectionResult): Promise<void> {
  const zip = new JSZip();
  const files = buildNodeScaffold(demo, result);
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${demo.id}-node-service.zip`);
}

