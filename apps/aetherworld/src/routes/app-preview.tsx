import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { runAetherAppRuntime } from "@/lib/app-runtime/aetherAppRuntime";
import { AppFileTreePanel } from "@/components/app-runtime/AppFileTreePanel";
import { AppCodeViewer } from "@/components/app-runtime/AppCodeViewer";
import { AppPreviewPanel } from "@/components/app-runtime/AppPreviewPanel";
import { AppQaPanel } from "@/components/app-runtime/AppQaPanel";

export const Route = createFileRoute("/app-preview")({
  head: () => ({ meta: [{ title: "App Preview · 应用预览" }, { name: "description", content: "左侧文件树、中间代码、右侧 HTML iframe 预览。" }] }),
  component: AppPreviewPage,
});

function AppPreviewPage() {
  const [idea, setIdea] = useState("做一个番茄钟网页，专注 25 分钟、休息 5 分钟。");
  const [result, setResult] = useState(() => runAetherAppRuntime(idea, { saveToWorkspace: false }));
  const [active, setActive] = useState<string | undefined>(result.project.codeFiles[0]?.path);

  const regen = () => {
    const r = runAetherAppRuntime(idea, { saveToWorkspace: false });
    setResult(r);
    setActive(r.project.codeFiles[0]?.path);
  };

  const file = result.project.codeFiles.find(f => f.path === active);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-3">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">App Preview</div>
        <h1 className="font-display text-2xl gold-text">应用预览</h1>
      </header>
      <div className="flex gap-2 items-center">
        <input value={idea} onChange={e => setIdea(e.target.value)} className="flex-1 bg-background border border-border/40 rounded px-2 py-1 text-sm" />
        <button onClick={regen} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">重生成预览</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-3">
          <AppFileTreePanel tree={result.project.fileTree} codeFiles={result.project.codeFiles} activePath={active} onSelect={setActive} />
        </div>
        <div className="lg:col-span-4"><AppCodeViewer file={file} /></div>
        <div className="lg:col-span-5 space-y-3">
          <AppPreviewPanel config={result.project.previewConfig} />
          <AppQaPanel qa={result.project.qaResult} />
        </div>
      </div>
    </div>
  );
}
