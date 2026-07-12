import { useEffect, useMemo, useState } from 'react';
import { loadSpecRegistry, validateSpecAgainstCode, validateOSESpecAgainstCode, type SpecFile } from '@/csl/specs/loader';
import { EXAMPLES } from '@/csl/examples';
import { ALL_FLAGS } from '@/csl';
import { OSE_HOOK_IDS } from '@/csl/projection/ose-bridge';
import { setDisabledFeatures, getDisabledFeatures } from '@/csl/versions/dispatch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, FileCode2, GitBranch, Box, Layers, BookOpen, Package, Shield, Zap, ZapOff } from 'lucide-react';

interface Props {
  /** 当用户点击"在编辑器打开此规格"时回调 */
  onOpenInEditor?: (source: string, label: string) => void;
}

const SPEC_LABELS: Record<SpecFile, string> = {
  'grammar-registry': '版本注册',
  'feature-map': '特性表',
  'ast-schema': 'AST schema',
  'ir-schema': 'IR schema',
  'examples-registry': '示例注册',
  'suffix-system': '后缀体系',
  'projection-protocol': '投影协议',
  'ose-protocol': 'OSE 协议',
};

const STATUS_TONE: Record<string, string> = {
  stable: 'bg-status-success/15 text-status-success border-status-success/30',
  preview: 'bg-primary/15 text-primary border-primary/30',
  experimental: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  disabled: 'bg-muted text-muted-foreground border-border',
  runnable: 'bg-status-success/15 text-status-success border-status-success/30',
};

