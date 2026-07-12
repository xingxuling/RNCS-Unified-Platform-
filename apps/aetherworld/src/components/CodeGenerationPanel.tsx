import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CODE_TASK_TYPES } from "@/constants/codeTaskTypes";
import { DEFAULT_DO_NOT_BREAK } from "@/constants/codeSafetyRules";
import { generateCodeTask, type CodeGenerationResult } from "@/lib/codeGenerationCalculus";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

const TOOLS = ["LOVABLE", "CODEX", "CURSOR", "GENERIC"] as const;
const SCOPES = ["PATCH", "MODULE", "BULK", "REFACTOR", "SYSTEM_LAYER"] as const;
const LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

const HISTORY_KEY = "codeGenerationHistory";

export function CodeGenerationPanel() {
  const [feature, setFeature] = useState("");
  const [taskType, setTaskType] = useState("NEW_ENGINE");
  const [tool, setTool] = useState<typeof TOOLS[number]>("LOVABLE");
  const [scope, setScope] = useState<typeof SCOPES[number]>("MODULE");
  const [safety, setSafety] = useState<typeof LEVELS[number]>("MEDIUM");
  const [affected, setAffected] = useState("Prompt Forge, Encyclopedia");
  const [doNotBreak, setDoNotBreak] = useState(DEFAULT_DO_NOT_BREAK.join(", "));
  const [result, setResult] = useState<CodeGenerationResult | null>(null);

  const handle = () => {
    if (!feature.trim()) { toast.error("请填写目标功能"); return; }
    const r = generateCodeTask({
      targetFeature: feature,
      taskType,
      targetTool: tool,
      scopeMode: scope,
      safetyLevel: safety,
      affectedModules: affected.split(",").map(s => s.trim()).filter(Boolean),
      doNotBreak: doNotBreak.split(",").map(s => s.trim()).filter(Boolean),
    });
    setResult(r);
    try {
      const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      hist.unshift({ feature, taskType, tool, scope, at: new Date().toISOString() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 30)));
    } catch { /* quota */ }
  };

  const copy = () => { if (result) { navigator.clipboard.writeText(result.generatedPrompt); toast.success("已复制提示词"); } };

  return (
    <div className="space-y-4">
      <div className="aether-card-elevated p-5 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Code Generator · 代码生成</div>
        <Textarea placeholder="描述目标功能（例：新增「平台传播计算法」引擎并接入侧边栏与百科）"
          value={feature} onChange={e => setFeature(e.target.value)} rows={3} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Field label="任务类型">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={taskType} onChange={e => setTaskType(e.target.value)}>
              {CODE_TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="目标工具">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={tool} onChange={e => setTool(e.target.value as any)}>
              {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="范围模式">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={scope} onChange={e => setScope(e.target.value as any)}>
              {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="安全级别">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={safety} onChange={e => setSafety(e.target.value as any)}>
              {LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="受影响模块（逗号分隔）">
          <Input value={affected} onChange={e => setAffected(e.target.value)} />
        </Field>
        <Field label="不要破坏（do-not-break，逗号分隔）">
          <Textarea value={doNotBreak} onChange={e => setDoNotBreak(e.target.value)} rows={2} />
        </Field>
        <Button onClick={handle}><Wand2 className="w-3.5 h-3.5 mr-1" />生成代码任务与提示词</Button>
      </div>

      {result && (
        <>
          <div className="aether-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">任务类型 / 提示词模式</div>
            <div className="text-sm">{result.recommendedTaskType} · {result.recommendedPromptMode}</div>
          </div>

          <Section title="计划文件">
            <ul className="text-xs space-y-1">
              {result.targetFiles.map(f => (
                <li key={f.path}>
                  <span className={f.intent === "create" ? "text-emerald-400" : "text-amber-400"}>[{f.intent}]</span>{" "}
                  <code>{f.path}</code> <span className="text-muted-foreground">— {f.reason}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="验收清单">
            <ul className="text-xs space-y-1 list-disc list-inside">{result.acceptanceChecklist.map(a => <li key={a}>{a}</li>)}</ul>
          </Section>

          <Section title="QA 检查">
            <ul className="text-xs space-y-1 list-disc list-inside">{result.qaChecklist.map(a => <li key={a}>{a}</li>)}</ul>
          </Section>

          {(result.dependencyWarnings.length > 0 || result.riskWarnings.length > 0) && (
            <Section title="警告">
              <ul className="text-xs space-y-1">
                {result.dependencyWarnings.map(w => <li key={w} className="text-amber-400">⚠ {w}</li>)}
                {result.riskWarnings.map(w => <li key={w} className="text-rose-400">⚠ {w}</li>)}
              </ul>
            </Section>
          )}

          {(result.recalculationImpact.length > 0 || result.documentationImpact.length > 0) && (
            <Section title="重算 / 文档影响">
              <ul className="text-xs space-y-1">
                {result.recalculationImpact.map(s => <li key={s}>↻ {s}</li>)}
                {result.documentationImpact.map(s => <li key={s}>📖 {s}</li>)}
              </ul>
            </Section>
          )}

          <Section title="生成的提示词">
            <pre className="text-[11px] bg-background/40 p-3 rounded border border-border max-h-96 overflow-auto whitespace-pre-wrap">{result.generatedPrompt}</pre>
            <Button size="sm" variant="outline" className="mt-2" onClick={copy}>
              <Copy className="w-3.5 h-3.5 mr-1" />复制提示词
            </Button>
          </Section>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="aether-card p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}
