import { listWebLlmModels } from "@/lib/webllm/webLlmModelRegistry";

export function WebLlmModelSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const models = listWebLlmModels();
  return (
    <div className="border border-border/40 rounded p-3 space-y-2">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Model · 模型</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border/40 rounded px-2 py-1 text-sm">
        {models.map((m) => (
          <option key={m.modelId} value={m.modelId}>
            {m.displayName}（{m.estimatedSize} · {m.recommendedDevice}）
          </option>
        ))}
      </select>
      <div className="text-[11px] text-muted-foreground">
        {models.find((m) => m.modelId === value)?.notes.join(" / ")}
      </div>
    </div>
  );
}