export function SpecsPanel({ onOpenInEditor }: Props) {
  const registry = useMemo(() => loadSpecRegistry(), []);
  const mismatches = useMemo(
    () => validateSpecAgainstCode(
      registry,
      EXAMPLES.map(e => e.id),
      ALL_FLAGS as unknown as string[],
    ),
    [registry],
  );
  const oseMismatches = useMemo(
    () => validateOSESpecAgainstCode(registry, OSE_HOOK_IDS as unknown as string[]),
    [registry],
  );
  const allMismatches = useMemo(() => [...mismatches, ...oseMismatches], [mismatches, oseMismatches]);

  const allOk = registry.diagnostics.every(d => d.level === 'ok');

  // ---------- spec-driven dispatch v1 ----------
  // 规格层 status = "disabled" 的 feature → 自动注入 dispatch
  // 同时支持 UI 试验:临时强制 disable 某 feature 验证规格能掌权
  const specDisabled = useMemo(
    () => registry.features.filter(f => f.status === 'disabled').map(f => f.id),
    [registry],
  );
  const [manualDisabled, setManualDisabled] = useState<string[]>([]);
  const effectiveDisabled = useMemo(
    () => Array.from(new Set([...specDisabled, ...manualDisabled])),
    [specDisabled, manualDisabled],
  );

  useEffect(() => {
    setDisabledFeatures(effectiveDisabled);
  }, [effectiveDisabled]);

  // 试验台只列举可被切换的"第一梯队"feature(已在 dispatch FEATURE_KEYWORDS 中登记)
  const TOGGLABLE_FEATURES = [
    'concept_blocks', 'proposition_blocks', 'relation_blocks',
    'mapping_tables', 'sealing', 'colocation_chains', 'domain_expansion',
    'functions', 'conditionals', 'subjects',
  ];
  const toggle = (id: string) => {
    setManualDisabled(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };


  return (
    <div className="space-y-4">
      {/* 总体状态 */}
      <div className="flex items-center gap-2 flex-wrap">
        {allOk ? (
          <Badge className="bg-status-success/15 text-status-success border-status-success/30 border">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            8 份规格全部解析通过 — 自举链路成立
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            存在规格解析错误 — 自举链路断裂
          </Badge>
        )}
        <span className="text-[11px] text-muted-foreground">
          {registry.versions.length} 版本 · {registry.features.length} 特性 · {registry.astNodes.length} AST 节点 · {registry.irTypes.length} IR 类型 · {registry.examples.length} 示例 · {registry.suffixes.length} 后缀 · {registry.oseHooks.length} OSE 钩子
        </span>
      </div>

      {/* 规格 → 代码一致性(Phase 2.4:examples 类升 error,其余仍 warn) */}
      {allMismatches.length > 0 && (() => {
        const errors = allMismatches.filter(m => m.level === 'error');
        const warns = allMismatches.filter(m => m.level === 'warn');
        return (
          <div className={`border rounded-md p-3 ${errors.length > 0 ? 'bg-destructive/5 border-destructive/40' : 'bg-status-warning/5'}`}>
            <div className={`flex items-center gap-2 text-xs font-medium mb-2 ${errors.length > 0 ? 'text-destructive' : 'text-status-warning'}`}>
              <AlertTriangle className="w-3 h-3" />
              规格 ↔ 代码 对齐状态
              {errors.length > 0 && <Badge variant="destructive" className="text-[10px]">{errors.length} 硬错误 (BLOCK)</Badge>}
              {warns.length > 0 && <Badge variant="outline" className="text-[10px]">{warns.length} 软警告</Badge>}
            </div>
            <ul className="space-y-1">
              {[...errors, ...warns].map((m, i) => (
                <li key={i} className={`text-[11px] font-mono ${m.level === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  · [{m.level}/{m.category}] {m.message}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* spec-driven dispatch v1 试验台 */}
      <div className="border rounded-md p-3 bg-primary/5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
          <Zap className="w-3.5 h-3.5 text-primary" />
          spec-driven dispatch v1 — 规格层 feature 状态真正掌权 lexer
          <Badge variant="outline" className="text-[10px]">试点</Badge>
          {effectiveDisabled.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{effectiveDisabled.length} 个 feature 已被关闭</Badge>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground leading-5">
          规格层 <code>feature-map.csl</code> 中 <span className="text-status-warning">状态 = "disabled"</span> 的 feature 会被注入 dispatch,
          其对应的 v0.9 关键字立即从 lexer 词表中剔除。下方按钮可临时强制 disable 某 feature,
          切到「投影」面板对应 demo 会解析失败 → 证明<strong>规格能掌权 dispatch</strong>。
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TOGGLABLE_FEATURES.map(id => {
            const off = effectiveDisabled.includes(id);
            const fromSpec = specDisabled.includes(id);
            return (
              <Button
                key={id} size="sm" variant={off ? 'destructive' : 'outline'}
                disabled={fromSpec}
                onClick={() => toggle(id)}
                className="h-6 text-[10px] gap-1 font-mono"
                title={fromSpec ? '由规格层永久关闭,不可在此切换' : (off ? '点击重新启用' : '点击临时 disable')}
              >
                {off ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                {id}
              </Button>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground border-t pt-1.5">
          当前生效 disabled: <code className="font-mono">{effectiveDisabled.length === 0 ? '(空 — 全部启用)' : effectiveDisabled.join(', ')}</code>
        </div>
      </div>

      <Tabs defaultValue="versions" className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-0 flex-wrap">
          {[
            { v: 'versions', icon: GitBranch, label: '版本' },
            { v: 'features', icon: Layers, label: '特性' },
            { v: 'ast', icon: FileCode2, label: 'AST 节点' },
            { v: 'ir', icon: Box, label: 'IR 类型' },
            { v: 'examples', icon: BookOpen, label: '示例' },
            { v: 'suffixes', icon: Package, label: '后缀体系' },
            { v: 'ose', icon: Shield, label: 'OSE 钩子' },
            { v: 'sources', icon: FileCode2, label: '原始 .csl' },
          ].map(t => (
            <TabsTrigger
              key={t.v} value={t.v}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2 gap-1.5"
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 版本 */}
        <TabsContent value="versions" className="mt-3 space-y-2">
          {registry.versions.map(v => (
            <div key={v.id} className="border rounded-md p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-medium">{v.id}</span>
                <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[v.status] || ''}`}>{v.status}</Badge>
                {v.parent && <span className="text-[10px] text-muted-foreground">← {v.parent}</span>}
                <span className="ml-auto text-[10px] text-muted-foreground">序号 {v.releaseSeq}</span>
              </div>
              <div className="text-xs text-muted-foreground">{v.description}</div>
            </div>
          ))}
        </TabsContent>

        {/* 特性 */}
        <TabsContent value="features" className="mt-3 space-y-1.5">
          {registry.features.map(f => (
            <div key={f.id} className="border rounded-md p-2.5 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-medium min-w-[140px]">{f.id}</span>
              <span className="text-xs">{f.cnName}</span>
              <Badge variant="outline" className="text-[10px]">{f.belongsTo}</Badge>
              <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[f.status] || ''}`}>{f.status}</Badge>
              <span className="text-[10px] text-muted-foreground font-mono">{f.affects}</span>
              <span className="text-[11px] text-muted-foreground ml-auto max-w-[40%] text-right">{f.description}</span>
            </div>
          ))}
        </TabsContent>

        {/* AST 节点 */}
        <TabsContent value="ast" className="mt-3 space-y-1.5">
          {registry.astNodes.map(n => (
            <div key={n.nodeName} className="border rounded-md p-2.5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs font-medium">{n.nodeName}</span>
                {n.feature && <Badge variant="outline" className="text-[10px]">feat: {n.feature}</Badge>}
                {n.isTopLevel && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">顶层</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground">{n.description}</span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">{n.fields}</div>
            </div>
          ))}
        </TabsContent>

        {/* IR 类型 */}
        <TabsContent value="ir" className="mt-3 space-y-1.5">
          {registry.irTypes.map(t => (
            <div key={t.typeName} className="border rounded-md p-2.5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs font-medium">{t.typeName}</span>
                <Badge variant="outline" className="text-[10px] font-mono">ir.{t.containerKey}</Badge>
                {t.feature && <Badge variant="outline" className="text-[10px]">feat: {t.feature}</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground">{t.description}</span>
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">{t.fields}</div>
            </div>
          ))}
        </TabsContent>

        {/* 示例 */}
        <TabsContent value="examples" className="mt-3 space-y-1.5">
          {registry.examples.map(e => (
            <div key={e.id} className="border rounded-md p-2.5 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-medium min-w-[120px]">{e.id}</span>
              <span className="text-xs">{e.name}</span>
              <Badge variant="outline" className="text-[10px]">{e.belongsTo}</Badge>
              <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[e.status] || ''}`}>{e.status}</Badge>
              {e.requiredFeatures.length > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  需要：{e.requiredFeatures.join(', ')}
                </span>
              )}
            </div>
          ))}
        </TabsContent>

        {/* 后缀体系 */}
        <TabsContent value="suffixes" className="mt-3 space-y-4">
          <div>
            <div className="text-xs font-medium mb-2 text-muted-foreground">四层后缀（Phase 1 → Phase 4）</div>
            <div className="space-y-1.5">
              {registry.suffixes.map(s => (
                <div key={s.id} className="border rounded-md p-2.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-medium">{s.id}</span>
                    <span className="text-xs">{s.cnName}</span>
                    <Badge variant="outline" className="text-[10px]">{s.layer}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.phase}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[s.status] || ''}`}>{s.status}</Badge>
                    {s.parent && <span className="text-[10px] text-muted-foreground font-mono">← {s.parent}</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2 text-muted-foreground">平台目标（未来 .cslpkg 投影）</div>
            <div className="space-y-1.5">
              {registry.platforms.map(p => (
                <div key={p.id} className="border rounded-md p-2.5 flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-medium min-w-[80px]">{p.id}</span>
                  <span className="text-xs">{p.cnName}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{p.nativeFormat}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[p.status] || ''}`}>{p.status}</Badge>
                  <span className="text-[11px] text-muted-foreground ml-auto max-w-[50%] text-right">{p.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2 text-muted-foreground">构建步骤（未来 cslc 工具链草案）</div>
            <div className="space-y-1.5">
              {registry.buildSteps.map(b => (
                <div key={b.id} className="border rounded-md p-2.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="font-mono text-xs font-medium px-1.5 py-0.5 bg-muted rounded">{b.command}</code>
                    <span className="text-[10px] font-mono text-muted-foreground">{b.inputSuffix} → {b.outputSuffix}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[b.status] || ''}`}>{b.status}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{b.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground border-t pt-2 leading-5">
            <strong>定性：</strong>CSL 不是平台原生安装格式的替代品,而是跨平台应用与结构系统的<strong>母源格式</strong>。
            <code>.csl</code> 做骨,<code>.cslapp</code> 做应用本体,<code>.cslschema</code> 做自举规格,<code>.cslpkg</code> 做平台投影。
            当前仅 <code>.csl</code> 处于 active,<code>.cslschema</code> 正由本规格自身草拟中。
          </div>
        </TabsContent>

        {/* OSE 治理钩子 */}
        <TabsContent value="ose" className="mt-3 space-y-3">
          <div className="text-[11px] text-muted-foreground leading-5">
            <strong>软对齐说明:</strong> 规格层 <code>ose-protocol.csl</code> 声明协议钩子,代码侧 <code>ose-bridge.ts</code> 提供 <code>OSE_HOOK_IDS</code> 实际接入名单。
            两侧仅核对 <span className="text-status-success">active</span> 状态的钩子,缺一报 warn。<span className="text-muted-foreground">planned</span> 视为 Phase 2 占位,不参与对齐。
          </div>

          {oseMismatches.length === 0 ? (
            <div className="border rounded-md p-2.5 bg-status-success/5 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
              <span className="text-xs text-status-success">OSE 协议层与实现层完全对齐({OSE_HOOK_IDS.length} 个 active 钩子)</span>
            </div>
          ) : (
            <div className="border rounded-md p-3 bg-status-warning/5">
              <div className="flex items-center gap-2 text-xs font-medium text-status-warning mb-2">
                <AlertTriangle className="w-3 h-3" />
                OSE 软对齐警告({oseMismatches.length})
              </div>
              <ul className="space-y-1">
                {oseMismatches.map((m, i) => (
                  <li key={i} className="text-[11px] font-mono text-muted-foreground">· {m.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            {registry.oseHooks.map(h => (
              <div key={h.id} className="border rounded-md p-2.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-medium min-w-[160px]">{h.id}</span>
                  <Badge variant="outline" className="text-[10px]">{h.aspect}</Badge>
                  <Badge variant="outline" className="text-[10px]">{h.phase}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[h.status] || ''}`}>{h.status}</Badge>
                  <code className="text-[10px] font-mono text-muted-foreground ml-auto">{h.entryPoint}</code>
                </div>
                <div className="text-[11px] text-muted-foreground">{h.description}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-3 space-y-2">
          {(Object.keys(registry.rawSources) as SpecFile[]).map(file => {
            const diag = registry.diagnostics.find(d => d.file === file);
            return (
              <div key={file} className="border rounded-md">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                  <FileCode2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-xs font-medium">{file}.csl</span>
                  <span className="text-[11px] text-muted-foreground">{SPEC_LABELS[file]}</span>
                  {diag && (
                    <Badge variant="outline" className={`text-[10px] ml-2 ${diag.level === 'ok' ? STATUS_TONE.stable : 'bg-destructive/15 text-destructive border-destructive/30'}`}>
                      {diag.level === 'ok' ? `✓ ${diag.entityCount} 条` : '✗ ' + diag.message}
                    </Badge>
                  )}
                  {onOpenInEditor && (
                    <button
                      onClick={() => onOpenInEditor(registry.rawSources[file], `${file}.csl`)}
                      className="ml-auto text-[11px] px-2 py-0.5 rounded border hover:bg-muted"
                    >
                      在编辑器中打开
                    </button>
                  )}
                </div>
                <pre className="text-[10px] font-mono p-3 overflow-x-auto max-h-[280px] leading-4 text-foreground/80">
{registry.rawSources[file]}
                </pre>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      <div className="text-[10px] text-muted-foreground border-t pt-2 leading-5">
        <strong>自举说明：</strong>
        以上 8 份规格文件全部用 v0.8 子集（概念/实例/属性/不变量/规则/证据）编写，由 v0.8 lexer/parser/ir-builder 解析后映射成强类型 SpecRegistry。
        当前为<strong>软对齐</strong>阶段：规格与代码并存，规格变化不会自动驱动 dispatch。
        v1.0 启用 <code>spec_driven_dispatch</code> 后，将由规格直接驱动 lexer 关键字表与示例注册。
        <br />
        <strong>暂不能自举的部分：</strong>
        lexer KEYWORD 白名单、parser 节点构造逻辑、runtime 求值与阶段推进、UI 面板渲染——这些仍需手写代码。
      </div>
    </div>
  );
}
