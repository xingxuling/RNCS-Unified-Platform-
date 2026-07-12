interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  examples?: { title: string; rawIdea: string }[];
  onPickExample?: (raw: string) => void;
}

export function AppIdeaInputPanel({ value, onChange, onSubmit, examples = [], onPickExample }: Props) {
  return (
    <div className="border border-border/40 rounded p-3 space-y-2 bg-card/40">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">App Idea · 应用想法</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-background border border-border/40 rounded p-2 text-sm font-mono"
        placeholder="例如：做一个番茄钟网页，专注 25 分钟、休息 5 分钟。"
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={onSubmit} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">生成 App Project</button>
        {examples.slice(0, 5).map((ex, i) => (
          <button key={i} onClick={() => onPickExample?.(ex.rawIdea)} className="px-2 py-1 text-[11px] border border-border/40 rounded hover:bg-muted/40">
            {ex.title}
          </button>
        ))}
      </div>
    </div>
  );
}
