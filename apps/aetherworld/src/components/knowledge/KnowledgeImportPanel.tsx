import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ingestKnowledge } from "@/lib/knowledge/knowledgeIngestionEngine";
import { KNOWLEDGE_SOURCE_TYPES } from "@/constants/knowledge/knowledgeSourceTypes";
import { KNOWLEDGE_TYPES } from "@/constants/knowledge/knowledgeTypes";

export function KnowledgeImportPanel({ onAdded }: { onAdded?: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceType, setSourceType] = useState("MANUAL_ENTRY");
  const [knowledgeType, setKnowledgeType] = useState<string>("");
  const [tags, setTags] = useState("");
  const [warns, setWarns] = useState<string[]>([]);

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    const r = ingestKnowledge({
      title,
      body,
      sourceType: sourceType as never,
      knowledgeType: (knowledgeType || undefined) as never,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setWarns(r.warnings);
    setTitle(""); setBody(""); setTags("");
    onAdded?.();
  };

  return (
    <div className="rounded-md border border-border/60 p-4 space-y-3">
      <div className="font-medium text-sm">新增知识条目</div>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" />
      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="正文" rows={4} />
      <div className="grid grid-cols-2 gap-2">
        <select className="text-xs bg-background border border-border rounded px-2 py-1.5" value={sourceType} onChange={e => setSourceType(e.target.value)}>
          {KNOWLEDGE_SOURCE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label} · {s.en}</option>)}
        </select>
        <select className="text-xs bg-background border border-border rounded px-2 py-1.5" value={knowledgeType} onChange={e => setKnowledgeType(e.target.value)}>
          <option value="">自动分类</option>
          {KNOWLEDGE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label} · {s.en}</option>)}
        </select>
      </div>
      <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="标签，用逗号分隔" />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit}>保存条目</Button>
      </div>
      {warns.length > 0 && (
        <ul className="text-[11px] text-amber-500 list-disc list-inside">
          {warns.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
    </div>
  );
}
