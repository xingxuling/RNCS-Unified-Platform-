import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { SequenceMode, SequenceTargetType } from "@/lib/sequence-world/sequenceCoreEngine";

interface Props {
  name: string; setName: (s: string) => void;
  mode: SequenceMode; setMode: (m: SequenceMode) => void;
  target: SequenceTargetType; setTarget: (t: SequenceTargetType) => void;
  sequences: string[]; setSequences: (s: string[]) => void;
}

export function SequenceInputCard({ name, setName, mode, setMode, target, setTarget, sequences, setSequences }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label className="text-xs">名称</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="世界 / 对象 / NPC 名称" />
      </div>
      <div>
        <Label className="text-xs">目标类型</Label>
        <Select value={target} onValueChange={v => setTarget(v as SequenceTargetType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["SUBJECT","OBJECT","WORLD","NPC","ZONE","QUEST","EVENT"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">数列模式</Label>
        <Select value={mode} onValueChange={v => setMode(v as SequenceMode)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["DEMO","LIGHT_20","FULL_60","OBJECT","WORLD","FOUNDER"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">数列（每行一段，仅数字 0-9）</Label>
          <Button size="sm" variant="ghost" onClick={() => setSequences([...sequences, ""])}>
            <Plus className="w-3 h-3 mr-1" /> 新增段
          </Button>
        </div>
        <div className="space-y-2">
          {sequences.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={s}
                onChange={e => {
                  const next = [...sequences]; next[i] = e.target.value; setSequences(next);
                }}
                placeholder={`第 ${i + 1} 段，例如 12345`}
              />
              <Button size="icon" variant="ghost" onClick={() => setSequences(sequences.filter((_, j) => j !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
        <Textarea
          className="mt-2 text-xs"
          rows={2}
          placeholder="备注 / 上下文（可选）"
        />
      </div>
    </div>
  );
}
