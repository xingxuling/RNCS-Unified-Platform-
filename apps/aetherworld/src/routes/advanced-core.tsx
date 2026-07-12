import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DomainFoldingRadar } from "@/components/DomainFoldingRadar";
import { ReboundGauge } from "@/components/ReboundGauge";
import { foldDomains, DEFAULT_DOMAIN_SCORES, type DomainScoresMap } from "@/lib/domainFolding";
import { FOLD_DOMAINS, type FoldDomainKey } from "@/constants/domainFactors";
import { computeRebound, DEFAULT_REBOUND_INPUT, REBOUND_CATEGORIES, type ReboundInput } from "@/lib/pressureRebound";
import { evaluateConstantValue, DEFAULT_CONSTANT_SCORES, CONSTANT_DIMS, type ConstantScores } from "@/lib/constantValueEngine";
import { Slider } from "@/components/ui/slider";
import {
  ShieldCheck, Layers, Activity, Radio, GitBranch,
  Hash, Sparkles, MapPin, Wand2, CircleDot,
} from "lucide-react";
import { purifySignal, DEFAULT_SIGNAL_INPUT } from "@/lib/signalPurification";
import { evaluateBranch, DEFAULT_BRANCHES } from "@/lib/branchCollapse";
import { evaluateVitality, DEFAULT_VITALITY } from "@/lib/productVitality";
import { evaluateGeo } from "@/lib/geoFactor";
import { deriveFromKernel, determine } from "@/lib/determinantNumber";
import { DeterminationCard } from "@/components/DeterminationCard";
import { useAetherData } from "@/lib/useAetherData";

export const Route = createFileRoute("/advanced-core")({ component: AdvancedCore });

const MODULES = [
  { url: "/signal",          name: "信号净化",   en: "Signal Purification",   Icon: ShieldCheck, desc: "判断输入是否真信号；决定是否入模。" },
  { url: "/advanced-core",   name: "折域计算",   en: "Domain Folding",        Icon: Layers,      desc: "多域是否同向收束，是否具备显化条件。" },
  { url: "/advanced-core",   name: "反冲计算",   en: "Pressure Rebound",      Icon: Activity,    desc: "长期压制变量何时反向显化。" },
  { url: "/resonance",       name: "共振锁定",   en: "Resonance Lock",        Icon: Radio,       desc: "对象/人/项目是否与主体共振锁定。" },
  { url: "/branch-collapse", name: "分支塌缩",   en: "Branch Collapse",       Icon: GitBranch,   desc: "多条未来分支的塌缩状态与阻断因子。" },
  { url: "/advanced-core",   name: "常数价值",   en: "Constant Value",        Icon: Hash,        desc: "用 0–9 九维评估方法/产品/关系。" },
  { url: "/vitality",        name: "产品活性",   en: "Product Vitality",      Icon: Sparkles,    desc: "判断产品是否有生命力。" },
  { url: "/geo",             name: "地理因素",   en: "Geo-Factor",            Icon: MapPin,      desc: "地区/制度/市场对事件的修正。" },
  { url: "/prompt-forge",    name: "提示词计算", en: "Prompt Calculus",       Icon: Wand2,       desc: "根据所有计算结果生成可执行提示词。" },
  { url: "/advanced-core",   name: "定数计算",   en: "Determinant Number",    Icon: CircleDot,   desc: "收束所有计算法，输出未定 / 半定 / 已定 / 反定 / 假定。" },
];

const FLOW = [
  "输入：主体 / 问题 / 时间 / 对象 / 地点",
  "信号净化 · 决定是否入模",
  "常数价值 · 评估对象本身",
  "抽散扫描 · 找强触发日",
  "折域计算 · 多域是否同向",
  "反冲计算 · 是否存在蓄压反弹",
  "共振锁定 · 是否与对象形成锁定",
  "分支塌缩 · 哪条未来正在显化",
  "产品活性 / 地理因素 · 修正",
  "定数计算 · 收束为 未定 / 半定 / 接近 / 已定 / 反定 / 假定",
  "行动许可 · 进 / 守 / 转 / 断 / 等待 / 补证 / 观察 / 封存",
  "提示词计算 · 输出可执行下一步",
  "回验 · 修正模型权重",
];

