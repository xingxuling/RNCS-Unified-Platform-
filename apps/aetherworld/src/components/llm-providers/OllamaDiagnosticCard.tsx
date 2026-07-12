import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  diagnoseOllama,
  type OllamaDiagnosticReport,
  type OllamaDiagnosticLevel,
  type OllamaDiagnosticStatus,
} from "@/lib/llm-providers/ollamaDiagnostics";
import type { LlmProviderConfig } from "@/lib/llm-providers/llmProviderTypes";

const LEVEL_BADGE: Record<OllamaDiagnosticLevel, { label: string; cls: string }> = {
  PASS: { label: "通过", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  WARN: { label: "注意", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  FAIL: { label: "失败", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  INFO: { label: "提示", cls: "bg-muted text-muted-foreground border-border" },
};

const STATUS_BADGE: Record<OllamaDiagnosticStatus, { label: string; cls: string }> = {
  READY: { label: "READY · 已就绪", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  NO_MODELS: { label: "NO_MODELS · 未安装模型", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  MODEL_NOT_FOUND: { label: "MODEL_NOT_FOUND · 默认模型缺失", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  NON_OLLAMA_RESPONSE: { label: "NON_OLLAMA_RESPONSE · 非 Ollama 响应", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  TERMINAL_OK_BROWSER_BLOCKED: { label: "TERMINAL_OK_BROWSER_BLOCKED · 终端可访问，浏览器被拒", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  CORS_ORIGIN_BLOCKED: { label: "CORS_ORIGIN_BLOCKED · Origin 被拒", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  CORS_BLOCKED: { label: "CORS_BLOCKED · 跨域被拒", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  UNREACHABLE_PORT: { label: "UNREACHABLE_PORT · 端口不可达", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  UNKNOWN_ERROR: { label: "UNKNOWN_ERROR · 未知错误", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props {
  provider: LlmProviderConfig;
  initialReport?: OllamaDiagnosticReport;
  onDismiss?: () => void;
}

export function OllamaDiagnosticCard({ provider, initialReport, onDismiss }: Props) {
  const [report, setReport] = useState<OllamaDiagnosticReport | undefined>(initialReport);
  const [running, setRunning] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const runDiagnose = async () => {
    setRunning(true);
    try {
      const r = await diagnoseOllama(provider);
      setReport(r);
      if (r.ok) toast.success("Ollama 已连接。");
      else toast.message(r.statusTitle);
    } finally {
      setRunning(false);
    }
  };

  const copy = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label ? `已复制：${label}` : "已复制到剪贴板");
    } catch {
      toast.error("复制失败，请手动选择文本。");
    }
  };

  const title = report?.statusTitle ?? "无法连接本机 Ollama";
  const desc =
    report?.statusDescription ??
    `Aetherworld 无法访问 ${provider.baseUrl || "http://localhost:11434"}。该错误不会影响其它部分——WebLLM 与规则模式仍可继续使用。`;

  const groupedCommands = report
    ? {
        win: report.commands.filter((c) => c.platform === "Windows PowerShell"),
        nix: report.commands.filter((c) => c.platform === "macOS / Linux"),
        common: report.commands.filter((c) => !c.platform || c.platform === "通用"),
      }
    : null;

  return (
    <Card className="p-4 space-y-3 border-amber-500/40 bg-amber-500/5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-medium">{title}</div>
            {report && (
              <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[report.status].cls}`}>
                {STATUS_BADGE[report.status].label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          <p className="text-[11px] text-muted-foreground">
            目标地址：
            <code className="px-1 py-0.5 rounded bg-muted">
              {(report?.baseUrl ?? provider.baseUrl) || "http://localhost:11434"}
            </code>
          </p>
        </div>
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            收起
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={runDiagnose} disabled={running}>
          {running ? "诊断中…" : report ? "重新诊断" : "运行连接诊断"}
        </Button>
        {report &&
          (report.status === "TERMINAL_OK_BROWSER_BLOCKED" ||
            report.status === "CORS_ORIGIN_BLOCKED" ||
            report.status === "CORS_BLOCKED") && (
            <Button size="sm" onClick={runDiagnose} disabled={running}>
              我已设置 OLLAMA_ORIGINS，重新检测
            </Button>
          )}
      </div>

      {report && (
        <div className="space-y-3">
          <div className="rounded border bg-background/60 divide-y">
            {report.items.map((it) => {
              const meta = LEVEL_BADGE[it.level];
              return (
                <div key={it.id} className="flex items-start justify-between gap-3 px-3 py-2">
                  <div className="text-xs">
                    <div className="font-medium">{it.label}</div>
                    {it.detail && <div className="text-muted-foreground mt-0.5 break-all">{it.detail}</div>}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
                    {meta.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          {report.suggestions.length > 0 && (
            <div className="text-xs space-y-1">
              <div className="font-medium">建议操作</div>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {report.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {groupedCommands && (
            <div className="text-xs space-y-2">
              <div className="font-medium">常用命令</div>

              <CommandGroup
                title="Windows PowerShell"
                hint='PowerShell 中 curl 是 Invoke-WebRequest 的别名，请使用 curl.exe；设置环境变量使用 $env:OLLAMA_ORIGINS="*"。'
                items={groupedCommands.win}
                onCopy={copy}
              />
              <CommandGroup title="macOS / Linux" items={groupedCommands.nix} onCopy={copy} />
              <CommandGroup title="通用" items={groupedCommands.common} onCopy={copy} />
            </div>
          )}

          {(report.rawErrorMessage || report.rawResponsePreview) && (
            <div className="text-xs">
              <button
                type="button"
                onClick={() => setShowRaw((v) => !v)}
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {showRaw ? "隐藏" : "展开"}技术详情
              </button>
              {showRaw && (
                <div className="mt-2 space-y-2">
                  {report.rawErrorMessage && (
                    <pre className="p-2 rounded bg-muted text-[11px] whitespace-pre-wrap break-all">
                      {report.rawErrorMessage}
                    </pre>
                  )}
                  {report.rawResponsePreview && (
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-1">响应预览（前 240 字符）</div>
                      <pre className="p-2 rounded bg-muted text-[11px] whitespace-pre-wrap break-all">
                        {report.rawResponsePreview}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!report && (
        <div className="text-[11px] text-muted-foreground">
          点击「运行连接诊断」查看具体卡点（端口不可达 / 非 Ollama 响应 / 跨域 / 未装模型等）。原始错误位于「技术详情」。
        </div>
      )}
    </Card>
  );
}

function CommandGroup({
  title,
  hint,
  items,
  onCopy,
}: {
  title: string;
  hint?: string;
  items: { label: string; command: string }[];
  onCopy: (text: string, label?: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded border bg-background/60 p-2 space-y-2">
      <div className="text-[11px] font-medium">{title}</div>
      {hint && <div className="text-[10px] text-muted-foreground leading-relaxed">{hint}</div>}
      <div className="space-y-1.5">
        {items.map((c) => (
          <div key={c.command} className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-muted-foreground">{c.label}</div>
              <pre className="text-[11px] p-1.5 rounded bg-muted whitespace-pre-wrap break-all">{c.command}</pre>
            </div>
            <Button size="sm" variant="outline" onClick={() => onCopy(c.command, c.label)}>
              复制
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
