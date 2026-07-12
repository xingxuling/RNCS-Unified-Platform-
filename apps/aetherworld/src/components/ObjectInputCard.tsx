import { BREAKTHROUGH_OBJECT_TYPES } from "@/constants/breakthroughObjectTypes";
import { PRESET_EXAMPLES } from "@/lib/universalBreakthroughCalculus";

interface Props {
  text: string;
  onTextChange: (v: string) => void;
  objectTypeId: string;
  onObjectTypeChange: (v: string) => void;
  onRun: () => void;
  beginner: boolean;
}

export function ObjectInputCard({ text, onTextChange, objectTypeId, onObjectTypeChange, onRun, beginner }: Props) {
  return (
    <section className="aether-card-elevated p-5 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Step 1</div>
        <h2 className="font-display text-lg gold-text">{beginner ? "把你卡住的问题写下来" : "对象输入 · Object Input"}</h2>
        <p className="text-xs text-muted-foreground">
          {beginner
            ? "用一两句话说出你现在卡在哪里。系统会帮你拆成：卡在哪里、缺什么、先做哪一步、怎么验证。"
            : "输入任意现实对象或问题；可显式选择对象类型以提升识别精度。"}
        </p>
      </header>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        rows={5}
        placeholder="例如：用户看不懂我的产品怎么办？"
        className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {PRESET_EXAMPLES.map((p) => (
          <button key={p} onClick={() => onTextChange(p)}
            className="text-[11px] px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40">
            {p}
          </button>
        ))}
      </div>

      {!beginner && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-muted-foreground">对象类型</label>
          <select
            value={objectTypeId}
            onChange={(e) => onObjectTypeChange(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-sm"
          >
            <option value="">自动识别</option>
            {BREAKTHROUGH_OBJECT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.userFriendlyName} · {t.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={onRun}
        disabled={!text.trim()}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-40"
      >
        {beginner ? "一键拆解" : "运行万物破解"}
      </button>
    </section>
  );
}
