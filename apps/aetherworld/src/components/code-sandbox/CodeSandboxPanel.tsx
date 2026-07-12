import { useEffect, useMemo, useState } from "react";
import type { CodeSandboxMode } from "@/constants/code-sandbox/codeSandboxModes";
import { listAppWorkspaceRecords } from "@/lib/app-runtime/appWorkspaceBridge";
import { runAetherAppRuntime } from "@/lib/app-runtime/aetherAppRuntime";
import { runCodeSandbox, buildCodeRunRequest } from "@/lib/code-sandbox/aetherCodeSandboxBridge";
import { listCodeRunRecords } from "@/lib/code-sandbox/codeSandboxWorkspaceBridge";
import type { CodeRunResult } from "@/lib/code-sandbox/codeRunRequestEngine";
import { CodeSandboxModeCard } from "./CodeSandboxModeCard";
import { CodeRunRequestPanel } from "./CodeRunRequestPanel";
import { CodeRunLogPanel } from "./CodeRunLogPanel";
import { CodeErrorSummaryPanel } from "./CodeErrorSummaryPanel";
import { CodeRepairSuggestionPanel } from "./CodeRepairSuggestionPanel";
import { CodePatchDraftPanel } from "./CodePatchDraftPanel";
import { CodeSandboxQaPanel } from "./CodeSandboxQaPanel";
import { CodeRunHistoryPanel } from "./CodeRunHistoryPanel";
import { CodeSandboxSafetyNote } from "./CodeSandboxSafetyNote";

export function CodeSandboxPanel() {
  const [appRecords, setAppRecords] = useState(() => listAppWorkspaceRecords());
  const [projectId, setProjectId] = useState<string | undefined>();
  const [idea, setIdea] = useState("做一个番茄钟网页，专注 25 分钟、休息 5 分钟。");
  const [mode, setMode] = useState<CodeSandboxMode>("STATIC_HTML_RUNNER");
  const [command, setCommand] = useState("");
  const [result, setResult] = useState<CodeRunResult | null>(null);
  const [history, setHistory] = useState(() => listCodeRunRecords());

  useEffect(() => {
    setAppRecords(listAppWorkspaceRecords());
    setHistory(listCodeRunRecords());
  }, []);

  const run = () => {
    const project = runAetherAppRuntime(idea, { saveToWorkspace: true }).project;
    setProjectId(project.projectId);
    const r = runCodeSandbox(project, { runnerMode: mode, requestedCommand: command || undefined, saveToWorkspace: true });
    setResult(r);
    setHistory(listCodeRunRecords());
  };

  const request = useMemo(() => {
    if (!result) return undefined;
    const project = appRecords.find(r => r.projectId === projectId);
    return project ? undefined : undefined; // request is shown indirectly via result
  }, [result, appRecords, projectId]);

  return (
    <div className="space-y-4">
      <div className="border border-border/40 rounded p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">App Idea · 选择或输入</div>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={2}
          className="w-full bg-background border border-border/40 rounded p-2 text-sm font-mono"
          placeholder="输入一个 App 想法..."
        />
        {appRecords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground">最近项目：</span>
            {appRecords.slice(0, 5).map((r) => (
              <button key={r.projectId} onClick={() => setIdea(r.summary)} className="px-2 py-0.5 text-[10px] border border-border/40 rounded hover:bg-muted/30">
                {r.projectName}
              </button>
            ))}
          </div>
        )}
      </div>

      <CodeSandboxModeCard selected={mode} onChange={setMode} />

      <div className="border border-border/40 rounded p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">命令（可选，v0.2 不真实执行）</div>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="例如：npm run build"
          className="w-full bg-background border border-border/40 rounded p-2 text-sm font-mono"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={run} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">运行代码沙箱</button>
          <button onClick={() => { setMode("STATIC_HTML_RUNNER"); run(); }} className="px-3 py-1.5 border border-border/40 rounded text-sm">Run Static HTML</button>
          <button onClick={() => { setMode("SIMULATED_BUILD_RUNNER"); run(); }} className="px-3 py-1.5 border border-border/40 rounded text-sm">Simulate Build</button>
          <button onClick={() => { setMode("EXTERNAL_CODEX_RUNNER"); run(); }} className="px-3 py-1.5 border border-border/40 rounded text-sm">Codex Pack</button>
          <button onClick={() => { setMode("EXTERNAL_CURSOR_RUNNER"); run(); }} className="px-3 py-1.5 border border-border/40 rounded text-sm">Cursor Pack</button>
        </div>
      </div>

      {!result && <CodeSandboxSafetyNote />}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="border border-border/40 rounded p-3 space-y-1 text-sm">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Run Result</div>
              <div className="text-base font-medium">{result.runId}</div>
              <div className="text-[11px] text-muted-foreground">project: {result.projectId} · runner: {result.runnerMode} · status: {result.status}</div>
              {result.versionImpact && <div className="text-[10px] text-muted-foreground">version impact: {result.versionImpact}</div>}
            </div>
            <CodeRunRequestPanel request={request} />
            <CodeRunLogPanel logs={result.logs} />
            <CodeErrorSummaryPanel error={result.errorSummary} />
            <CodeSandboxQaPanel qa={result.qaResult} />
          </div>
          <div className="space-y-3">
            <CodeRepairSuggestionPanel suggestions={result.repairSuggestions} />
            <CodePatchDraftPanel patches={result.patchDrafts} />
            {result.previewHtml && (
              <div className="border border-border/40 rounded overflow-hidden">
                <div className="px-3 py-1.5 bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">HTML Preview</div>
                <iframe sandbox="allow-scripts" srcDoc={result.previewHtml} className="w-full h-72 bg-white" title="code-sandbox-preview" />
              </div>
            )}
            {result.codexPack && (
              <div className="border border-border/40 rounded">
                <div className="px-3 py-1.5 bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Codex Repair Pack</div>
                <pre className="p-3 text-[10px] font-mono whitespace-pre-wrap max-h-72 overflow-auto">{result.codexPack.prompt}</pre>
              </div>
            )}
            {result.cursorPack && (
              <div className="border border-border/40 rounded p-3 text-[12px] space-y-1">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Cursor Repair Pack</div>
                <div className="text-[11px] text-muted-foreground">files: {result.cursorPack.fileContexts.length}</div>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  {result.cursorPack.repairNotes.map((n, i) => <li key={i}>· {n}</li>)}
                </ul>
              </div>
            )}
            <CodeSandboxSafetyNote />
          </div>
        </div>
      )}

      <CodeRunHistoryPanel records={history} />
    </div>
  );
}
