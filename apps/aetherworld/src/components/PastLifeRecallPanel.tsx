import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Brain, Save, Plus, Trash2, Globe2 } from "lucide-react";
import { RecallSafetyNote } from "./RecallSafetyNote";
import { SubconsciousFragmentInput } from "./SubconsciousFragmentInput";
import { RecallSignalMap } from "./RecallSignalMap";
import { ArchetypalMemoryCard } from "./ArchetypalMemoryCard";
import { SymbolicMemoryMatrix } from "./SymbolicMemoryMatrix";
import { ContaminationRiskPanel } from "./ContaminationRiskPanel";
import { RecallValidationChecklist } from "./RecallValidationChecklist";
import { DreamFragmentTimeline } from "./DreamFragmentTimeline";
import { RecallNarrativeReport } from "./RecallNarrativeReport";
import {
  analyzeRecallFragment,
  type RecallFragment,
} from "@/lib/pastLifeRecallCalculus";
import {
  createBlankFragment,
  listFragments,
  saveFragment,
  deleteFragment,
} from "@/lib/subconsciousRecallEngine";
import { detectMemoryContamination } from "@/lib/memoryContaminationDetector";
import { validateRecall } from "@/lib/recallValidationEngine";
import { getActiveSubjectId } from "@/lib/store";
import { DEMO_SUBJECT } from "@/lib/demoPersona";

interface Props {
  variant?: "advanced" | "beginner" | "founder";
}

export function PastLifeRecallPanel({ variant = "advanced" }: Props) {
  const [mode, setMode] = useState<"DEMO" | "REAL">("DEMO");
  const [list, setList] = useState<RecallFragment[]>([]);
  const [current, setCurrent] = useState<RecallFragment>(() => createBlankFragment());

  useEffect(() => {
    const active = getActiveSubjectId();
    setMode(active === DEMO_SUBJECT.id ? "DEMO" : "REAL");
  }, []);

  useEffect(() => { setList(listFragments(mode)); }, [mode]);

  const result = useMemo(() => analyzeRecallFragment(current), [current]);
  const contamination = useMemo(() => detectMemoryContamination(current), [current]);
  const validation = useMemo(() => validateRecall(current), [current]);

  const onSave = () => {
    const toSave: RecallFragment = { ...current, createdAt: current.createdAt || new Date().toISOString() };
    saveFragment(mode, toSave);
    setList(listFragments(mode));
  };

  const onNew = () => setCurrent(createBlankFragment());
  const onDelete = (id: string) => {
    deleteFragment(mode, id);
    setList(listFragments(mode));
  };
  const onSelect = (f: RecallFragment) => setCurrent(f);

  const title = variant === "founder"
    ? "Past-Life Memory & Subconscious Recall Calculus"
    : variant === "beginner"
      ? "深层记忆记录"
      : "前世感记忆 · 潜意识调用";

  const subtitle = variant === "beginner"
    ? "记录梦境、既视感、反复出现的画面与符号，作为自我观察与创作素材。"
    : "把前世感 / 梦境 / 既视感 / 原型经验作为可记录、可分析、可回验的深层材料。";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <Brain className="w-3.5 h-3.5" />
          Subconscious Recall · 潜意识调用
        </div>
        <h1 className="text-2xl md:text-3xl font-display gold-text">{title}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">{subtitle}</p>
        <div className="text-[11px] text-muted-foreground">
          当前数据隔离：<span className="text-foreground">{mode === "DEMO" ? "Demo 演示" : "Real 真实主体"}</span>
          {mode === "REAL" && (
            <span className="ml-2 text-amber-300">· Full 60 隐私提醒：本地保存，不外传。</span>
          )}
        </div>
      </header>

      <RecallSafetyNote />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SubconsciousFragmentInput value={current} onChange={setCurrent} />
          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="text-xs px-3 py-1.5 rounded bg-primary/30 hover:bg-primary/40 flex items-center gap-1">
              <Save className="w-3.5 h-3.5" /> 保存到{mode}
            </button>
            <button onClick={onNew} className="text-xs px-3 py-1.5 rounded bg-background/60 hover:bg-background/80 border border-border/40 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> 新建
            </button>
            {current.id && (
              <button onClick={() => onDelete(current.id)} className="text-xs px-3 py-1.5 rounded bg-background/60 hover:bg-background/80 border border-border/40 flex items-center gap-1 text-muted-foreground">
                <Trash2 className="w-3.5 h-3.5" /> 删除当前
              </button>
            )}
            <Link to="/virtual-world" className="text-xs px-3 py-1.5 rounded bg-background/60 hover:bg-background/80 border border-border/40 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5" /> 转入 Virtual World OS
            </Link>
          </div>
          <DreamFragmentTimeline fragments={list} onSelect={onSelect} onDelete={onDelete} />
        </div>

        <div className="space-y-6">
          <RecallSignalMap result={result} />
          <ContaminationRiskPanel risk={contamination} />
          <ArchetypalMemoryCard ids={result.archetypalMatch} />
          <SymbolicMemoryMatrix ids={result.symbolicDomains} />
          <RecallValidationChecklist items={validation} />
          <FiveDomainBlock map={result.fiveDomainMap} />
          <RecommendedUseBlock uses={result.recommendedUse} />
          <RecallNarrativeReport fragment={current} result={result} />
        </div>
      </div>
    </div>
  );
}

function FiveDomainBlock({ map }: { map: ReturnType<typeof analyzeRecallFragment>["fiveDomainMap"] }) {
  return (
    <div className="aether-card p-5 space-y-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Five-Domain Map · 五域映射</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <Item k="天" v={map.heaven} />
        <Item k="地" v={map.earth} />
        <Item k="人" v={map.human} />
        <Item k="神" v={map.spirit} />
        <Item k="风" v={map.wind} />
        <Item k="主导域" v={map.dominantDomain} />
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-l border-border/40 pl-3">
      <span className="text-muted-foreground">{k}：</span>
      <span>{v}</span>
    </div>
  );
}

function RecommendedUseBlock({ uses }: { uses: string[] }) {
  return (
    <div className="aether-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recommended Use · 推荐使用</div>
      <ul className="space-y-1 text-xs">
        {uses.map((u, i) => <li key={i}>· {u}</li>)}
      </ul>
      <div className="text-[10px] text-muted-foreground mt-3">
        不建议：用作真实身份证明 / 重大决策唯一依据 / 判断他人身份 / 替代心理或医疗帮助。
      </div>
    </div>
  );
}
