import { useState } from "react";
import { runAetherAppRuntime, type AppRuntimeRunResult } from "@/lib/app-runtime/aetherAppRuntime";
import { APP_RUNTIME_EXAMPLES } from "@/lib/app-runtime/appExamplesRegistry";
import { AppIdeaInputPanel } from "./AppIdeaInputPanel";
import { AppRequirementPanel } from "./AppRequirementPanel";
import { AppArchitecturePanel } from "./AppArchitecturePanel";
import { AppFileTreePanel } from "./AppFileTreePanel";
import { AppCodeViewer } from "./AppCodeViewer";
import { AppPreviewPanel } from "./AppPreviewPanel";
import { AppQaPanel } from "./AppQaPanel";
import { AppExportPanel } from "./AppExportPanel";
import { AppHandoffPackPanel } from "./AppHandoffPackPanel";
import { AppRuntimeTracePanel } from "./AppRuntimeTracePanel";
import { AppRuntimeSafetyNote } from "./AppRuntimeSafetyNote";

const ROLE_CHAIN = ["Digital PM", "Digital Architect", "Digital Programmer", "Digital QA", "Digital Docs"];

export function AppRuntimePanel() {
  const [idea, setIdea] = useState("做一个番茄钟网页，专注 25 分钟、休息 5 分钟。");
  const [result, setResult] = useState<AppRuntimeRunResult | null>(null);
  const [activePath, setActivePath] = useState<string | undefined>();

  const run = () => {
    const r = runAetherAppRuntime(idea, { saveToWorkspace: true });
    setResult(r);
    setActivePath(r.project.codeFiles[0]?.path);
  };

  const project = result?.project;
  const activeFile = project?.codeFiles.find(f => f.path === activePath);

  return (
    <div className="space-y-4">
      <AppIdeaInputPanel
        value={idea}
        onChange={setIdea}
        onSubmit={run}
        examples={APP_RUNTIME_EXAMPLES.map(e => ({ title: e.title, rawIdea: e.rawIdea }))}
        onPickExample={(raw) => setIdea(raw)}
      />

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="text-muted-foreground">数字角色链：</span>
        {ROLE_CHAIN.map((r, i) => (
          <span key={i} className="px-2 py-0.5 border border-border/40 rounded">{r}{i < ROLE_CHAIN.length - 1 && " →"}</span>
        ))}
      </div>

      {!result && <AppRuntimeSafetyNote />}

      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-3 lg:col-span-1">
            <div className="border border-border/40 rounded p-3 text-sm space-y-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{project.appType} · {project.appRuntimeMode}</div>
              <div className="text-lg font-medium">{project.projectName}</div>
              <div className="text-[11px] text-muted-foreground">{project.intentSummary}</div>
              <div className="text-[10px] text-muted-foreground">status: {project.status} · qa: {project.qaResult?.status} · files: {project.codeFiles.length}</div>
            </div>
            <AppFileTreePanel tree={project.fileTree} codeFiles={project.codeFiles} activePath={activePath} onSelect={setActivePath} />
            <AppQaPanel qa={project.qaResult} />
            <AppRuntimeTracePanel trace={result!.trace} />
          </div>
          <div className="space-y-3 lg:col-span-1">
            <AppRequirementPanel req={project.requirement} />
            <AppArchitecturePanel arch={project.architecture} />
            <AppExportPanel packages={project.exportPackages} />
          </div>
          <div className="space-y-3 lg:col-span-1">
            <AppPreviewPanel config={project.previewConfig} />
            <AppCodeViewer file={activeFile} />
            <AppHandoffPackPanel packs={project.handoffPacks} />
            <AppRuntimeSafetyNote />
          </div>
        </div>
      )}
    </div>
  );
}
