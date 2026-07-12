import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { forgePrompt, loadPromptHistory, savePromptHistory, type PromptHistoryItem } from "@/lib/promptCalculus";
import { PROMPT_STAGES, PROMPT_TARGETS, type PromptStage, type PromptTarget, PROMPT_TYPES } from "@/constants/promptTypes";
import { GEO_PRESETS } from "@/constants/geoFactors";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Copy, History, Save, CheckCircle2 } from "lucide-react";
import { purifySignal, DEFAULT_SIGNAL_INPUT } from "@/lib/signalPurification";
import { foldDomains, DEFAULT_DOMAIN_SCORES } from "@/lib/domainFolding";
import { evaluateBranch, DEFAULT_BRANCHES } from "@/lib/branchCollapse";
import { evaluateVitality, DEFAULT_VITALITY } from "@/lib/productVitality";
import { evaluateGeo } from "@/lib/geoFactor";
import { deriveFromKernel, determine } from "@/lib/determinantNumber";
import { DeterminationCard } from "@/components/DeterminationCard";
import { useAetherData } from "@/lib/useAetherData";
import { SafetyBoundaryBanner } from "@/components/SafetyBoundaryBanner";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";
import { getSequenceMode } from "@/lib/realSubjectStore";

export const Route = createFileRoute("/prompt-forge")({ component: PromptForge });

