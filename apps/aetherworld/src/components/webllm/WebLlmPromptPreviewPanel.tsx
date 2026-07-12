export function WebLlmPromptPreviewPanel({ promptPreview }: { promptPreview?: string }) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Prompt Preview · 提示预览</div>
      <pre className="text-[11px] whitespace-pre-wrap max-h-96 overflow-auto bg-muted/20 p-2 rounded border border-border/30">{promptPreview || "尚未生成。运行一次后此处显示编译后的 prompt。"}</pre>
    </div>
  );
}
