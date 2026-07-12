import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MSLInputPanel } from "./MSLInputPanel";
import { MSLParseResultView } from "./MSLParseResult";
import { MSLBlockView } from "./MSLBlockView";
import { MSLProgramTrace } from "./MSLProgramTrace";
import { MSLWorldOutput } from "./MSLWorldOutput";
import { MSLExportPanel } from "./MSLExportPanel";
import { MSLSafetyNote } from "./MSLSafetyNote";
import { parseMSL, MSLStatement } from "@/lib/msl/mslParser";
import { interpretMany } from "@/lib/msl/mslInterpreter";
import { analyzeBlock } from "@/lib/msl/mslBlockAnalyzer";
import { compileStatement, MSLCompileTarget } from "@/lib/msl/mslCompiler";
import { runProgram, MSLProgramResult } from "@/lib/msl/mslProgramRunner";
import { useFounderState } from "@/hooks/useFounderState";

interface Props {
  mode?: "beginner" | "advanced" | "founder";
}

const COMPILE_TARGETS: MSLCompileTarget[] = [
  "MARKDOWN_REPORT", "WORLD_ENGINE", "RENDER_PROFILE", "SEMANTIC_PHYSICS",
  "ANIMATION_PROFILE", "NPC_PROFILE", "QUEST_PROFILE", "IAL",
  "PROMPT_FORGE", "UNITY_JSON", "GODOT_JSON",
];

const DEFAULT_INPUT = `55555
34230
BLOCK 49..60`;

export function MSLConsole({ mode }: Props) {
  const { active: founderActive } = useFounderState();
  const effectiveMode = mode ?? (founderActive ? "founder" : "advanced");

  const [input, setInput] = useState(DEFAULT_INPUT);
  const [tab, setTab] = useState<"parse" | "interp" | "block" | "program" | "compile">("parse");
  const [target, setTarget] = useState<MSLCompileTarget>("MARKDOWN_REPORT");
  const [autoRun, setAutoRun] = useState(true);
  const [runKey, setRunKey] = useState(0);

  const parsed = useMemo(() => parseMSL(input), [input, runKey]);

  const allStatements: MSLStatement[] = useMemo(() => {
    if (!autoRun && runKey === 0) return [];
    return [
      ...parsed.statements,
      ...parsed.programs.flatMap(p => p.statements),
    ];
  }, [parsed, autoRun, runKey]);

  const interpretations = useMemo(() => interpretMany(allStatements), [allStatements]);
  const blockAnalyses = useMemo(
    () => parsed.blocks.map(b => analyzeBlock(b, allStatements)),
    [parsed.blocks, allStatements],
  );
  const programResults: MSLProgramResult[] = useMemo(
    () => parsed.programs.map(p => runProgram(p, { isFull60: parsed.isFull60 })),
    [parsed.programs, parsed.isFull60],
  );
  const compileResults = useMemo(
    () => allStatements.map(s => compileStatement(s, target, { isFull60: parsed.isFull60 })),
    [allStatements, target, parsed.isFull60],
  );

  const safetyExtras: string[] = [];
  if (parsed.isFull60) safetyExtras.push("⚠️ Full 60：本次输入包含完整主体数列，请谨慎导出。");
  if (effectiveMode !== "founder") safetyExtras.push("ℹ️ 当前为非 Founder 视图，Program Runner 输出已折叠简化。");

  const showProgram = effectiveMode === "founder" || effectiveMode === "advanced";

  return (
    <div className="space-y-4">
      <Card className="p-4 aether-card-elevated">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-base font-medium">MSL Console · 母体数列语言控制台</div>
            <div className="text-xs text-muted-foreground">
              五位数列 ABCDE = 天·地·人·神·风。一条语句即一次世界状态。
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" variant={autoRun ? "default" : "outline"}
              onClick={() => setAutoRun(a => !a)}
            >
              {autoRun ? "自动运行：开" : "自动运行：关"}
            </Button>
            <Button size="sm" onClick={() => setRunKey(k => k + 1)}>
              重新解析
            </Button>
          </div>
        </div>
      </Card>

      <MSLInputPanel value={input} onChange={setInput} onRun={() => setRunKey(k => k + 1)} />

      <div className="flex flex-wrap gap-2">
        {(["parse", "interp", "block", "program", "compile"] as const).map(t => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            disabled={t === "program" && !showProgram}
          >
            {t === "parse" ? "Parsed" :
             t === "interp" ? "Interpretation" :
             t === "block" ? "Block Analysis" :
             t === "program" ? `Program Trace${effectiveMode === "founder" ? "" : "（仅高阶）"}` :
             "Compiled / Export"}
          </Button>
        ))}
      </div>

      {tab === "parse" && <MSLParseResultView result={parsed} />}
      {tab === "interp" && <MSLWorldOutput interpretations={interpretations} />}
      {tab === "block" && <MSLBlockView blocks={blockAnalyses} />}
      {tab === "program" && showProgram && <MSLProgramTrace results={programResults} />}
      {tab === "compile" && (
        <MSLExportPanel
          targets={effectiveMode === "founder" ? COMPILE_TARGETS : COMPILE_TARGETS.filter(t =>
            ["MARKDOWN_REPORT", "RENDER_PROFILE", "IAL", "PROMPT_FORGE"].includes(t),
          )}
          current={target}
          onChange={setTarget}
          results={compileResults}
        />
      )}

      <MSLSafetyNote extraNotes={safetyExtras} />
    </div>
  );
}