function AdvancedCore() {
  // Folding
  const [domainScores, setDomainScores] = useState<DomainScoresMap>(DEFAULT_DOMAIN_SCORES);
  const folding = useMemo(() => foldDomains(domainScores), [domainScores]);

  // Rebound
  const [rebound, setRebound] = useState<ReboundInput>(DEFAULT_REBOUND_INPUT);
  const reboundResult = useMemo(() => computeRebound(rebound), [rebound]);

  // Constant
  const [constants, setConstants] = useState<ConstantScores>(DEFAULT_CONSTANT_SCORES);
  const constResult = useMemo(() => evaluateConstantValue(constants), [constants]);

  // Determinant Number：基于当前内核滑块 + 默认信号 / 分支 / 活性 / 地理 + 回验
  const { feedback } = useAetherData();
  const determination = useMemo(() => {
    const signal = purifySignal(DEFAULT_SIGNAL_INPUT);
    const branch = DEFAULT_BRANCHES.map(evaluateBranch).sort((a, b) => b.total - a.total)[0];
    const vitality = evaluateVitality(DEFAULT_VITALITY);
    const geo = evaluateGeo("hk", "Internal Test");
    return determine(deriveFromKernel({ signal, folding, branch, vitality, geo, feedback }));
  }, [folding, feedback]);

  return (
    <>
      <PageHeader
        caption="Advanced Core · 高级内核"
        title="多计算法预测内核"
        subtitle="Aether Fate Engine v0.2 · Multi-Calculus Prediction Core — 9 个计算法被统一接入预测操作系统的主流程。"
      />
      <div className="p-6 md:p-10 space-y-10">
        <section>
          <SectionTitle title="计算法目录" caption="9 Engines" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((m, i) => (
              <Link key={i} to={m.url} className="aether-card p-4 hover:border-primary/40 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md aether-card-elevated flex items-center justify-center">
                    <m.Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground tracking-wider">{m.en}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">{m.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Domain Folding */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 aether-card p-5">
            <SectionTitle title="折域计算" caption="Domain Folding" />
            <div className="space-y-3 mt-3">
              {FOLD_DOMAINS.map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-xs">
                    <span>{d.name}{d.isNegative && <span className="text-destructive/70 ml-1">(逆)</span>}</span>
                    <span className="font-mono text-muted-foreground">{domainScores[d.key]}</span>
                  </div>
                  <Slider min={0} max={100} step={1} value={[domainScores[d.key]]}
                    onValueChange={(x) => setDomainScores({ ...domainScores, [d.key as FoldDomainKey]: x[0] })} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 aether-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Domain Folding Index</div>
                <div className="font-display text-3xl gold-text mt-1">{folding.index}</div>
                <div className="text-sm mt-1">{folding.verdict}</div>
              </div>
              <DomainFoldingRadar scores={domainScores} size={220} />
            </div>
            <div className="gold-divider my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <Info label="同向域" items={folding.aligned.map(k => FOLD_DOMAINS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="good" />
              <Info label="冲突域" items={folding.conflicting.map(k => FOLD_DOMAINS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="bad" />
              <Info label="缺失域" items={folding.missing.map(k => FOLD_DOMAINS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="warn" />
            </div>
          </div>
        </section>

        {/* Rebound */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 aether-card p-5">
            <SectionTitle title="反冲计算" caption="Pressure Rebound" />
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs mb-1">反冲类型</div>
                <div className="flex flex-wrap gap-1.5">
                  {REBOUND_CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setRebound({ ...rebound, category: c.key })}
                      className={`text-[10px] px-2 py-1 rounded border ${rebound.category === c.key ? "border-primary/60 text-primary" : "border-border/60"}`}>{c.name}</button>
                  ))}
                </div>
              </div>
              {([
                ["pressureLevel","压制强度",10],
                ["durationMonths","压制时长(月)",36],
                ["subjectNeed","主体需求",10],
                ["dampingDrop","阻尼下降",10],
                ["capacity","当前承载",10],
                ["noiseLeak","噪声泄漏",10],
                ["overloadRisk","过载风险",10],
              ] as const).map(([k,n,mx]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs">
                    <span>{n}</span><span className="font-mono text-muted-foreground">{rebound[k]}/{mx}</span>
                  </div>
                  <Slider min={0} max={mx} step={1} value={[rebound[k] as number]}
                    onValueChange={(x) => setRebound({ ...rebound, [k]: x[0] })} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <ReboundGauge result={reboundResult} label={REBOUND_CATEGORIES.find(c=>c.key===rebound.category)?.name} />
          </div>
        </section>

        {/* Constant Value */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 aether-card p-5">
            <SectionTitle title="常数价值评估" caption="Constant Value" />
            <div className="mt-3 space-y-3">
              {CONSTANT_DIMS.map((d) => (
                <div key={d.key}>
                  <div className="flex justify-between text-xs">
                    <span>{d.digit} · {d.name}</span>
                    <span className="font-mono text-muted-foreground">{constants[d.key]}/10</span>
                  </div>
                  <Slider min={0} max={10} step={1} value={[constants[d.key]]}
                    onValueChange={(x) => setConstants({ ...constants, [d.key]: x[0] })} />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 aether-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Constant Value</div>
                <div className="font-display text-3xl gold-text mt-1">{constResult.total}</div>
                <div className="text-sm mt-1">建议：<span className="text-primary">{constResult.recommendation}</span> · {constResult.worthPursuing ? "值得推进" : "暂不推进"}</div>
              </div>
            </div>
            <div className="gold-divider my-4" />
            <div className="grid grid-cols-9 gap-1.5">
              {CONSTANT_DIMS.map((d) => {
                const v = constants[d.key];
                return (
                  <div key={d.key} className="rounded bg-muted/20 p-2 text-center">
                    <div className="text-[10px] text-muted-foreground">{d.digit}</div>
                    <div className="text-[10px]">{d.name}</div>
                    <div className="font-mono text-sm mt-1">{v}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <Info label="优势常数" items={constResult.advantages.map(k=>CONSTANT_DIMS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="good" />
              <Info label="缺失常数" items={constResult.missing.map(k=>CONSTANT_DIMS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="warn" />
              <Info label="风险常数" items={constResult.risks.map(k=>CONSTANT_DIMS.find(d=>d.key===k)?.name).filter(Boolean) as string[]} tone="bad" />
            </div>
          </div>
        </section>

        {/* Determinant Number */}
        <section>
          <SectionTitle title="定数计算法" caption="Determinant Number Engine" />
          <DeterminationCard result={determination} caption="Kernel Determinant" title="多计算法综合定数" />
          <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
            定数计算法不再生成新预测，它收束信号 / 折域 / 分支 / 共振 / 活性 / 地理 / 回验，输出最终状态与最终动作。
            当前内核滑块（折域）会实时影响定数结果。
          </div>
        </section>


        <section>
          <SectionTitle title="升级后的预测总流程" caption="Kernel Flow" />
          <ol className="aether-card p-5 space-y-2">
            {FLOW.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="font-mono text-xs text-primary w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="aether-card p-5 text-xs text-muted-foreground">
          系统边界：所有计算法输出概率与结构，而非绝对未来；不替代医疗 / 法律 / 金融 / 心理诊断；
          所有预测都必须有回验入口；Demo Persona 与真实主体分离。
        </section>
      </div>
    </>
  );
}

function SectionTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{caption}</div>
      <div className="font-display text-xl gold-text">{title}</div>
    </div>
  );
}

function Info({ label, items, tone }: { label: string; items: string[]; tone: "good" | "bad" | "warn" }) {
  const color = tone === "good" ? "text-trigger-high" : tone === "bad" ? "text-destructive" : "text-trigger-mid";
  return (
    <div className="rounded-md bg-muted/10 p-3">
      <div className={`text-[10px] tracking-wider ${color}`}>{label}</div>
      <div className="mt-1 text-muted-foreground">{items.length ? items.join(" · ") : "—"}</div>
    </div>
  );
}
