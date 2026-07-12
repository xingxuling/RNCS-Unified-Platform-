import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COMPRESSION_LEVELS, type CompressionLevelId } from "@/constants/compression/compressionLevels";
import { OUTPUT_AUDIENCES, type OutputAudienceId } from "@/constants/compression/outputAudienceTypes";
import { COMPRESSED_OUTPUT_TEMPLATES, type CompressedOutputTemplateId } from "@/constants/compression/compressedOutputTemplates";
import { runHybridCompression, type HybridCompressionResult, auditCompression } from "@/lib/compression/hybridCompressionEngine";
import type { RawEngineOutput } from "@/lib/compression/blackBoxSignalExtractor";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { CompressedOutputCard } from "./CompressedOutputCard";
import { BlackBoxSignalCard } from "./BlackBoxSignalCard";
import { WhiteBoxStructureCard } from "./WhiteBoxStructureCard";
import { CompressedTraceView } from "./CompressedTraceView";
import { CompressionSafetyNote } from "./CompressionSafetyNote";
import { CompressionAuditPanel } from "./CompressionAuditPanel";

const PRESET_EXAMPLES: { label: string; raw: RawEngineOutput[]; goal: string; risk: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL"; template: CompressedOutputTemplateId; }[] = [
  {
    label: "示例 1｜将 Sequence AI 长输出压缩为普通用户版",
    template: "DECISION_OUTPUT", risk: "LOW", goal: "做出下一步决策",
    raw: [
      { engine: "SequenceAI", intent: "ANALYZE_OBJECT", conclusion: "当前系统缺少的不是新模块，而是输出压缩层。", signals: [{ name: "OUTPUT_OVERFLOW", strength: 0.82, confidence: 0.7, note: "多个引擎输出超出普通用户消化能力。" }], evidence: ["Sequence AI 输出已包含 6 段以上文本", "Free Input 输出未分层"], trace: ["SequenceAI", "FreeInput", "QA"], actions: ["运行 Hybrid Compression", "切换 PLAIN_USER 视图"] },
    ],
  },
  {
    label: "示例 2｜将 QA 表格压缩为发布建议",
    template: "QA_OUTPUT", risk: "MEDIUM", goal: "判断是否可发布",
    raw: [{ engine: "SoftwareQA", conclusion: "存在 2 条 HIGH、5 条 MEDIUM 问题。", signals: [{ name: "RELEASE_BLOCKER", strength: 0.7, confidence: 0.8 }], evidence: ["路由覆盖 92%", "Demo/Real 隔离审计通过"], actions: ["先修 HIGH", "再发布"] }],
  },
  {
    label: "示例 3｜将 MSL 解释压缩为一句话",
    template: "KNOWLEDGE_OUTPUT", risk: "LOW", goal: "理解数列含义",
    raw: [{ engine: "MSL", conclusion: "55555 表示风之结晶的高强度共振区块。", signals: [{ name: "WIND_CRYSTAL_BLOCK", strength: 0.9, confidence: 0.85 }], knowledgeRefs: ["MSL 区块定义"] }],
  },
  {
    label: "示例 4｜将世界引擎输出压缩为创作者版",
    template: "CREATION_OUTPUT", risk: "LOW", goal: "推进世界创作",
    raw: [{ engine: "SequenceWorld", conclusion: "生成北境冰原区域，NPC 风之祭司，关键事件「裂隙」。", evidence: ["区域 / NPC / 事件三联齐备"], actions: ["生成对应剧情种子", "导出 Godot"] }],
  },
  {
    label: "示例 5｜将剧情输出压缩为漫画脚本摘要",
    template: "NARRATIVE_OUTPUT", risk: "LOW", goal: "完成漫画脚本",
    raw: [{ engine: "Narrative", conclusion: "三幕结构，核心冲突为家族秘密与外部入侵的双线碰撞。", actions: ["按 3 页分镜"] }],
  },
  {
    label: "示例 6｜将声乐输出压缩为 Suno prompt",
    template: "VOCAL_OUTPUT", risk: "LOW", goal: "生成可用音乐 Prompt",
    raw: [{ engine: "Vocal", conclusion: "Mezzo / 80 BPM / Cinematic / Mandopop fusion。", actions: ["粘贴到 Suno"] }],
  },
  {
    label: "示例 7｜将知识引擎输出压缩为百科摘要",
    template: "KNOWLEDGE_OUTPUT", risk: "LOW", goal: "百科条目摘要",
    raw: [{ engine: "WorldKnowledge", conclusion: "Aether Fate Engine 是数列驱动的命运计算系统。", knowledgeRefs: ["ProductEncyclopedia"], evidence: ["主体数列", "MSL"] }],
  },
  {
    label: "示例 8｜将 Founder trace 压缩为系统审计报告",
    template: "DECISION_OUTPUT", risk: "HIGH", goal: "系统审计",
    raw: [{ engine: "SystemAudit", conclusion: "整体连通性良好，输出层缺压缩。", signals: [{ name: "COMPRESSION_LAYER_MISSING", strength: 0.88, confidence: 0.9 }], evidence: ["路由扫描", "隔离审计"], actions: ["接入 Hybrid Compression Engine"], riskLevel: "HIGH" }],
  },
];

