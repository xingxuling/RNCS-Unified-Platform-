import type { AppPreviewConfig } from "@/lib/app-runtime/appProjectObjectEngine";

export function AppPreviewPanel({ config }: { config?: AppPreviewConfig }) {
  if (!config) return <div className="border border-border/40 rounded p-3 text-sm text-muted-foreground">尚未生成预览</div>;
  return (
    <div className="border border-border/40 rounded overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/30 text-[11px] flex justify-between">
        <span>Preview · {config.previewMode}</span>
        <span className="font-mono text-muted-foreground">{config.entryFile}</span>
      </div>
      {config.previewMode === "IFRAME_HTML" && config.previewHtml ? (
        <iframe
          title="App Preview"
          sandbox="allow-scripts"
          srcDoc={config.previewHtml}
          className="w-full h-[420px] bg-white"
        />
      ) : (
        <div className="p-3 text-[12px] text-muted-foreground space-y-1">
          <div>当前模式不支持 iframe 预览。请使用代码视图，或通过 Handoff Pack 在 Codex / Cursor / Lovable 继续运行。</div>
          <ul className="list-disc pl-4 text-[11px]">{config.limitations.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
