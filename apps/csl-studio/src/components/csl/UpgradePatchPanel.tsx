// 升级建议面板 — 用 CSL 自举生成器产出可粘贴的 CSL 源码补丁
import { useState, useCallback } from 'react';
import type { IRContainer } from '@/csl/types';
import { generateUpgradePatches, type CSLUpgradeReport, type CSLPatch } from '@/csl/csl-upgrade-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Copy, Check, FileCode, ChevronDown, ChevronRight, ArrowDownToLine, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const VERDICT_TONE: Record<CSLPatch['verdict'], string> = {
  '建议纳入': 'bg-status-success/15 text-status-success border-status-success/30',
  '暂缓':     'bg-status-warning/15 text-status-warning border-status-warning/30',
  '拒绝':     'bg-destructive/10 text-destructive border-destructive/30',
};

const CHANGE_KIND_TONE: Record<string, string> = {
  '新增关键字':     'bg-primary/10 text-primary border-primary/30',
  '新增 AST 节点':  'bg-accent/15 text-accent-foreground border-accent/30',
  '新增 IR 字段':   'bg-status-success/10 text-status-success border-status-success/30',
  '新增运行时校验': 'bg-status-warning/10 text-status-warning border-status-warning/30',
  '新增示例':       'bg-secondary text-secondary-foreground border-border',
  '新增 UI 面板':   'bg-muted text-muted-foreground border-border',
};

interface UpgradePatchPanelProps {
  ir: IRContainer | null;
  /** 0.8 — 把 csl_snippet 追加到当前编辑器末尾（闭环验证补丁是合法 CSL） */
  onAppendCode?: (snippet: string) => void;
}

export function UpgradePatchPanel({ ir, onAppendCode }: UpgradePatchPanelProps) {
  const [question, setQuestion] = useState('CSL 0.8 应该加什么新原语？');
  const [report, setReport] = useState<CSLUpgradeReport | null>(null);
  const [openPatches, setOpenPatches] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState<string | null>(null);
  /** 0.8 — 已实施标记（本地状态，按补丁 trigger_block 名称跟踪） */
  const [implemented, setImplemented] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(() => {
    const r = generateUpgradePatches(question.trim() || '升级建议', ir);
    setReport(r);
    setOpenPatches(new Set([0]));
  }, [question, ir]);

  const handleCopy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('复制失败');
    }
  }, []);

  const togglePatch = (i: number) => {
    setOpenPatches(s => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-md p-3 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">CSL 自举升级器</span>
          <Badge variant="outline" className="text-[10px]">
            读取「目标/元概念」型概念块 → 产出可粘贴的 CSL 源码补丁
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
          升级器扫描当前知识库里 <span className="font-mono">类型 = "目标"</span> 或 <span className="font-mono">"元概念"</span> 的概念块，
          按"价值 − 代价"打分，为每个升级目标生成：新增关键字、AST/IR 字段骨架、运行时校验、CSL 示例片段。
          建议先加载「CSL 自举 v1」示例。
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="例如：CSL 0.8 应该加什么？/ 跨知识库联合推理怎么实现？"
            className="text-xs min-h-[44px] flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
          />
          <Button onClick={handleGenerate} size="sm" className="h-9" disabled={!ir}>
            <Wand2 className="w-3.5 h-3.5 mr-1" />生成补丁
          </Button>
        </div>
      </div>

      {!report && (
        <div className="text-center py-12 text-xs text-muted-foreground border rounded-md border-dashed">
          <FileCode className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <div>点击「生成补丁」开始</div>
        </div>
      )}

      {report && (
        <>
          <div className="border rounded-md p-3 bg-secondary/30">
            <div className="text-[11px] text-muted-foreground mb-1">升级器结论</div>
            <div className="text-xs text-foreground leading-relaxed">{report.summary}</div>
            {report.detected_targets.length > 0 && (
              <div className="text-[10px] text-muted-foreground mt-2">
                识别到的升级目标：
                {report.detected_targets.map(n => (
                  <Badge key={n} variant="outline" className="text-[10px] font-mono ml-1">{n}</Badge>
                ))}
              </div>
            )}
          </div>

          {report.patches.map((p, i) => {
            const open = openPatches.has(i);
            const net = p.estimated_value - p.estimated_cost;
            return (
              <div key={i} className="border rounded-md bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-secondary/30 transition-colors"
                  onClick={() => togglePatch(i)}
                >
                  {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  <Badge variant="outline" className={`text-[10px] ${VERDICT_TONE[p.verdict]}`}>
                    {p.verdict}
                  </Badge>
                  <span className="text-xs font-medium flex-1">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    价值 {p.estimated_value} − 代价 {p.estimated_cost} = {net >= 0 ? '+' : ''}{net}
                  </span>
                </button>

                {open && (
                  <div className="p-3 pt-0 space-y-3 border-t border-border/50">
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">触发概念块：</span>
                      <span className="font-mono">{p.trigger_block}</span>
                      <br />
                      <span className="font-medium text-foreground">意图：</span>{p.intent}
                      <br />
                      <span className="font-medium text-foreground">判断理由：</span>{p.rationale}
                    </div>

                    <div>
                      <div className="text-[11px] font-medium mb-1.5">影响的代码模块（{p.affected_modules.length}）</div>
                      <div className="space-y-2">
                        {p.affected_modules.map((m, j) => {
                          const key = `${i}-mod-${j}`;
                          return (
                            <div key={j} className="border rounded-md bg-secondary/20">
                              <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-border/50">
                                <Badge variant="outline" className={`text-[10px] ${CHANGE_KIND_TONE[m.change_kind] ?? ''}`}>
                                  {m.change_kind}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">[{m.engine}]</span>
                                <span className="text-[10px] font-mono text-foreground flex-1 truncate">{m.file}</span>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={() => handleCopy(key, m.snippet)}
                                >
                                  {copied === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                              </div>
                              <pre className="text-[10px] font-mono p-2.5 overflow-x-auto whitespace-pre text-foreground">
                                {m.snippet}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-medium">CSL 源码补丁（可直接粘贴到编辑器）</span>
                        {implemented.has(p.trigger_block) && (
                          <Badge variant="outline" className="text-[10px] bg-status-success/15 text-status-success border-status-success/40">
                            <CheckCircle2 className="w-3 h-3 mr-1" />已实施
                          </Badge>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          {onAppendCode && (
                            <Button
                              variant="outline" size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                onAppendCode('\n\n' + p.csl_snippet + '\n');
                                toast.success('已追加到编辑器，点「运行」重新解析');
                              }}
                            >
                              <ArrowDownToLine className="w-3 h-3 mr-1" />应用到编辑器
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => handleCopy(`${i}-csl`, p.csl_snippet)}
                          >
                            {copied === `${i}-csl` ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            复制
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setImplemented(s => {
                                const n = new Set(s);
                                if (n.has(p.trigger_block)) n.delete(p.trigger_block);
                                else n.add(p.trigger_block);
                                return n;
                              });
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {implemented.has(p.trigger_block) ? '取消标记' : '标记已实施'}
                          </Button>
                        </div>
                      </div>
                      <pre className="text-[10px] font-mono p-2.5 overflow-x-auto whitespace-pre border rounded-md bg-secondary/20 text-foreground">
                        {p.csl_snippet}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
