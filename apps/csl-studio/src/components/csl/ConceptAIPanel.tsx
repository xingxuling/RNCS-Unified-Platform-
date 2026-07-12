import { useState, useCallback, useMemo } from 'react';
import type { IRContainer } from '@/csl/types';
import { runConceptAI, type ConceptAIResult, type ProfileLevel } from '@/csl/concept-ai';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Download, Sparkles, Brain, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  result?: ConceptAIResult;
}

export function ConceptAIPanel({ ir }: { ir: IRContainer | null }) {
  const [profile, setProfile] = useState<ProfileLevel>('normal');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const summary = useMemo(() => {
    if (!ir) return null;
    return {
      concepts: ir.concepts.length,
      entities: ir.entities.length,
      rules: ir.rules.length,
      subjects: ir.subjects.length,
      stages: ir.stages.length,
      chains: ir.correspondence_chains.length,
    };
  }, [ir]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !ir) return;
    const q = input.trim();
    const result = runConceptAI(q, ir, profile);
    setHistory(h => [
      ...h,
      { id: Date.now(), role: 'user', content: q },
      { id: Date.now() + 1, role: 'ai', content: result.markdown, result },
    ]);
    setInput('');
  }, [input, ir, profile]);

  const handleExport = useCallback(() => {
    if (!history.length) return;
    const md = history.map(m =>
      m.role === 'user' ? `\n\n---\n\n# 🧑 用户提问\n\n${m.content}\n` : m.content
    ).join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concept-ai-conversation-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  const profileLabel = (p: ProfileLevel) =>
    p === 'light' ? '轻量问答 (前 2 步)' : p === 'normal' ? '常规推理 (前 4 步)' : '深度推理 (全 7 步)';

  return (
    <div className="space-y-4">
      {/* 顶部：知识库摘要 + 控制 */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium">当前知识库</span>
          {summary ? (
            <>
              <Badge variant="outline" className="text-[10px]">{summary.concepts} 概念</Badge>
              <Badge variant="outline" className="text-[10px]">{summary.entities} 实例</Badge>
              <Badge variant="outline" className="text-[10px]">{summary.rules} 规则</Badge>
              {summary.subjects > 0 && <Badge variant="outline" className="text-[10px]">{summary.subjects} 主体</Badge>}
              {summary.chains > 0 && <Badge variant="outline" className="text-[10px]">{summary.chains} 同位链</Badge>}
            </>
          ) : <span className="text-xs text-muted-foreground">无 IR，请先运行 CSL 代码</span>}
        </div>
        <div className="flex items-center gap-2">
          <Select value={profile} onValueChange={(v) => setProfile(v as ProfileLevel)}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue>{profileLabel(profile)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light" className="text-xs">{profileLabel('light')}</SelectItem>
              <SelectItem value="normal" className="text-xs">{profileLabel('normal')}</SelectItem>
              <SelectItem value="deep" className="text-xs">{profileLabel('deep')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 对话历史 */}
      <div className="space-y-3">
        {history.length === 0 && (
          <div className="text-center py-10 text-xs text-muted-foreground border rounded-md border-dashed">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <div>用「概念」与 AI 对话</div>
            <div className="mt-1 text-[10px]">示例：在材料学示例下输入「PEDOT:PSS 怎么样？」</div>
          </div>
        )}
        {history.map(m => (
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-2">
              {m.result && (
                <>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Brain className="w-3 h-3" />
                    焦点：{m.result.focus ? `${m.result.focus.kind} / ${m.result.focus.name}` : '未识别'}
                    <span className="mx-1">·</span>
                    {m.result.steps.length} 步
                  </div>
                  <div className="space-y-2">
                    {m.result.steps.map((s, i) => (
                      <div key={i} className="border rounded-md p-2.5 bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={s.status === 'ok' ? 'default' : 'outline'}
                            className={`text-[10px] ${s.status === 'ok' ? 'bg-status-success' : s.status === 'skip' ? 'opacity-50' : ''}`}
                          >
                            {i + 1}. {s.unit}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{s.layer} · 净分 {s.net_score}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {s.status === 'ok' ? '✓' : s.status === 'empty' ? '∅' : '⊘'}
                          </span>
                        </div>
                        <div className="text-xs mb-1.5">{s.summary}</div>
                        {s.refs.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {s.refs.slice(0, 8).map((r, j) => (
                              <Badge key={j} variant="outline" className="text-[10px] font-mono">{r}</Badge>
                            ))}
                          </div>
                        )}
                        {s.details.length > 0 && (
                          <div className="space-y-0.5 mt-1">
                            {s.details.map((d, j) => (
                              <div key={j} className="text-[11px] text-muted-foreground font-mono pl-2 border-l border-border">
                                {d}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        ))}
      </div>

      {/* 输入区 */}
      <div className="sticky bottom-0 bg-background pt-2 border-t">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入一个问题，提到知识库里的概念名 / 实例名 / 主体名..."
            className="text-xs min-h-[60px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />
          <div className="flex flex-col gap-2">
            <Button onClick={handleSend} size="sm" disabled={!input.trim() || !ir} className="h-9">
              <Send className="w-3.5 h-3.5 mr-1" />发送
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline" disabled={!history.length} className="h-9">
              <Download className="w-3.5 h-3.5 mr-1" />导出
            </Button>
            <Button onClick={() => setHistory([])} size="sm" variant="outline" disabled={!history.length} className="h-9">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">⌘/Ctrl + Enter 发送</div>
      </div>
    </div>
  );
}
