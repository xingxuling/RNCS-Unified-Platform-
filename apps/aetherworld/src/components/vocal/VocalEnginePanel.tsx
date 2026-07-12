import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { runVocalEngine, VocalMode } from "@/lib/vocal/vocalEngine";
import { VOCAL_TYPE_OPTIONS } from "@/lib/vocal/vocalProfileEngine";
import { VOCAL_RANGE_OPTIONS } from "@/lib/vocal/vocalRangeEstimator";
import { EMOTION_CURVE_OPTIONS } from "@/lib/vocal/emotionCurveEngine";
import { LANGUAGE_OPTIONS } from "@/lib/vocal/multilingualVocalAdapter";
import { CHARACTER_PRESETS } from "@/lib/vocal/characterVoiceEngine";
import { MUSIC_PROMPT_PLATFORMS, getPlatform } from "@/constants/vocal/musicPromptPlatforms";
import { VocalProfileCard } from "./VocalProfileCard";
import { VocalRangeCard } from "./VocalRangeCard";
import { VocalStyleCard } from "./VocalStyleCard";
import { EmotionCurveChart } from "./EmotionCurveChart";
import { LyricSingingMap } from "./LyricSingingMap";
import { CharacterVoiceCard } from "./CharacterVoiceCard";
import { AiMusicPromptCard } from "./AiMusicPromptCard";
import { MultilingualVocalPanel } from "./MultilingualVocalPanel";
import { VocalPracticePlanCard } from "./VocalPracticePlan";
import { VocalSafetyNote } from "./VocalSafetyNote";

const MODE_OPTIONS: Array<{ id: VocalMode; label: string }> = [
  { id: "CHARACTER_VOICE",   label: "角色声线" },
  { id: "LYRIC_ANALYSIS",    label: "歌词演唱分析" },
  { id: "AI_MUSIC_PROMPT",   label: "AI 音乐提示词" },
  { id: "MULTILINGUAL_ADAPT",label: "多语言演唱适配" },
  { id: "PRACTICE_PLAN",     label: "练唱计划" },
];

const DEFAULT_LYRICS = `[Verse]
风从世界的另一边吹来
我把名字写在水面上

[Pre-Chorus]
所有看似不可能的瞬间
都在等一句回答

[Chorus]
就让这一刻被看见
就让这一次不再后退
我把答案折成一道光
穿过所有沉默的边界

[Bridge]
如果一切都会过去
就让我先成为那道光

[Outro]
风停了
名字仍在`;

