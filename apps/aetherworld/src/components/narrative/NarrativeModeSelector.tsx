import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NARRATIVE_MODES } from "@/constants/narrative/narrativeModes";
import { PLATFORM_NARRATIVE_PROFILES } from "@/constants/narrative/platformNarrativeProfiles";
import { PLOT_STRUCTURES } from "@/constants/narrative/plotStructures";
import { STORY_PHASES } from "@/constants/narrative/storyPhases";
import { DIALOGUE_STYLES } from "@/constants/narrative/dialogueStyles";
import { SCENE_TYPES, SCENE_TYPE_LABELS } from "@/constants/narrative/sceneTypes";
import { Badge } from "@/components/ui/badge";

interface Props {
  mode: string; setMode: (v: string) => void;
  platform: string; setPlatform: (v: string) => void;
  structure: string; setStructure: (v: string) => void;
  phase: string; setPhase: (v: string) => void;
  sceneType: string; setSceneType: (v: string) => void;
  style: string; setStyle: (v: string) => void;
  pov: string; setPov: (v: string) => void;
  recommended?: string;
}

export function NarrativeModeSelector(p: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">叙事模式与平台</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="叙事模式">
          <Select value={p.mode} onValueChange={p.setMode}>
            <SelectTrigger><SelectValue placeholder="自动判断" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto__">自动判断</SelectItem>
              {NARRATIVE_MODES.map(m => <SelectItem key={m.id} value={m.id}>{m.userFriendlyName}</SelectItem>)}
            </SelectContent>
          </Select>
          {p.recommended && <div className="text-xs text-muted-foreground mt-1">推荐：<Badge variant="secondary">{p.recommended}</Badge></div>}
        </Field>
        <Field label="目标平台">
          <Select value={p.platform} onValueChange={p.setPlatform}>
            <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">未指定</SelectItem>
              {PLATFORM_NARRATIVE_PROFILES.map(pf => <SelectItem key={pf.id} value={pf.id}>{pf.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="剧情结构">
          <Select value={p.structure} onValueChange={p.setStructure}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLOT_STRUCTURES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="当前阶段">
          <Select value={p.phase} onValueChange={p.setPhase}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STORY_PHASES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="场景类型">
          <Select value={p.sceneType} onValueChange={p.setSceneType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SCENE_TYPES.map(s => <SelectItem key={s} value={s}>{SCENE_TYPE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="对白风格">
          <Select value={p.style} onValueChange={p.setStyle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIALOGUE_STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="视角 POV">
          <Select value={p.pov} onValueChange={p.setPov}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIRST_PERSON">第一人称</SelectItem>
              <SelectItem value="THIRD_PERSON_LIMITED">第三人称·有限</SelectItem>
              <SelectItem value="THIRD_PERSON_OMNISCIENT">第三人称·全知</SelectItem>
              <SelectItem value="SCRIPT">剧本体</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
