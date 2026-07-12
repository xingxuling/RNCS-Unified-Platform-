import { SEQUENCE_AI_EXAMPLES } from "@/constants/sequence-ai/sequenceAIIntents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function SequenceAIInputBox({ value, onChange, onSubmit, loading }: Props) {
  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="比如：我现在该不该推进这个项目？／帮我生成今天的虚拟生活。／把这段歌词生成 Suno 提示词。"
        rows={4}
        className="resize-y"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
        }}
      />
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {SEQUENCE_AI_EXAMPLES.slice(0, 6).map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onChange(ex)}
              className="text-[11px] px-2 py-1 rounded border border-border/60 hover:bg-muted text-muted-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
        <Button onClick={onSubmit} disabled={loading || !value.trim()}>
          {loading ? "推理中…" : "提交 (⌘/Ctrl+Enter)"}
        </Button>
      </div>
    </div>
  );
}