export function VocalEnginePanel({ defaultMode = "CHARACTER_VOICE" as VocalMode }: { defaultMode?: VocalMode }) {
  const [mode, setMode] = useState<VocalMode>(defaultMode);
  const [voiceType, setVoiceType] = useState(VOCAL_TYPE_OPTIONS[0].id);
  const [rangeId, setRangeId] = useState(VOCAL_RANGE_OPTIONS[1].id);
  const [rangeNote, setRangeNote] = useState("");
  const [language, setLanguage] = useState<typeof LANGUAGE_OPTIONS[number]["code"]>("zh-CN");
  const [sourceLanguage, setSourceLanguage] = useState<typeof LANGUAGE_OPTIONS[number]["code"]>("zh-CN");
  const [genre, setGenre] = useState("cinematic anime rock");
  const [emotion, setEmotion] = useState("restrained → explosive");
  const [curveId, setCurveId] = useState(EMOTION_CURVE_OPTIONS[0].id);
  const [platform, setPlatform] = useState<typeof MUSIC_PROMPT_PLATFORMS[number]["id"]>("SUNO");
  const [songTitle, setSongTitle] = useState("以太边界");
  const [lyrics, setLyrics] = useState(DEFAULT_LYRICS);
  const [characterName, setCharacterName] = useState("蓝天机");
  const [characterRole, setCharacterRole] = useState("主角");
  const [personality, setPersonality] = useState("冷静, 清醒, 承担");
  const [goal, setGoal] = useState("稳定唱完副歌而不损嗓");

  const result = useMemo(() => runVocalEngine({
    mode,
    subjectName: characterName,
    voiceType,
    rangeId,
    rangeNote,
    language,
    sourceLanguage,
    genre,
    emotion,
    curveId,
    platform,
    songTitle,
    lyrics,
    goal,
    character: {
      characterName,
      characterRole,
      personalityKeywords: personality.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      storyPhase: "第一幕",
      targetLanguage: language,
      targetGenre: genre,
    },
  }), [mode, voiceType, rangeId, rangeNote, language, sourceLanguage, genre, emotion, curveId, platform, songTitle, lyrics, goal, characterName, characterRole, personality]);

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block text-xs space-y-1">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="aether-card-elevated p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Aether Vocal Engine · 声乐引擎</div>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`text-xs px-3 py-1.5 rounded border ${mode === m.id ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 aether-card p-4">
        <Field label="角色名 / 主体">
          <input list="char-presets" value={characterName} onChange={e => setCharacterName(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
          <datalist id="char-presets">{CHARACTER_PRESETS.map(c => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="角色定位">
          <input value={characterRole} onChange={e => setCharacterRole(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        <Field label="人格关键词（逗号分隔）">
          <input value={personality} onChange={e => setPersonality(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        <Field label="声线类型">
          <select value={voiceType} onChange={e => setVoiceType(e.target.value as typeof voiceType)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
            {VOCAL_TYPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="音域">
          <select value={rangeId} onChange={e => setRangeId(e.target.value as typeof rangeId)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
            {VOCAL_RANGE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="音域备注">
          <input value={rangeNote} onChange={e => setRangeNote(e.target.value)} placeholder="如：高音容易紧"
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        <Field label="曲风">
          <input value={genre} onChange={e => setGenre(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        <Field label="情绪关键词">
          <input value={emotion} onChange={e => setEmotion(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        <Field label="情绪曲线">
          <select value={curveId} onChange={e => setCurveId(e.target.value as typeof curveId)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
            {EMOTION_CURVE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="演唱语言">
          <select value={language} onChange={e => setLanguage(e.target.value as typeof language)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
            {LANGUAGE_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
        </Field>
        {mode === "MULTILINGUAL_ADAPT" && (
          <Field label="源语言">
            <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value as typeof sourceLanguage)}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
              {LANGUAGE_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="目标平台">
          <select value={platform} onChange={e => setPlatform(e.target.value as typeof platform)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm">
            {MUSIC_PROMPT_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="歌曲标题">
          <input value={songTitle} onChange={e => setSongTitle(e.target.value)}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
        </Field>
        {mode === "PRACTICE_PLAN" && (
          <Field label="练唱目标">
            <input value={goal} onChange={e => setGoal(e.target.value)}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm" />
          </Field>
        )}
        {(mode === "LYRIC_ANALYSIS" || mode === "AI_MUSIC_PROMPT") && (
          <Field label="歌词（使用 [Verse] [Chorus] 段落标签）">
            <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={8}
              className="md:col-span-3 w-full bg-background border border-border rounded px-2 py-1 text-xs font-mono" />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {result.characterVoice && <CharacterVoiceCard data={result.characterVoice} />}
        <VocalProfileCard profile={result.vocalProfile} />
        <VocalRangeCard data={result.range} />
        <VocalStyleCard data={result.style} />
        <EmotionCurveChart curve={result.emotionCurve} />
        {result.aiPrompt && <AiMusicPromptCard data={result.aiPrompt} platformName={getPlatform(platform).name} />}
        {result.multilingual && <MultilingualVocalPanel data={result.multilingual} />}
        {result.practice && <VocalPracticePlanCard plan={result.practice} />}
      </div>

      {result.lyricAnalysis && <LyricSingingMap analyses={result.lyricAnalysis} />}

      <VocalSafetyNote safety={result.safety} note={result.safetyNote} />

      <div className="aether-card p-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">跨模块联动：</span>
        <Link to="/prompt-forge" className="px-2 py-1 rounded border border-border hover:bg-secondary/30">发送到 Prompt Forge</Link>
        <Link to="/encyclopedia" className="px-2 py-1 rounded border border-border hover:bg-secondary/30">保存到产品百科</Link>
        <Link to="/recalculation" className="px-2 py-1 rounded border border-border hover:bg-secondary/30">触发重算</Link>
        <Link to="/translation-engine" className="px-2 py-1 rounded border border-border hover:bg-secondary/30">翻译引擎</Link>
      </div>
    </div>
  );
}
