import { useMemo, useState } from "react";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { useFounderState } from "@/hooks/useFounderState";
import { OBJECT_ONTOLOGY_TYPES } from "@/constants/objectOntologyTypes";
import { runThingItself, THING_ITSELF_PRESETS, type ThingItselfInput } from "@/lib/thingItselfCalculus";
import { ObjectEssenceCard } from "./ObjectEssenceCard";
import { ObjectBoundaryMap } from "./ObjectBoundaryMap";
import { ObjectInvariantMatrix } from "./ObjectInvariantMatrix";
import { ObjectDynamicVariablePanel } from "./ObjectDynamicVariablePanel";
import { ObjectRelationFieldGraph } from "./ObjectRelationFieldGraph";
import { ObjectManifestLatentCard } from "./ObjectManifestLatentCard";
import { ObjectSelfConsistencyGauge } from "./ObjectSelfConsistencyGauge";
import { ObjectOntologyReport } from "./ObjectOntologyReport";
import { ObjectOntologySafetyNote } from "./ObjectOntologySafetyNote";

export function ThingItselfPanel() {
  const beginner = isBeginnerMode();
  const { active: founder } = useFounderState();
  const [input, setInput] = useState<ThingItselfInput>({
    name: "",
    description: "",
    typeId: "UNKNOWN",
    beginner,
  });
  const [submitted, setSubmitted] = useState<ThingItselfInput | null>(null);
  const result = useMemo(() => submitted ? runThingItself(submitted) : null, [submitted]);

  const loadPreset = (i: number) => {
    const p = THING_ITSELF_PRESETS[i];
    setInput({ ...input, name: p.name, description: p.description, typeId: p.typeId });
  };

  return (
    <div className="space-y-4">
      <ObjectOntologySafetyNote />

      <div className="aether-card p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {beginner ? "看清一个东西" : founder ? "Thing-Itself Calculus" : "万物本身"}
        </div>
        <h2 className="font-display text-xl gold-text">
          {beginner ? "把你想看清的对象写下来" : "Object Ontology Reader"}
        </h2>
        {beginner && (
          <p className="text-xs text-muted-foreground">
            先别急着问“它会怎样”。先看清：它到底是什么、靠什么成立、现在有没有偏离自己。
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
            placeholder="对象名称（例如：我的新产品想法）"
            className="text-sm px-3 py-2 rounded bg-background/60 border border-border/40"
          />
          <select
            value={input.typeId}
            onChange={(e) => setInput({ ...input, typeId: e.target.value })}
            className="text-sm px-3 py-2 rounded bg-background/60 border border-border/40"
          >
            {OBJECT_ONTOLOGY_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.userFriendlyName}（{t.id}）</option>
            ))}
          </select>
        </div>
        <textarea
          value={input.description}
          onChange={(e) => setInput({ ...input, description: e.target.value })}
          rows={4}
          placeholder="描述这个对象：它是什么、不是什么、靠什么成立、当前处于什么状态……"
          className="w-full text-sm px-3 py-2 rounded bg-background/60 border border-border/40"
        />

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSubmitted({ ...input, beginner })}
            disabled={!input.description.trim()}
            className="text-sm px-4 py-2 rounded bg-primary/80 hover:bg-primary text-primary-foreground disabled:opacity-40"
          >
            读取本体
          </button>
          {submitted && (
            <button onClick={() => setSubmitted(null)}
              className="text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40">
              重置
            </button>
          )}
          <div className="ml-auto flex flex-wrap gap-1.5">
            {THING_ITSELF_PRESETS.map((p, i) => (
              <button key={i} onClick={() => loadPreset(i)}
                className="text-[11px] px-2 py-1 rounded bg-background/40 border border-border/30 hover:border-primary/40">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Beginner summary always shown */}
          <div className="aether-card p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">看清这个东西</div>
            <div className="text-sm"><span className="text-muted-foreground">它是什么：</span>{result.beginnerSummary.whatItIs}</div>
            <div className="text-sm">
              <span className="text-muted-foreground">它不是：</span>
              {result.beginnerSummary.whatItIsNot.join("；") || "—"}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">核心不变量：</span>
              {result.beginnerSummary.keyInvariants.join("、") || "—"}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">当前阶段：</span>{result.beginnerSummary.currentPhase}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">最大误解：</span>{result.beginnerSummary.biggestMisunderstanding}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">下一步：</span>{result.beginnerSummary.nextStep}
            </div>
          </div>

          {!beginner && (
            <>
              <ObjectEssenceCard essence={result.essence} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ObjectInvariantMatrix invariants={result.invariants} />
                <ObjectSelfConsistencyGauge result={result.consistency} />
              </div>
              <ObjectBoundaryMap boundary={result.boundary} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ObjectDynamicVariablePanel dynamics={result.dynamicVariables} />
                <ObjectManifestLatentCard ml={result.manifestLatent} />
              </div>
              <ObjectRelationFieldGraph field={result.relationField} />
              <div className="aether-card p-4 text-xs space-y-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Phase · 阶段</div>
                <div><span className="text-muted-foreground">原因：</span>{result.phase.phaseReason}</div>
                <div><span className="text-muted-foreground">允许动作：</span>{result.phase.allowedActions.join("、")}</div>
                <div><span className="text-muted-foreground">禁止动作：</span>{result.phase.forbiddenActions.join("、")}</div>
                <div><span className="text-muted-foreground">下一阶段提示：</span>{result.phase.nextPhaseHint}</div>
              </div>
              <ObjectOntologyReport result={result} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
