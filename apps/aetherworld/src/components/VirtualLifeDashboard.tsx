import { useMemo, useState } from "react";
import { VIRTUAL_LIFE_MODES } from "@/constants/virtualLifeModes";
import { runVirtualLife } from "@/lib/virtualLifeCalculus";
import { saveJournalEntry } from "@/lib/virtualLifeJournalEngine";
import { useFounderState } from "@/hooks/useFounderState";
import { getActiveSubjectId } from "@/lib/store";
import { VirtualDayCard } from "./VirtualDayCard";
import { VirtualLifeStateCard } from "./VirtualLifeStateCard";
import { VirtualLifeQuestBoard } from "./VirtualLifeQuestBoard";
import { VirtualNpcEncounterCard } from "./VirtualNpcEncounterCard";
import { VirtualRealityAnchorCard } from "./VirtualRealityAnchorCard";
import { VirtualLifeSafetyNote } from "./VirtualLifeSafetyNote";
import { VirtualRoutinePanel } from "./VirtualRoutinePanel";

export function VirtualLifeDashboard() {
  const { active: founderActive } = useFounderState();
  const [lifeMode, setLifeMode] = useState("LIGHT_PERSONAL_LIFE");
  const [realityIssue, setRealityIssue] = useState("");
  const [tick, setTick] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState("");
  const [emotion, setEmotion] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const subjectId = typeof window !== "undefined" ? getActiveSubjectId() : "demo";
  const worldId = "default-world";

  const report = useMemo(() => runVirtualLife({
    subjectId, worldId, lifeMode, founderActive,
    realityIssue: realityIssue || undefined,
  }), [subjectId, lifeMode, founderActive, realityIssue, tick]);

  const day = report.day;
  const modes = VIRTUAL_LIFE_MODES.filter(m => !m.founderOnly || founderActive);

  const isFullMode = lifeMode === "FULL_PERSONAL_LIFE";

  const handleSave = () => {
    const completedIds = Object.entries(completed).filter(([, v]) => v).map(([k]) => k);
    const allQuests = [day.mainQuest, ...day.sideQuests];
    const completedTitles = allQuests.filter(q => completedIds.includes(q.id)).map(q => `${q.title} · ${q.realWorldAction}`);
    const skippedTitles = allQuests.filter(q => !completedIds.includes(q.id)).map(q => `${q.title} · ${q.realWorldAction}`);
    saveJournalEntry({
      date: new Date().toISOString().slice(0, 10),
      lifeMode: day.lifeModeName,
      dayTitle: day.dayTitle,
      completedQuests: completedTitles,
      skippedQuests: skippedTitles,
      npcEncounters: day.npcEncounter ? [`${day.npcEncounter.npcName}：${day.npcEncounter.message}`] : [],
      realWorldActions: completedTitles,
      emotionalState: emotion || undefined,
      reflection,
      nextDayHint: day.realityAnchor.anchorText,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
  };

  const copyMd = () => navigator.clipboard?.writeText(report.markdown);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Virtual Life Calculus Engine</div>
        <h1 className="text-2xl md:text-3xl font-display gold-text">虚拟生活</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          今天你在哪里醒来、你是谁、做什么、现实里落到哪一步。系统帮你把虚拟世界变成一天可生活的节奏。
        </p>
      </header>

      <VirtualLifeSafetyNote />

      <div className="aether-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs space-y-1">
            <div className="text-muted-foreground">生活模式</div>
            <select className="w-full bg-background/40 border border-border/50 rounded px-2 py-1.5"
              value={lifeMode} onChange={e => setLifeMode(e.target.value)}>
              {modes.map(m => <option key={m.id} value={m.id}>{m.userFriendlyName}</option>)}
            </select>
          </label>
          <label className="text-xs space-y-1 md:col-span-2">
            <div className="text-muted-foreground">当前想被处理的现实问题（可选）</div>
            <input className="w-full bg-background/40 border border-border/50 rounded px-3 py-1.5"
              placeholder="例：我找不到创始人控制台入口" value={realityIssue} onChange={e => setRealityIssue(e.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setTick(t => t + 1)} className="text-xs px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30">重新生成今日</button>
          <button onClick={copyMd} className="text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40">复制今日 Markdown</button>
          <button onClick={() => setAdvanced(a => !a)} className="text-xs px-3 py-1.5 rounded bg-background/60 border border-border/40">{advanced ? "收起高级信息" : "展开高级信息"}</button>
        </div>
        {isFullMode && (
          <div className="text-[11px] text-amber-200/80">
            Full 60 隐私提示：深度个人生活仅在本地使用你的完整主体特征。系统不会上传 Full 60 原始字段，不会公开显示。
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VirtualDayCard day={day} />
        <VirtualLifeStateCard stateId={day.currentLifeState.id} />
      </div>

      <VirtualLifeQuestBoard
        main={day.mainQuest}
        sides={day.sideQuests}
        onComplete={(id, done) => setCompleted(s => ({ ...s, [id]: done }))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VirtualNpcEncounterCard encounter={day.npcEncounter} />
        <VirtualRealityAnchorCard anchor={day.realityAnchor} />
      </div>

      <div className="aether-card p-5 space-y-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Evening Reflection · 晚间反思与保存</div>
        <div className="text-sm text-foreground/90">{day.eveningReflectionPrompt}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs space-y-1">
            <div className="text-muted-foreground">情绪/能量</div>
            <input className="w-full bg-background/40 border border-border/50 rounded px-3 py-1.5"
              placeholder="例：稳定/疲惫/兴奋" value={emotion} onChange={e => setEmotion(e.target.value)} />
          </label>
          <label className="text-xs space-y-1 md:col-span-2">
            <div className="text-muted-foreground">今天的反思（写3行即可）</div>
            <textarea className="w-full bg-background/40 border border-border/50 rounded px-3 py-1.5 min-h-[68px]"
              value={reflection} onChange={e => setReflection(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={handleSave} className="text-sm px-4 py-2 rounded bg-primary/80 hover:bg-primary text-primary-foreground">保存今日日记</button>
          {savedFlash && <span className="text-xs text-primary">已保存</span>}
        </div>
      </div>

      {advanced && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VirtualRoutinePanel />
          <div className="aether-card p-5 space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Source Trace · 来源追溯</div>
            <div className="text-[11px] text-muted-foreground">主体：{subjectId}</div>
            <div className="text-[11px] text-muted-foreground">世界：{worldId}</div>
            <div className="text-[11px] text-muted-foreground">生成时间：{day.generatedAt}</div>
            <div className="text-[11px] text-muted-foreground">NPC 原型：{day.npcEncounter?.archetype ?? "（无）"}</div>
            <div className="text-[11px] text-muted-foreground">主任务类型：{day.mainQuest.questTypeName}</div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground">{report.safetyNote}</div>
    </div>
  );
}
