// CSL 全栈投影 — Frontend Codegen
// Phase 2.0:多视图 + React Router
// 输出:
//   - generateFrontendSource(p):主视图组件源码(向后兼容)
//   - generateFrontendFiles(p):多文件产物(routes.tsx / App.tsx / 各 view.tsx)

import type { FrontendProjection, ViewProjection } from './types';

// ---------- 单 view 组件源码(form / summary 两种模式) ----------

function generateViewSource(v: ViewProjection): string {
  if (v.mode === 'summary' && v.subjectSummary) return generateSubjectSummaryView(v);
  if (v.mode === 'summary') return generateSummaryView(v);
  if (v.mode === 'stage') return generateStageView(v);
  if (v.mode === 'blocks') return generateBlocksView(v);
  if (v.mode === 'mapping') return generateMappingView(v);
  return generateFormView(v);
}

// ---------- Phase 2.3:Blocks 视图源码(概念块网络) ----------

function generateBlocksView(v: ViewProjection): string {
  const net = v.blockNetwork || { nodes: [], propositions: [], relations: [], isolatedNodes: [], danglingRefs: [] };
  const netJson = JSON.stringify(net, null, 2);
  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (blocks 概念块网络)
// 主概念: ${v.primaryConcept} · 节点 ${net.nodes.length} / 命题 ${net.propositions.length} / 关系 ${net.relations.length}

const NETWORK = ${netJson} as const;

export function ${v.componentName}() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {NETWORK.nodes.length} 概念块 · {NETWORK.propositions.length} 命题 · {NETWORK.relations.length} 关系
          {NETWORK.isolatedNodes.length > 0 && <span className="ml-2 text-destructive">孤立 {NETWORK.isolatedNodes.length}</span>}
          {NETWORK.danglingRefs.length > 0 && <span className="ml-2 text-destructive">悬空 {NETWORK.danglingRefs.length}</span>}
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium mb-2">概念块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {NETWORK.nodes.map(n => (
            <div key={n.id} className="border rounded p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{n.name}</span>
                <span className="text-[10px] text-muted-foreground border rounded px-1">{n.kind}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{n.definition}</p>
              <div className="flex gap-2 text-[10px] text-muted-foreground pt-1">
                <span>命题 {n.propositionCount}</span>
                <span>关系 {n.relationCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">命题边</h2>
        <ul className="text-xs space-y-1">
          {NETWORK.propositions.map(p => (
            <li key={p.id} className={\`border rounded p-2 \${p.resolved ? '' : 'border-destructive/40 bg-destructive/5'}\`}>
              <span className="font-mono">{p.subject}</span>
              <span className="text-muted-foreground"> {p.predicate} </span>
              <span className="font-mono">{p.object}</span>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.assertion}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">关系边</h2>
        <ul className="text-xs space-y-1">
          {NETWORK.relations.map(r => (
            <li key={r.id} className={\`border rounded p-2 \${r.resolved ? '' : 'border-destructive/40 bg-destructive/5'}\`}>
              <span className="font-mono">{r.source}</span>
              <span className="text-muted-foreground"> ━[{r.kind} {r.strength}]━▶ </span>
              <span className="font-mono">{r.target}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
`;
}

// ---------- Phase 2.3:Mapping 视图源码(映射表/封口/同位链/域展开) ----------

function generateMappingView(v: ViewProjection): string {
  const snap = v.mappingSnapshot || { tables: [], closures: [], chains: [], expansions: [] };
  const snapJson = JSON.stringify(snap, null, 2);
  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (mapping 跨域映射推演)
// 主概念: ${v.primaryConcept}

const SNAPSHOT = ${snapJson} as const;

export function ${v.componentName}() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {SNAPSHOT.tables.length} 映射表 · {SNAPSHOT.closures.length} 封口 · {SNAPSHOT.chains.length} 同位链 · {SNAPSHOT.expansions.length} 域展开
        </p>
      </header>

      {SNAPSHOT.tables.map(t => (
        <section key={t.id} className="border rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">{t.name}</span>
            {!t.aligned && <span className="text-[10px] text-destructive">错位 {t.misalignedRows.length}</span>}
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr><th className="border px-2 py-1 text-left bg-muted/30">行/列</th>{t.columns.map(c => <th key={c} className="border px-2 py-1 text-left bg-muted/30">{c}</th>)}</tr>
            </thead>
            <tbody>
              {t.rows.map(r => (
                <tr key={r.label}><td className="border px-2 py-1 font-medium">{r.label}</td>{r.items.map((it, i) => <td key={i} className="border px-2 py-1 font-mono">{it}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {SNAPSHOT.closures.map(c => (
        <section key={c.id} className={\`border rounded p-3 \${c.closed ? '' : 'border-destructive/40 bg-destructive/5'}\`}>
          <div className="text-sm font-medium mb-1">封口 · {c.name}</div>
          <div className="text-xs">声明 {c.total} · 实际 {c.computedSum} · {c.closed ? <span className="text-status-success">已闭合</span> : <span className="text-destructive">未闭合 (差 {c.total - c.computedSum})</span>}</div>
          <div className="text-[10px] text-muted-foreground mt-1 font-mono">{c.parts.map(p => \`\${p.label}:\${p.value}\`).join(' · ')}</div>
        </section>
      ))}

      {SNAPSHOT.chains.map(c => (
        <section key={c.id} className={\`border rounded p-3 \${c.aligned ? '' : 'border-destructive/40 bg-destructive/5'}\`}>
          <div className="text-sm font-medium mb-1">同位链 · {c.name}</div>
          <div className="grid grid-cols-5 gap-1 text-xs">
            {c.domains.map((d, i) => (
              <div key={i} className="border rounded p-1.5 text-center">
                <div className="text-[10px] text-muted-foreground">{d}</div>
                <div className="font-mono">{c.items[i] ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {SNAPSHOT.expansions.map(e => (
        <section key={e.id} className="border rounded p-3">
          <div className="text-sm font-medium mb-1">域展开 · {e.name}</div>
          <div className="text-[10px] text-muted-foreground mb-2">母法: {e.motherLawValues.join(' / ')}</div>
          <div className="space-y-1 text-xs">
            {e.factors.map(f => (
              <div key={f.domain}>
                <span className="font-medium mr-2">{f.domain}:</span>
                <span className="font-mono text-muted-foreground">{f.items.join(' · ')}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">派生概念 {e.derivedConceptNames.length} 个</div>
        </section>
      ))}
    </div>
  );
}
`;
}

// ---------- Subject Summary 视图(Phase 2.2):主体诊断快照 ----------

function generateSubjectSummaryView(v: ViewProjection): string {
  const s = v.subjectSummary!;
  const summaryJson = JSON.stringify(s, null, 2);
  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (subject summary)
// 主体: ${v.subjectRef} · 端点: ${v.method} ${v.endpoint}

const SUMMARY = ${summaryJson} as const;

export function ${v.componentName}() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          主体「${escapeJsx(v.subjectRef || '')}」· 当前阶段 <span className="font-mono">{SUMMARY.currentStage || '(未定义)'}</span>
          {SUMMARY.blocked && <span className="ml-2 text-destructive font-semibold">[BLOCKED]</span>}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-md p-3">
          <div className="text-[10px] text-muted-foreground">阶段数</div>
          <div className="text-lg font-mono">{SUMMARY.stageCount}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-[10px] text-muted-foreground">信号数</div>
          <div className="text-lg font-mono">{SUMMARY.signalCount}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-[10px] text-muted-foreground">转移数</div>
          <div className="text-lg font-mono">{SUMMARY.transitionCount}</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-[10px] text-muted-foreground">再生事件</div>
          <div className="text-lg font-mono">{SUMMARY.regenerationCount}</div>
        </div>
      </section>

      <section className="border rounded-md p-4 space-y-2 text-xs">
        <div className="text-sm font-medium mb-2">最近一次活动</div>
        <div><span className="text-muted-foreground">最近信号:</span> <span className="font-mono">{SUMMARY.latestSignal ?? '(无)'}</span></div>
        <div><span className="text-muted-foreground">最近转移:</span> <span className="font-mono">{SUMMARY.latestTransition ?? '(无)'}</span></div>
        <div><span className="text-muted-foreground">最近再生:</span> <span className="font-mono">{SUMMARY.latestRegeneration ?? '(无)'}</span></div>
      </section>

      <section className="border rounded-md p-4 space-y-2">
        <div className="text-sm font-medium mb-2">OSE 治理摘要</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatusCard title="阶段合法性" status={SUMMARY.stageLegality} />
          <StatusCard title="转移完整性" status={SUMMARY.transitionCompleteness} />
          <StatusCard title="信号有效性" status={SUMMARY.signalValidity} />
          <StatusCard title="再生孤立"   status={SUMMARY.regenerationIsolation} />
        </div>
        <div className="text-xs pt-2 border-t mt-2">
          <span className="text-muted-foreground">错误:</span> <span className="font-mono text-destructive">{SUMMARY.oseErrorCount}</span>
          <span className="text-muted-foreground ml-3">警告:</span> <span className="font-mono">{SUMMARY.oseWarnCount}</span>
        </div>
        {SUMMARY.blocked && SUMMARY.blockReasons.length > 0 && (
          <div className="border border-destructive/40 bg-destructive/5 rounded p-2 mt-2">
            <div className="text-xs font-semibold text-destructive mb-1">阻塞原因</div>
            <ul className="text-[11px] text-destructive/80 space-y-0.5 font-mono">
              {SUMMARY.blockReasons.map((m, i) => <li key={i}>· {m}</li>)}
            </ul>
          </div>
        )}
        {SUMMARY.keyMessages.length > 0 && (
          <details className="text-[11px] mt-1">
            <summary className="cursor-pointer text-muted-foreground">关键治理消息 ({SUMMARY.keyMessages.length})</summary>
            <ul className="mt-1 space-y-0.5 font-mono">
              {SUMMARY.keyMessages.map((m, i) => <li key={i}>· {m}</li>)}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

function StatusCard({ title, status }: { title: string; status: string }) {
  const ok = status === 'legal' || status === 'complete' || status === 'valid' || status === 'linked';
  return (
    <div className={\`border rounded p-2 \${ok ? 'border-border' : 'border-destructive/40 bg-destructive/5'}\`}>
      <div className="text-[10px] text-muted-foreground">{title}</div>
      <div className={\`text-xs font-mono \${ok ? '' : 'text-destructive'}\`}>{status}</div>
    </div>
  );
}
`;
}

function generateFormView(v: ViewProjection): string {
  const fieldsInit = v.formFields
    .map(f => `    '${f.name}': ${f.kind === 'number' ? '0' : "''"},`)
    .join('\n');

  const fieldsJsx = v.formFields
    .map(f => `        <label className="block">
          <span className="block text-xs text-muted-foreground mb-1">${escapeJsx(f.label)}${f.required ? ' *' : ''}</span>
          <input
            type="${f.kind === 'number' ? 'number' : 'text'}"
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
            value={form['${f.name}']}
            onChange={e => setForm({ ...form, '${f.name}': ${f.kind === 'number' ? 'Number(e.target.value)' : 'e.target.value'} })}
            ${f.required ? 'required' : ''}
          />
        </label>`)
    .join('\n');

  const inputType = v.formFields
    .map(f => `  '${f.name}': ${f.kind === 'number' ? 'number' : 'string'};`)
    .join('\n');

  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (form)
// 主概念: ${v.primaryConcept}
// 端点: ${v.method} ${v.endpoint}

import { useState } from 'react';

interface FormState {
${inputType}
}

interface ApiResponse {
  ok: boolean;
  errors?: string[];
  results?: { invariants: string[]; rules: string[] };
}

export function ${v.componentName}() {
  const [form, setForm] = useState<FormState>({
${fieldsInit}
  });
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('${v.endpoint}', {
        method: '${v.method}',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setResult(await res.json());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          投影自概念「${escapeJsx(v.primaryConcept)}」 · ${v.formFields.length} 字段
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-md">
${fieldsJsx}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {submitting ? '提交中...' : '提交评估'}
        </button>
      </form>
      {result && (
        <div className="p-4 border border-border rounded-md space-y-2">
          <div className="text-sm font-medium">状态：{result.ok ? '✓ 通过' : '✗ 校验失败'}</div>
          {result.errors && result.errors.length > 0 && (
            <ul className="text-xs text-destructive space-y-1">
              {result.errors.map((e, i) => <li key={i}>· {e}</li>)}
            </ul>
          )}
          {result.results && (
            <>
              <div className="text-xs text-muted-foreground">
                不变量：{result.results.invariants.join(', ') || '（无）'}
              </div>
              <div className="text-xs text-muted-foreground">
                命中规则：{result.results.rules.join(', ') || '（无）'}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
`;
}

function generateSummaryView(v: ViewProjection): string {
  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (summary)
// 主概念: ${v.primaryConcept}
// 端点: ${v.method} ${v.endpoint}

import { useEffect, useState } from 'react';

interface SummaryItem {
  id: string;
  label: string;
  value: string | number;
}

interface SummaryResponse {
  ok: boolean;
  results?: {
    invariants: string[];
    rules: string[];
    items?: SummaryItem[];
  };
}

export function ${v.componentName}() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('${v.endpoint}', { method: '${v.method}' })
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          只读汇总 · 主概念「${escapeJsx(v.primaryConcept)}」 · ${v.method} ${v.endpoint}
        </p>
      </header>

      {loading && <div className="text-sm text-muted-foreground">加载中...</div>}
      {err && <div className="text-sm text-destructive">加载失败: {err}</div>}

      {data && (
        <div className="border border-border rounded-md p-4 space-y-3">
          <div className="text-sm">服务状态: {data.ok ? '✓ ok' : '✗ error'}</div>
          {data.results?.rules && (
            <div className="text-xs">
              <span className="text-muted-foreground">规则命中: </span>
              {data.results.rules.length > 0 ? data.results.rules.join(', ') : '（无）'}
            </div>
          )}
          {data.results?.items && data.results.items.length > 0 && (
            <ul className="text-xs space-y-1">
              {data.results.items.map(it => (
                <li key={it.id}>· {it.label}: <span className="font-mono">{it.value}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
`;
}

// ---------- stage 视图源码:主体状态机 ----------

function generateStageView(v: ViewProjection): string {
  const timeline = v.stageTimeline || [];
  const signals = v.availableSignals || [];
  const regens = v.regenerationPreviews || [];

  const timelineJson = JSON.stringify(timeline, null, 2);
  const signalsJson = JSON.stringify(signals, null, 2);
  const regensJson = JSON.stringify(regens, null, 2);

  return `// 由 CSL 投影自动生成 — 视图: ${v.id} (stage 主体状态机)
// 主体: ${v.subjectRef} · 主概念: ${v.primaryConcept}
// 端点: ${v.method} ${v.endpoint}

import { useState } from 'react';

interface StageItem { id: string; name: string; index: number | null; keywords: string[]; description: string; current: boolean; }
interface SignalItem { id: string; name: string; kind: string; intensity: number; description: string; }
interface RegenItem { id: string; name: string; failure: string; diagnosis: string; recompose: string; newVersion: string; }

interface TransitionResponse {
  ok: boolean;
  fromStage: string;
  toStage: string;
  matchedTransition: string | null;
  triggeredRegenerations: string[];
  trace: string[];
}

const TIMELINE: StageItem[] = ${timelineJson};
const SIGNALS: SignalItem[] = ${signalsJson};
const REGENS: RegenItem[] = ${regensJson};

export function ${v.componentName}() {
  const initial = TIMELINE.find(s => s.current)?.name || TIMELINE[0]?.name || '';
  const [currentStage, setCurrentStage] = useState(initial);
  const [signal, setSignal] = useState<SignalItem | null>(SIGNALS[0] || null);
  const [intensity, setIntensity] = useState<number>(SIGNALS[0]?.intensity || 0);
  const [resp, setResp] = useState<TransitionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inject = async () => {
    if (!signal) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        __signal_name__: signal.name,
        __signal_intensity__: intensity,
        __current_stage__: currentStage,
        [signal.name]: intensity,
      };
      const r = await fetch('${v.endpoint}', {
        method: '${v.method}',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json() as TransitionResponse;
      setResp(data);
      if (data.ok && data.toStage) setCurrentStage(data.toStage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">${escapeJsx(v.pageTitle)}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          主体「${escapeJsx(v.subjectRef || '')}」· 当前阶段 <span className="font-mono text-primary">{currentStage || '(未定义)'}</span>
        </p>
      </header>

      {/* 阶段时间线 */}
      <section className="border border-border rounded-md p-4">
        <h2 className="text-sm font-medium mb-3">主权阶段时间线</h2>
        <ol className="flex gap-2 overflow-x-auto pb-2">
          {TIMELINE.map(s => (
            <li
              key={s.id}
              className={\`flex-shrink-0 px-3 py-2 rounded border text-xs min-w-[120px] \${s.name === currentStage ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'}\`}
            >
              <div className="font-mono">#{s.index ?? '?'} {s.name}</div>
              <div className="text-[10px] mt-1 opacity-70">{s.keywords.join(' / ')}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* 信号注入 */}
      <section className="border border-border rounded-md p-4 space-y-3">
        <h2 className="text-sm font-medium">注入信号 → 触发阶段判定</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            <span className="text-muted-foreground">信号</span>
            <select
              className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-background text-sm"
              value={signal?.id || ''}
              onChange={e => {
                const s = SIGNALS.find(x => x.id === e.target.value) || null;
                setSignal(s);
                if (s) setIntensity(s.intensity);
              }}
            >
              {SIGNALS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.kind})</option>)}
            </select>
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground">强度</span>
            <input
              type="number"
              className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-background text-sm"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
            />
          </label>
        </div>
        {signal && <p className="text-[11px] text-muted-foreground">{signal.description}</p>}
        <button
          onClick={inject}
          disabled={submitting || !signal}
          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {submitting ? '判定中...' : '注入并判定'}
        </button>
      </section>

      {/* 转移结果 */}
      {resp && (
        <section className="border border-border rounded-md p-4 space-y-2 text-xs">
          <div className="text-sm font-medium">阶段判定结果</div>
          <div>
            <span className="text-muted-foreground">从 </span>
            <span className="font-mono">{resp.fromStage}</span>
            <span className="text-muted-foreground"> → </span>
            <span className="font-mono text-primary">{resp.toStage}</span>
            {resp.matchedTransition && (
              <span className="text-muted-foreground"> · 触发转移「{resp.matchedTransition}」</span>
            )}
          </div>
          {resp.triggeredRegenerations.length > 0 && (
            <div>
              <span className="text-muted-foreground">再生事件: </span>
              {resp.triggeredRegenerations.join(', ')}
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-muted-foreground">判定踪迹</summary>
            <ul className="mt-1 space-y-0.5 font-mono">
              {resp.trace.map((t, i) => <li key={i}>· {t}</li>)}
            </ul>
          </details>
        </section>
      )}

      {/* 再生事件预览 */}
      {REGENS.length > 0 && (
        <section className="border border-border rounded-md p-4 space-y-2">
          <h2 className="text-sm font-medium">关联再生事件</h2>
          <ul className="text-xs space-y-1">
            {REGENS.map(r => (
              <li key={r.id} className="border-l-2 border-border pl-2">
                <div className="font-medium">{r.name} <span className="text-muted-foreground">→ {r.newVersion}</span></div>
                <div className="text-muted-foreground">失配: {r.failure} · 重组: {r.recompose}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
`;
}


export function generateFrontendFiles(p: FrontendProjection): Record<string, string> {
  const files: Record<string, string> = {};

  // 单视图回退
  if (p.views.length === 0) {
    files['App.tsx'] = generateFrontendSource(p);
    return files;
  }

  // 每个 view 一个文件
  for (const v of p.views) {
    files[`views/${v.componentName}.tsx`] = generateViewSource(v);
  }

  // routes.tsx
  files['routes.tsx'] = generateRoutesSource(p);

  // App.tsx
  files['App.tsx'] = generateAppSource(p);

  return files;
}

function generateRoutesSource(p: FrontendProjection): string {
  const imports = p.views
    .map(v => `import { ${v.componentName} } from './views/${v.componentName}';`)
    .join('\n');

  const routes = p.routes
    .map(r => `  { path: '${r.path}', element: <${r.componentName} />, viewId: '${r.viewId}' },`)
    .join('\n');

  return `// 由 CSL 投影自动生成 — 路由表
// ${p.routes.length} 条路由

import type { ReactElement } from 'react';
${imports}

export interface AppRoute {
  path: string;
  element: ReactElement;
  viewId: string;
}

export const routes: AppRoute[] = [
${routes}
];
`;
}

function generateAppSource(p: FrontendProjection): string {
  const navLinks = p.views
    .map(v => `        <NavLink to="${v.path}" className={({ isActive }) => isActive ? 'font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}>${escapeJsx(v.pageTitle)}</NavLink>`)
    .join('\n');

  const routeJsx = p.routes
    .map(r => `          <Route path="${r.path}" element={<${r.componentName} />} />`)
    .join('\n');

  const viewImports = p.views
    .map(v => `import { ${v.componentName} } from './views/${v.componentName}';`)
    .join('\n');

  return `// 由 CSL 投影自动生成 — App 入口
// ${p.views.length} 视图 / 入口路由 = ${p.routes[0]?.path || '/'}

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
${viewImports}

export function ${p.appComponentName}() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 px-6 py-3 border-b border-border text-sm">
${navLinks}
      </nav>
      <main>
        <Routes>
${routeJsx}
        </Routes>
      </main>
    </BrowserRouter>
  );
}
`;
}

// ---------- 兼容入口:Phase 1 单文件 ----------

export function generateFrontendSource(p: FrontendProjection): string {
  // 多视图情况下,仍为兼容 UI 展示生成主视图源码(取入口 view)
  const entry = p.views.find(v => v.componentName === p.componentName) || p.views[0];
  if (entry) return generateViewSource(entry);

  // 完全空骨架(理论不应到达)
  return `// (空投影)
export function ${p.componentName}() {
  return <div>无可投影视图</div>;
}
`;
}

function escapeJsx(s: string): string {
  return s.replace(/[<>{}]/g, c => ({ '<': '&lt;', '>': '&gt;', '{': '&#123;', '}': '&#125;' }[c]!));
}
