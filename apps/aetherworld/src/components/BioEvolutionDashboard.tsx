import { useEffect, useState, useCallback } from "react";
import { computeBioEvolution, type BioEvolutionResult } from "@/lib/bioProductEvolutionEngine";
import { generateRecommendations, type RecommendationResult } from "@/lib/evolutionRecommendationEngine";
import { generateProfile, loadProfile, saveProfile } from "@/lib/personalAppProfileEngine";
import { pushSnapshot } from "@/lib/evolutionRollbackManager";
import { EvolutionSafetyNotice } from "./EvolutionSafetyNotice";
import { EvolutionStageTimeline } from "./EvolutionStageTimeline";
import { PersonalAppProfileCard } from "./PersonalAppProfileCard";
import { EvolutionRecommendationBoard } from "./EvolutionRecommendationBoard";
import { EvolutionSignalPanel } from "./EvolutionSignalPanel";
import { EvolutionRollbackPanel } from "./EvolutionRollbackPanel";
import { LocalEvolutionMemoryPanel } from "./LocalEvolutionMemoryPanel";
import { PersonalizedAppPreview } from "./PersonalizedAppPreview";
import { useFounderState } from "@/hooks/useFounderState";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Sparkles, Code2 } from "lucide-react";
import { toast } from "sonner";
import { loadMemory } from "@/lib/localEvolutionMemory";
import type { EvolutionMutation } from "@/constants/evolutionMutationTypes";

export function BioEvolutionDashboard() {
  const { active: founder } = useFounderState();
  const [bio, setBio] = useState<BioEvolutionResult>(() => computeBioEvolution());
  const [recs, setRecs] = useState<RecommendationResult>(() => generateRecommendations());
  const [profile, setProfile] = useState(() => loadProfile());
  const [genResult, setGenResult] = useState(() => generateProfile());

  const refresh = useCallback(() => {
    setBio(computeBioEvolution());
    setRecs(generateRecommendations());
    setProfile(loadProfile());
    setGenResult(generateProfile());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleApply = (m: EvolutionMutation) => {
    const mem = loadMemory();
    pushSnapshot(m.reason, {
      signalCount: mem.signals.length,
      feedbackReliability: mem.feedbackReliability,
      languagePreference: mem.languagePreference,
      topModules: profile.topModules,
    });
    const next = { ...profile };
    if (m.afterState.topModules) next.topModules = m.afterState.topModules as string[];
    if (m.type === "MODULE_HIDE") next.hiddenModules = Array.from(new Set([...next.hiddenModules, ...m.affectedModules]));
    if (m.type === "MODULE_PIN") next.recommendedShortcuts = Array.from(new Set([...next.recommendedShortcuts, ...m.affectedModules]));
    if (m.type === "FEEDBACK_REMINDER_ADJUST" && m.afterState.style) next.feedbackReminderStyle = String(m.afterState.style);
    if (m.type === "WORLD_MODE_PRIORITIZE" && m.afterState.mode) next.worldGenerationMode = String(m.afterState.mode);
    if (m.type === "BEGINNER_TO_ADVANCED") next.preferredLanguageLevel = "ADVANCED";
    if (m.type === "PERSONAL_APP_PROFILE_UPDATE") Object.assign(next, generateProfile().profile);
    next.lastEvolvedAt = new Date().toISOString();
    saveProfile(next);
    toast.success("已应用进化建议");
    refresh();
  };

  const handleIgnore = (m: EvolutionMutation) => {
    toast.message(`已忽略：${m.type}`);
    setRecs(prev => ({ ...prev, recommendations: prev.recommendations.filter(r => r.mutation.id !== m.id) }));
  };

  const handleRegenerateProfile = () => {
    const gen = generateProfile();
    pushSnapshot("手动重新生成 Profile", {
      signalCount: loadMemory().signals.length,
      feedbackReliability: loadMemory().feedbackReliability,
      languagePreference: loadMemory().languagePreference,
      topModules: profile.topModules,
    });
    saveProfile(gen.profile);
    toast.success("已根据当前进化记忆生成新的 Profile");
    refresh();
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Bio-Product Self-Evolution · 生物产品自进化
        </div>
        <h1 className="font-display text-3xl gold-text">{founder ? "Bio-Product Evolution Console" : "我的 App 进化"}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          本系统会在本地观察你的使用习惯、回验、偏好和频率，逐步把同一个产品演化成你专属的 App。所有修改都需要确认，所有数据仅存储在本地。
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="进化分数" value={bio.score.toFixed(1)} accent />
        <Metric label="当前阶段" value={bio.stage.name} />
        <Metric label="信号总数" value={String(bio.signalCount)} />
        <Metric label="回验命中" value={String(bio.validatedEventCount)} />
      </div>

      <EvolutionSafetyNotice compact={!founder} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EvolutionStageTimeline currentStageId={bio.stage.id} />
        <PersonalAppProfileCard profile={profile} rationale={genResult.rationale} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleRegenerateProfile}><Sparkles className="w-3.5 h-3.5 mr-1" />重新生成个人 App Profile</Button>
        <Link to="/personal-app-profile" className="text-xs text-primary hover:underline">查看完整 Profile →</Link>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Evolution Recommendations · 进化建议</div>
        <EvolutionRecommendationBoard
          recommendations={recs.recommendations}
          onApply={handleApply}
          onIgnore={handleIgnore}
          founderView={founder}
        />
      </div>

      {recs.suggestCodeEvolution && (
        <div className="aether-card-elevated p-4 border-l-2 border-primary/40">
          <div className="flex items-center gap-2 text-primary">
            <Code2 className="w-4 h-4" />
            <div className="text-[10px] uppercase tracking-wider">Code Evolution Suggestion</div>
          </div>
          <div className="text-sm mt-1">{recs.suggestCodeEvolution.reason}</div>
          {founder ? (
            <Link to="/code-generator" className="inline-block mt-2 text-xs text-primary hover:underline">
              前往代码生成计算法 → 生成 Lovable 提示词
            </Link>
          ) : (
            <div className="text-[11px] text-muted-foreground mt-2">代码进化仅创始人模式可用。</div>
          )}
        </div>
      )}

      <PersonalizedAppPreview profile={profile} />

      <EvolutionSignalPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EvolutionRollbackPanel onChange={refresh} />
        <LocalEvolutionMemoryPanel founderView={founder} onChange={refresh} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="aether-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 ${accent ? "font-display text-2xl gold-text" : "text-lg"}`}>{value}</div>
    </div>
  );
}