function PromptForge() {
  const [target, setTarget] = useState<PromptTarget>("Lovable");
  const [stage, setStage] = useState<PromptStage>("Internal Test");
  const [productLogic, setProductLogic] = useState("Aether Fate Engine：以 0–9 常数、五位数列、五域断事与多计算法构建的结构触发预测 OS。用户可输入主体、问题、对象、地点，系统输出强触发日、行动许可与可执行下一步。");
  const [question, setQuestion] = useState("判断 Aether Fate Engine 是否适合在香港先做内测，并生成下一轮 Lovable 提示词。");
  const [geoKey, setGeoKey] = useState<string>("hk");
  const [vitalityScore, setVitalityScore] = useState(82);
  const [constantScore, setConstantScore] = useState(84);
  const [signalPermission, setSignalPermission] = useState<"YES" | "CAUTION" | "NO">("YES");
  const [intent, setIntent] = useState(8);
  const [noise, setNoise] = useState(3);
  const [scopeDrift, setScopeDrift] = useState(4);
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setHistory(loadPromptHistory()); }, []);

  const { feedback } = useAetherData();

  // 计算定数态：以默认内核 + 当前地理 + 信号许可态
  const determination = useMemo(() => {
    const signal = purifySignal({
      ...DEFAULT_SIGNAL_INPUT,
      externalNoise: noise,
    });
    const folding = foldDomains(DEFAULT_DOMAIN_SCORES);
    const branch = DEFAULT_BRANCHES.map(evaluateBranch).sort((a, b) => b.total - a.total)[0];
    const vitality = evaluateVitality(DEFAULT_VITALITY);
    const geo = evaluateGeo(geoKey, stage);
    return determine(deriveFromKernel({ signal, folding, branch, vitality, geo, feedback }));
  }, [geoKey, stage, noise, feedback]);

  const result = useMemo(() => forgePrompt({
    target, stage, productLogic, currentQuestion: question, geoKey,
    vitalityScore, constantScore, signalPermission,
    intentClarity: intent, noise, scopeDrift,
    determinationStatus: determination.status,
    determinationScore: determination.determinationScore,
  }), [target, stage, productLogic, question, geoKey, vitalityScore, constantScore, signalPermission, intent, noise, scopeDrift, determination]);

  const copy = async () => {
    await navigator.clipboard.writeText(result.finalPrompt);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const save = () => {
    const item: PromptHistoryItem = {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      target, stage, type: result.types, question,
      power: result.power, prompt: result.finalPrompt,
    };
    const next = [...history, item];
    savePromptHistory(next); setHistory(next);
  };
  const toggleEffective = (id: string) => {
    const next = history.map((h) => h.id === id ? { ...h, effective: !h.effective } : h);
    savePromptHistory(next); setHistory(next);
  };

  const mode = typeof window !== "undefined" ? getSequenceMode() : "DEMO";

  return (
    <>
      <PageHeader
        caption="Prompt Forge · 提示词锻造炉"
        title="基于预测内核的提示词计算"
        subtitle="提示词强度 = 产品逻辑 × 外界常数 × 实时判断 × 产品活性 × 地理因素 ÷ 噪声 ÷ 范围漂移。"
      />
      <div className="px-6 md:px-10 pt-6">
        <SafetyBoundaryBanner page="Prompt Forge" subjectMode={mode} forceLevel="MEDIUM" />
      </div>
      <div className="p-6 md:p-10 grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="xl:col-span-2 aether-card p-5 space-y-4">
          <Row label="目标工具">
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_TARGETS.map((t) => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`text-[11px] px-2 py-1 rounded border ${target === t ? "border-primary/60 text-primary" : "border-border/60"}`}>{t}</button>
              ))}
            </div>
          </Row>
          <Row label="产品阶段">
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_STAGES.map((s) => (
                <button key={s} onClick={() => setStage(s)}
                  className={`text-[11px] px-2 py-1 rounded border ${stage === s ? "border-primary/60 text-primary" : "border-border/60"}`}>{s}</button>
              ))}
            </div>
          </Row>
          <Row label="目标市场">
            <div className="flex flex-wrap gap-1.5">
              {GEO_PRESETS.map((g) => (
                <button key={g.key} onClick={() => setGeoKey(g.key)}
                  className={`text-[11px] px-2 py-1 rounded border ${geoKey === g.key ? "border-primary/60 text-primary" : "border-border/60"}`}>{g.name}</button>
              ))}
            </div>
          </Row>
          <Row label="信号许可">
            <div className="flex gap-1.5">
              {(["YES","CAUTION","NO"] as const).map((p) => (
                <button key={p} onClick={() => setSignalPermission(p)}
                  className={`text-[11px] px-2 py-1 rounded border ${signalPermission === p ? "border-primary/60 text-primary" : "border-border/60"}`}>{p}</button>
              ))}
            </div>
          </Row>
          <div>
            <div className="text-sm mb-1">产品逻辑</div>
            <Textarea rows={4} value={productLogic} onChange={(e) => setProductLogic(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">当前问题 / 目标</div>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
          </div>
          <SliderRow label="常数价值分" v={constantScore} set={setConstantScore} max={100} />
          <SliderRow label="产品活性分" v={vitalityScore} set={setVitalityScore} max={100} />
          <SliderRow label="意图清晰度" v={intent} set={setIntent} max={10} />
          <SliderRow label="噪声" v={noise} set={setNoise} max={10} />
          <SliderRow label="范围漂移" v={scopeDrift} set={setScopeDrift} max={10} />
        </div>

        {/* Output */}
        <div className="xl:col-span-3 space-y-4">
          <DeterminationCard result={determination} compact caption="Determinant Number" title="本轮定数判断" />
          <div className="aether-card-elevated p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Prompt Power</div>
                <div className="font-display text-3xl gold-text mt-1">{result.power}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.types.map((k) => (
                    <span key={k} className="text-[10px] px-2 py-0.5 rounded border border-primary/40 text-primary">
                      {PROMPT_TYPES.find(p => p.key === k)?.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={copy} className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:border-primary/40 flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />{copied ? "已复制" : "复制"}
                </button>
                <button onClick={save} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />存档
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-1">
              <div><span className="text-primary/80">范围边界：</span>{result.scopeBoundary}</div>
              <div><span className="text-primary/80">风险：</span>{result.riskWarning}</div>
            </div>
          </div>

          <pre className="aether-card p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">{result.finalPrompt}</pre>

          <div className="aether-card p-5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <div className="font-display text-base gold-text">提示词历史</div>
              <div className="text-[10px] text-muted-foreground ml-2">共 {history.length} 条</div>
            </div>
            <div className="mt-3 space-y-2 max-h-72 overflow-auto">
              {history.length === 0 && <div className="text-xs text-muted-foreground">尚无历史。生成后点击「存档」保存。</div>}
              {[...history].reverse().map((h) => (
                <div key={h.id} className="rounded-md border border-border/60 p-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="font-mono text-muted-foreground">{new Date(h.createdAt).toLocaleString("zh-CN")}</div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-muted/30">{h.target}</span>
                      <span className="font-mono">{h.power}</span>
                      <button onClick={() => toggleEffective(h.id)} className={`flex items-center gap-1 ${h.effective ? "text-trigger-high" : "text-muted-foreground"}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />{h.effective ? "有效" : "标记有效"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-1">{h.question}</div>
                </div>
              ))}
            </div>
          </div>

          <FeedbackEntryCard title="快速回验 · Prompt 效果" detailLink="/feedback" />
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}
function SliderRow({ label, v, set, max }: { label: string; v: number; set: (n: number) => void; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{v}/{max}</span>
      </div>
      <Slider min={0} max={max} step={1} value={[v]} onValueChange={(x) => set(x[0])} />
    </div>
  );
}
