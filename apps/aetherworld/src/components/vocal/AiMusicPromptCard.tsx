import { useState } from "react";
import type { AIMusicPromptResult } from "@/lib/vocal/aiMusicPromptEngine";

export function AiMusicPromptCard({ data, platformName }: { data: AIMusicPromptResult; platformName: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Music Prompt · {platformName}</div>
        <button
          onClick={() => copy(data.copyReadyPrompt)}
          className="text-[11px] px-2 py-1 rounded border border-primary/40 hover:bg-primary/10"
        >
          {copied ? "已复制" : "复制 Prompt"}
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <Block label="Style" value={data.stylePrompt} />
        <Block label="Vocal" value={data.vocalPrompt} />
        <Block label="Arrangement" value={data.arrangementPrompt} />
        <Block label="Negative" value={data.negativePrompt} />
      </div>
      <details className="text-[11px]">
        <summary className="cursor-pointer text-muted-foreground">复制即用版（含段落标签）</summary>
        <pre className="mt-2 p-2 rounded bg-secondary/30 whitespace-pre-wrap font-mono text-[10px]">{data.copyReadyPrompt}</pre>
      </details>
      {data.sectionNotes.length > 0 && (
        <ul className="text-[11px] text-amber-500/80 list-disc list-inside">
          {data.sectionNotes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px]">{label}</div>
      <div className="font-mono text-[11px]">{value}</div>
    </div>
  );
}
