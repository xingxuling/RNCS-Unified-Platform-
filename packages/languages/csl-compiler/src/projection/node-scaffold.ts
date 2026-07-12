// CSL Phase 1.8 — 真 Node Runtime / API Scaffold 生成
// 把 backend projection 落成最小 Node + TS 服务骨架
// 范围: Node + TS + express + 单 endpoint, 不含 db / auth / queue / 部署

import type { ProjectionResult, FrontendProjection, BackendProjection } from './types';
import type { DemoSpec } from './demo-source';

// ---------- Endpoint Manifest ----------

export interface EndpointManifest {
  service: string;
  version: string;
  baseUrl: string;
  endpoints: Array<{
    method: 'POST';
    path: string;
    handler: string;
    requestSchema: Record<string, 'string' | 'number'>;
    responseShape: 'HandlerResponse';
    invariants: string[];
    rules: string[];
  }>;
  frontend: {
    componentName: string;
    submitEndpoint: string;
  };
  alignment: {
    submitEndpointMatchesRoute: boolean;
    fieldsAligned: boolean;
    notes: string[];
  };
}

export function buildEndpointManifest(demo: DemoSpec, result: ProjectionResult): EndpointManifest {
  const fe = result.frontend;
  const be = result.backend;
  const align = checkEndpointAlignment(fe, be);
  return {
    service: result.manifest.name,
    version: result.manifest.version,
    baseUrl: 'http://localhost:3000',
    endpoints: [{
      method: 'POST',
      path: be.endpoint,
      handler: be.handlerName,
      requestSchema: be.inputSchema,
      responseShape: 'HandlerResponse',
      invariants: be.invariantChecks.map(c => c.name),
      rules: be.ruleEvaluations.map(r => r.name),
    }],
    frontend: {
      componentName: fe.componentName,
      submitEndpoint: fe.submitEndpoint,
    },
    alignment: align,
  };
}

// ---------- Frontend ↔ Backend 对齐检查 ----------

export interface AlignmentReport {
  submitEndpointMatchesRoute: boolean;
  fieldsAligned: boolean;
  notes: string[];
}

export function checkEndpointAlignment(fe: FrontendProjection, be: BackendProjection): AlignmentReport {
  const notes: string[] = [];
  const epMatch = fe.submitEndpoint === be.endpoint;
  if (!epMatch) {
    notes.push(`submitEndpoint "${fe.submitEndpoint}" 与后端 route "${be.endpoint}" 不一致`);
  } else {
    notes.push(`endpoint 一致: POST ${be.endpoint}`);
  }

  const feFields = new Set(fe.formFields.map(f => f.name));
  const beFields = new Set(Object.keys(be.inputSchema));
  let fieldsAligned = true;
  for (const f of feFields) {
    if (!beFields.has(f)) { fieldsAligned = false; notes.push(`前端字段「${f}」在后端 schema 缺失`); }
  }
  for (const f of beFields) {
    if (!feFields.has(f)) { fieldsAligned = false; notes.push(`后端字段「${f}」前端未渲染`); }
  }
  if (fieldsAligned && epMatch) {
    notes.push(`字段集合对齐 (${feFields.size} 项)`);
  }
  return { submitEndpointMatchesRoute: epMatch, fieldsAligned, notes };
}

// ---------- route.ts ----------

export function generateRouteSource(p: BackendProjection): string {
  return `// 由 CSL 投影自动生成 — 单 endpoint route
// 关联: handler.ts 中的 ${p.handlerName}

import { Router, type Request, type Response } from 'express';
import { ${p.handlerName}, type HandlerInput } from './handler';

export const router = Router();

router.post('${p.endpoint}', (req: Request, res: Response) => {
  const input = req.body as HandlerInput;
  const result = ${p.handlerName}(input);
  res.status(result.ok ? 200 : 422).json(result);
});
`;
}

// ---------- server.ts ----------

