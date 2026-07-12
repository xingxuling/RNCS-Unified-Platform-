// CSL 全栈投影 — Playground 面板
// 三栏：应用本体 / 前端投影 / 后端投影
// 包含浏览器内实时预览（直接 mount 生成的组件 + 调用 handler）

import { useMemo, useState, useCallback } from 'react';
import { DEMO_REGISTRY, projectDemo, buildRuntimeHandler, buildRuntimeHandlersByView, type ProjectionResult } from '@/csl/projection';
import {
  exportFrontend, exportBackend, exportDiagnostics, exportScaffoldZip, exportNodeServiceZip,
} from '@/csl/projection/export';
import { checkEndpointAlignment } from '@/csl/projection/node-scaffold';
import { callCSLFunction, getCapabilityProfile } from '@/csl';
import { computeBlocked } from '@/csl/projection/ose-bridge';
import { loadSpecRegistry, validateProjectionDemosAgainstCode } from '@/csl/specs/loader';
import type { IRContainer } from '@/csl/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, Code2, Server, Layout, Play, RefreshCw, ShieldCheck, Download, FileArchive, Link2, Unlink, Network, Table as TableIcon, Lock } from 'lucide-react';
import { toast } from 'sonner';

// Phase 2.4:投影示例硬对齐 — 与 examples-registry.csl(投影示例) 1:1 校验
//   不一致项从下拉菜单剔除并在顶部红条提示
const SPEC_REGISTRY_FOR_DEMOS = loadSpecRegistry();
const SPEC_DEMO_IDS = new Set(SPEC_REGISTRY_FOR_DEMOS.projectionDemos.map(d => d.id));
const ALIGNED_DEMOS = DEMO_REGISTRY.filter(d => SPEC_DEMO_IDS.has(d.id));
const DEMO_MISMATCHES = validateProjectionDemosAgainstCode(
  SPEC_REGISTRY_FOR_DEMOS,
  DEMO_REGISTRY.map(d => d.id),
);

export function ProjectionPanel() {
  const [demoId, setDemoId] = useState(ALIGNED_DEMOS[0]?.id || DEMO_REGISTRY[0].id);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const demo = useMemo(
    () => ALIGNED_DEMOS.find(d => d.id === demoId) || ALIGNED_DEMOS[0] || DEMO_REGISTRY[0],
    [demoId],
  );

  const projection = useMemo<ProjectionResult | { error: string; diagnostics: any[] }>(
    () => projectDemo(demo),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demo, refreshNonce],
  );

  const failed = 'error' in projection;

  const handleExportZip = useCallback(async () => {
    if ('error' in projection) return;
    try {
      await exportScaffoldZip(demo, projection);
      toast.success(`已导出 ${demo.id}-scaffold.zip`);
    } catch (e) {
      toast.error(`导出失败:${e instanceof Error ? e.message : String(e)}`);
    }
  }, [demo, projection]);

  const handleExportNodeZip = useCallback(async () => {
    if ('error' in projection) return;
    try {
      await exportNodeServiceZip(demo, projection);
      toast.success(`已导出 ${demo.id}-node-service.zip`);
    } catch (e) {
      toast.error(`Node 服务导出失败:${e instanceof Error ? e.message : String(e)}`);
    }
  }, [demo, projection]);

  const alignment = useMemo(() => {
    if ('error' in projection) return null;
    return checkEndpointAlignment(projection.frontend, projection.backend);
  }, [projection]);

  return (
    <div className="space-y-4">
      {/* Phase 2.4:投影示例硬对齐 mismatch 红条 */}
      {DEMO_MISMATCHES.length > 0 && (
        <div className="border border-destructive/40 bg-destructive/10 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] text-destructive">
            <div className="font-semibold mb-1">投影示例硬对齐失败 ({DEMO_MISMATCHES.length}):</div>
            <div className="mb-1">不一致项已从下拉菜单剔除,请同步修正 examples-registry.csl(投影示例) 与 demo-source.ts</div>
            <ul className="space-y-0.5 font-mono">
              {DEMO_MISMATCHES.slice(0, 4).map((m, i) => (
                <li key={i}>· {m.message}</li>
              ))}
              {DEMO_MISMATCHES.length > 4 && <li>· … 共 {DEMO_MISMATCHES.length} 项</li>}
            </ul>
          </div>
        </div>
      )}

      {/* 顶部控制栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">示范应用：</span>
        <select
          value={demoId}
          onChange={e => setDemoId(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-border bg-background"
        >
          {ALIGNED_DEMOS.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <Button
          size="sm" variant="outline"
          onClick={() => setRefreshNonce(n => n + 1)}
          className="h-7 text-xs gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          重新投影
        </Button>

        {!failed && (
          <div className="ml-auto flex items-center gap-2">
            {projection.blocked && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                BLOCKED
              </Badge>
            )}
            {alignment && (
              alignment.submitEndpointMatchesRoute && alignment.fieldsAligned ? (
                <Badge className="bg-status-success/15 text-status-success border-status-success/30 border text-[10px]">
                  <Link2 className="w-3 h-3 mr-1" />
                  前后端对齐
                </Badge>
              ) : (
                <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 border text-[10px]">
                  <Unlink className="w-3 h-3 mr-1" />
                  对齐异常
                </Badge>
              )
            )}
            {!projection.blocked && (
              <Badge className="bg-status-success/15 text-status-success border-status-success/30 border">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                投影成功
              </Badge>
            )}
          </div>
        )}
        {failed && (
          <Badge variant="destructive" className="ml-auto">
            <AlertTriangle className="w-3 h-3 mr-1" />
            投影失败
          </Badge>
        )}
      </div>

      {/* 导出栏:仅投影成功时可用 */}
      {!failed && (
        <div className="flex items-center gap-2 flex-wrap border rounded-md p-2 bg-muted/20">
          <span className="text-[11px] text-muted-foreground mr-1">导出当前 demo:</span>
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { exportFrontend(demo, projection); toast.success('已导出前端 .tsx'); }}
          >
            <Download className="w-3 h-3" />
            前端 .tsx
          </Button>
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { exportBackend(demo, projection); toast.success('已导出后端 handler.ts'); }}
          >
            <Download className="w-3 h-3" />
            后端 .ts
          </Button>
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => { exportDiagnostics(demo, projection); toast.success('已导出 diagnostics.json'); }}
          >
            <Download className="w-3 h-3" />
            diagnostics.json
          </Button>
          <Button
            size="sm" variant="outline" className="h-7 text-xs gap-1 ml-auto"
            onClick={handleExportZip}
          >
            <FileArchive className="w-3 h-3" />
            zip scaffold
          </Button>
          <Button
            size="sm" className="h-7 text-xs gap-1"
            onClick={handleExportNodeZip}
          >
            <Server className="w-3 h-3" />
            Node 服务 zip
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">{demo.description}</p>

      {failed && (
        <div className="border border-destructive/30 bg-destructive/5 rounded-md p-3">
          <div className="text-xs font-medium text-destructive mb-1">投影错误</div>
          <pre className="text-[11px] font-mono text-destructive/80 whitespace-pre-wrap">
            {projection.error}
          </pre>
        </div>
      )}

      {!failed && (
        <ProjectionDetail result={projection} cslappSource={demo.cslappSource} />
      )}
    </div>
  );
}

