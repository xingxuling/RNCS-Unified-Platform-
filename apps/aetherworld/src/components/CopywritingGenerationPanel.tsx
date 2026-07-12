import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COPYWRITING_TARGETS } from "@/constants/copywritingTargets";
import { COPYWRITING_CHANNELS } from "@/constants/copywritingChannels";
import { COPY_LANGUAGE_LEVELS } from "@/constants/copyLanguageLevels";
import { generateCopy, type CopyGenerationResult } from "@/lib/copywritingGenerationCalculus";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

const USER_TYPES = ["Demo Visitor", "Light User", "Full User", "Creator", "Enterprise", "Founder"];
const HISTORY_KEY = "copyGenerationHistory";

export function CopywritingGenerationPanel() {
  const [target, setTarget] = useState("HOMEPAGE_HERO");
  const [user, setUser] = useState("Light User");
  const [channel, setChannel] = useState("WEBSITE");
  const [level, setLevel] = useState("BEGINNER");
  const [concepts, setConcepts] = useState("个人世界、信号、回验");
  const [length, setLength] = useState<"MICRO" | "SHORT" | "MEDIUM" | "LONG">("SHORT");
  const [includeCTA, setIncludeCTA] = useState(true);
  const [result, setResult] = useState<CopyGenerationResult | null>(null);

  const handle = () => {
    const r = generateCopy({
      target, targetUser: user, channel, languageLevel: level,
      sourceConcepts: concepts.split(/[,，、\s]+/).filter(Boolean),
      safetyLevel: "MEDIUM", desiredLength: length, includeCTA,
    });
    setResult(r);
    try {
      const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      hist.unshift({ target, channel, at: new Date().toISOString() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 30)));
    } catch { /* quota */ }
  };

  const copyText = (t: string) => { navigator.clipboard.writeText(t); toast.success("已复制"); };

  return (
    <div className="space-y-4">
      <div className="aether-card-elevated p-5 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Copy Generator · 文案生成</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Field label="目标">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={target} onChange={e => setTarget(e.target.value)}>
              {COPYWRITING_TARGETS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="目标用户">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={user} onChange={e => setUser(e.target.value)}>
              {USER_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="渠道">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={channel} onChange={e => setChannel(e.target.value)}>
              {COPYWRITING_CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="语言层级">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={level} onChange={e => setLevel(e.target.value)}>
              {COPY_LANGUAGE_LEVELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="长度">
            <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm"
              value={length} onChange={e => setLength(e.target.value as any)}>
              {["MICRO", "SHORT", "MEDIUM", "LONG"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="包含 CTA">
            <label className="flex items-center gap-2 text-sm h-9">
              <input type="checkbox" checked={includeCTA} onChange={e => setIncludeCTA(e.target.checked)} />
              <span className="text-muted-foreground">追加行动召唤</span>
            </label>
          </Field>
        </div>
        <Field label="来源概念（逗号分隔）">
          <Textarea value={concepts} onChange={e => setConcepts(e.target.value)} rows={2} />
        </Field>
        <Button onClick={handle}><Wand2 className="w-3.5 h-3.5 mr-1" />生成 3 个版本</Button>
      </div>

      {result && (
        <>
          <div className="aether-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Metric label="平台适配分" value={`${result.platformFitScore}/100`} />
            <Metric label="术语风险" value={`${result.jargonRisk}/100`} accent={result.jargonRisk > 40} />
            <Metric label="安全告警" value={String(result.safetyWarnings.length)} accent={result.safetyWarnings.length > 0} />
            <Metric label="推荐版本" value={result.recommendedVariantId.split("-").slice(0, 2).join("-")} />
          </div>

          {result.safetyWarnings.length > 0 && (
            <div className="aether-card p-4 border-l-2 border-rose-500/50">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 mb-2">Copy Safety · 安全检查</div>
              <ul className="text-xs space-y-1">
                {result.safetyWarnings.map(w => <li key={w} className="text-rose-300">⚠ {w}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {result.variants.map(v => (
              <div key={v.id} className={`aether-card-elevated p-4 ${v.id === result.recommendedVariantId ? "border border-primary/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">{v.style}</div>
                  {v.id === result.recommendedVariantId && <span className="text-[10px] text-primary">推荐</span>}
                </div>
                {v.title && <div className="font-display text-lg gold-text mt-1">{v.title}</div>}
                <p className="text-sm text-foreground/95 mt-2 whitespace-pre-line leading-relaxed">{v.body}</p>
                {v.safetyNote && <div className="text-[10px] text-amber-400/80 mt-2">{v.safetyNote}</div>}
                <Button size="sm" variant="outline" className="mt-3"
                  onClick={() => copyText(`${v.title ? v.title + "\n\n" : ""}${v.body}${v.safetyNote ? "\n\n" + v.safetyNote : ""}`)}>
                  <Copy className="w-3.5 h-3.5 mr-1" />复制
                </Button>
              </div>
            ))}
          </div>

          {(result.suggestedTags || result.suggestedCTA) && (
            <div className="aether-card p-4 text-xs">
              {result.suggestedCTA && <div className="mb-2">建议 CTA：<span className="text-primary">{result.suggestedCTA}</span></div>}
              {result.suggestedTags && <div>建议标签：{result.suggestedTags.join(" ")}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${accent ? "text-amber-400" : "text-foreground/90"}`}>{value}</div>
    </div>
  );
}
