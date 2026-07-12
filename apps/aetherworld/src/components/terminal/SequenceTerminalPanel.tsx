import { useEffect, useMemo, useRef, useState } from "react";
import { TerminalInputLine } from "./TerminalInputLine";
import { TerminalOutputBlock } from "./TerminalOutputBlock";
import { TerminalCommandHistory } from "./TerminalCommandHistory";
import { TerminalHelpPanel } from "./TerminalHelpPanel";
import { TerminalExportPanel } from "./TerminalExportPanel";
import { TerminalSafetyNote } from "./TerminalSafetyNote";
import { runSequenceTerminal } from "@/lib/terminal/sequenceTerminal";
import { deriveSession, type SubjectMode } from "@/lib/terminal/terminalSessionManager";
import type { TerminalMode } from "@/constants/terminal/terminalModes";
import { TERMINAL_MODES } from "@/constants/terminal/terminalModes";
import type { TerminalOutput } from "@/constants/terminal/terminalOutputTypes";
import { useFounderState } from "@/hooks/useFounderState";
import { isBeginnerMode } from "@/constants/onboardingUserStates";
import { onDataChange } from "@/lib/store";

interface Props {
  /** 锁定终端模式，例如 MSL 页面强制为 MSL_TERMINAL，Founder 页面强制为 FOUNDER_TERMINAL */
  forceMode?: TerminalMode;
  /** 标题副文本 */
  subtitle?: string;
}

export function SequenceTerminalPanel({ forceMode, subtitle }: Props) {
  const { active: founderActive } = useFounderState();
  const [beginner, setBeginner] = useState(true);
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [subjectMode, setSubjectMode] = useState<SubjectMode>("DEMO");
  const [full60, setFull60] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [mode, setMode] = useState<TerminalMode | undefined>(forceMode);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setBeginner(isBeginnerMode());
    sync();
    return onDataChange(sync);
  }, []);

  useEffect(() => {
    if (founderActive) setSubjectMode("FOUNDER");
    else if (subjectMode === "FOUNDER") setSubjectMode("DEMO");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founderActive]);

  const session = useMemo(
    () => deriveSession({ founderUnlocked: founderActive, beginner, subjectMode, full60Active: full60, forceMode: mode }),
    [founderActive, beginner, subjectMode, full60, mode],
  );

  function runCommand(raw: string) {
    const result = runSequenceTerminal(raw, {
      session,
      onClear: () => setOutputs([]),
    });
    setOutputs((prev) => [...prev, { ...result.output }]);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }

  useEffect(() => {
    if (pendingCommand) {
      runCommand(pendingCommand);
      setPendingCommand(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCommand]);

  const lastOutput = outputs[outputs.length - 1] ?? null;

  return (
    <div className="space-y-3">
      {/* 顶部状态栏 */}
      <div className="border border-amber-500/30 rounded-md px-3 py-2 bg-black/50 flex flex-wrap gap-x-4 gap-y-2 items-center text-[11px] font-mono">
        <div>
          <span className="text-muted-foreground">terminal:</span>{" "}
          {forceMode ? (
            <span className="text-amber-300">{session.mode}</span>
          ) : (
            <select
              value={mode ?? session.mode}
              onChange={(e) => setMode(e.target.value as TerminalMode)}
              className="bg-transparent border border-amber-500/30 rounded px-1 text-amber-300"
            >
              {TERMINAL_MODES.map((m) => (
                <option key={m.id} value={m.id} className="bg-black text-amber-200">{m.id}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">subject:</span>{" "}
          <select
            value={subjectMode}
            onChange={(e) => setSubjectMode(e.target.value as SubjectMode)}
            disabled={founderActive}
            className="bg-transparent border border-amber-500/30 rounded px-1 text-amber-300 disabled:opacity-60"
          >
            <option value="DEMO" className="bg-black">DEMO</option>
            <option value="REAL" className="bg-black">REAL</option>
            {founderActive && <option value="FOUNDER" className="bg-black">FOUNDER</option>}
          </select>
        </div>
        <div>
          <span className="text-muted-foreground">permission:</span> <span className="text-amber-300">{session.permission}</span>
        </div>
        <div>
          <span className="text-muted-foreground">lang:</span> <span className="text-amber-300">zh-CN</span>
        </div>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={full60} onChange={(e) => setFull60(e.target.checked)} className="accent-amber-400" />
          <span className="text-muted-foreground">full60</span>
        </label>
        <div className="ml-auto">
          <span className={`px-2 py-0.5 rounded ${founderActive ? "bg-amber-500/30 text-amber-100" : "bg-white/5 text-muted-foreground"}`}>
            {founderActive ? "Founder · Unlocked" : "Founder · Locked"}
          </span>
        </div>
      </div>

      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        {/* 主输出区 + 输入 */}
        <div className="space-y-2">
          <div
            ref={scrollRef}
            className="border border-amber-500/20 rounded-md bg-black/70 p-3 min-h-[360px] max-h-[60vh] overflow-y-auto space-y-2"
          >
            {outputs.length === 0 && (
              <div className="text-xs text-muted-foreground font-mono">
                <p>欢迎使用数列终端 · Sequence Terminal</p>
                <p>输入 <span className="text-amber-300">help</span> 查看命令；或直接输入 <span className="text-amber-300">55555</span> 自动解释一条数列。</p>
              </div>
            )}
            {outputs.map((o) => (
              <TerminalOutputBlock key={o.id} output={o} />
            ))}
          </div>
          <TerminalInputLine onSubmit={runCommand} />
        </div>

        {/* 右侧：示例 / 历史 / 导出 */}
        <aside className="space-y-3">
          <div className="border border-amber-500/20 rounded-md p-3 bg-black/30 space-y-3">
            <TerminalHelpPanel onPick={(c) => setPendingCommand(c)} founder={founderActive} />
          </div>
          <div className="border border-amber-500/20 rounded-md p-3 bg-black/30">
            <TerminalCommandHistory refreshKey={refreshKey} onPick={(c) => setPendingCommand(c)} />
          </div>
          <TerminalExportPanel lastOutput={lastOutput} subjectMode={session.subjectMode} full60Active={session.full60Active} />
        </aside>
      </div>

      <TerminalSafetyNote />
    </div>
  );
}
