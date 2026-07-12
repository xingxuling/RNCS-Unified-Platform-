import { useMemo } from "react";
import { generatePatchPrompts } from "@/lib/text-dynamic/textPatchPromptGenerator";

export function TextPatchPromptCard() {
  const prompts = useMemo(() => generatePatchPrompts(), []);
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-display text-lg">修复提示词 · Patch Prompts</h2>
      {prompts.length === 0 ? (
        <div className="text-sm text-muted-foreground">当前没有需要修复的文本。</div>
      ) : (
        <ul className="space-y-3 text-sm">
          {prompts.slice(0, 12).map((p, i) => (
            <li key={i} className="rounded border border-border p-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{p.title}</div>
                <span className="text-[10px] px-2 py-0.5 rounded border border-border">{p.priority}</span>
              </div>
              <pre className="text-xs whitespace-pre-wrap mt-2 text-muted-foreground">{p.prompt}</pre>
              <div className="text-[10px] text-muted-foreground/80 mt-1">files: {p.affectedFiles.join(", ")}</div>
              <button onClick={() => navigator.clipboard?.writeText(p.prompt)}
                className="mt-2 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90">
                复制 Prompt
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
