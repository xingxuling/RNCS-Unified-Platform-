import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  title: string; setTitle: (v: string) => void;
  worldName: string; setWorldName: (v: string) => void;
  characters: string; setCharacters: (v: string) => void;
  premise: string; setPremise: (v: string) => void;
  conflict: string; setConflict: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  tone: string; setTone: (v: string) => void;
  lore: string; setLore: (v: string) => void;
  sequenceContext: string; setSequenceContext: (v: string) => void;
}

export function SceneGeneratorPanel(p: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">故事输入</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="标题（可选）"><Input value={p.title} onChange={e => p.setTitle(e.target.value)} /></Field>
        <Field label="世界名"><Input value={p.worldName} onChange={e => p.setWorldName(e.target.value)} /></Field>
        <Field label="角色（逗号分隔，第一个为主角）"><Input value={p.characters} onChange={e => p.setCharacters(e.target.value)} placeholder="蓝天机, 云澜星禾" /></Field>
        <Field label="情绪基调"><Input value={p.tone} onChange={e => p.setTone(e.target.value)} placeholder="克制而炽热" /></Field>
        <Field label="场景位置"><Input value={p.location} onChange={e => p.setLocation(e.target.value)} placeholder="咖啡厅 / 系统控制台" /></Field>
        <Field label="数列上下文 / MSL"><Input value={p.sequenceContext} onChange={e => p.setSequenceContext(e.target.value)} placeholder="55555 / 34230" /></Field>
        <div className="md:col-span-2"><Field label="故事前提"><Textarea rows={3} value={p.premise} onChange={e => p.setPremise(e.target.value)} /></Field></div>
        <div className="md:col-span-2"><Field label="当前冲突"><Textarea rows={2} value={p.conflict} onChange={e => p.setConflict(e.target.value)} /></Field></div>
        <div className="md:col-span-2"><Field label="已有设定 / 术语"><Textarea rows={2} value={p.lore} onChange={e => p.setLore(e.target.value)} placeholder="逗号分隔的术语" /></Field></div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
