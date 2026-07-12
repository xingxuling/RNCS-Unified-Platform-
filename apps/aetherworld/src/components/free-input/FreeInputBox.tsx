import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FREE_INPUT_EXAMPLES } from "@/constants/free-input/freeIntentTypes";
import { FREE_INPUT_QUICK_PROMPTS } from "@/constants/free-input/freeExampleInputs";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function FreeInputBox({ value, onChange, onSubmit, loading }: Props) {
  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="resize-y"
        placeholder="你可以直接说：我现在该怎么办 / 帮我写成提示词 / 解释这组数列 / 生成剧情 / 翻译成日文 / 检查系统缺口……"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSubmit();
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FREE_INPUT_QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(value ? `${value.replace(/[，,。]?\s*$/, "")}，${p}` : `${p}：`)}
              className="text-[11px] px-2 py-1 rounded border border-border/60 hover:bg-muted text-muted-foreground"
            >
              {p}
            </button>
          ))}
        </div>
        <Button onClick={onSubmit} disabled={loading || !value.trim()}>
          {loading ? "处理中…" : "提交 (⌘/Ctrl+Enter)"}
        </Button>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">查看 {FREE_INPUT_EXAMPLES.length} 个示例输入</summary>
        <div className="grid sm:grid-cols-2 gap-1 mt-2">
          {FREE_INPUT_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onChange(ex)}
              className="text-left text-[11px] px-2 py-1 rounded hover:bg-muted text-muted-foreground"
            >
              · {ex}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