export function HybridCompressionPanel() {
  const { active: founderActive } = useFounderState();
  const beginner = isBeginnerMode();
  const subjectMode: "DEMO" | "REAL" | "FOUNDER" = founderActive ? "FOUNDER" : "DEMO";

  const [exampleIdx, setExampleIdx] = useState(0);
  const [rawJson, setRawJson] = useState(JSON.stringify(PRESET_EXAMPLES[0].raw, null, 2));
  const [goal, setGoal] = useState(PRESET_EXAMPLES[0].goal);
  const [risk, setRisk] = useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">(PRESET_EXAMPLES[0].risk);
  const [template, setTemplate] = useState<CompressedOutputTemplateId>(PRESET_EXAMPLES[0].template);
  const [audience, setAudience] = useState<OutputAudienceId>(beginner ? "PLAIN_USER" : founderActive ? "FOUNDER_USER" : "STRUCTURED_USER");
  const [language, setLanguage] = useState("zh-CN");
  const [forceLevel, setForceLevel] = useState<CompressionLevelId | "">("");

  const [result, setResult] = useState<HybridCompressionResult | null>(null);
  const [error, setError] = useState<string>("");

  const audit = useMemo(() => result ? auditCompression(result.output, { riskLevel: risk, audience }) : null, [result, risk, audience]);

  const loadExample = (i: number) => {
    setExampleIdx(i);
    const ex = PRESET_EXAMPLES[i];
    setRawJson(JSON.stringify(ex.raw, null, 2));
    setGoal(ex.goal); setRisk(ex.risk); setTemplate(ex.template);
  };

  const compress = () => {
    setError("");
    try {
      const raws = JSON.parse(rawJson) as RawEngineOutput[];
      if (!Array.isArray(raws)) throw new Error("rawEngineOutputs 必须是数组。");
      const r = runHybridCompression({
        rawEngineOutputs: raws,
        userLevel: audience,
        targetModule: template,
        riskLevel: risk,
        outputGoal: goal,
        language,
        template,
        subjectMode,
      });
      if (forceLevel) r.plan.compressionLevel = forceLevel;
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  const copyMd = () => {
    if (!result) return;
    const o = result.output;
    const md = [
      `# ${o.title}`,
      `**压缩等级**：${o.compressionLevel} · **受众**：${o.audienceType}`,
      ``, o.plainConclusion, ``,
      `**原因**：${o.shortReason}`,
      o.keySignals?.length ? `\n## 黑箱信号\n` + o.keySignals.map(s => `- ${s}`).join("\n") : "",
      o.visibleEvidence?.length ? `\n## 白箱依据\n` + o.visibleEvidence.map(s => `- ${s}`).join("\n") : "",
      `\n## 下一步\n` + o.nextActions.map(s => `- ${s}`).join("\n"),
      `\n## 如何验证\n` + o.validationPoints.map(s => `- ${s}`).join("\n"),
      o.safetyNotes.length ? `\n## 安全说明\n` + o.safetyNotes.map(s => `- ${s}`).join("\n") : "",
    ].join("\n");
    navigator.clipboard?.writeText(md);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border/60 p-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EXAMPLES.map((p, i) => (
            <button key={i} onClick={() => loadExample(i)}
              className={`text-[11px] px-2.5 py-1 rounded border ${exampleIdx === i ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted"}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">原始引擎输出（JSON 数组）</label>
            <Textarea rows={10} value={rawJson} onChange={(e) => setRawJson(e.target.value)} className="font-mono text-xs mt-1" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">输出目标</label>
              <Textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} className="text-xs mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="space-y-1">
                <span className="text-[11px] uppercase text-muted-foreground">受众</span>
                <select className="w-full border border-border/60 rounded px-2 py-1 bg-background" value={audience} onChange={(e) => setAudience(e.target.value as OutputAudienceId)}>
                  {OUTPUT_AUDIENCES.map(a => <option key={a.id} value={a.id} disabled={a.id === "FOUNDER_USER" && !founderActive}>{a.label} · {a.en}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] uppercase text-muted-foreground">风险</span>
                <select className="w-full border border-border/60 rounded px-2 py-1 bg-background" value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)}>
                  {(["LOW","MEDIUM","HIGH","CRITICAL"] as const).map(r => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] uppercase text-muted-foreground">模板</span>
                <select className="w-full border border-border/60 rounded px-2 py-1 bg-background" value={template} onChange={(e) => setTemplate(e.target.value as CompressedOutputTemplateId)}>
                  {COMPRESSED_OUTPUT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label} · {t.en}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] uppercase text-muted-foreground">语言</span>
                <select className="w-full border border-border/60 rounded px-2 py-1 bg-background" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {["zh-CN","zh-TW","en","ja","ko","fr"].map(l => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className="space-y-1 col-span-2">
                <span className="text-[11px] uppercase text-muted-foreground">强制压缩等级（可选）</span>
                <select className="w-full border border-border/60 rounded px-2 py-1 bg-background" value={forceLevel} onChange={(e) => setForceLevel(e.target.value as CompressionLevelId | "")}>
                  <option value="">由规划器决定</option>
                  {COMPRESSION_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label} · {l.en}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={compress}>压缩</Button>
              <Button size="sm" variant="ghost" onClick={copyMd} disabled={!result}>复制 Markdown</Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </section>

      {result && (
        <div className="space-y-4">
          <CompressedOutputCard output={result.output} />
          <CompressionSafetyNote notes={result.output.safetyNotes} />
          {audit && <CompressionAuditPanel result={audit} />}

          {(audience !== "PLAIN_USER" || founderActive) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BlackBoxSignalCard signals={result.blackBoxSignals} />
              <WhiteBoxStructureCard wb={result.whiteBox} />
            </div>
          )}
          {(result.plan.showEngineTrace || founderActive) && (
            <CompressedTraceView trace={result.trace} />
          )}

          {founderActive && result.output.founderTrace && (
            <details className="rounded-md border border-border/60 p-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">Founder Trace（完整内部）</summary>
              <pre className="mt-2 overflow-auto text-[10px] leading-snug">{JSON.stringify(result.output.founderTrace, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