export function generateServerSource(p: BackendProjection, manifestName: string): string {
  return `// 由 CSL 投影自动生成 — 最小 Node + TS server entry
// 启动: npm install && npm run dev
// 服务: ${manifestName}

import express from 'express';
import { router } from './route';

const app = express();
app.use(express.json());

// 简易 CORS, 仅供本地联调
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});
app.options('*', (_req, res) => res.sendStatus(204));

app.get('/health', (_req, res) => res.json({ ok: true, service: ${JSON.stringify(manifestName)} }));

app.use(router);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`[${manifestName}] listening on http://localhost:\${PORT}\`);
  console.log(\`  → POST http://localhost:\${PORT}${p.endpoint}\`);
});
`;
}

// ---------- package.json ----------

export function generatePackageJson(demo: DemoSpec): string {
  return JSON.stringify({
    name: `csl-projection-${demo.id}`,
    version: '0.1.0',
    private: true,
    description: `CSL projected Node service for ${demo.name}`,
    type: 'commonjs',
    scripts: {
      dev: 'ts-node-dev --respawn server.ts',
      build: 'tsc -p tsconfig.json',
      start: 'node dist/server.js',
    },
    dependencies: {
      express: '^4.19.2',
    },
    devDependencies: {
      '@types/express': '^4.17.21',
      '@types/node': '^20.11.0',
      typescript: '^5.4.0',
      'ts-node-dev': '^2.0.0',
    },
  }, null, 2);
}

// ---------- tsconfig.json ----------

export function generateTsconfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: 'dist',
      resolveJsonModule: true,
    },
    include: ['*.ts'],
    exclude: ['node_modules', 'dist'],
  }, null, 2);
}

// ---------- README ----------

export function generateBackendReadme(demo: DemoSpec, result: ProjectionResult): string {
  return `# ${result.manifest.name} — Node API Scaffold

由 CSL Projection Pipeline (Phase 1.8) 自动生成的最小 Node + TypeScript 服务骨架。

## 来源
- demo: \`${demo.id}\`
- 业务规格: original.csl
- 应用本体: original.cslapp

## 目录
\`\`\`
.
├── package.json
├── tsconfig.json
├── server.ts                # express 启动入口 + CORS + /health
├── route.ts                 # 单 endpoint 路由
├── handler.ts               # 由 CSL 投影的纯函数 handler(校验 + 规则)
├── endpoint-manifest.json   # endpoint + schema + 前后端对齐报告
├── original.csl
└── original.cslapp
\`\`\`

## Endpoint
- **POST \`${result.backend.endpoint}\`**
- 入参字段: ${Object.keys(result.backend.inputSchema).map(k => `\`${k}\``).join(', ') || '(无)'}
- 校验数: ${result.backend.invariantChecks.length}
- 规则数: ${result.backend.ruleEvaluations.length}

## 前后端对齐
- 前端组件: \`${result.frontend.componentName}\`
- 前端 submitEndpoint: \`${result.frontend.submitEndpoint}\`
- 与后端 route 一致: ${result.frontend.submitEndpoint === result.backend.endpoint ? '✅' : '❌'}

详见 \`endpoint-manifest.json\` 中的 \`alignment\` 字段。

## 本地启动
\`\`\`bash
npm install
npm run dev
# 然后访问 http://localhost:3000/health
\`\`\`

## 调用示例
\`\`\`bash
curl -X POST http://localhost:3000${result.backend.endpoint} \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(buildSampleInput(result), null, 0)}'
\`\`\`

## 边界
- 仅 Phase 1.8: 单 endpoint / 无持久化 / 无认证 / 无 queue
- 任何业务变更请回到 \`original.csl\`,而非直接改 \`handler.ts\`
`;
}

function buildSampleInput(result: ProjectionResult): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const f of result.frontend.formFields) {
    obj[f.name] = f.defaultValue;
  }
  return obj;
}

// ---------- 聚合: 一次拿全 Node scaffold 文件 ----------

export interface NodeScaffoldFiles {
  'package.json': string;
  'tsconfig.json': string;
  'server.ts': string;
  'route.ts': string;
  'handler.ts': string;
  'endpoint-manifest.json': string;
  'README.md': string;
  'original.csl': string;
  'original.cslapp': string;
}

export function buildNodeScaffold(demo: DemoSpec, result: ProjectionResult): NodeScaffoldFiles {
  return {
    'package.json': generatePackageJson(demo),
    'tsconfig.json': generateTsconfig(),
    'server.ts': generateServerSource(result.backend, result.manifest.name),
    'route.ts': generateRouteSource(result.backend),
    'handler.ts': result.backendSource,
    'endpoint-manifest.json': JSON.stringify(buildEndpointManifest(demo, result), null, 2),
    'README.md': generateBackendReadme(demo, result),
    'original.csl': demo.cslSource,
    'original.cslapp': demo.cslappSource,
  };
}
