import { Button } from "@/components/ui/button";
import type { GeneratedAsset } from "@/lib/sequence-ai/sequenceAIResponseComposer";

interface Props {
  assets: GeneratedAsset[];
  exportOptions: string[];
}

function download(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function SequenceAIExportPanel({ assets, exportOptions }: Props) {
  if (!assets.length && !exportOptions.length) return null;
  const handleCopy = async (content: string) => {
    try { await navigator.clipboard.writeText(content); } catch { /* ignore */ }
  };
  const summary = assets.map((a) => `# ${a.title}\n\n${a.content}`).join("\n\n---\n\n");
  return (
    <div className="rounded-md border border-border/60 p-3 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">导出</div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" onClick={() => handleCopy(summary)} disabled={!assets.length}>复制全部</Button>
        <Button size="sm" variant="outline" onClick={() => download("sequence-ai.md", summary, "text/markdown")} disabled={!assets.length}>下载 Markdown</Button>
        <Button size="sm" variant="outline" onClick={() => download("sequence-ai.json", JSON.stringify(assets, null, 2), "application/json")} disabled={!assets.length}>下载 JSON</Button>
      </div>
      {exportOptions.length > 0 && (
        <div className="text-[11px] text-muted-foreground">可路由的导出目标：{exportOptions.join(" / ")}</div>
      )}
    </div>
  );
}