// ============================================================
// Detail：三栏（manifest / frontend / backend），各带源码与运行预览
// ============================================================

function ProjectionDetail({
  result,
  cslappSource,
}: {
  result: ProjectionResult;
  cslappSource: string;
}) {
  return (
    <Tabs defaultValue="manifest" className="w-full">
      <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-0">
        <TabsTrigger value="manifest" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5">
          <Layout className="w-3 h-3" />
          应用本体
        </TabsTrigger>
        <TabsTrigger value="frontend" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5">
          <Code2 className="w-3 h-3" />
          前端投影
        </TabsTrigger>
        <TabsTrigger value="backend" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5">
          <Server className="w-3 h-3" />
          后端投影
        </TabsTrigger>
        <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5">
          <Play className="w-3 h-3" />
          实时运行
        </TabsTrigger>
        <TabsTrigger value="ose" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          OSE 治理
        </TabsTrigger>
      </TabsList>

      {/* 应用本体 */}
      <TabsContent value="manifest" className="mt-3 space-y-3">
        <div className="border rounded-md p-3 bg-muted/20 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-medium">{result.manifest.name}</span>
            <Badge variant="outline" className="text-[10px]">v{result.manifest.version}</Badge>
            <Badge variant="outline" className="text-[10px]">{result.manifest.target}</Badge>
            <Badge variant="outline" className="text-[10px]">{result.manifest.frontendFramework}</Badge>
            <Badge variant="outline" className="text-[10px]">{result.manifest.backendFramework}</Badge>
          </div>
          <div className="text-[11px] text-muted-foreground">
            入口视图：{result.manifest.entryView} · 包含规格：{result.manifest.includedSpecs.join(', ') || '（未声明）'}
          </div>
        </div>

        <div className="border rounded-md">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
            <Layout className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-xs font-medium">.cslapp 源码</span>
          </div>
          <pre className="text-[10px] font-mono p-3 overflow-x-auto max-h-[320px] leading-4 text-foreground/80">
{cslappSource}
          </pre>
        </div>

        <DiagnosticList diagnostics={result.diagnostics} />
      </TabsContent>

      {/* 前端投影 */}
      <TabsContent value="frontend" className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Stat label="组件名" value={result.frontend.componentName} />
          <Stat label="提交端点" value={result.frontend.submitEndpoint} mono />
          <Stat label="主概念" value={result.frontend.primaryConcept} />
          <Stat label="字段数" value={String(result.frontend.formFields.length)} />
        </div>
        <SourceBlock title=".tsx 源码" source={result.frontendSource} />
      </TabsContent>

      {/* 后端投影 */}
      <TabsContent value="backend" className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Stat label="Handler" value={result.backend.handlerName} mono />
          <Stat label="Endpoint" value={result.backend.endpoint} mono />
          <Stat label="校验数" value={String(result.backend.invariantChecks.length)} />
          <Stat label="规则数" value={String(result.backend.ruleEvaluations.length)} />
        </div>

        {result.backend.invariantChecks.length > 0 && (
          <div className="border rounded-md p-2.5">
            <div className="text-xs font-medium mb-1.5 text-muted-foreground">不变量校验</div>
            <div className="space-y-1">
              {result.backend.invariantChecks.map((c, i) => (
                <div key={i} className="text-[11px] font-mono">
                  <span className="text-primary">{c.name}</span>
                  <span className="text-muted-foreground"> → </span>
                  <code className="bg-muted px-1.5 py-0.5 rounded">{c.jsExpression}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.backend.ruleEvaluations.length > 0 && (
          <div className="border rounded-md p-2.5">
            <div className="text-xs font-medium mb-1.5 text-muted-foreground">规则评估</div>
            <div className="space-y-1">
              {result.backend.ruleEvaluations.map((r, i) => (
                <div key={i} className="text-[11px] font-mono">
                  <span className="text-primary">{r.name}</span>
                  <span className="text-muted-foreground"> → </span>
                  <code className="bg-muted px-1.5 py-0.5 rounded">{r.jsCondition}</code>
                  <span className="text-muted-foreground"> ⇒ </span>
                  <span className="text-status-success">"{r.markLabel}"</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <SourceBlock title=".handler.ts 源码" source={result.backendSource} />
      </TabsContent>

      {/* 实时运行 */}
      <TabsContent value="preview" className="mt-3">
        <LivePreview result={result} />
      </TabsContent>

      {/* OSE 治理 */}
      <TabsContent value="ose" className="mt-3">
        <OSEReportView result={result} />
      </TabsContent>
    </Tabs>
  );
}

// ---------- OSE 治理报告视图 ----------

function OSEReportView({ result }: { result: ProjectionResult }) {
  const r = result.oseReport;
  if (!r) {
    return <p className="text-xs text-muted-foreground">（无 OSE 报告）</p>;
  }

  const sections: Array<{ key: string; title: string; items: ProjectionResult['diagnostics']; hint: string }> = [
    { key: 'pd', title: '① 问题定义检查',     items: r.problemDefinition,            hint: '是否存在 manifest / 主概念 / 有效字段与规则' },
    { key: 'sc', title: '② 结构一致性检查',   items: r.structuralConsistency,        hint: '前后端字段集合 + 规则引用对齐' },
    { key: 'rk', title: '③ 风险提示',         items: r.risks,                        hint: '当前阶段边界与受限说明' },
    { key: 'as', title: '④ 假设显式化',       items: r.assumptions,                  hint: '投影管线运作的隐含前提' },
    { key: 'rc', title: '⑤ 路由一致性',       items: r.routeConsistency || [],       hint: 'Phase 2.0:视图 ↔ endpoint 对齐' },
    { key: 'mc', title: '⑥ 多概念覆盖',       items: r.multiConceptCoverage || [],   hint: 'Phase 2.0:视图主概念是否声明' },
    { key: 'dr', title: '⑦ 死路检测',         items: r.deadRouteDetection || [],     hint: 'Phase 2.0:入口视图路由可达性' },
    { key: 'sl', title: '⑧ 阶段合法性 (BLOCK)', items: r.stageLegality || [],          hint: 'Phase 2.2:阶段非法 → 硬阻塞' },
    { key: 'tc', title: '⑨ 转移完整性',       items: r.transitionCompleteness || [], hint: 'Phase 2.1:转移引用与可达性' },
    { key: 'sv', title: '⑩ 信号有效性',       items: r.signalValidity || [],         hint: 'Phase 2.1:僵尸信号 / 未引用' },
    { key: 'ri', title: '⑪ 再生事件孤立',     items: r.regenerationIsolation || [],  hint: 'Phase 2.1:再生事件主体绑定' },
    { key: 'fr', title: '⑫ 函数风险 (BLOCK)', items: (r as any).functionRisk || [],   hint: 'Phase 2.4:未定义函数/参数不匹配 → 硬阻塞;空体/无返回/自递归 warn' },
    { key: 'bi', title: '⑬ 块完整性 (BLOCK)', items: (r as any).blockIntegrity || [], hint: 'Phase 2.3:命题/关系悬空 → 硬阻塞;孤立 warn' },
    { key: 'bd', title: '⑭ 边界完整性 (BLOCK)', items: (r as any).boundaryIntegrity || [], hint: 'Phase 2.3:映射错位/封口未闭合/同位链断裂 → 硬阻塞' },
  ];

  const allCount = sections.reduce((n, s) => n + s.items.length, 0);
  const errCount = sections.reduce((n, s) => n + s.items.filter(i => i.level === 'error').length, 0);
  const warnCount = sections.reduce((n, s) => n + s.items.filter(i => i.level === 'warn').length, 0);

  return (
    <div className="space-y-3">
      <div className="border rounded-md p-3 bg-muted/20 flex items-center gap-2 flex-wrap">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">OSE 治理 (Phase 2.3)</span>
        <Badge variant="outline" className="text-[10px]">{sections.length} 个 hook</Badge>
        <Badge variant="outline" className="text-[10px]">{allCount} 条诊断</Badge>
        {errCount > 0 && (
          <Badge variant="destructive" className="text-[10px]">{errCount} 错误</Badge>
        )}
        {warnCount > 0 && (
          <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 border text-[10px]">
            {warnCount} 警告
          </Badge>
        )}
        {result.blocked && (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertTriangle className="w-3 h-3" /> BLOCKED
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">
          阶段非法 / 块悬空 / 边界破损 触发硬阻塞,其他项保持 warn
        </span>
      </div>

      {result.blocked && result.blockReasons && result.blockReasons.length > 0 && (
        <div className="border border-destructive/40 bg-destructive/5 rounded-md p-3">
          <div className="text-xs font-semibold text-destructive mb-1">阻塞原因 ({result.blockReasons.length})</div>
          <ul className="text-[11px] font-mono text-destructive/80 space-y-0.5">
            {result.blockReasons.map((m, i) => <li key={i}>· {m}</li>)}
          </ul>
        </div>
      )}

      {sections.map(s => (
        <div key={s.key} className="border rounded-md">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
            <span className="text-xs font-medium">{s.title}</span>
            <Badge variant="outline" className="text-[10px]">{s.items.length}</Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">{s.hint}</span>
          </div>
          <div className="p-2.5 space-y-1">
            {s.items.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">（本切面无诊断输出）</p>
            )}
            {s.items.map((d, i) => (
              <div key={i} className="text-[11px] font-mono flex items-start gap-2">
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase shrink-0 ${
                    d.level === 'error' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                    d.level === 'warn' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {d.level}
                </Badge>
                <span className="text-foreground/80">{d.message}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 实时运行:支持多视图切换(stage / summary / form) ----------

function LivePreview({ result }: { result: ProjectionResult }) {
  const views = result.frontend.views;
  const [activeViewId, setActiveViewId] = useState(views[0]?.id || '');
  const activeView = views.find(v => v.id === activeViewId) || views[0];

  const handlersByView = useMemo(() => buildRuntimeHandlersByView(result.backend), [result.backend]);
  const activeEndpoint = result.backend.endpoints.find(e => e.viewId === activeView?.id);
  const handler = activeView ? handlersByView[activeView.id] : null;

  // ---- 视图切换栏 ----
  const viewTabs = views.length > 1 && (
    <div className="flex gap-1 mb-3 border rounded-md p-1 bg-muted/30 w-fit">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => setActiveViewId(v.id)}
          className={`text-[11px] px-2.5 py-1 rounded ${
            v.id === activeView?.id ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {v.pageTitle} <span className="text-[9px] opacity-60">[{v.mode}]</span>
        </button>
      ))}
    </div>
  );

  if (!activeView || !handler) {
    return <div className="text-xs text-muted-foreground">无可预览视图</div>;
  }

  // ---- summary 视图:直接渲染快照 ----
  if (activeView.mode === 'summary' && activeView.subjectSummary) {
    return (
      <div className="space-y-3">
        {viewTabs}
        <SummaryPreview view={activeView} />
      </div>
    );
  }

  // ---- stage 视图:阶段判定 ----
  if (activeView.mode === 'stage') {
    return (
      <div className="space-y-3">
        {viewTabs}
        <StagePreview view={activeView} handler={handler} blocked={!!result.blocked} blockReasons={result.blockReasons || []} />
      </div>
    );
  }

  // ---- blocks 视图:概念块网络 ----
  if (activeView.mode === 'blocks') {
    return (
      <div className="space-y-3">
        {viewTabs}
        <BlocksPreview view={activeView} />
      </div>
    );
  }

  // ---- mapping 视图:映射表/封口/同位链/域展开 ----
  if (activeView.mode === 'mapping') {
    return (
      <div className="space-y-3">
        {viewTabs}
        <MappingPreview view={activeView} />
      </div>
    );
  }

  // ---- form 视图:沿用原有逻辑(Phase 2.3 接 derivedFields, Phase 2.4 阻塞感知) ----
  return (
    <div className="space-y-3">
      {viewTabs}
      <FormPreview
        view={activeView}
        endpoint={activeEndpoint}
        handler={handler}
        ir={result.ir}
        blocked={!!result.blocked}
        blockReasons={result.blockReasons || []}
        functionRiskErrors={(result.oseReport?.functionRisk || []).filter(d => d.level === 'error').map(d => d.message)}
      />
    </div>
  );
}

// ---------- Summary 视图预览(Phase 2.2) ----------
function SummaryPreview({ view }: { view: import('@/csl/projection').ViewProjection }) {
  const s = view.subjectSummary!;
  const Card = ({ title, status }: { title: string; status: string }) => {
    const ok = status === 'legal' || status === 'complete' || status === 'valid' || status === 'linked';
    return (
      <div className={`border rounded p-2 ${ok ? '' : 'border-destructive/40 bg-destructive/5'}`}>
        <div className="text-[10px] text-muted-foreground">{title}</div>
        <div className={`text-xs font-mono ${ok ? '' : 'text-destructive'}`}>{status}</div>
      </div>
    );
  };
  return (
    <div className="border rounded-md p-4 space-y-4">
      <header className="flex items-center gap-2 flex-wrap">
        <Layout className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium">{view.pageTitle}</span>
        <Badge variant="outline" className="text-[10px]">summary</Badge>
        <Badge variant="outline" className="text-[10px]">主体: {s.subjectRef}</Badge>
        {s.blocked && <Badge variant="destructive" className="text-[10px]">BLOCKED</Badge>}
        <span className="text-[10px] text-muted-foreground ml-auto">{view.method} {view.endpoint}</span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="border rounded p-2"><div className="text-[10px] text-muted-foreground">当前阶段</div><div className="text-xs font-mono">{s.currentStage || '(未定义)'}</div></div>
        <div className="border rounded p-2"><div className="text-[10px] text-muted-foreground">阶段数</div><div className="text-xs font-mono">{s.stageCount}</div></div>
        <div className="border rounded p-2"><div className="text-[10px] text-muted-foreground">信号数</div><div className="text-xs font-mono">{s.signalCount}</div></div>
        <div className="border rounded p-2"><div className="text-[10px] text-muted-foreground">转移数</div><div className="text-xs font-mono">{s.transitionCount}</div></div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div><span className="text-muted-foreground">最近信号:</span> <span className="font-mono">{s.latestSignal ?? '(无)'}</span></div>
        <div><span className="text-muted-foreground">最近转移:</span> <span className="font-mono">{s.latestTransition ?? '(无)'}</span></div>
        <div><span className="text-muted-foreground">最近再生:</span> <span className="font-mono">{s.latestRegeneration ?? '(无)'}</span></div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium">OSE 治理摘要</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card title="阶段合法性" status={s.stageLegality} />
          <Card title="转移完整性" status={s.transitionCompleteness} />
          <Card title="信号有效性" status={s.signalValidity} />
          <Card title="再生孤立" status={s.regenerationIsolation} />
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground">错误:</span> <span className="font-mono text-destructive">{s.oseErrorCount}</span>
          <span className="text-muted-foreground ml-3">警告:</span> <span className="font-mono">{s.oseWarnCount}</span>
        </div>
      </div>

      {s.blocked && s.blockReasons.length > 0 && (
        <div className="border border-destructive/40 bg-destructive/5 rounded p-2">
          <div className="text-xs font-semibold text-destructive mb-1">阻塞原因 (blocked = true)</div>
          <ul className="text-[11px] text-destructive/80 font-mono space-y-0.5">
            {s.blockReasons.map((m, i) => <li key={i}>· {m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Stage 视图预览(Phase 2.1, 含 BLOCK 处理) ----------
function StagePreview({
  view, handler, blocked, blockReasons,
}: {
  view: import('@/csl/projection').ViewProjection;
  handler: (input: Record<string, unknown>) => any;
  blocked: boolean;
  blockReasons: string[];
}) {
  const timeline = view.stageTimeline || [];
  const signals = view.availableSignals || [];
  const initial = timeline.find(s => s.current)?.name || timeline[0]?.name || '';
  const [currentStage, setCurrentStage] = useState(initial);
  const [signalIdx, setSignalIdx] = useState(0);
  const [intensity, setIntensity] = useState(signals[0]?.intensity || 0);
  const [resp, setResp] = useState<any>(null);
  const sig = signals[signalIdx];

  const inject = () => {
    if (!sig) return;
    const r = handler({
      __signal_name__: sig.name,
      __signal_intensity__: intensity,
      __current_stage__: currentStage,
      [sig.name]: intensity,
    });
    setResp(r);
    if (r.ok && r.toStage && !r.blocked) setCurrentStage(r.toStage);
  };

  return (
    <div className="border rounded-md p-4 space-y-4">
      <header className="flex items-center gap-2 flex-wrap">
        <Layout className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium">{view.pageTitle}</span>
        <Badge variant="outline" className="text-[10px]">stage</Badge>
        <Badge variant="outline" className="text-[10px]">主体: {view.subjectRef}</Badge>
        {blocked && <Badge variant="destructive" className="text-[10px]">BLOCKED</Badge>}
        <span className="text-[10px] text-muted-foreground ml-auto">{view.method} {view.endpoint}</span>
      </header>

      {blocked && (
        <div className="border border-destructive/40 bg-destructive/5 rounded p-2">
          <div className="text-xs font-semibold text-destructive mb-1">runtime 已阻塞 — 所有阶段迁移调用都会返回 ok=false</div>
          <ul className="text-[11px] text-destructive/80 font-mono space-y-0.5">
            {blockReasons.slice(0, 4).map((m, i) => <li key={i}>· {m}</li>)}
          </ul>
        </div>
      )}

      <ol className="flex gap-2 overflow-x-auto pb-2">
        {timeline.map(s => (
          <li key={s.id} className={`flex-shrink-0 px-3 py-2 rounded border text-xs min-w-[120px] ${s.name === currentStage ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'}`}>
            <div className="font-mono">#{s.index ?? '?'} {s.name}</div>
            <div className="text-[10px] mt-1 opacity-70">{s.keywords.join(' / ')}</div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-3 gap-2">
        <label className="block text-xs">
          <span className="text-muted-foreground">信号</span>
          <select value={signalIdx} onChange={e => { const i = Number(e.target.value); setSignalIdx(i); setIntensity(signals[i]?.intensity || 0); }}
            className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-background text-xs">
            {signals.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-muted-foreground">强度</span>
          <input type="number" value={intensity} onChange={e => setIntensity(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-background text-xs font-mono" />
        </label>
        <div className="flex items-end">
          <Button size="sm" onClick={inject} className="w-full h-8 text-xs gap-1">
            <Play className="w-3 h-3" />注入并判定
          </Button>
        </div>
      </div>

      {resp && (
        <div className="border rounded p-2 space-y-1 text-xs">
          <div className="text-sm font-medium">阶段判定结果</div>
          <div>状态: {resp.ok && !resp.blocked ? <Badge className="bg-status-success/15 text-status-success border-status-success/30 border text-[10px]">ok</Badge> : <Badge variant="destructive" className="text-[10px]">{resp.blocked ? 'BLOCKED' : 'ok=false'}</Badge>}</div>
          <div><span className="text-muted-foreground">从 </span><span className="font-mono">{resp.fromStage}</span><span className="text-muted-foreground"> → </span><span className="font-mono text-primary">{resp.toStage}</span>{resp.matchedTransition && <span className="text-muted-foreground"> · 命中「{resp.matchedTransition}」</span>}</div>
          {resp.triggeredRegenerations?.length > 0 && <div><span className="text-muted-foreground">再生事件:</span> {resp.triggeredRegenerations.join(', ')}</div>}
          {resp.errors && resp.errors.length > 0 && <ul className="text-destructive font-mono text-[11px]">{resp.errors.map((e: string, i: number) => <li key={i}>· {e}</li>)}</ul>}
          <details><summary className="cursor-pointer text-muted-foreground">判定踪迹</summary><ul className="mt-1 font-mono text-[11px]">{(resp.trace || []).map((t: string, i: number) => <li key={i}>· {t}</li>)}</ul></details>
        </div>
      )}
    </div>
  );
}

// ---------- Blocks 视图预览(Phase 2.3:概念块网络 + 引用关系连线) ----------
function BlocksPreview({ view }: { view: import('@/csl/projection').ViewProjection }) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const net = view.blockNetwork;
  if (!net) return <div className="text-xs text-muted-foreground">无概念块网络数据</div>;

  const isHL = (n: string) => highlight === n;
  const edgeOf = (a: string, b: string) =>
    !highlight || highlight === a || highlight === b;

  return (
    <div className="border rounded-md p-4 space-y-4">
      <header className="flex items-center gap-2 flex-wrap">
        <Network className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium">{view.pageTitle}</span>
        <Badge variant="outline" className="text-[10px]">blocks</Badge>
        <Badge variant="outline" className="text-[10px]">{net.nodes.length} 节点</Badge>
        <Badge variant="outline" className="text-[10px]">{net.propositions.length} 命题</Badge>
        <Badge variant="outline" className="text-[10px]">{net.relations.length} 关系</Badge>
        {net.isolatedNodes.length > 0 && (
          <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 border text-[10px]">孤立 {net.isolatedNodes.length}</Badge>
        )}
        {net.danglingRefs.length > 0 && (
          <Badge variant="destructive" className="text-[10px]">悬空 {net.danglingRefs.length}</Badge>
        )}
        <span className="text-[10px] text-muted-foreground ml-auto">点击节点高亮其关联边</span>
      </header>

      <section>
        <div className="text-xs font-medium mb-2 text-muted-foreground">概念块</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {net.nodes.map(n => {
            const isolated = net.isolatedNodes.includes(n.name);
            return (
              <button
                key={n.id}
                onClick={() => setHighlight(isHL(n.name) ? null : n.name)}
                className={`text-left border rounded p-2.5 transition ${
                  isHL(n.name) ? 'border-primary bg-primary/5 ring-1 ring-primary/40' :
                  isolated ? 'border-status-warning/40 bg-status-warning/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{n.name}</span>
                  <Badge variant="outline" className="text-[9px]">{n.kind}</Badge>
                  {isolated && <Badge className="text-[9px] bg-status-warning/15 text-status-warning border-status-warning/30 border">孤立</Badge>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{n.definition}</p>
                <div className="flex gap-2 text-[9px] text-muted-foreground mt-1">
                  <span>命题 {n.propositionCount}</span>
                  <span>关系 {n.relationCount}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="text-xs font-medium mb-2 text-muted-foreground">命题边 (主语 → 宾语)</div>
        <ul className="space-y-1">
          {net.propositions.map(p => (
            <li
              key={p.id}
              className={`border rounded p-2 text-[11px] transition ${
                !p.resolved ? 'border-destructive/40 bg-destructive/5' :
                edgeOf(p.subject, p.object) ? 'border-border' : 'opacity-30 border-border'
              }`}
            >
              <span className={`font-mono ${isHL(p.subject) ? 'text-primary font-semibold' : ''}`}>{p.subject}</span>
              <span className="text-muted-foreground"> ─ {p.predicate} ─▶ </span>
              <span className={`font-mono ${isHL(p.object) ? 'text-primary font-semibold' : ''}`}>{p.object}</span>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.assertion}</div>
              {!p.resolved && <Badge variant="destructive" className="text-[9px] mt-1">悬空引用</Badge>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="text-xs font-medium mb-2 text-muted-foreground">关系边 (源 → 靶)</div>
        <ul className="space-y-1">
          {net.relations.map(r => (
            <li
              key={r.id}
              className={`border rounded p-2 text-[11px] transition ${
                !r.resolved ? 'border-destructive/40 bg-destructive/5' :
                edgeOf(r.source, r.target) ? 'border-border' : 'opacity-30 border-border'
              }`}
            >
              <span className={`font-mono ${isHL(r.source) ? 'text-primary font-semibold' : ''}`}>{r.source}</span>
              <span className="text-muted-foreground"> ━[{r.kind} · {r.strength}]━▶ </span>
              <span className={`font-mono ${isHL(r.target) ? 'text-primary font-semibold' : ''}`}>{r.target}</span>
              {!r.resolved && <Badge variant="destructive" className="text-[9px] mt-1 ml-2">悬空引用</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {net.danglingRefs.length > 0 && (
        <div className="border border-destructive/40 bg-destructive/5 rounded p-2">
          <div className="text-xs font-semibold text-destructive mb-1">悬空引用清单 ({net.danglingRefs.length}) — 已触发硬阻塞</div>
          <ul className="text-[11px] font-mono text-destructive/80 space-y-0.5">
            {net.danglingRefs.map((m, i) => <li key={i}>· {m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Mapping 视图预览(Phase 2.3:映射表/封口/同位链/域展开) ----------
function MappingPreview({ view }: { view: import('@/csl/projection').ViewProjection }) {
  const snap = view.mappingSnapshot;
  if (!snap) return <div className="text-xs text-muted-foreground">无映射数据</div>;
  return (
    <div className="border rounded-md p-4 space-y-4">
      <header className="flex items-center gap-2 flex-wrap">
        <TableIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium">{view.pageTitle}</span>
        <Badge variant="outline" className="text-[10px]">mapping</Badge>
        <Badge variant="outline" className="text-[10px]">{snap.tables.length} 表</Badge>
        <Badge variant="outline" className="text-[10px]">{snap.closures.length} 封口</Badge>
        <Badge variant="outline" className="text-[10px]">{snap.chains.length} 同位链</Badge>
        <Badge variant="outline" className="text-[10px]">{snap.expansions.length} 域展开</Badge>
      </header>

      {snap.tables.map(t => (
        <section key={t.id} className={`border rounded p-2.5 ${t.aligned ? '' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">映射表 · {t.name}</span>
            {!t.aligned && <Badge variant="destructive" className="text-[9px]">错位 {t.misalignedRows.join('、')}</Badge>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left bg-muted/30">行 / 列</th>
                  {t.columns.map(c => <th key={c} className="border px-2 py-1 text-left bg-muted/30">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.rows.map(r => (
                  <tr key={r.label} className={t.misalignedRows.includes(r.label) ? 'bg-destructive/5' : ''}>
                    <td className="border px-2 py-1 font-medium">{r.label}</td>
                    {t.columns.map((_, i) => (
                      <td key={i} className="border px-2 py-1 font-mono">{r.items[i] ?? <span className="text-destructive">—</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {snap.closures.map(c => (
        <section key={c.id} className={`border rounded p-2.5 ${c.closed ? '' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="text-xs font-medium mb-1">封口 · {c.name}</div>
          <div className="text-[11px]">
            声明 <span className="font-mono">{c.total}</span> · 实际 <span className="font-mono">{c.computedSum}</span> ·{' '}
            {c.closed
              ? <Badge className="bg-status-success/15 text-status-success border-status-success/30 border text-[9px]">已闭合</Badge>
              : <Badge variant="destructive" className="text-[9px]">未闭合 (差 {c.total - c.computedSum})</Badge>
            }
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">{c.parts.map(p => `${p.label}:${p.value}`).join(' · ')}</div>
        </section>
      ))}

      {snap.chains.map(c => (
        <section key={c.id} className={`border rounded p-2.5 ${c.aligned ? '' : 'border-destructive/40 bg-destructive/5'}`}>
          <div className="text-xs font-medium mb-2">同位链 · {c.name} {!c.aligned && <Badge variant="destructive" className="text-[9px] ml-1">断裂</Badge>}</div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${c.domains.length}, minmax(0, 1fr))` }}>
            {c.domains.map((d, i) => (
              <div key={i} className="border rounded p-1.5 text-center">
                <div className="text-[9px] text-muted-foreground">{d}</div>
                <div className="text-[11px] font-mono">{c.items[i] ?? <span className="text-destructive">—</span>}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {snap.expansions.map(e => (
        <section key={e.id} className="border rounded p-2.5">
          <div className="text-xs font-medium mb-1">域展开 · {e.name}</div>
          <div className="text-[10px] text-muted-foreground mb-2">母法: {e.motherLawValues.join(' / ')}</div>
          <div className="space-y-1">
            {e.factors.map(f => {
              const ok = f.items.length === e.motherLawValues.length;
              return (
                <div key={f.domain} className="text-[11px] flex items-baseline gap-2">
                  <span className="font-medium w-16 shrink-0">{f.domain}:</span>
                  <span className="font-mono text-muted-foreground flex-1">{f.items.join(' · ')}</span>
                  {!ok && <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 border text-[9px]">五因不齐 ({f.items.length}/{e.motherLawValues.length})</Badge>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------- Form 视图预览(Phase 1 + Phase 2.3 派生字段 + Phase 2.4 阻塞感知) ----------
function FormPreview({
  view, endpoint, handler, ir, blocked = false, blockReasons = [], functionRiskErrors = [],
}: {
  view: import('@/csl/projection').ViewProjection;
  endpoint?: import('@/csl/projection').EndpointProjection;
  handler: (input: Record<string, unknown>) => any;
  ir?: IRContainer;
  blocked?: boolean;
  blockReasons?: string[];
  functionRiskErrors?: string[];
}) {
  const initialForm = useMemo(() => {
    const obj: Record<string, string | number> = {};
    for (const f of view.formFields) obj[f.name] = f.defaultValue;
    return obj;
  }, [view.formFields]);

  const [form, setForm] = useState<Record<string, string | number>>(initialForm);
  const [response, setResponse] = useState<any>(null);
  useMemo(() => { setForm(initialForm); setResponse(null); }, [initialForm]);
  const submit = useCallback(() => setResponse(handler(form)), [handler, form]);

  // Phase 2.4:从 functionRisk error 列表反推哪些函数名被阻塞
  //   命中规则:消息包含「函数「name」」或「调用「name」」
  const blockedFunctionNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of functionRiskErrors) {
      const re = /「([^」]+)」/g;
      let mt: RegExpExecArray | null;
      while ((mt = re.exec(m))) set.add(mt[1]);
    }
    return set;
  }, [functionRiskErrors]);

  // Phase 2.3 + 2.4:派生字段实时计算,blocked 时整体熔断;单条若命中 functionRisk 也熔断
  const derived = view.derivedFields || [];
  const derivedResults = useMemo(() => {
    if (!ir || derived.length === 0) return [];
    return derived.map(d => {
      if (blocked || blockedFunctionNames.has(d.functionName) || blockedFunctionNames.has(d.label)) {
        return { label: d.label, value: null, trace: ['[BLOCKED] functionRisk 阻塞,停止 callCSLFunction'], halted: true };
      }
      const args: Record<string, unknown> = {};
      for (const fn of d.argFields) args[fn] = form[fn];
      try {
        // H1+H2: callCSLFunction 现在必须带 profile 与 oseVerdict
        const grammar = (ir._meta?.grammarVersion as 'v0.8' | 'v0.9') || 'v0.9';
        const profile = getCapabilityProfile(grammar);
        // 派生字段路径已在外层判定 blocked,这里用一个放行裁决避免重复阻塞
        const verdict = { blocked: false, reasons: [] as string[] };
        const r = callCSLFunction(ir, d.functionName, args, profile, verdict);
        return { label: d.label, value: r.result, trace: r.trace, halted: false };
      } catch (e) {
        return { label: d.label, value: null, trace: [String(e)], halted: true };
      }
    });
  }, [ir, derived, form, blocked, blockedFunctionNames]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* 表单 */}
      <div className={`border rounded-md p-4 space-y-3 ${blocked ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
        <div className="flex items-center gap-2 text-xs font-medium">
          <Layout className="w-3.5 h-3.5 text-primary" />
          {view.pageTitle}
          {blocked && <Badge variant="destructive" className="text-[10px] gap-1"><Lock className="w-3 h-3" />BLOCKED</Badge>}
          <Badge variant="outline" className="text-[10px] ml-auto">前端表单</Badge>
        </div>

        {blocked && (
          <div className="border border-destructive/40 bg-destructive/10 rounded p-2 text-[11px] text-destructive">
            <div className="font-semibold mb-1">runtime 已阻塞 — 派生字段已停止执行</div>
            <ul className="font-mono space-y-0.5">
              {blockReasons.slice(0, 3).map((m, i) => <li key={i}>· {m}</li>)}
            </ul>
          </div>
        )}

        {view.formFields.length === 0 && (
          <p className="text-[11px] text-muted-foreground">（无字段)</p>
        )}

        {view.formFields.map(f => (
          <label key={f.name} className="block">
            <span className="block text-[11px] text-muted-foreground mb-1">
              {f.label}{f.required && ' *'}
            </span>
            <input
              type={f.kind === 'number' ? 'number' : 'text'}
              value={form[f.name] ?? ''}
              onChange={e => {
                const v = f.kind === 'number' ? Number(e.target.value) : e.target.value;
                setForm(prev => ({ ...prev, [f.name]: v }));
              }}
              disabled={blocked}
              className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        ))}

        {derivedResults.length > 0 && (
          <div className={`border rounded-md p-2.5 space-y-1.5 ${blocked ? 'border-destructive/30 bg-destructive/5 opacity-60' : 'border-primary/30 bg-primary/5'}`}>
            <div className={`text-[11px] font-medium flex items-center gap-1.5 ${blocked ? 'text-destructive' : 'text-primary'}`}>
              {blocked ? <Lock className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              派生字段 {blocked ? '(已熔断 · functionRisk 硬阻塞)' : '(实时调用 CSL 函数)'}
            </div>
            {derivedResults.map((d, i) => (
              <div key={i} className="text-[11px] flex items-center gap-2">
                <span className="text-muted-foreground">{d.label}({derived[i].argFields.join(', ')}):</span>
                {d.halted
                  ? <span className="font-mono text-destructive">— BLOCKED</span>
                  : <span className="font-mono font-semibold text-primary">{d.value === null ? '—' : String(d.value)}</span>
                }
              </div>
            ))}
          </div>
        )}

        <Button size="sm" onClick={submit} disabled={blocked} className="w-full h-8 text-xs gap-1">
          <Play className="w-3 h-3" />
          {blocked ? '已阻塞,无法提交' : `提交评估 (${view.method} ${endpoint?.endpoint || view.endpoint})`}
        </Button>
      </div>

      {/* 结果 */}
      <div className="border border-border rounded-md p-4">
        <div className="flex items-center gap-2 text-xs font-medium mb-3">
          <Server className="w-3.5 h-3.5 text-primary" />
          后端响应
          <Badge variant="outline" className="text-[10px] ml-auto">handler 实时执行</Badge>
        </div>

        {!response && (
          <p className="text-[11px] text-muted-foreground italic">
            填写左侧表单并点击「提交评估」查看 handler 返回结果
          </p>
        )}

        {response && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">状态：</span>
              {response.ok ? (
                <Badge className="bg-status-success/15 text-status-success border-status-success/30 border text-[10px]">
                  ok = true
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">ok = false</Badge>
              )}
            </div>

            {response.errors && response.errors.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 rounded p-2">
                <div className="text-[11px] font-medium text-destructive mb-1">errors</div>
                <ul className="text-[11px] text-destructive/80 space-y-0.5">
                  {response.errors.map((e, i) => <li key={i} className="font-mono">· {e}</li>)}
                </ul>
              </div>
            )}

            {response.results && (
              <>
                <div className="text-[11px]">
                  <span className="text-muted-foreground">不变量通过：</span>
                  <span className="font-mono">
                    {response.results.invariants.length > 0
                      ? response.results.invariants.join(', ')
                      : '（无）'}
                  </span>
                </div>
                <div className="text-[11px]">
                  <span className="text-muted-foreground">命中规则：</span>
                  {response.results.rules.length > 0 ? (
                    <span className="space-x-1">
                      {response.results.rules.map((r, i) => (
                        <Badge key={i} className="bg-primary/15 text-primary border-primary/30 border text-[10px]">
                          {r}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground">（无）</span>
                  )}
                </div>
              </>
            )}

            <pre className="mt-3 text-[10px] font-mono p-2 bg-muted/30 rounded overflow-x-auto">
{JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 子组件 ----------

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-border rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-xs ${mono ? 'font-mono' : ''} truncate`}>{value || '—'}</div>
    </div>
  );
}

function SourceBlock({ title, source }: { title: string; source: string }) {
  const lineCount = source.split('\n').length;
  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
        <Code2 className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-xs font-medium">{title}</span>
        <Badge variant="outline" className="text-[10px] ml-auto">{lineCount} 行</Badge>
      </div>
      <pre className="text-[10px] font-mono p-3 overflow-x-auto max-h-[420px] leading-4 text-foreground/80">
{source}
      </pre>
    </div>
  );
}

function DiagnosticList({ diagnostics }: { diagnostics: ProjectionResult['diagnostics'] }) {
  if (diagnostics.length === 0) return null;
  return (
    <div className="border rounded-md p-2.5 space-y-1">
      <div className="text-xs font-medium text-muted-foreground mb-1">投影诊断</div>
      {diagnostics.map((d, i) => (
        <div key={i} className="text-[11px] font-mono flex items-start gap-2">
          <Badge
            variant="outline"
            className={`text-[9px] uppercase ${
              d.level === 'error' ? 'bg-destructive/10 text-destructive border-destructive/30' :
              d.level === 'warn' ? 'bg-status-warning/10 text-status-warning border-status-warning/30' :
              'bg-muted text-muted-foreground'
            }`}
          >
            {d.level}
          </Badge>
          <span className="text-muted-foreground">{d.message}</span>
        </div>
      ))}
    </div>
  );
}
